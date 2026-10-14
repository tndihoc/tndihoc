/* =====================================================================
   TƯƠNG TÁC BẰNG CAMERA — tab "📷 Tương tác camera" trong khu Trò chơi
   ---------------------------------------------------------------------
   2 trò, mỗi lượt 1 phút, mỗi câu 5 giây (hết giờ → tự chuyển câu khác):
     • tilt  : hiện 1 từ (theo cấp độ HSK đang chọn) + 1 nghĩa → nghiêng TRÁI = Đúng, nghiêng PHẢI = Sai
     • count : hiện số 一 → 十 → giơ đúng số ngón tay (2 tay cho số > 5)
   Kỷ lục = số câu đúng trong 1 phút: lưu trên máy (localStorage) + bảng top 10
   trên Firestore: camRecords/{tilt|count}/scores/{uid} = { name, best, games, updatedAt }.

   Dùng lại hàm chung của trang (khai báo ở index.html): gameWords, sndCorrect, sndWrong,
   addToNotebook, trackWordMemorized, trackStudyActivity, gameStopHandlers, tnVoice, tnAuth, tnEnsureFb.
   MediaPipe (~8 MB) chỉ được tải khi bấm "Bật camera" lần đầu.
   ===================================================================== */

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const CFG = {
  sessionSec: 60,
  questionSec: 5,
  feedbackMs: 700,        // hiện đúng/sai bao lâu trước khi sang câu mới
  faceModel: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  handModel: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  tiltRad: 0.26,          // ~15° lệch so với tư thế thẳng thì tính là nghiêng
  tiltHoldMs: 250,        // phải giữ nghiêng chừng này mới nhận
  holdMs: 600,            // giữ nguyên số ngón tay chừng này mới nhận
  maxRecord: 100,         // chặn số liệu vô lý khi ghi bảng kỷ lục
};
const NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const NUM_PY = ['yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'];
const MODE_NAME = { tilt: 'Nghiêng đầu Đúng / Sai', count: 'Đếm số bằng ngón tay' };

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const call = (name, ...a) => { try { return typeof window[name] === 'function' ? window[name](...a) : undefined; } catch (e) { console.warn(name, e); } };
const pick = arr => arr[(Math.random() * arr.length) | 0];

if ($('game-camera')) init();

function init() {
  const el = {
    setup: $('cam-setup'), play: $('cam-play'), result: $('cam-result'),
    start: $('cam-start'), warn: $('cam-setup-warning'), msg: $('cam-setup-msg'), myBest: $('cam-my-best'),
    video: $('cam-video'), canvas: $('cam-overlay'), hud: $('cam-hud'), card: $('cam-card'),
    time: $('cam-session-time'), correct: $('cam-correct'), bar: $('cam-timebar'),
  };
  const ctx = el.canvas.getContext('2d');
  let mode = 'tilt';

  /* ---------------- Chọn trò + kiểm tra dữ liệu ---------------- */
  const words = () => call('gameWords') || [];
  function refreshSetup() {
    const ok = mode === 'count' || words().length >= 4;
    el.start.disabled = !ok;
    el.start.classList.toggle('opacity-50', !ok);
    el.warn.classList.toggle('hidden', ok);
    el.myBest.textContent = localBest(mode) || '—';
    $('cam-board-title').textContent = MODE_NAME[mode];
  }
  document.querySelectorAll('[data-cam-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.camMode;
    document.querySelectorAll('[data-cam-mode]').forEach(x => x.classList.toggle('active', x === b));
    refreshSetup(); Board.load(mode);
  }));
  // Đổi cấp độ HSK → kiểm tra lại số từ (bộ chọn cấp độ dùng chung của khu Trò chơi)
  document.querySelectorAll('.game-hsk-pill').forEach(p => p.addEventListener('click', () => setTimeout(refreshSetup)));
  document.querySelectorAll('[data-game-tab="camera"]').forEach(t => t.addEventListener('click', () => { refreshSetup(); Board.load(mode); }));
  document.querySelectorAll('[data-cam-board-refresh]').forEach(b => b.addEventListener('click', () => Board.load(mode, true)));

  /* ---------------- Camera + MediaPipe (tải lười) ---------------- */
  let stream = null, vision = null, files = null, face = null, hand = null;
  async function openCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
    el.video.srcObject = stream;
    await new Promise(r => (el.video.readyState >= 1 ? r() : (el.video.onloadedmetadata = r)));
    await el.video.play();
    el.canvas.width = el.video.videoWidth; el.canvas.height = el.video.videoHeight;
  }
  function closeCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; el.video.srcObject = null;
  }
  async function landmarker(kind) {
    vision ??= await import(`${MP}/vision_bundle.mjs`);
    files ??= await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const make = async (Klass, path, extra) => {
      for (const delegate of ['GPU', 'CPU']) {
        try { return await Klass.createFromOptions(files, { baseOptions: { modelAssetPath: path, delegate }, runningMode: 'VIDEO', ...extra }); }
        catch (e) { if (delegate === 'CPU') throw e; }
      }
    };
    if (kind === 'tilt') return (face ??= await make(vision.FaceLandmarker, CFG.faceModel, { numFaces: 1 }));
    return (hand ??= await make(vision.HandLandmarker, CFG.handModel, { numHands: 2 }));
  }

  /* ---------------- Nhận diện: nghiêng đầu ----------------
     Góc nghiêng = góc đường nối 2 khoé mắt ngoài (điểm 33 & 263) trên khung hình gốc (chưa lật gương).
     < 0: nghiêng về vai PHẢI của người chơi; > 0: vai TRÁI. Tư thế "thẳng" được học dần (EMA)
     để ai quen hơi lệch đầu cũng không bị nhận nhầm. Sau mỗi lần nhận phải về thẳng mới nhận tiếp. */
  const Tilt = {
    base: 0, since: 0, armed: true,
    reset() { this.since = 0; this.armed = false; },
    update(lm, t) {
      const r = Math.atan2(lm[263].y - lm[33].y, lm[263].x - lm[33].x), d = r - this.base;
      if (Math.abs(d) < CFG.tiltRad * 0.5) { this.armed = true; this.base += (r - this.base) * 0.03; }
      if (!this.armed || Math.abs(d) < CFG.tiltRad) { this.since = 0; return null; }
      this.since ||= t;
      if (t - this.since < CFG.tiltHoldMs) return null;
      this.reset();
      return d > 0 ? 'left' : 'right';
    },
  };

  /* ---------------- Nhận diện: đếm ngón tay ----------------
     Ngón duỗi = đầu ngón xa cổ tay hơn hẳn khớp giữa (không phụ thuộc góc xoay bàn tay).
     Ngón cái duỗi = đầu ngón cái xa gốc ngón út hơn hẳn gốc ngón cái. */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function fingersUp(lm) {
    let n = 0;
    for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) if (dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]) * 1.15) n++;
    if (dist(lm[4], lm[17]) > dist(lm[2], lm[17]) * 1.2) n++;
    return n;
  }
  const Count = {
    value: -1, since: 0, done: false,
    reset() { this.value = -1; this.done = false; },
    update(n, t) {   // trả về số ngón khi đã giữ đủ lâu (1 lần cho mỗi lần giữ)
      if (n !== this.value) { this.value = n; this.since = t; this.done = false; return null; }
      if (!this.done && n > 0 && t - this.since >= CFG.holdMs) { this.done = true; return n; }
      return null;
    },
  };
  function drawTips(hands) {
    ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    ctx.fillStyle = '#FFC72C'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    for (const lm of hands) for (const i of [4, 8, 12, 16, 20]) {
      ctx.beginPath(); ctx.arc(lm[i].x * el.canvas.width, lm[i].y * el.canvas.height, 9, 0, 7); ctx.fill(); ctx.stroke();
    }
  }

  /* ---------------- Vòng chơi ---------------- */
  const S = { running: false, det: null, endAt: 0, qEnd: 0, q: null, ok: 0, total: 0, locked: false, lastVT: -1, raf: 0, timer: 0 };

  async function start() {
    el.start.disabled = true;
    try {
      el.msg.textContent = 'Đang bật camera…';
      await openCamera();
      el.msg.textContent = 'Đang tải mô hình nhận diện (lần đầu hơi lâu)…';
      S.det = await landmarker(mode);
    } catch (err) {
      console.error(err); closeCamera();
      el.msg.textContent = err && err.name === 'NotAllowedError'
        ? 'Bạn chưa cho phép dùng camera. Hãy bấm biểu tượng camera trên thanh địa chỉ để cho phép rồi thử lại.'
        : 'Không bật được camera hoặc không tải được mô hình. Kiểm tra camera, mạng (ở Trung Quốc cần VPN) rồi thử lại.';
      el.start.disabled = false; return;
    }
    el.msg.textContent = 'Hình ảnh camera chỉ xử lý ngay trên máy bạn, không gửi đi đâu.';
    el.start.disabled = false;
    el.setup.classList.add('hidden'); el.result.classList.add('hidden'); el.play.classList.remove('hidden');
    Object.assign(S, { running: true, ok: 0, total: 0, locked: false, lastVT: -1, endAt: performance.now() + CFG.sessionSec * 1000 });
    el.correct.textContent = '0';
    Tilt.reset(); Count.reset();
    ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    nextQuestion();
    S.timer = setInterval(tickClock, 100);
    loop();
  }

  function nextQuestion() {
    if (!S.running) return;
    if (mode === 'tilt') {
      const list = words(), word = pick(list), isTrue = Math.random() < 0.5;
      let mean = word.mean;
      if (!isTrue) { const others = list.filter(w => w.mean !== word.mean); if (others.length) mean = pick(others).mean; }
      S.q = { word, isTrue: mean === word.mean, mean };
      el.card.innerHTML = `
        <p class="jn-question">Nghĩa này có đúng không?</p>
        <p class="jn-hanzi cam-hanzi">${esc(word.hanzi)}</p>
        <p class="jn-pinyin">${esc(word.pinyin)}</p>
        <p class="cam-mean">${esc(mean)}</p>
        <div class="cam-sides">
          <button type="button" class="cam-side is-true" data-cam-ans="left">⬅ Nghiêng trái<b>✅ Đúng</b></button>
          <button type="button" class="cam-side is-false" data-cam-ans="right">Nghiêng phải ➡<b>❌ Sai</b></button>
        </div>
        <p class="cam-feedback" id="cam-fb"></p>`;
      window.tnVoice && window.tnVoice.speak(word.hanzi, { rate: 0.85 });
    } else {
      let n; do n = 1 + ((Math.random() * 10) | 0); while (S.q && S.q.n === n);
      S.q = { n };
      el.card.innerHTML = `
        <p class="jn-question">Giơ đúng số ngón tay (số &gt; 5 dùng 2 tay):</p>
        <p class="jn-hanzi cam-hanzi cam-num">${NUMS[n - 1]}</p>
        <p class="jn-pinyin">${NUM_PY[n - 1]}</p>
        <p class="cam-live">Camera đếm được: <b id="cam-live">0</b> ngón</p>
        <p class="cam-feedback" id="cam-fb"></p>`;
      window.tnVoice && window.tnVoice.speak(NUMS[n - 1], { rate: 0.85 });
    }
    Count.reset();
    S.locked = false;
    S.qEnd = performance.now() + CFG.questionSec * 1000;
  }

  function answer(input) {
    if (!S.running || S.locked) return;
    S.locked = true; S.total++;
    call('trackStudyActivity');
    const correct = mode === 'tilt' ? (input === 'left') === S.q.isTrue : input === S.q.n;
    const fb = $('cam-fb');
    if (correct) {
      S.ok++; el.correct.textContent = String(S.ok);
      call('sndCorrect');
      if (mode === 'tilt') call('trackWordMemorized', S.q.word);
    } else {
      call('sndWrong');
      if (mode === 'tilt') call('addToNotebook', S.q.word);
    }
    if (mode === 'tilt') {
      const btn = el.card.querySelector(`[data-cam-ans="${input}"]`); if (btn) btn.classList.add(correct ? 'is-hit' : 'is-miss');
      fb.textContent = correct ? '🎉 Chính xác!' : `Chưa đúng — ${S.q.word.hanzi} nghĩa là “${S.q.word.mean}”`;
    } else {
      fb.textContent = correct ? '🎉 Chính xác!' : `Bạn giơ ${input} ngón — ${NUMS[S.q.n - 1]} là ${S.q.n}`;
    }
    fb.className = 'cam-feedback ' + (correct ? 'ok' : 'bad');
    setTimeout(nextQuestion, CFG.feedbackMs);
  }

  function timeout() {   // hết 5 giây chưa trả lời → không tính sai, chuyển câu khác
    if (S.locked) return;
    S.locked = true; S.total++;
    const fb = $('cam-fb');
    fb.textContent = mode === 'tilt' ? `⏰ Hết giờ — ${S.q.word.hanzi} nghĩa là “${S.q.word.mean}”` : `⏰ Hết giờ — ${NUMS[S.q.n - 1]} là ${S.q.n}`;
    fb.className = 'cam-feedback bad';
    setTimeout(nextQuestion, CFG.feedbackMs);
  }

  function tickClock() {
    const now = performance.now(), left = Math.max(0, S.endAt - now);
    const sec = Math.ceil(left / 1000);
    el.time.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    const q = S.locked ? 0 : Math.max(0, S.qEnd - now) / (CFG.questionSec * 1000);
    el.bar.style.width = (S.locked ? 0 : q * 100) + '%';
    el.bar.classList.toggle('is-low', !S.locked && q < 0.3);
    if (left <= 0) return finish();
    if (!S.locked && now >= S.qEnd) timeout();
  }

  // Chỉ chạy nhận diện khi camera có khung hình MỚI (tiết kiệm CPU/GPU)
  function loop() {
    if (!S.running) return;
    S.raf = 'requestVideoFrameCallback' in el.video ? el.video.requestVideoFrameCallback(frame) : requestAnimationFrame(frame);
  }
  function frame() {
    if (!S.running) return;
    loop();
    if (el.video.currentTime === S.lastVT) return;
    S.lastVT = el.video.currentTime;
    const t = performance.now();
    try {
      if (mode === 'tilt') {
        const lm = S.det.detectForVideo(el.video, t).faceLandmarks?.[0];
        el.hud.textContent = lm ? 'Đã thấy khuôn mặt 🙂' : 'Chưa thấy khuôn mặt — nhìn thẳng vào camera';
        if (!lm) return;
        const g = Tilt.update(lm, t);
        if (g && !S.locked) answer(g);
      } else {
        const hands = S.det.detectForVideo(el.video, t).landmarks || [];
        drawTips(hands);
        const n = hands.reduce((s, lm) => s + fingersUp(lm), 0);
        el.hud.textContent = hands.length ? `Đếm được ${n} ngón ✋` : 'Chưa thấy bàn tay — đưa tay vào khung hình';
        const live = $('cam-live'); if (live) live.textContent = String(n);
        const got = Count.update(n, t);
        if (got && !S.locked) answer(got);
      }
    } catch (e) { console.warn('camera game frame', e); }
  }

  function halt() {
    S.running = false;
    clearInterval(S.timer);
    closeCamera();
    window.tnVoice && window.tnVoice.stop && window.tnVoice.stop();
  }
  function stopToSetup() {
    if (S.running) halt();
    el.play.classList.add('hidden'); el.result.classList.add('hidden'); el.setup.classList.remove('hidden');
    refreshSetup();
  }
  function finish() {
    halt();
    call('sndWin');
    const score = S.ok, prev = localBest(mode), isNew = score > prev;
    if (isNew) setLocalBest(mode, score);
    $('cam-final-correct').textContent = score;
    $('cam-final-total').textContent = S.total;
    $('cam-final-score').textContent = score;
    $('cam-final-best').textContent = isNew ? `${score} 🏅 mới!` : String(Math.max(prev, score));
    $('cam-result-emoji').textContent = score >= 15 ? '👑' : score >= 8 ? '🔥' : '💪';
    el.play.classList.add('hidden'); el.result.classList.remove('hidden');
    Board.submit(mode, score, $('cam-lb-note'));
  }

  el.start.addEventListener('click', start);
  $('cam-quit').addEventListener('click', stopToSetup);
  $('cam-back').addEventListener('click', stopToSetup);
  $('cam-play-again').addEventListener('click', start);
  // Bấm chuột vào ô Đúng / Sai (dự phòng khi camera nhận chưa tốt)
  el.card.addEventListener('click', e => { const b = e.target.closest('[data-cam-ans]'); if (b) answer(b.dataset.camAns); });

  // Tự dừng (tắt camera) khi chuyển trò khác, rời mục Trò chơi / trang, hoặc ẩn tab trình duyệt
  (window.gameStopHandlers || []).push(stopToSetup);
  const visible = () => {
    const panel = $('game-camera'), games = $('vocab-games'), page = $('chinese');
    return panel.classList.contains('active') && (!page || page.classList.contains('is-active'))
      && (!games || !games.classList.contains('hub-part') || games.classList.contains('hub-show'));
  };
  const mo = new MutationObserver(() => { if (S.running && !visible()) stopToSetup(); });
  ['game-camera', 'vocab-games', 'chinese'].forEach(id => $(id) && mo.observe($(id), { attributes: true, attributeFilter: ['class'] }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.running) stopToSetup(); });

  refreshSetup();
}

/* ---------------- Kỷ lục ---------------- */
const LS_KEY = m => 'tndihoc_cam_best_' + m;
function localBest(m) { try { return Number(localStorage.getItem(LS_KEY(m)) || 0); } catch { return 0; } }
function setLocalBest(m, v) { try { localStorage.setItem(LS_KEY(m), String(v)); } catch {} }

const Board = {
  rows: {}, loading: false,
  async fb() {
    const fb = window.tnEnsureFb ? await Promise.race([window.tnEnsureFb(), new Promise(r => setTimeout(() => r(null), 15000))]) : null;
    return fb && fb.db ? fb : null;
  },
  user() { return window.tnAuth && window.tnAuth.user; },
  name() {
    const a = window.tnAuth || {}, p = a.profile, u = a.user;
    return String((p && p.name) || (u && (u.displayName || (u.email || '').split('@')[0])) || 'Học viên').trim().slice(0, 60) || 'Học viên';
  },
  draw(m, html) { document.querySelectorAll('[data-cam-board]').forEach(b => (b.innerHTML = html)); },
  render(m) {
    const rows = this.rows[m] || [], uid = this.user() && this.user().uid, medals = ['🥇', '🥈', '🥉'];
    this.draw(m, rows.length ? rows.map((r, i) => `
      <div class="cam-row${r.id === uid ? ' is-me' : ''}">
        <span class="cam-rank">${i < 3 ? medals[i] : i + 1}</span>
        <span class="cam-name">${esc(r.name || 'Học viên')}${r.id === uid ? ' <small>(bạn)</small>' : ''}</span>
        <span class="cam-best"><b>${Number(r.best) || 0}</b> câu/phút</span>
      </div>`).join('')
      : `<p class="cam-empty">Chưa có kỷ lục nào cho trò này — hãy là người đầu tiên! 🚀</p>`);
  },
  async load(m, force) {
    if (this.rows[m] && !force) return this.render(m);
    this.draw(m, '<p class="cam-empty">Đang tải bảng kỷ lục…</p>');
    const fb = await this.fb();
    if (!fb) return this.draw(m, '<p class="cam-empty">Không kết nối được máy chủ để tải bảng kỷ lục (ở Trung Quốc cần VPN).</p>');
    try {
      const { db, D } = fb;
      const snap = await D.getDocs(D.query(D.collection(db, 'camRecords', m, 'scores'), D.orderBy('best', 'desc'), D.limit(10)));
      this.rows[m] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.render(m);
    } catch (err) {
      console.error('Tải bảng kỷ lục camera lỗi:', err);
      this.draw(m, `<p class="cam-empty">${err.code === 'permission-denied' ? 'Bảng kỷ lục chưa được bật (cần cập nhật Rules của Firestore).' : 'Chưa tải được bảng kỷ lục. Kiểm tra mạng rồi bấm "Làm mới".'}</p>`);
    }
  },
  async submit(m, score, noteEl) {
    const note = (t, cls) => { if (noteEl) { noteEl.textContent = t; noteEl.className = 'lb-note ' + (cls || ''); } };
    score = Math.min(CFG.maxRecord, Math.max(0, score | 0));
    if (!this.user()) { note('Đăng nhập để kỷ lục của bạn hiện trên bảng kỷ lục chung.', 'is-guest'); return this.load(m); }
    const fb = await this.fb();
    if (!fb) { note('Chưa kết nối được máy chủ nên kỷ lục lần này chỉ lưu trên máy bạn.', 'is-err'); return; }
    const { db, D } = fb, ref = D.doc(db, 'camRecords', m, 'scores', this.user().uid);
    try {
      const snap = await D.getDoc(ref), old = snap.exists() ? Number(snap.data().best) || 0 : 0;
      const data = { name: this.name(), games: D.increment(1), updatedAt: D.serverTimestamp() };
      if (score > old || !snap.exists()) data.best = Math.max(score, old);
      await D.setDoc(ref, data, { merge: true });
      note(score > old ? `🏅 Kỷ lục mới ${score} câu/phút đã được ghi lên bảng!` : `Kỷ lục trên bảng của bạn vẫn là ${old} câu/phút.`, 'is-ok');
    } catch (err) {
      console.error('Ghi kỷ lục camera lỗi:', err);
      note(err.code === 'permission-denied' ? 'Chưa ghi được lên bảng kỷ lục (cần cập nhật Rules của Firestore).' : 'Không ghi được kỷ lục. Kiểm tra mạng rồi thử lại.', 'is-err');
    }
    this.load(m, true);
  },
};
