/**
 * game-cu-chi.js — Chinese-learning gesture game (Vanilla JS + MediaPipe Tasks Vision).
 *
 * Modules (all in one file to stay CDN/no-build friendly):
 *   CONFIG          tunable thresholds
 *   Camera          getUserMedia wrapper
 *   Vision          lazy MediaPipe loader (only the landmarker the current mode needs)
 *   HeadGestures    landmarks -> pitch/yaw/roll -> NOD | SHAKE | TILT_LEFT | TILT_RIGHT
 *   FingerCounter   hand landmarks -> stable finger count (0–10, two hands)
 *   Game            question banks, scoring, rendering
 *   Loop            one detection per *new* video frame, paused when tab hidden
 */
import { FilesetResolver, FaceLandmarker, HandLandmarker }
  from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

/* ------------------------------------------------------------------ CONFIG */
const CONFIG = {
  wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  faceModel: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  handModel: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  cam: { width: 640, height: 480, frameRate: { ideal: 30 } },
  head: {
    windowMs: 900,      // motion history inspected for nod/shake
    nodAmp: 0.06,       // min pitch swing (normalised, see headPose) to count a reversal
    shakeAmp: 0.10,     // min yaw swing
    nodSwings: 1,       // down+up = 1 reversal
    shakeSwings: 2,     // left-right-left = 2 reversals (ignores "glance aside")
    tiltRad: 0.26,      // ~15° roll away from neutral
    tiltHoldMs: 250,    // tilt must be held this long
    cooldownMs: 1100,   // ignore input right after a gesture fires
  },
  hand: { holdMs: 600, extendRatio: 1.15, thumbRatio: 1.2 },
};

/* ------------------------------------------------------------------ Camera */
const Camera = {
  async start(video) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', ...CONFIG.cam }, audio: false });
    video.srcObject = stream;
    await new Promise(r => (video.onloadedmetadata = r));
    await video.play();
  },
};

/* ------------------------------------------------------------------ Vision */
// Each landmarker is created on first use and cached. GPU delegate with CPU fallback.
const Vision = {
  fileset: null, face: null, hand: null,
  async init() { this.fileset ??= await FilesetResolver.forVisionTasks(CONFIG.wasm); },
  async create(Klass, modelAssetPath, extra) {
    await this.init();
    for (const delegate of ['GPU', 'CPU']) {
      try {
        return await Klass.createFromOptions(this.fileset, { baseOptions: { modelAssetPath, delegate }, runningMode: 'VIDEO', ...extra });
      } catch (e) { if (delegate === 'CPU') throw e; }
    }
  },
  async get(mode) {
    if (mode === 'head') return (this.face ??= await this.create(FaceLandmarker, CONFIG.faceModel,
      { numFaces: 1, outputFaceBlendshapes: false, outputFacialTransformationMatrixes: false }));
    return (this.hand ??= await this.create(HandLandmarker, CONFIG.handModel, { numHands: 2 }));
  },
};

/* ------------------------------------------------------------ HeadGestures */
// Cheap pose proxies from 5 face-mesh points (no matrix math needed).
// Coordinates are from the RAW (un-mirrored) frame, so "left/right" below is the user's own.
function headPose(lm) {
  const nose = lm[1], chin = lm[152], cheekR = lm[234], cheekL = lm[454], eyeR = lm[33], eyeL = lm[263];
  const eyeMidY = (eyeR.y + eyeL.y) / 2;
  return {
    yaw: (nose.x - (cheekR.x + cheekL.x) / 2) / (cheekL.x - cheekR.x),  // ~-0.5..0.5
    pitch: (nose.y - eyeMidY) / (chin.y - eyeMidY),                      // grows when looking down
    roll: Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x),                  // <0 = head toward user's right shoulder
  };
}

// Counts direction reversals whose amplitude exceeds `amp` (hysteresis filters jitter).
function countSwings(vals, amp) {
  let dir = 0, ext = vals[0], swings = 0;
  for (const v of vals) {
    const d = v - ext;
    if (dir <= 0 && d > amp) { if (dir) swings++; dir = 1; ext = v; }
    else if (dir >= 0 && d < -amp) { if (dir) swings++; dir = -1; ext = v; }
    else if (dir * d > 0) ext = v;                   // keep tracking the current extreme
  }
  return swings;
}

class HeadGestures {
  buf = [];            // [{t, pitch, yaw, roll}]
  rollBase = 0;        // neutral roll, slowly adapted while the head is level
  tiltSince = 0;
  lockedUntil = 0;

  /** @returns {'NOD'|'SHAKE'|'TILT_LEFT'|'TILT_RIGHT'|null} */
  update(lm, t) {
    const c = CONFIG.head, p = headPose(lm);
    if (t < this.lockedUntil) return null;

    // Tilt: sustained roll offset.
    const dr = p.roll - this.rollBase;
    if (Math.abs(dr) > c.tiltRad) {
      this.tiltSince ||= t;
      if (t - this.tiltSince > c.tiltHoldMs) return this.fire(t, dr < 0 ? 'TILT_RIGHT' : 'TILT_LEFT');
      return null;                                    // while tilting, skip nod/shake analysis
    }
    this.tiltSince = 0;
    this.rollBase += (p.roll - this.rollBase) * 0.02; // EMA: absorbs a habitual slight head lean

    // Nod / shake: oscillation inside a sliding window.
    this.buf.push({ t, ...p });
    while (this.buf[0].t < t - c.windowMs) this.buf.shift();
    if (this.buf.length < 6) return null;
    const nod = countSwings(this.buf.map(s => s.pitch), c.nodAmp) >= c.nodSwings;
    const shake = countSwings(this.buf.map(s => s.yaw), c.shakeAmp) >= c.shakeSwings;
    if (shake) return this.fire(t, 'SHAKE');          // shake checked first: it also wobbles pitch slightly
    if (nod) return this.fire(t, 'NOD');
    return null;
  }
  fire(t, g) { this.buf = []; this.tiltSince = 0; this.lockedUntil = t + CONFIG.head.cooldownMs; return g; }
  reset() { this.buf = []; this.tiltSince = 0; this.lockedUntil = 0; }
}

/* ----------------------------------------------------------- FingerCounter */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Rotation-invariant: a finger is "up" when its tip is clearly farther from the wrist than its PIP joint.
function fingersUp(lm) {
  const r = CONFIG.hand, w = lm[0];
  let n = 0;
  for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) if (dist(lm[tip], w) > dist(lm[pip], w) * r.extendRatio) n++;
  if (dist(lm[4], lm[17]) > dist(lm[2], lm[17]) * r.thumbRatio) n++;  // thumb: tip away from pinky base
  return n;
}

class FingerCounter {
  value = -1; since = 0; confirmed = false;
  /** Returns a count once it has been held steady for holdMs (fires once per hold). */
  update(hands, t) {
    const n = hands.reduce((s, lm) => s + fingersUp(lm), 0);
    if (n !== this.value) { this.value = n; this.since = t; this.confirmed = false; return null; }
    if (!this.confirmed && n > 0 && t - this.since >= CONFIG.hand.holdMs) { this.confirmed = true; return n; }
    return null;
  }
  reset() { this.value = -1; this.confirmed = false; }
}

/* -------------------------------------------------------------------- Game */
const GESTURE_VI = { NOD: 'Gật đầu', SHAKE: 'Lắc đầu', TILT_LEFT: 'Nghiêng trái', TILT_RIGHT: 'Nghiêng phải' };

// Feature A bank. type: tf (true/false), dir (direction), pick (tilt toward the correct side).
const HEAD_BANK = [
  { type: 'tf', zh: '猫', py: 'māo', claim: 'con mèo', answer: 'NOD' },
  { type: 'tf', zh: '狗', py: 'gǒu', claim: 'con cá', answer: 'SHAKE' },
  { type: 'tf', zh: '老师', py: 'lǎoshī', claim: 'giáo viên', answer: 'NOD' },
  { type: 'tf', zh: '水', py: 'shuǐ', claim: 'lửa', answer: 'SHAKE' },
  { type: 'tf', zh: '谢谢', py: 'xièxie', claim: 'cảm ơn', answer: 'NOD' },
  { type: 'dir', zh: '左', py: 'zuǒ', answer: 'TILT_LEFT' },
  { type: 'dir', zh: '右', py: 'yòu', answer: 'TILT_RIGHT' },
  { type: 'dir', zh: '上', py: 'shàng', answer: 'NOD' },
  { type: 'pick', vi: 'quả táo', left: ['苹果', 'píngguǒ'], right: ['香蕉', 'xiāngjiāo'], answer: 'TILT_LEFT' },
  { type: 'pick', vi: 'trường học', left: ['医院', 'yīyuàn'], right: ['学校', 'xuéxiào'], answer: 'TILT_RIGHT' },
];
// Feature B bank: numerals 1–10 (6–10 need two hands).
const NUM_BANK = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  .map((zh, i) => ({ zh, n: i + 1, py: ['yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'][i] }));

const $ = id => document.getElementById(id);
const pickRandom = (arr, not) => { let q; do q = arr[(Math.random() * arr.length) | 0]; while (arr.length > 1 && q === not); return q; };

// Embedded in tndihoc (index.html iframe, same origin): reuse the site's voice picker & streak tracker.
const host = (() => { try { return window.parent !== window && window.parent.document ? window.parent : null; } catch { return null; } })();
if (window.frameElement) {   // auto-fit iframe height to content (stacked layout on phones is taller)
  new ResizeObserver(() => { window.frameElement.style.height = document.documentElement.scrollHeight + 'px'; })
    .observe(document.body);
}

// Text-to-speech for pronunciation (free, offline on most OSes).
function speak(text) {
  if (host?.tnVoice?.ok) return host.tnVoice.speak(text, { rate: 0.85 });
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = 0.85;
  speechSynthesis.speak(u);
}

const Game = {
  mode: 'head', q: null, score: 0, streak: 0, busy: false,

  next() {
    this.q = pickRandom(this.mode === 'head' ? HEAD_BANK : NUM_BANK, this.q);
    this.render();
    this.busy = false;
  },

  render() {
    const q = this.q, card = $('card');
    let html;
    if (this.mode === 'hand') {
      html = `<p class="prompt">Giơ đúng số ngón tay (dùng 2 tay cho số > 5):</p>
              <div class="zh">${q.zh}</div><div class="py">${q.py}</div>`;
      speak(q.zh);
    } else if (q.type === 'tf') {
      html = `<p class="prompt">Nghĩa có đúng không?</p>
              <div class="zh">${q.zh}</div><div class="py">${q.py}</div><div class="claim">= ${q.claim} ?</div>
              <p class="hint">Gật = 对 (đúng) · Lắc = 不对 (sai)</p>`;
      speak(q.zh);
    } else if (q.type === 'dir') {
      html = `<p class="prompt">Làm theo phương hướng:</p>
              <div class="zh">${q.zh}</div><div class="py">${q.py}</div>
              <p class="hint">左 = nghiêng trái · 右 = nghiêng phải · 上 = gật đầu</p>`;
      speak(q.zh);
    } else {
      html = `<p class="prompt">Từ nào nghĩa là “${q.vi}”? Nghiêng đầu về phía đáp án.</p>
              <div class="choices">
                <div class="choice">${q.left[0]}<small>${q.left[1]} · ← trái</small></div>
                <div class="choice">${q.right[0]}<small>${q.right[1]} · phải →</small></div>
              </div>`;
    }
    card.innerHTML = `<div class="fade-in">${html}</div>`;
    $('feedback').className = 'feedback'; $('feedback').textContent = '';
  },

  /** Called with a gesture name (head mode) or finger count (hand mode). */
  answer(input) {
    if (this.busy || !this.q) return;
    const correct = this.mode === 'hand' ? input === this.q.n : input === this.q.answer;
    // Head mode: ignore gestures that are not valid for this question type (avoids accidental fails).
    if (this.mode === 'head' && !correct) {
      const valid = { tf: ['NOD', 'SHAKE'], dir: ['NOD', 'TILT_LEFT', 'TILT_RIGHT'], pick: ['TILT_LEFT', 'TILT_RIGHT'] }[this.q.type];
      if (!valid.includes(input)) return;
    }
    this.busy = true;
    host?.trackStudyActivity?.();   // counts toward the site's "10 phút học liên tục" streak
    this.score += correct ? 10 : 0;
    this.streak = correct ? this.streak + 1 : 0;
    $('score').textContent = this.score; $('streak').textContent = this.streak;
    const label = this.mode === 'hand' ? `${input} ngón` : GESTURE_VI[input];
    const fb = $('feedback');
    fb.className = `feedback ${correct ? 'ok' : 'bad'}`;
    fb.textContent = correct ? `✓ 对了！(${label})` : `✗ ${label} — thử câu tiếp nhé`;
    if (correct && this.q.zh) speak('对');
    setTimeout(() => this.next(), 1300);
  },

  setMode(mode) {
    this.mode = mode;
    head.reset(); fingers.reset();
    document.querySelectorAll('.modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    this.next();
  },
};

/* -------------------------------------------------------------------- Loop */
const video = $('video'), canvas = $('overlay'), ctx = canvas.getContext('2d'), hud = $('hud');
const head = new HeadGestures(), fingers = new FingerCounter();
let landmarker = null, lastVideoTime = -1, switching = false;

async function useMode(mode) {
  switching = true; hud.textContent = 'Đang tải mô hình…';
  landmarker = await Vision.get(mode);
  switching = false; hud.textContent = mode === 'head' ? 'Nhìn thẳng vào camera' : 'Đưa bàn tay vào khung hình';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawTips(hands) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f08a3c';
  for (const lm of hands) for (const i of [4, 8, 12, 16, 20]) {
    ctx.beginPath(); ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 6, 0, 7); ctx.fill();
  }
}

function tick() {
  schedule();
  if (switching || !landmarker || video.currentTime === lastVideoTime) return; // only process NEW frames
  lastVideoTime = video.currentTime;
  const t = performance.now();

  if (Game.mode === 'head') {
    const res = landmarker.detectForVideo(video, t);
    const lm = res.faceLandmarks?.[0];
    if (!lm) { hud.textContent = 'Không thấy khuôn mặt'; return; }
    const g = head.update(lm, t);
    hud.textContent = g ? GESTURE_VI[g] : 'Sẵn sàng';
    if (g) Game.answer(g);
  } else {
    const hands = landmarker.detectForVideo(video, t).landmarks ?? [];
    drawTips(hands);
    const live = hands.reduce((s, lm) => s + fingersUp(lm), 0);
    hud.textContent = hands.length ? `Đếm: ${live} ngón` : 'Không thấy bàn tay';
    const n = fingers.update(hands, t);
    if (n) Game.answer(n);
  }
}

// requestVideoFrameCallback fires once per decoded frame (ideal); rAF is the fallback.
const schedule = () => {
  if (document.hidden) return;                     // stop work in background tabs; resumed by visibilitychange
  'requestVideoFrameCallback' in video ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
};
document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });

/* ------------------------------------------------------------------- Boot */
document.querySelectorAll('.modes button').forEach(b => b.addEventListener('click', async () => {
  if (b.dataset.mode === Game.mode) return;
  await useMode(b.dataset.mode);
  Game.setMode(b.dataset.mode);
}));

// Keyboard fallback (testing without a camera / accessibility).
document.addEventListener('keydown', e => {
  const k = { y: 'NOD', n: 'SHAKE', ArrowLeft: 'TILT_LEFT', ArrowRight: 'TILT_RIGHT' }[e.key];
  if (Game.mode === 'head' && k) Game.answer(k);
  if (Game.mode === 'hand' && /^[0-9]$/.test(e.key)) Game.answer(+e.key || 10); // "0" = 10
});

$('btnStart').addEventListener('click', async () => {
  const msg = $('loadMsg');
  try {
    msg.textContent = 'Đang bật camera…';
    await Camera.start(video);
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    msg.textContent = 'Đang tải mô hình MediaPipe…';
    await useMode('head');
    $('start').remove();
    Game.next();
    schedule();
  } catch (err) {
    console.error(err);
    msg.textContent = `Lỗi: ${err.message}. Cần HTTPS hoặc localhost và quyền camera.`;
  }
});
