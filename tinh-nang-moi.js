/* =====================================================================
   TÍNH NĂNG MỚI — tndihoc
   ---------------------------------------------------------------------
   1. Bài đọc: góp ý sửa bản dịch (chờ duyệt) + bình luận
   2. Chép chính tả: đánh máy (đo tốc độ) + chép tay (đăng ảnh lên Góc luyện chữ)
   3. Khẩu ngữ theo chủ đề: ghi âm, nộp cho giáo viên nhận xét
   4. Hội thoại 《贯通中文》 (VIP): nghe file gốc từng câu → ghi âm → nộp bài
   5. Lớp học & phân quyền: tạo lớp, mã mời, bật/tắt tính năng theo lớp hoặc theo từng người
   Dữ liệu lưu trên Firebase Firestore (cùng dự án với đăng nhập).
   File này chỉ cần tải lên GitHub cùng thư mục với index.html — không cần sửa gì bên trong.
   ===================================================================== */

/* ---------------- Tiện ích chung ---------------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Chống Stored XSS: chỉ chấp nhận URL ảnh/âm thanh hợp lệ (data:/blob:/https), rồi mã hoá cho thuộc tính HTML.
// Giá trị lạ (vd thumb bị chèn 'x" onerror="...') sẽ bị loại bỏ, trả về "" để không thể thoát khỏi dấu ngoặc của src.
const safeMedia = (src) => {
  const s = String(src ?? "");
  if (!/^(data:(?:image|audio)\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]*|blob:https?:\/\/[^\s"'<>]+|https?:\/\/[^\s"'<>]+)$/i.test(s)) return "";
  return esc(s);
};
const initialOf = (n) => (String(n || "?").trim().charAt(0) || "?").toUpperCase();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pad2 = (n) => String(n).padStart(2, "0");
function fmtTime(ts) {
  const d = ts && typeof ts.toDate === "function" ? ts.toDate() : (ts instanceof Date ? ts : null);
  if (!d) return "vừa xong";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
  if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + " ngày trước";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function fmtClock(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${pad2(sec % 60)}`; }
function randomCode(n = 6) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "";
  const r = crypto.getRandomValues(new Uint32Array(n));
  for (let i = 0; i < n; i++) s += a[r[i] % a.length];
  return s;
}
let toastTimer = null;
function toast(msg) {
  let el = $("tt-toast");
  if (!el) { el = document.createElement("div"); el.id = "tt-toast"; el.className = "tt-toast"; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function errText(e) {
  const code = (e && e.code) || "";
  if (code.includes("permission-denied")) return "Tài khoản chưa có quyền thực hiện việc này (hoặc luật Firestore chưa được cập nhật).";
  if (code.includes("unavailable") || code.includes("network")) return "Mất kết nối máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.";
  if (code.includes("resource-exhausted")) return "Dữ liệu quá lớn hoặc vượt hạn mức miễn phí hôm nay.";
  if (code.includes("invalid-argument")) return "Dữ liệu quá lớn (ảnh/ghi âm quá dài). Hãy thử lại với file nhỏ hơn.";
  return (e && e.message) ? e.message : "Có lỗi xảy ra, vui lòng thử lại.";
}
function modal(html, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = "tt-modal";
  wrap.innerHTML = `<div class="tt-modal-box" style="${opts.wide ? "max-width:820px" : ""}"><div class="tt-row between" style="margin-bottom:.6rem"><h4 style="font-weight:700;font-size:1.05rem;color:#2E3440">${opts.title || ""}</h4><button class="tt-x" data-close aria-label="Đóng">×</button></div><div class="tt-modal-body">${html}</div></div>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  const close = () => { wrap.remove(); if (!document.querySelector(".tt-modal")) document.body.style.overflow = ""; opts.onClose && opts.onClose(); };
  wrap.addEventListener("click", e => { if (e.target === wrap || e.target.closest("[data-close]")) close(); });
  const onKey = e => { if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); } };
  document.addEventListener("keydown", onKey);
  return { el: wrap.querySelector(".tt-modal-body"), close };
}
function blobToDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}
function dataURLToBlob(url) {
  const [h, b] = url.split(","); const mime = (h.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(b); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* ---------------- Trạng thái đăng nhập + Firebase ---------------- */
const T = {
  user: null, profile: null, fb: null,
  defaults: { dictation: true, speakingTasks: true, contributeEdits: true, vipDialogue: false, interview: false },
  myClasses: [], ready: false,
};
const FLAGS = [
  { perm: "can_access_dictation", feat: "dictation", label: "Chép chính tả & Góc luyện chữ", icon: "✍️" },
  { perm: "can_access_speaking_tasks", feat: "speakingTasks", label: "Khẩu ngữ theo chủ đề", icon: "🎙️" },
  { perm: "can_access_vip_dialogue", feat: "vipDialogue", label: "Hội thoại 贯通中文 (VIP)", icon: "⭐" },
  { perm: "can_contribute_edits", feat: "contributeEdits", label: "Góp ý sửa bản dịch", icon: "📝" },
  { perm: "can_access_interview", feat: "interview", label: "Training phỏng vấn (VIP)", icon: "🎤" },
];
const flagOf = (feat) => FLAGS.find(f => f.feat === feat);
const role = () => (T.profile && T.profile.role) || "user";
const isAdmin = () => !!T.user && role() === "admin";
const isStaff = () => !!T.user && (role() === "admin" || role() === "teacher");
const myName = () => (T.profile && T.profile.name) || (T.user && (T.user.displayName || (T.user.email || "").split("@")[0])) || "Học viên";

/** Kiểm tra quyền dùng 1 tính năng — cùng logic với luật Firestore (firestore.rules) */
function can(feat) {
  if (isStaff()) return true;
  const f = flagOf(feat);
  const o = T.profile && T.profile.permissions ? T.profile.permissions[f.perm] : undefined;
  if (o === true) return true;
  if (o === false) return false;
  if (T.defaults[feat]) return true;
  if (!T.user) return false;
  const ids = (T.profile && T.profile.classIds) || [];
  return T.myClasses.some(c => ids.slice(0, 3).includes(c.id) && (c.studentIds || []).includes(T.user.uid) && c.enabledFeatures && c.enabledFeatures[feat]);
}
function db() { return T.fb ? T.fb.db : null; }
function D() { return T.fb ? T.fb.D : null; }
async function fbReady() {
  if (T.fb) return T.fb;
  if (window.tnEnsureFb) { const fb = await Promise.race([window.tnEnsureFb(), sleep(15000).then(() => null)]); if (fb) T.fb = fb; }
  return T.fb;
}
/** Mở đúng thẻ trong trang "Học tiếng Trung" chứa khối id rồi cuộn tới */
function showSec(id) {
  if (window.tnHocOpen && window.tnHocOpen(id)) return;
  $(id)?.scrollIntoView({ behavior: "smooth" });
}
function needLoginHtml(what) {
  return `<div class="tt-lock"><div class="ico">🔐</div><b>Đăng nhập để ${esc(what)}</b><p>Một tài khoản — học trên mọi thiết bị, giáo viên có thể xem và nhận xét bài của bạn.</p><button class="tt-btn" data-tt-login>Đăng nhập / Đăng ký</button></div>`;
}
function lockedHtml(feat) {
  const f = flagOf(feat);
  if (!T.user) return `<div class="tt-lock"><div class="ico">${f.icon}</div><b>${esc(f.label)}</b><p>Tính năng này dành cho học viên đã đăng nhập và được giáo viên mở quyền.</p><button class="tt-btn" data-tt-login>Đăng nhập</button></div>`;
  return `<div class="tt-lock"><div class="ico">🔒</div><b>${esc(f.label)} chưa được mở cho tài khoản của bạn</b><p>${feat === "vipDialogue" ? "Đây là tính năng VIP dành cho học viên lớp giáo trình 《贯通中文》. " : feat === "interview" ? "Đây là tính năng VIP dành cho học viên được cô Thúy cấp quyền luyện phỏng vấn du học. " : ""}Hãy nhập <b>mã lớp</b> giáo viên gửi ở mục “Lớp của tôi”, hoặc liên hệ cô Thúy để được mở quyền.</p><button type="button" class="tt-btn peach" data-go-myclass>🏫 Nhập mã lớp</button></div>`;
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-tt-login]")) { e.preventDefault(); window.tnOpenLogin ? window.tnOpenLogin("login") : alert("Đang tải chức năng đăng nhập, thử lại sau giây lát."); }
});

/* ---------------- Tiến độ lưu trên máy (tự đồng bộ theo tài khoản nhờ auth.js) ---------------- */
const PKEY = "tn_tt_progress_v1";
function getProg() { try { return JSON.parse(localStorage.getItem(PKEY) || "{}") || {}; } catch (e) { return {}; } }
function setProg(fn) { const p = getProg(); fn(p); localStorage.setItem(PKEY, JSON.stringify(p)); }

/* ---------------- Giọng đọc máy (dự phòng khi chưa có file âm thanh) ---------------- */
const TTS = {
  ok: typeof window.speechSynthesis !== "undefined",
  voice() { const vs = speechSynthesis.getVoices(); return vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null; },
  stop() { if (window.tnVoice) return window.tnVoice.stop(); if (this.ok) speechSynthesis.cancel(); },
  speak(text, rate = 0.85) {
    // Dùng giọng đọc chung (hoc-tieng-trung.js): giọng tốt nhất, pitch 1.0, có ngắt nghỉ giữa câu
    if (window.tnVoice) return window.tnVoice.speak(text, { rate, pitch: 1.0 });
    return new Promise(res => {
      if (!this.ok) return res(false);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN"; u.rate = rate; const v = this.voice(); if (v) u.voice = v;
      u.onend = () => res(true); u.onerror = () => res(false);
      speechSynthesis.speak(u);
    });
  },
};
if (TTS.ok) speechSynthesis.onvoiceschanged = () => {};

/* ---------------- Ghi âm (MediaRecorder) ---------------- */
const REC = {
  supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
  mime() {
    const c = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];
    return c.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } }) || "";
  },
  /** Bắt đầu ghi; trả về { stop(): Promise<{blob,url,dataUrl,duration}>, cancel() } */
  async start({ maxSec = 60, onTick, onAutoStop } = {}) {
    if (!this.supported) throw new Error("Trình duyệt này không hỗ trợ ghi âm. Hãy dùng Chrome / Safari bản mới.");
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { throw new Error("Chưa được phép dùng micro. Hãy bấm biểu tượng 🔒 trên thanh địa chỉ → cho phép Micro, rồi thử lại."); }
    const mime = this.mime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
    const chunks = []; const t0 = Date.now();
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    let auto = false;
    let tick = setInterval(() => {
      const s = (Date.now() - t0) / 1000; onTick && onTick(s);
      if (s >= maxSec && !auto) { auto = true; ctl.stop().then(r => onAutoStop && onAutoStop(r)); }
    }, 200);
    let done;
    const finished = new Promise(r => { done = r; });
    rec.onstop = async () => {
      clearInterval(tick); stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
      const duration = (Date.now() - t0) / 1000;
      done({ blob, url: URL.createObjectURL(blob), dataUrl: await blobToDataURL(blob), duration });
    };
    rec.start(250);
    const ctl = {
      stop() { if (rec.state !== "inactive") rec.stop(); return finished; },
      cancel() { clearInterval(tick); try { rec.stop(); } catch (e) {} stream.getTracks().forEach(t => t.stop()); },
    };
    return ctl;
  },
};

/* ---------------- Nén ảnh trước khi lưu ---------------- */
async function compressImage(file, maxSide, maxChars, q = 0.8) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Không đọc được ảnh này. Hãy chọn ảnh JPG/PNG.")); i.src = url; });
  let side = maxSide, out = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    out = c.toDataURL("image/jpeg", q);
    if (out.length <= maxChars) break;
    q = Math.max(0.45, q - 0.08); side = Math.round(side * 0.85);
  }
  URL.revokeObjectURL(url);
  return out;
}

/* ---------------- Tải dữ liệu theo tài khoản ---------------- */
const listeners = [];
function onState(fn) { listeners.push(fn); }
function emit() {
  listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  document.dispatchEvent(new CustomEvent("tt-state")); // cho hoc-tieng-trung.js (ôn từ vựng, bộ thủ) cập nhật theo quyền
}
window.tnCan = (feat) => can(feat);
window.tnIsStaff = () => isStaff();

async function loadAccountData() {
  const fb = T.fb; if (!fb) return;
  const { db, D } = fb;
  try {
    const s = await D.getDoc(D.doc(db, "settings", "defaults"));
    if (s.exists()) T.defaults = { ...T.defaults, ...s.data() };
  } catch (e) { /* luật cũ chưa cho đọc — giữ mặc định */ }
  T.myClasses = [];
  if (T.user) {
    try {
      const q = D.query(D.collection(db, "classes"), D.where("studentIds", "array-contains", T.user.uid));
      const snap = await D.getDocs(q);
      T.myClasses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.warn("tndihoc: chưa đọc được lớp học", e); }
  }
}

let authSeq = 0;
async function handleAuth(detail) {
  const seq = ++authSeq;
  T.user = detail ? detail.user : null;
  T.profile = detail ? detail.profile : null;
  if (detail && detail.fb) T.fb = detail.fb;
  document.querySelectorAll("[data-staff-only]").forEach(el => el.style.display = isStaff() ? "" : "none");
  if (T.fb) await loadAccountData();
  if (seq !== authSeq) return;
  T.ready = true;
  emit();
}
document.addEventListener("tn-auth", e => handleAuth(e.detail));

/* =====================================================================
   1) BÀI ĐỌC: góp ý bản dịch (hàng chờ duyệt) + bình luận
   ===================================================================== */
const READ = { overridesLoaded: false, openId: null, unsubComments: null };
const lessons = () => window.tnReadingLessons || [];
const lessonById = (id) => lessons().find(l => l.id === id);

/** Áp các bản dịch/ghi chú đã được duyệt (collection readingOverrides) vào dữ liệu bài đọc */
async function loadOverrides() {
  if (READ.overridesLoaded || !T.fb || !lessons().length) return;
  READ.overridesLoaded = true;
  try {
    const snap = await D().getDocs(D().collection(db(), "readingOverrides"));
    snap.forEach(d => applyOverride(d.id, d.data()));
    window.tnReadingRerender && window.tnReadingRerender();
  } catch (e) { READ.overridesLoaded = false; console.warn("tndihoc: chưa đọc được bản dịch đã duyệt", e); }
}
function applyOverride(readingId, data) {
  const l = lessonById(readingId); if (!l || !l.content) return;
  Object.entries((data && data.lines) || {}).forEach(([i, v]) => {
    const line = l.content[Number(i)]; if (!line || !v) return;
    if (typeof v.vi === "string" && v.vi.trim()) line.vi = v.vi;
    if (typeof v.note === "string") line.note = v.note;
  });
}

function readingExtraBox() {
  let box = $("tt-reading-extra");
  const detail = $("baidoc-detail");
  if (box && detail && box.parentElement !== detail) detail.appendChild(box);
  return box;
}

function renderReadingExtra() {
  const box = readingExtraBox(); if (!box) return;
  const l = lessonById(READ.openId);
  if (!l) { box.hidden = true; return; }
  box.hidden = false;
  const hasContent = l.content && l.content.length;
  const card = $("baidoc-detail-card");
  if (card) card.classList.toggle("tt-can-suggest", !!(hasContent && T.user && can("contributeEdits")));
  box.innerHTML = `
    <div class="tt-card tt-fade">
      <div class="tt-row between" style="margin-bottom:.5rem">
        <div class="tt-row">
          ${hasContent ? `<button class="tt-btn soft sm" data-r-suggest>📝 Góp ý bản dịch</button>
          <button class="tt-btn ghost sm" data-r-dict>✍️ Chép chính tả bài này</button>` : ""}
        </div>
        <span class="tt-small">${hasContent ? "Mẹo: ở tab <b>Tiếng Việt</b>, bấm vào một câu để góp ý nhanh." : ""}</span>
      </div>
      <h5 style="font-weight:700;color:#2E3440;margin:.6rem 0 .2rem">💬 Thảo luận về bài đọc</h5>
      <p class="tt-small" style="margin-bottom:.4rem">Đặt câu hỏi, chia sẻ ghi chú từ vựng/ngữ pháp với các bạn học khác.</p>
      <div class="tt-comments" id="tt-r-comments"><div class="tt-empty"><span class="tt-spin"></span></div></div>
      ${T.user ? `<div class="tt-row" style="align-items:flex-end">
          <textarea class="tt-textarea" id="tt-r-cmt" rows="2" maxlength="1000" placeholder="Viết bình luận…" style="flex:1;min-height:46px"></textarea>
          <button class="tt-btn" id="tt-r-cmt-send">Gửi</button></div>`
        : `<p class="tt-small">Hãy <button class="tt-link" data-tt-login>đăng nhập</button> để bình luận.</p>`}
    </div>`;
  box.querySelector("[data-r-suggest]")?.addEventListener("click", () => openSuggest(l, 0));
  box.querySelector("[data-r-dict]")?.addEventListener("click", () => window.ttDictOpen && window.ttDictOpen(l.id));
  $("tt-r-cmt-send")?.addEventListener("click", () => sendReadingComment(l.id));
  loadReadingComments(l.id);
}

async function loadReadingComments(rid) {
  const wrap = $("tt-r-comments"); if (!wrap) return;
  if (!(await fbReady())) { wrap.innerHTML = `<div class="tt-empty">Không kết nối được máy chủ bình luận.</div>`; return; }
  try {
    const q = D().query(D().collection(db(), "readingComments", rid, "items"), D().orderBy("createdAt", "asc"), D().limit(200));
    const snap = await D().getDocs(q);
    if (READ.openId !== rid) return;
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    wrap.innerHTML = items.length ? items.map(c => `
      <div class="tt-cmt"><span class="tt-ava">${esc(initialOf(c.name))}</span>
        <div class="bub"><b>${esc(c.name || "Học viên")}</b>${c.role === "teacher" || c.role === "admin" ? ' <span class="tt-badge peach">giáo viên</span>' : ""}<span class="tt-small">${fmtTime(c.createdAt)}</span>
          ${(T.user && (c.uid === T.user.uid || isStaff())) ? `<button class="tt-link" style="float:right;color:#D6524F" data-del="${c.id}">Xoá</button>` : ""}
          <div>${esc(c.text)}</div></div></div>`).join("")
      : `<div class="tt-empty">Chưa có bình luận nào — hãy là người đầu tiên!</div>`;
    wrap.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Xoá bình luận này?")) return;
      try { await D().deleteDoc(D().doc(db(), "readingComments", rid, "items", b.dataset.del)); loadReadingComments(rid); }
      catch (e) { toast(errText(e)); }
    }));
  } catch (e) { wrap.innerHTML = `<div class="tt-empty">${esc(errText(e))}</div>`; }
}

async function sendReadingComment(rid) {
  const ta = $("tt-r-cmt"); const text = (ta.value || "").trim();
  if (!text) return;
  const btn = $("tt-r-cmt-send"); btn.disabled = true;
  try {
    await D().addDoc(D().collection(db(), "readingComments", rid, "items"), {
      uid: T.user.uid, name: myName(), role: role(), text: text.slice(0, 1000), createdAt: D().serverTimestamp(),
    });
    ta.value = ""; loadReadingComments(rid);
  } catch (e) { toast(errText(e)); }
  finally { btn.disabled = false; }
}

function openSuggest(lesson, lineIdx) {
  if (!T.user) { window.tnOpenLogin && window.tnOpenLogin("login"); return; }
  if (!can("contributeEdits")) { toast("Tài khoản của bạn chưa được mở quyền góp ý bản dịch."); return; }
  const lines = lesson.content || [];
  const m = modal(`
    <p class="tt-small" style="margin-bottom:.4rem">Góp ý của bạn sẽ được gửi tới giáo viên. Khi được duyệt, bài đọc sẽ tự động cập nhật cho mọi người.</p>
    <label class="tt-label">Câu muốn góp ý</label>
    <select class="tt-select" id="sg-line" style="width:100%">${lines.map((x, i) => `<option value="${i}" ${i === lineIdx ? "selected" : ""}>${i + 1}. ${esc(x.cn.slice(0, 40))}${x.cn.length > 40 ? "…" : ""}</option>`).join("")}</select>
    <div class="tt-note" id="sg-cur" style="margin-top:.6rem"></div>
    <label class="tt-label">Loại góp ý</label>
    <div class="tt-row">
      <label class="tt-radio"><input type="radio" name="sg-type" value="vi" checked> <span>✏️ Sửa bản dịch</span></label>
      <label class="tt-radio"><input type="radio" name="sg-type" value="note"> <span>💡 Thêm ghi chú ngữ cảnh / giải thích</span></label>
    </div>
    <label class="tt-label" id="sg-lab">Bản dịch đề xuất</label>
    <textarea class="tt-textarea" id="sg-text" maxlength="600"></textarea>
    <label class="tt-label">Lý do (không bắt buộc)</label>
    <input class="tt-input" id="sg-reason" maxlength="300" style="width:100%" placeholder="VD: 'gāoxìng' ở đây mang nghĩa 'vui mừng' hợp ngữ cảnh hơn">
    <div class="tt-row" style="justify-content:flex-end;margin-top:1rem"><button class="tt-btn ghost" data-close>Huỷ</button><button class="tt-btn peach" id="sg-send">Gửi góp ý</button></div>
  `, { title: "📝 Góp ý bản dịch — " + esc(lesson.title) });
  const el = m.el;
  const showCur = () => {
    const i = Number(el.querySelector("#sg-line").value); const x = lines[i];
    const t = el.querySelector("[name=sg-type]:checked").value;
    el.querySelector("#sg-cur").innerHTML = `<div class="tt-hz" style="font-size:18px;color:#2E3440">${esc(x.cn)}</div><div style="font-size:12.5px">${esc(x.pinyin || "")}</div><div style="margin-top:3px">Bản dịch hiện tại: <b>${esc(x.vi || "—")}</b></div>${x.note ? `<div>Ghi chú hiện tại: ${esc(x.note)}</div>` : ""}`;
    el.querySelector("#sg-lab").textContent = t === "vi" ? "Bản dịch đề xuất" : "Ghi chú / giải thích ngữ cảnh";
    const ta = el.querySelector("#sg-text"); if (!ta.dataset.touched) ta.value = t === "vi" ? (x.vi || "") : (x.note || "");
  };
  el.querySelector("#sg-line").addEventListener("change", () => { el.querySelector("#sg-text").dataset.touched = ""; showCur(); });
  el.querySelectorAll("[name=sg-type]").forEach(r => r.addEventListener("change", () => { el.querySelector("#sg-text").dataset.touched = ""; showCur(); }));
  el.querySelector("#sg-text").addEventListener("input", e => e.target.dataset.touched = "1");
  showCur();
  el.querySelector("#sg-send").addEventListener("click", async () => {
    const i = Number(el.querySelector("#sg-line").value); const x = lines[i];
    const type = el.querySelector("[name=sg-type]:checked").value;
    const sug = el.querySelector("#sg-text").value.trim();
    const original = type === "vi" ? (x.vi || "") : (x.note || "");
    if (!sug || sug === original) { toast("Hãy nhập nội dung góp ý khác với bản hiện tại."); return; }
    const b = el.querySelector("#sg-send"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang gửi';
    try {
      await D().addDoc(D().collection(db(), "contributions"), {
        readingId: lesson.id, readingTitle: lesson.title, hsk: lesson.hsk || "", lineIndex: i, field: type,
        cn: x.cn, originalText: original, suggestedText: sug.slice(0, 600),
        reason: el.querySelector("#sg-reason").value.trim().slice(0, 300),
        uid: T.user.uid, name: myName(), email: T.user.email || "", status: "pending", createdAt: D().serverTimestamp(),
      });
      m.close(); toast("✅ Đã gửi góp ý — cảm ơn bạn! Giáo viên sẽ xem và duyệt.");
    } catch (e) { toast(errText(e)); b.disabled = false; b.textContent = "Gửi góp ý"; }
  });
}

document.addEventListener("tn-reading-open", e => { READ.openId = e.detail.id; renderReadingExtra(); });
document.addEventListener("tn-reading-close", () => { READ.openId = null; renderReadingExtra(); });
document.addEventListener("click", e => {
  const s = e.target.closest(".tt-can-suggest .baidoc-vi-block .vi-sentence");
  if (!s) return;
  const l = lessonById(READ.openId); if (l) openSuggest(l, Number(s.dataset.line || 0));
});
onState(() => { loadOverrides(); if (READ.openId) renderReadingExtra(); });
// Kho bài đọc được tải từ máy chủ sau khi đăng nhập (bai-doc.js) → áp bản dịch đã duyệt, vẽ lại chép chính tả
document.addEventListener("tn-readings-ready", () => { READ.overridesLoaded = false; loadOverrides(); renderDictation(); });

/* =====================================================================
   2) CHÉP CHÍNH TẢ — đánh máy (đo tốc độ) + chép tay (đăng ảnh)
   ===================================================================== */
const DICT = { tab: "type", input: "hz", level: "", lessonId: "", idx: 0, results: [], t0: 0, tEnd: 0, timer: null, rate: 0.8, checked: false, handRun: 0 };
const hzOnly = (s) => (String(s || "").match(/[\u3400-\u9fff0-9A-Za-z]/g) || []);
function pyLetters(s) {
  return (String(s || "").toLowerCase().replace(/ü|u:/g, "v").normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z]/g) || []);
}
/** So khớp 2 dãy ký tự (LCS) → đánh dấu từng ký tự đúng / thiếu / thừa */
function diffSeq(exp, got) {
  const n = exp.length, m = got.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = exp[i] === got[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && exp[i] === got[j]) { out.push({ c: exp[i], t: "ok" }); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { out.push({ c: got[j], t: "ex" }); j++; }
    else { out.push({ c: exp[i], t: "miss" }); i++; }
  }
  return { parts: out, ok: L[0][0], total: n, extra: m - L[0][0] };
}
const dictLessons = () => lessons().filter(l => l.content && l.content.length);
const dictLines = (l) => (l ? l.content.filter(x => hzOnly(x.cn).length) : []);

function renderDictation() {
  const box = $("tt-dictation"); if (!box) return;
  const head = `<div class="tt-head"><span class="tt-stamp">听</span><h3>Chép chính tả</h3><span class="tt-badge peach">mới</span></div>
    <p class="tt-desc">Nghe từng câu trong kho bài đọc HSK rồi <b>gõ lại</b> (đo tốc độ chữ/phút) hoặc <b>chép tay</b> ra giấy, chụp ảnh và chia sẻ ở <a href="#tt-gallery" class="tt-link">Góc luyện chữ</a>.</p>`;
  if (!T.user) { box.innerHTML = head + needLoginHtml("luyện chép chính tả với kho bài đọc HSK"); return; }
  if (!can("dictation")) { box.innerHTML = head + lockedHtml("dictation"); return; }
  const all = dictLessons();
  if (!all.length) { box.innerHTML = head + `<div class="tt-empty">Đang tải kho bài đọc…</div>`; return; }
  const levels = [...new Set(all.map(l => String(l.hsk)))].sort();
  if (!DICT.level) DICT.level = levels[0];
  if (!DICT.lessonId || !all.some(l => l.id === DICT.lessonId)) DICT.lessonId = (all.find(l => String(l.hsk) === DICT.level) || all[0]).id;
  const inLevel = all.filter(l => String(l.hsk) === DICT.level);
  box.innerHTML = head + `
    <div class="tt-card">
      <div class="tt-tabs">
        <button class="tt-tab ${DICT.tab === "type" ? "active" : ""}" data-dt="type">⌨️ Đánh máy</button>
        <button class="tt-tab ${DICT.tab === "hand" ? "active" : ""}" data-dt="hand">✍️ Chép tay</button>
      </div>
      <div class="tt-row" style="margin-bottom:.9rem">
        <select class="tt-select" id="dt-level">${levels.map(v => `<option value="${v}" ${v === DICT.level ? "selected" : ""}>HSK ${v}</option>`).join("")}</select>
        <select class="tt-select" id="dt-lesson" style="flex:1;min-width:200px">${inLevel.map(l => `<option value="${l.id}" ${l.id === DICT.lessonId ? "selected" : ""}>${esc(l.title)} (${dictLines(l).length} câu)</option>`).join("")}</select>
        <select class="tt-select" id="dt-rate" title="Tốc độ đọc"><option value="0.65">🐢 Chậm</option><option value="0.8">Vừa</option><option value="1">🐇 Nhanh</option></select>
      </div>
      <div id="dt-body"></div>
    </div>`;
  $("dt-rate").value = String(DICT.rate);
  box.querySelectorAll("[data-dt]").forEach(b => b.addEventListener("click", () => { stopDict(); DICT.tab = b.dataset.dt; renderDictation(); }));
  $("dt-level").addEventListener("change", e => { stopDict(); DICT.level = e.target.value; DICT.lessonId = ""; renderDictation(); });
  $("dt-lesson").addEventListener("change", e => { stopDict(); DICT.lessonId = e.target.value; resetDict(); renderDictBody(); });
  $("dt-rate").addEventListener("change", e => { DICT.rate = Number(e.target.value); });
  if (!DICT.results.length && DICT.idx === 0) resetDict();
  renderDictBody();
}
function resetDict() { DICT.idx = 0; DICT.results = []; DICT.t0 = 0; DICT.tEnd = 0; DICT.checked = false; clearInterval(DICT.timer); }
function stopDict() { TTS.stop(); clearInterval(DICT.timer); DICT.handRun++; }
function renderDictBody() { DICT.tab === "type" ? renderTyping() : renderHand(); }

/* ---- Đánh máy ---- */
function dictStats() {
  const ok = DICT.results.reduce((s, r) => s + r.ok, 0), total = DICT.results.reduce((s, r) => s + r.total, 0);
  const end = DICT.tEnd || Date.now(); const min = DICT.t0 ? (end - DICT.t0) / 60000 : 0;
  return { ok, total, acc: total ? Math.round(ok / total * 100) : 0, cpm: min > 0.05 ? Math.round(ok / min) : 0, sec: DICT.t0 ? (end - DICT.t0) / 1000 : 0 };
}
function renderTyping() {
  const body = $("dt-body"); const l = lessonById(DICT.lessonId); const lines = dictLines(l);
  if (!lines.length) { body.innerHTML = `<div class="tt-empty">Bài này chưa có nội dung.</div>`; return; }
  if (DICT.idx >= lines.length) return renderDictSummary(l, lines);
  const line = lines[DICT.idx]; const best = (getProg().dict || {})[l.id];
  body.innerHTML = `
    <div class="tt-row" style="margin-bottom:.6rem">
      <label class="tt-radio"><input type="radio" name="dt-in" value="hz" ${DICT.input === "hz" ? "checked" : ""}> Gõ chữ Hán</label>
      <label class="tt-radio"><input type="radio" name="dt-in" value="py" ${DICT.input === "py" ? "checked" : ""}> Gõ pinyin</label>
      ${best ? `<span class="tt-small">Kỷ lục bài này: <b>${best.bestCpm} chữ/phút</b> · chính xác ${best.bestAcc}%</span>` : ""}
    </div>
    <div class="tt-dict-bar"><b style="color:#2E3440">Câu ${DICT.idx + 1}/${lines.length}</b>
      <span class="tt-live" id="dt-live">⏱ 0:00 · 0 chữ/phút</span></div>
    <div class="tt-progress"><i style="width:${DICT.idx / lines.length * 100}%"></i></div>
    <div class="tt-row" style="margin-bottom:.7rem">
      <button class="tt-btn peach" id="dt-play">🔊 Nghe câu</button>
      <button class="tt-btn ghost sm" id="dt-slow">🐢 Nghe chậm</button>
      <span class="tt-small">Phím tắt: <b>Ctrl + Space</b> nghe lại · <b>Enter</b> kiểm tra</span>
    </div>
    <input class="tt-input big ${DICT.input === "py" ? "" : "tt-hz"}" id="dt-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${DICT.input === "hz" ? "Gõ chữ Hán bạn nghe được…" : "Gõ pinyin (có hoặc không dấu đều được)…"}">
    <div id="dt-result"></div>
    <div class="tt-row" style="margin-top:.8rem;justify-content:space-between">
      <button class="tt-link" id="dt-skip">Bỏ qua câu này</button>
      <div class="tt-row"><button class="tt-btn" id="dt-check">Kiểm tra</button></div>
    </div>`;
  body.querySelectorAll("[name=dt-in]").forEach(r => r.addEventListener("change", e => { DICT.input = e.target.value; resetDict(); renderTyping(); }));
  const input = $("dt-input");
  const play = (rate) => { input.focus(); TTS.speak(line.cn, rate || DICT.rate).then(ok => { if (!ok && !TTS.ok) toast("Trình duyệt không có giọng đọc tiếng Trung."); }); };
  $("dt-play").addEventListener("click", () => play());
  $("dt-slow").addEventListener("click", () => play(0.55));
  input.addEventListener("input", () => { if (!DICT.t0) { DICT.t0 = Date.now(); startLive(); } });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); DICT.checked ? next() : check(); }
    if (e.key === " " && e.ctrlKey) { e.preventDefault(); play(); }
  });
  const check = () => {
    const got = input.value;
    const exp = DICT.input === "hz" ? hzOnly(line.cn) : pyLetters(line.pinyin);
    const d = diffSeq(exp, DICT.input === "hz" ? hzOnly(got) : pyLetters(got));
    if (!DICT.t0) DICT.t0 = Date.now();
    // Quy đổi ra "số chữ Hán viết đúng" để tốc độ 2 chế độ so sánh được với nhau
    const hzN = hzOnly(line.cn).length;
    const okHz = DICT.input === "hz" ? d.ok : Math.round(hzN * (d.total ? d.ok / d.total : 0));
    DICT.results[DICT.idx] = { ok: okHz, total: hzN };
    DICT.checked = true;
    const pct = d.total ? Math.round(d.ok / d.total * 100) : 0;
    $("dt-result").innerHTML = `<div class="tt-diff ${DICT.input === "py" ? "py" : "tt-hz"} tt-fade">${d.parts.map(p => `<span class="${p.t}">${esc(p.c)}</span>`).join("")}</div>
      <div class="tt-answer">${pct === 100 ? "🎉 <b>Chính xác 100%!</b>" : `Đúng <b>${pct}%</b>${d.extra ? ` · thừa ${d.extra} ký tự` : ""}`}<br>Đáp án: <b class="tt-hz" style="font-size:16px">${esc(line.cn)}</b> · ${esc(line.pinyin || "")}<br><span>${esc(line.vi || "")}</span></div>`;
    $("dt-check").textContent = DICT.idx + 1 < lines.length ? "Câu tiếp ▶" : "Xem kết quả";
  };
  const next = () => { DICT.idx++; DICT.checked = false; if (DICT.idx >= lines.length) DICT.tEnd = Date.now(); renderTyping(); setTimeout(() => { const i = $("dt-input"); if (i) { i.focus(); $("dt-play")?.click(); } }, 80); };
  $("dt-check").addEventListener("click", () => DICT.checked ? next() : check());
  $("dt-skip").addEventListener("click", () => { DICT.results[DICT.idx] = { ok: 0, total: hzOnly(line.cn).length }; if (!DICT.t0) DICT.t0 = Date.now(); next(); });
  if (DICT.t0) startLive();
}
function startLive() {
  clearInterval(DICT.timer);
  DICT.timer = setInterval(() => {
    const el = $("dt-live"); if (!el) return clearInterval(DICT.timer);
    const st = dictStats(); const cur = DICT.input === "hz" ? hzOnly(($("dt-input") || {}).value).length : 0;
    const min = st.sec / 60; const cpm = min > 0.05 ? Math.round((st.ok + (DICT.checked ? 0 : cur)) / min) : 0;
    el.textContent = `⏱ ${fmtClock(st.sec)} · ${cpm} chữ/phút`;
  }, 500);
}
function renderDictSummary(l, lines) {
  clearInterval(DICT.timer);
  const st = dictStats();
  let rec = false;
  if (st.total) setProg(p => {
    p.dict = p.dict || {}; const o = p.dict[l.id] || { bestCpm: 0, bestAcc: 0, times: 0 };
    rec = st.cpm > o.bestCpm;
    p.dict[l.id] = { title: l.title, bestCpm: Math.max(o.bestCpm, st.cpm), bestAcc: Math.max(o.bestAcc, st.acc), times: (o.times || 0) + 1, last: Date.now() };
  });
  if (window.trackStudyActivity) window.trackStudyActivity();
  $("dt-body").innerHTML = `<div class="tt-fade">
    <h4 style="font-weight:700;font-size:1.1rem;margin-bottom:.7rem">🏁 Hoàn thành “${esc(l.title)}” ${rec ? '<span class="tt-badge vip">kỷ lục mới!</span>' : ""}</h4>
    <div class="tt-stats">
      <div class="tt-stat peach"><div class="k">Tốc độ</div><div class="v">${st.cpm}</div><div class="tt-small">chữ đúng / phút</div></div>
      <div class="tt-stat navy"><div class="k">Độ chính xác</div><div class="v">${st.acc}%</div><div class="tt-small">${st.ok}/${st.total} chữ</div></div>
      <div class="tt-stat"><div class="k">Thời gian</div><div class="v">${fmtClock(st.sec)}</div><div class="tt-small">${lines.length} câu</div></div>
    </div>
    <div class="tt-row" style="margin-top:1rem"><button class="tt-btn peach" id="dt-again">↻ Làm lại bài này</button><button class="tt-btn ghost" id="dt-hand">✍️ Chép tay bài này</button></div></div>`;
  $("dt-again").addEventListener("click", () => { resetDict(); renderTyping(); });
  $("dt-hand").addEventListener("click", () => { DICT.tab = "hand"; renderDictation(); });
}

/* ---- Chép tay ---- */
function renderHand() {
  const body = $("dt-body"); const l = lessonById(DICT.lessonId); const lines = dictLines(l);
  body.innerHTML = `
    <ol class="tt-small" style="margin:0 0 .8rem 1.1rem;list-style:decimal;line-height:1.8">
      <li>Chuẩn bị giấy (vở ô li / giấy kẻ ô chữ điền). Bấm <b>Bắt đầu đọc</b>: mỗi câu được đọc 2 lần, có khoảng dừng để bạn viết.</li>
      <li>Viết xong, bấm <b>Hiện bài gốc</b> để tự chấm bằng bút đỏ.</li>
      <li>Chụp ảnh bài viết và đăng lên <b>Góc luyện chữ</b> để mọi người cùng góp ý.</li></ol>
    <div class="tt-row" style="margin-bottom:.6rem">
      <button class="tt-btn peach" id="hd-start">▶ Bắt đầu đọc</button>
      <button class="tt-btn ghost" id="hd-stop" disabled>■ Dừng</button>
      <span class="tt-live" id="hd-status">${lines.length} câu</span>
    </div>
    <div class="tt-progress"><i id="hd-bar"></i></div>
    <details style="margin-bottom:1rem"><summary class="tt-link" style="list-style:none">👁 Hiện bài gốc để tự chấm</summary>
      <div class="tt-diff tt-hz" style="font-size:20px">${lines.map(x => esc(x.cn)).join(" ")}</div></details>
    <div class="tt-card" style="background:#FFFBF6;border-color:#FFD9A8">
      <b style="color:#A65400">📷 Đăng ảnh bài chép tay</b>
      ${T.user ? `
        <input type="file" accept="image/*" id="hd-file" class="tt-input" style="width:100%;margin-top:.6rem">
        <img id="hd-preview" alt="" style="display:none;max-height:220px;border-radius:12px;margin-top:.6rem">
        <input class="tt-input" id="hd-cap" maxlength="200" placeholder="Lời nhắn (VD: Lần đầu chép bài HSK 3, mọi người góp ý giúp mình nhé!)" style="width:100%;margin-top:.6rem">
        <div class="tt-row" style="justify-content:flex-end;margin-top:.6rem"><button class="tt-btn peach" id="hd-post" disabled>Đăng lên Góc luyện chữ</button></div>`
      : `<p class="tt-small" style="margin-top:.4rem"><button class="tt-link" data-tt-login>Đăng nhập</button> để đăng ảnh bài viết.</p>`}
    </div>`;
  $("hd-start").addEventListener("click", () => runHand(lines));
  $("hd-stop").addEventListener("click", () => { stopDict(); $("hd-status").textContent = "Đã dừng"; $("hd-start").disabled = false; $("hd-stop").disabled = true; });
  const file = $("hd-file");
  if (file) {
    file.addEventListener("change", () => {
      const f = file.files[0]; const pv = $("hd-preview");
      if (f) { pv.src = URL.createObjectURL(f); pv.style.display = "block"; $("hd-post").disabled = false; }
    });
    $("hd-post").addEventListener("click", () => postHandwriting(l, file.files[0], $("hd-cap").value));
  }
}
async function runHand(lines) {
  const run = ++DICT.handRun;
  $("hd-start").disabled = true; $("hd-stop").disabled = false;
  for (let i = 0; i < lines.length; i++) {
    for (let k = 0; k < 2; k++) {
      if (run !== DICT.handRun) return;
      $("hd-status").textContent = `Câu ${i + 1}/${lines.length} · lần ${k + 1}`;
      $("hd-bar").style.width = `${(i + (k + 1) / 2) / lines.length * 100}%`;
      await TTS.speak(lines[i].cn, DICT.rate);
      if (run !== DICT.handRun) return;
      await sleep(k === 0 ? 1200 : Math.max(3500, hzOnly(lines[i].cn).length * 1100));
    }
  }
  if (run !== DICT.handRun) return;
  $("hd-status").textContent = "✅ Xong! Hãy hiện bài gốc để tự chấm.";
  $("hd-start").disabled = false; $("hd-stop").disabled = true;
  if (window.trackStudyActivity) window.trackStudyActivity();
}
async function postHandwriting(l, f, caption) {
  if (!f) return;
  const btn = $("hd-post"); btn.disabled = true; btn.innerHTML = '<span class="tt-spin"></span> Đang nén & tải ảnh…';
  try {
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    const [full, thumb] = await Promise.all([compressImage(f, 1400, 700000, 0.82), compressImage(f, 420, 60000, 0.7)]);
    const ref = D().doc(D().collection(db(), "handwriting"));
    await D().setDoc(D().doc(db(), "handwritingImages", ref.id), { uid: T.user.uid, image: full, createdAt: D().serverTimestamp() });
    await D().setDoc(ref, {
      uid: T.user.uid, name: myName(), readingId: l.id, readingTitle: l.title, hsk: String(l.hsk || ""),
      caption: String(caption || "").trim().slice(0, 200), thumb, likes: [], likesCount: 0, commentCount: 0, createdAt: D().serverTimestamp(),
    });
    toast("✅ Đã đăng lên Góc luyện chữ!");
    renderHand(); GAL.items = null; renderGallery();
    showSec("tt-gallery");
  } catch (e) { toast(errText(e)); btn.disabled = false; btn.textContent = "Đăng lên Góc luyện chữ"; }
}
window.ttDictOpen = (id) => {
  const l = lessonById(id); if (!l) return;
  stopDict(); DICT.level = String(l.hsk); DICT.lessonId = id; DICT.tab = "type"; resetDict();
  renderDictation(); showSec("tt-dictation");
};
onState(renderDictation);

/* =====================================================================
   2b) GÓC LUYỆN CHỮ — bảng tin ảnh chép tay: thích + bình luận
   ===================================================================== */
const GAL = { items: null, lastDoc: null, more: true, loading: false, mineOnly: false };
async function renderGallery() {
  const box = $("tt-gallery"); if (!box) return;
  const head = `<div class="tt-head"><span class="tt-stamp navy">字</span><h3>Góc luyện chữ</h3></div>
    <p class="tt-desc">Nơi khoe bài chép tay chữ Hán. Thả ♥ và để lại lời khen / góp ý nét chữ cho nhau nhé!</p>`;
  if (!T.user) { box.innerHTML = head + needLoginHtml("xem và chia sẻ bài chép tay"); return; }
  box.innerHTML = head + `<div class="tt-row between" style="margin-bottom:.8rem">
      <div class="tt-tabs" style="margin:0"><button class="tt-tab ${!GAL.mineOnly ? "active" : ""}" data-g="all">Tất cả</button><button class="tt-tab ${GAL.mineOnly ? "active" : ""}" data-g="mine">Bài của tôi</button></div>
      ${can("dictation") ? `<a class="tt-btn soft sm" href="#tt-dictation" id="g-new">＋ Đăng bài mới</a>` : ""}</div>
    <div class="tt-gallery" id="g-list"></div><div id="g-more" style="text-align:center;margin-top:.8rem"></div>`;
  box.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { GAL.mineOnly = b.dataset.g === "mine"; GAL.items = null; renderGallery(); }));
  $("g-new")?.addEventListener("click", (e) => { e.preventDefault(); DICT.tab = "hand"; renderDictation(); showSec("tt-dictation"); });
  if (!GAL.items) await loadGallery(true); else drawGallery();
}
async function loadGallery(reset) {
  if (GAL.loading || !(await fbReady())) return;
  GAL.loading = true;
  if (reset) { GAL.items = []; GAL.lastDoc = null; GAL.more = true; $("g-list") && ($("g-list").innerHTML = `<div class="tt-empty"><span class="tt-spin"></span></div>`); }
  try {
    const parts = [D().collection(db(), "handwriting")];
    if (GAL.mineOnly) parts.push(D().where("uid", "==", T.user.uid));
    else parts.push(D().orderBy("createdAt", "desc"));
    if (GAL.lastDoc && !GAL.mineOnly) parts.push(D().startAfter(GAL.lastDoc));
    parts.push(D().limit(GAL.mineOnly ? 100 : 24));
    const snap = await D().getDocs(D().query(...parts));
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (GAL.mineOnly) { docs.sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0)); GAL.more = false; }
    else { GAL.lastDoc = snap.docs[snap.docs.length - 1] || GAL.lastDoc; GAL.more = snap.docs.length === 24; }
    GAL.items = (GAL.items || []).concat(docs);
  } catch (e) { GAL.items = GAL.items || []; toast(errText(e)); }
  GAL.loading = false;
  drawGallery();
}
function drawGallery() {
  const list = $("g-list"); if (!list) return;
  list.innerHTML = (GAL.items || []).length ? GAL.items.map(p => `
    <button class="tt-shot" data-post="${p.id}">
      <img src="${safeMedia(p.thumb)}" alt="Bài chép tay của ${esc(p.name)}" loading="lazy">
      <div class="meta"><span class="who">${esc(p.name)}</span><span class="what">${p.hsk ? "HSK " + esc(p.hsk) + " · " : ""}${esc(p.readingTitle || "")}</span>
        <span class="cnt"><span>${(p.likes || []).includes(T.user.uid) ? "❤️" : "🤍"} ${p.likesCount || 0}</span><span>💬 ${p.commentCount || 0}</span><span>${fmtTime(p.createdAt)}</span></span></div>
    </button>`).join("") : `<div class="tt-empty" style="grid-column:1/-1">Chưa có bài nào. Hãy mở “Chép chính tả → Chép tay” và đăng bài đầu tiên!</div>`;
  list.querySelectorAll("[data-post]").forEach(b => b.addEventListener("click", () => openPost(b.dataset.post)));
  const more = $("g-more");
  if (more) { more.innerHTML = GAL.more && GAL.items.length ? `<button class="tt-btn ghost sm">Xem thêm</button>` : ""; more.querySelector("button")?.addEventListener("click", () => loadGallery(false)); }
}
async function openPost(id) {
  const p = GAL.items.find(x => x.id === id); if (!p) return;
  const m = modal(`<img class="full" id="pp-img" src="${safeMedia(p.thumb)}" alt="">
    <div class="tt-row between" style="margin:.7rem 0 .2rem"><div><b>${esc(p.name)}</b> <span class="tt-small">· ${fmtTime(p.createdAt)}</span><div class="tt-small">${p.hsk ? "HSK " + esc(p.hsk) + " · " : ""}${esc(p.readingTitle || "")}</div></div>
      <div class="tt-row"><button class="tt-btn ghost sm" id="pp-like"></button>${(p.uid === T.user.uid || isStaff()) ? `<button class="tt-btn danger sm" id="pp-del">Xoá</button>` : ""}</div></div>
    ${p.caption ? `<p style="font-size:14px;margin:.4rem 0">${esc(p.caption)}</p>` : ""}
    <div class="tt-comments" id="pp-cmts"><div class="tt-empty"><span class="tt-spin"></span></div></div>
    <div class="tt-row" style="align-items:flex-end"><textarea class="tt-textarea" id="pp-text" rows="2" maxlength="600" placeholder="Khen hoặc góp ý nét chữ…" style="flex:1;min-height:46px"></textarea><button class="tt-btn" id="pp-send">Gửi</button></div>`,
    { title: "🖼️ Bài chép tay" });
  const drawLike = () => { const liked = (p.likes || []).includes(T.user.uid); $("pp-like").innerHTML = `${liked ? "❤️" : "🤍"} ${p.likesCount || 0}`; };
  drawLike();
  D().getDoc(D().doc(db(), "handwritingImages", id)).then(s => { if (s.exists() && $("pp-img")) $("pp-img").src = s.data().image; }).catch(() => {});
  const loadC = async () => {
    try {
      const snap = await D().getDocs(D().query(D().collection(db(), "handwriting", id, "comments"), D().orderBy("createdAt", "asc"), D().limit(200)));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      $("pp-cmts").innerHTML = items.length ? items.map(c => `<div class="tt-cmt"><span class="tt-ava">${esc(initialOf(c.name))}</span><div class="bub"><b>${esc(c.name)}</b>${c.role === "teacher" || c.role === "admin" ? ' <span class="tt-badge peach">giáo viên</span>' : ""}<span class="tt-small">${fmtTime(c.createdAt)}</span>${(c.uid === T.user.uid || isStaff()) ? `<button class="tt-link" style="float:right;color:#D6524F" data-cdel="${c.id}">Xoá</button>` : ""}<div>${esc(c.text)}</div></div></div>`).join("") : `<div class="tt-empty">Chưa có bình luận.</div>`;
      $("pp-cmts").querySelectorAll("[data-cdel]").forEach(b => b.addEventListener("click", async () => {
        try {
          await D().deleteDoc(D().doc(db(), "handwriting", id, "comments", b.dataset.cdel));
          await D().updateDoc(D().doc(db(), "handwriting", id), { commentCount: D().increment(-1) });
          p.commentCount = Math.max(0, (p.commentCount || 1) - 1); loadC(); drawGallery();
        } catch (e) { toast(errText(e)); }
      }));
    } catch (e) { $("pp-cmts").innerHTML = `<div class="tt-empty">${esc(errText(e))}</div>`; }
  };
  loadC();
  $("pp-like").addEventListener("click", async () => {
    const liked = (p.likes || []).includes(T.user.uid);
    try {
      await D().updateDoc(D().doc(db(), "handwriting", id), { likes: liked ? D().arrayRemove(T.user.uid) : D().arrayUnion(T.user.uid), likesCount: D().increment(liked ? -1 : 1) });
      p.likes = liked ? p.likes.filter(u => u !== T.user.uid) : [...(p.likes || []), T.user.uid];
      p.likesCount = (p.likesCount || 0) + (liked ? -1 : 1); drawLike(); drawGallery();
    } catch (e) { toast(errText(e)); }
  });
  $("pp-send").addEventListener("click", async () => {
    const t = $("pp-text").value.trim(); if (!t) return;
    $("pp-send").disabled = true;
    try {
      await D().addDoc(D().collection(db(), "handwriting", id, "comments"), { uid: T.user.uid, name: myName(), role: role(), text: t.slice(0, 600), createdAt: D().serverTimestamp() });
      await D().updateDoc(D().doc(db(), "handwriting", id), { commentCount: D().increment(1) });
      p.commentCount = (p.commentCount || 0) + 1; $("pp-text").value = ""; loadC(); drawGallery();
    } catch (e) { toast(errText(e)); }
    $("pp-send").disabled = false;
  });
  $("pp-del")?.addEventListener("click", async () => {
    if (!confirm("Xoá bài đăng này?")) return;
    try {
      await D().deleteDoc(D().doc(db(), "handwriting", id));
      await D().deleteDoc(D().doc(db(), "handwritingImages", id)).catch(() => {});
      GAL.items = GAL.items.filter(x => x.id !== id); m.close(); drawGallery(); toast("Đã xoá bài đăng.");
    } catch (e) { toast(errText(e)); }
  });
}
onState(() => { GAL.items = null; renderGallery(); });

/* =====================================================================
   3) KHẨU NGỮ THEO CHỦ ĐỀ — ghi âm, nghe lại, nộp cho giáo viên
   ===================================================================== */
const BUILTIN_TOPICS = [
  { id: "t-ziwo", level: "HSK 1–2", icon: "🙋", title: "自我介绍", vi: "Giới thiệu bản thân",
    scene: "Buổi học đầu tiên ở lớp tiếng Trung. Hãy giới thiệu về bản thân trong khoảng 1 phút.",
    prompts: [["你叫什么名字？", "Nǐ jiào shénme míngzi?", "Bạn tên là gì?"], ["你是哪国人？今年多大？", "Nǐ shì nǎ guó rén? Jīnnián duō dà?", "Bạn là người nước nào? Năm nay bao nhiêu tuổi?"], ["你家有几口人？", "Nǐ jiā yǒu jǐ kǒu rén?", "Nhà bạn có mấy người?"], ["你为什么学习汉语？", "Nǐ wèishénme xuéxí Hànyǔ?", "Vì sao bạn học tiếng Trung?"]],
    words: [["名字", "míngzi", "tên"], ["越南人", "Yuènánrén", "người Việt Nam"], ["学生", "xuésheng", "học sinh"], ["喜欢", "xǐhuan", "thích"], ["认识", "rènshi", "quen biết"]], sec: 60 },
  { id: "t-diancai", level: "HSK 2", icon: "🍜", title: "在饭馆点菜", vi: "Gọi món ở nhà hàng",
    scene: "Bạn vào một quán ăn Trung Quốc. Hãy đóng vai khách: hỏi món, gọi món, gọi đồ uống và thanh toán.",
    prompts: [["服务员，有菜单吗？", "Fúwùyuán, yǒu càidān ma?", "Phục vụ ơi, có thực đơn không?"], ["我要一碗牛肉面，不要辣。", "Wǒ yào yì wǎn niúròumiàn, bú yào là.", "Cho tôi một bát mì bò, không cay."], ["你们这儿什么菜好吃？", "Nǐmen zhèr shénme cài hǎochī?", "Ở đây món gì ngon?"], ["买单！一共多少钱？", "Mǎidān! Yígòng duōshao qián?", "Tính tiền! Tổng cộng bao nhiêu?"]],
    words: [["菜单", "càidān", "thực đơn"], ["服务员", "fúwùyuán", "phục vụ"], ["辣", "là", "cay"], ["买单", "mǎidān", "tính tiền"], ["打包", "dǎbāo", "gói mang về"]], sec: 60 },
  { id: "t-wenlu", level: "HSK 2", icon: "🗺️", title: "问路", vi: "Hỏi đường",
    scene: "Bạn đang ở gần trường và muốn tìm ga tàu điện ngầm. Hãy hỏi đường một người qua đường và nhắc lại chỉ dẫn.",
    prompts: [["请问，地铁站怎么走？", "Qǐngwèn, dìtiězhàn zěnme zǒu?", "Xin hỏi, đến ga tàu điện ngầm đi thế nào?"], ["一直往前走，到路口往左拐。", "Yìzhí wǎng qián zǒu, dào lùkǒu wǎng zuǒ guǎi.", "Đi thẳng, đến ngã tư rẽ trái."], ["离这儿远吗？走路要多长时间？", "Lí zhèr yuǎn ma? Zǒulù yào duō cháng shíjiān?", "Có xa đây không? Đi bộ mất bao lâu?"]],
    words: [["地铁站", "dìtiězhàn", "ga tàu điện ngầm"], ["往前走", "wǎng qián zǒu", "đi thẳng"], ["左拐 / 右拐", "zuǒ guǎi / yòu guǎi", "rẽ trái / rẽ phải"], ["路口", "lùkǒu", "ngã tư"], ["远 / 近", "yuǎn / jìn", "xa / gần"]], sec: 60 },
  { id: "t-gouwu", level: "HSK 2–3", icon: "🛍️", title: "买东西、讲价", vi: "Mua sắm & mặc cả",
    scene: "Bạn đi chợ đêm mua một chiếc áo. Hãy hỏi giá, hỏi size/màu và mặc cả cho rẻ hơn.",
    prompts: [["这件衣服多少钱？", "Zhè jiàn yīfu duōshao qián?", "Chiếc áo này bao nhiêu tiền?"], ["太贵了，便宜一点儿吧。", "Tài guì le, piányi yìdiǎnr ba.", "Đắt quá, rẻ hơn chút đi."], ["有没有大一点儿的？有别的颜色吗？", "Yǒu méiyǒu dà yìdiǎnr de? Yǒu bié de yánsè ma?", "Có cái to hơn không? Có màu khác không?"], ["可以用微信付款吗？", "Kěyǐ yòng Wēixìn fùkuǎn ma?", "Có thể trả bằng WeChat không?"]],
    words: [["便宜", "piányi", "rẻ"], ["贵", "guì", "đắt"], ["颜色", "yánsè", "màu sắc"], ["试试", "shìshi", "thử"], ["付款", "fùkuǎn", "thanh toán"]], sec: 60 },
  { id: "t-yitian", level: "HSK 2–3", icon: "⏰", title: "我的一天", vi: "Một ngày của tôi",
    scene: "Hãy kể về một ngày bình thường của bạn: mấy giờ dậy, đi học/đi làm, ăn gì, buổi tối làm gì.",
    prompts: [["你每天几点起床？", "Nǐ měi tiān jǐ diǎn qǐchuáng?", "Mỗi ngày bạn dậy lúc mấy giờ?"], ["上午和下午你做什么？", "Shàngwǔ hé xiàwǔ nǐ zuò shénme?", "Buổi sáng và chiều bạn làm gì?"], ["晚上你喜欢做什么？几点睡觉？", "Wǎnshang nǐ xǐhuan zuò shénme? Jǐ diǎn shuìjiào?", "Buổi tối bạn thích làm gì? Mấy giờ đi ngủ?"]],
    words: [["起床", "qǐchuáng", "thức dậy"], ["上课 / 上班", "shàngkè / shàngbān", "vào học / đi làm"], ["然后", "ránhòu", "sau đó"], ["一般", "yìbān", "thường thường"], ["睡觉", "shuìjiào", "đi ngủ"]], sec: 75 },
  { id: "t-kanbing", level: "HSK 3", icon: "🏥", title: "去医院看病", vi: "Đi khám bệnh",
    scene: "Bạn bị cảm và đến phòng khám của trường. Hãy mô tả triệu chứng với bác sĩ và hỏi cách uống thuốc.",
    prompts: [["大夫，我头疼，还有点儿发烧。", "Dàifu, wǒ tóu téng, hái yǒudiǎnr fāshāo.", "Bác sĩ ơi, tôi đau đầu, còn hơi sốt."], ["从昨天晚上开始的。", "Cóng zuótiān wǎnshang kāishǐ de.", "Bắt đầu từ tối hôm qua."], ["这个药一天吃几次？", "Zhège yào yì tiān chī jǐ cì?", "Thuốc này một ngày uống mấy lần?"]],
    words: [["头疼", "tóu téng", "đau đầu"], ["发烧", "fāshāo", "sốt"], ["感冒", "gǎnmào", "cảm"], ["咳嗽", "késou", "ho"], ["药", "yào", "thuốc"]], sec: 60 },
  { id: "t-mianshi", level: "HSK 3–4", icon: "💼", title: "求职面试", vi: "Phỏng vấn xin việc",
    scene: "Bạn đang phỏng vấn vị trí trợ lý/phiên dịch tiếng Trung. Hãy trả lời các câu hỏi của nhà tuyển dụng.",
    prompts: [["请你简单介绍一下自己。", "Qǐng nǐ jiǎndān jièshào yíxià zìjǐ.", "Mời bạn giới thiệu ngắn gọn về bản thân."], ["你为什么想来我们公司工作？", "Nǐ wèishénme xiǎng lái wǒmen gōngsī gōngzuò?", "Vì sao bạn muốn làm việc ở công ty chúng tôi?"], ["你有什么优点和缺点？", "Nǐ yǒu shénme yōudiǎn hé quēdiǎn?", "Ưu điểm và nhược điểm của bạn là gì?"], ["你对工资有什么要求？", "Nǐ duì gōngzī yǒu shénme yāoqiú?", "Bạn có yêu cầu gì về lương?"]],
    words: [["经验", "jīngyàn", "kinh nghiệm"], ["负责", "fùzé", "phụ trách"], ["优点 / 缺点", "yōudiǎn / quēdiǎn", "ưu / nhược điểm"], ["沟通", "gōutōng", "giao tiếp"], ["机会", "jīhuì", "cơ hội"]], sec: 90 },
  { id: "t-liuxue", level: "HSK 4–5", icon: "🎓", title: "留学面试", vi: "Phỏng vấn học bổng du học",
    scene: "Bạn đang phỏng vấn online với giáo sư trường đại học Trung Quốc cho học bổng. Hãy trả lời tự nhiên, có ví dụ cụ thể.",
    prompts: [["你为什么选择来中国留学？", "Nǐ wèishénme xuǎnzé lái Zhōngguó liúxué?", "Vì sao bạn chọn du học Trung Quốc?"], ["你为什么申请我们学校的这个专业？", "Nǐ wèishénme shēnqǐng wǒmen xuéxiào de zhège zhuānyè?", "Vì sao bạn đăng ký ngành này của trường chúng tôi?"], ["你的学习计划是什么？", "Nǐ de xuéxí jìhuà shì shénme?", "Kế hoạch học tập của bạn là gì?"], ["毕业以后你打算做什么？", "Bìyè yǐhòu nǐ dǎsuàn zuò shénme?", "Sau khi tốt nghiệp bạn dự định làm gì?"]],
    words: [["专业", "zhuānyè", "chuyên ngành"], ["奖学金", "jiǎngxuéjīn", "học bổng"], ["研究方向", "yánjiū fāngxiàng", "hướng nghiên cứu"], ["导师", "dǎoshī", "giáo sư hướng dẫn"], ["发展", "fāzhǎn", "phát triển"]], sec: 90 },
];
const SPK = { topics: null, current: null, rec: null, take: null, mySubs: null, playId: 0 };

async function loadTopics() {
  SPK.topics = [...BUILTIN_TOPICS];
  if (!T.fb) return;
  try {
    const snap = await D().getDocs(D().collection(db(), "speakingTopics"));
    snap.forEach(d => { const x = d.data(); SPK.topics.push({ id: d.id, custom: true, ...x,
      prompts: (x.promptRows || []).map(r => [r.cn, r.py, r.vi]), words: (x.wordRows || []).map(r => [r.cn, r.py, r.vi]),
      dialogue: (x.dialogueRows || []).map(r => ({ role: r.role || "", cn: r.cn || "", py: r.py || "", vi: r.vi || "" })) }); });
  } catch (e) { /* chưa có quyền đọc → chỉ dùng chủ đề có sẵn */ }
}
async function renderSpeaking() {
  const box = $("tt-speaking"); if (!box) return;
  const head = `<div class="tt-head"><span class="tt-stamp">说</span><h3>Khẩu ngữ theo chủ đề</h3></div>
    <p class="tt-desc">Chọn một tình huống, xem gợi ý câu hỏi & từ vựng, rồi <b>ghi âm</b> câu trả lời của bạn. Nghe lại để tự sửa, sau đó <b>nộp cho giáo viên</b> nhận xét.</p>`;
  if (!can("speakingTasks")) { box.innerHTML = head + lockedHtml("speakingTasks"); return; }
  if (!SPK.topics) { box.innerHTML = head + `<div class="tt-empty"><span class="tt-spin"></span></div>`; await loadTopics(); }
  if (SPK.current) return renderTask(box, head);
  box.innerHTML = head + `<div class="tt-grid">${SPK.topics.map(t => `
      <button class="tt-pick" data-topic="${esc(t.id)}"><span style="font-size:22px">${esc(t.icon || "🗣️")}</span>
        <span class="cn tt-hz">${esc(t.title)}</span><span class="t">${esc(t.vi)}</span>
        <span class="tt-row"><span class="tt-badge">${esc(t.level || "")}</span>${(t.dialogue || []).length ? '<span class="tt-badge green">💬 hội thoại</span>' : (t.custom ? '<span class="tt-badge peach">giáo viên giao</span>' : "")}</span></button>`).join("")}</div>
    <div id="spk-mine" style="margin-top:1.2rem"></div>`;
  box.querySelectorAll("[data-topic]").forEach(b => b.addEventListener("click", () => { SPK.current = SPK.topics.find(t => t.id === b.dataset.topic); SPK.take = null; renderSpeaking(); $("tt-speaking").scrollIntoView({ behavior: "smooth" }); }));
  renderMySubs($("spk-mine"));
}
function renderTask(box, head) {
  const t = SPK.current;
  const maxSec = Math.min(Number(t.sec) || 60, 120) + 30;
  box.innerHTML = head + `<div class="tt-card tt-fade">
    <button class="tt-link" id="spk-back">‹ Tất cả chủ đề</button>
    <div class="tt-row" style="margin:.5rem 0 .2rem"><span style="font-size:26px">${esc(t.icon || "🗣️")}</span><div><div class="tt-hz" style="font-size:24px;color:#000080">${esc(t.title)}</div><b>${esc(t.vi)}</b> <span class="tt-badge">${esc(t.level || "")}</span></div></div>
    ${t.titlePy ? `<div class="tt-small" style="color:#000080">${esc(t.titlePy)}</div>` : ""}
    ${t.scene ? `<div class="tt-note warn" style="margin:.6rem 0">🎬 ${esc(t.scene)}</div>` : ""}
    ${dialogueHtml(t)}
    ${(t.prompts || []).length ? `<h5 style="font-weight:700;margin:.8rem 0 .4rem">Câu hỏi gợi ý</h5>` : ""}
    <div class="tt-lines">${(t.prompts || []).map((p, i) => `<div class="tt-line"><span class="tt-role r1">${i + 1}</span><div><div class="cn tt-hz">${esc(p[0])}</div><div class="py">${esc(p[1] || "")}</div><div class="vi">${esc(p[2] || "")}</div><div class="acts"><button class="tt-btn ghost sm" data-say="${esc(p[0])}">🔊 Nghe</button></div></div></div>`).join("")}</div>
    ${(t.words || []).length ? `<h5 style="font-weight:700;margin:1rem 0 .4rem">Từ vựng hữu ích</h5><div class="tt-row">${t.words.map(w => `<span class="tt-badge" style="font-size:12.5px;padding:5px 10px"><span class="tt-hz" style="font-size:15px">${esc(w[0])}</span> ${esc(w[1])} · ${esc(w[2])}</span>`).join("")}</div>` : ""}
    <div class="tt-card" style="margin-top:1.1rem;background:#FAFAFD">
      <div class="tt-row between"><b>🎙️ Bài nói của bạn</b><span class="tt-small">Gợi ý: ${Math.round((t.sec || 60))} giây · tối đa ${maxSec} giây</span></div>
      <div class="tt-row" style="margin-top:.7rem">
        <button class="tt-btn rec" id="spk-rec">● Bắt đầu ghi âm</button>
        <span class="tt-timer" id="spk-timer"></span>
      </div>
      <div id="spk-take" style="margin-top:.7rem"></div>
    </div></div>`;
  $("spk-back").addEventListener("click", () => { SPK.playId++; TTS.stop(); SPK.rec && SPK.rec.cancel(); SPK.rec = null; SPK.current = null; renderSpeaking(); });
  box.querySelectorAll("[data-say]").forEach(b => b.addEventListener("click", () => { SPK.playId++; TTS.speak(b.dataset.say, 0.85); }));
  bindDialogue(box);
  const recBtn = $("spk-rec");
  const finish = (r) => { if (!SPK.rec) return; SPK.rec = null; SPK.take = r; recBtn.classList.remove("live"); recBtn.textContent = "● Ghi lại"; drawTake(); };
  recBtn.addEventListener("click", async () => {
    if (SPK.rec) { finish(await SPK.rec.stop()); return; }
    try {
      SPK.playId++; TTS.stop();
      SPK.rec = await REC.start({ maxSec, onAutoStop: finish, onTick: s => { $("spk-timer") && ($("spk-timer").textContent = "● " + fmtClock(s) + " / " + fmtClock(maxSec)); } });
      recBtn.classList.add("live"); recBtn.textContent = "■ Dừng ghi"; $("spk-take").innerHTML = "";
    } catch (e) { toast(e.message); }
  });
  drawTake();
}
/* ---------- Hội thoại mẫu trong chủ đề khẩu ngữ ---------- */
function dialogueHtml(t) {
  const rows = t.dialogue || [];
  if (!rows.length) return "";
  const sp = (t.speakers && t.speakers.length) ? t.speakers : [...new Set(rows.map(r => r.role))];
  const cls = (role) => sp.indexOf(role) === 1 ? "r2" : "r1";
  const short = (role) => esc(role.length > 1 && role[0] === "小" ? role.slice(1) : role.slice(0, 2));
  return `<div class="tt-row between" style="margin:1rem 0 .5rem">
      <h5 style="font-weight:700">💬 Hội thoại mẫu <span class="tt-small">· ${rows.length} câu${sp.length ? " · " + sp.map(esc).join(" & ") : ""}</span></h5>
      <div class="tt-row">
        <button class="tt-btn ghost sm" id="dlg-py">Ẩn pinyin</button>
        <button class="tt-btn ghost sm" id="dlg-vi">Ẩn nghĩa</button>
        <button class="tt-btn peach sm" id="dlg-all">▶ Nghe cả bài</button>
      </div></div>
    <div class="tt-lines" id="dlg-lines">${rows.map((r, i) => `<div class="tt-line" data-dlg="${i}">
      <span class="tt-role ${cls(r.role)}" title="${esc(r.role)}">${short(r.role)}</span>
      <div><div class="cn tt-hz"><span class="tt-small" style="font-size:12px;color:#5A6172">${esc(r.role)}：</span>${esc(r.cn)}</div>
        <div class="py">${esc(r.py)}</div><div class="vi">${esc(r.vi)}</div>
        <div class="acts"><button class="tt-btn ghost sm" data-say="${esc(r.cn)}">🔊 Nghe</button></div></div></div>`).join("")}</div>`;
}
function bindDialogue(box) {
  const lines = $("dlg-lines"); if (!lines) return;
  const rows = SPK.current.dialogue || [];
  $("dlg-py").addEventListener("click", (e) => { const on = lines.classList.toggle("tt-hide-py"); e.target.textContent = on ? "Hiện pinyin" : "Ẩn pinyin"; });
  $("dlg-vi").addEventListener("click", (e) => { const on = lines.classList.toggle("tt-hide-vi"); e.target.textContent = on ? "Hiện nghĩa" : "Ẩn nghĩa"; });
  const btn = $("dlg-all");
  const clear = () => lines.querySelectorAll(".tt-line.playing").forEach(x => x.classList.remove("playing"));
  btn.addEventListener("click", async () => {
    if (btn.dataset.on) { SPK.playId++; TTS.stop(); return; }   // đang đọc → bấm lần nữa để dừng
    const my = ++SPK.playId; btn.dataset.on = "1"; btn.textContent = "■ Dừng";
    for (let i = 0; i < rows.length && my === SPK.playId; i++) {
      clear(); const el = lines.querySelector(`[data-dlg="${i}"]`);
      if (el) { el.classList.add("playing"); el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      const ok = await TTS.speak(rows[i].cn, 0.85);
      if (ok === false && !TTS.ok) { toast("Trình duyệt không có giọng đọc tiếng Trung."); break; }
      if (my === SPK.playId) await new Promise(r => setTimeout(r, 450));
    }
    clear(); if (document.body.contains(btn)) { delete btn.dataset.on; btn.textContent = "▶ Nghe cả bài"; }
  });
}
function drawTake() {
  const el = $("spk-take"); if (!el) return;
  const r = SPK.take;
  if (!r) { el.innerHTML = `<p class="tt-small">Bấm ghi âm, nói xong bấm dừng. Bạn có thể nghe lại và ghi lại nhiều lần trước khi nộp.</p>`; return; }
  el.innerHTML = `<audio class="tt-audio" controls src="${safeMedia(r.url)}" style="width:100%"></audio>
    <div class="tt-row" style="margin-top:.6rem;justify-content:space-between"><span class="tt-small">Độ dài: ${fmtClock(r.duration)} · ${(r.dataUrl.length / 1024).toFixed(0)} KB</span>
    ${T.user ? `<button class="tt-btn peach" id="spk-submit">📤 Nộp cho giáo viên</button>` : `<button class="tt-btn" data-tt-login>Đăng nhập để nộp bài</button>`}</div>`;
  $("spk-submit")?.addEventListener("click", () => submitSpeaking(SPK.current, r));
}
async function submitSpeaking(t, r) {
  const b = $("spk-submit"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…';
  try {
    if (r.dataUrl.length > 950000) throw new Error("Bản ghi quá dài. Hãy nói ngắn gọn hơn (dưới 2 phút) rồi ghi lại.");
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    const ref = D().doc(D().collection(db(), "submissions"));
    await D().setDoc(D().doc(db(), "submissionAudio", ref.id), { uid: T.user.uid, audio: r.dataUrl, createdAt: D().serverTimestamp() });
    await D().setDoc(ref, {
      type: "speaking", taskId: t.id, taskTitle: `${t.title} · ${t.vi}`, uid: T.user.uid, name: myName(), email: T.user.email || "",
      classIds: (T.profile && T.profile.classIds) || [], duration: Math.round(r.duration), status: "submitted", createdAt: D().serverTimestamp(),
    });
    toast("✅ Đã nộp bài! Giáo viên sẽ nghe và nhận xét.");
    if (window.trackStudyActivity) window.trackStudyActivity();
    SPK.take = null; SPK.mySubs = null; SPK.current = null; renderSpeaking();
  } catch (e) { toast(errText(e)); b.disabled = false; b.textContent = "📤 Nộp cho giáo viên"; }
}

/** Danh sách bài đã nộp (khẩu ngữ + hội thoại VIP) kèm nhận xét */
async function renderMySubs(el) {
  if (!el || !T.user) return;
  el.innerHTML = `<h5 style="font-weight:700;margin-bottom:.5rem">📬 Bài đã nộp của tôi</h5><div id="ms-list"><div class="tt-empty"><span class="tt-spin"></span></div></div>`;
  try {
    if (!SPK.mySubs) {
      const snap = await D().getDocs(D().query(D().collection(db(), "submissions"), D().where("uid", "==", T.user.uid), D().limit(100)));
      SPK.mySubs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
    }
    const list = $("ms-list"); if (!list) return;
    list.innerHTML = SPK.mySubs.length ? SPK.mySubs.slice(0, 30).map(s => `<div class="tt-sub">
        <div class="tt-row between"><div><b>${s.type === "vip" ? "⭐ " : s.type === "interview" ? "🎤 " : "🎙️ "}${esc(s.taskTitle)}</b> <span class="tt-small">· ${fmtTime(s.createdAt)}</span></div>
        ${s.status === "reviewed" ? `<span class="tt-badge green">đã nhận xét${s.score ? " · " + esc(s.score) : ""}</span>` : `<span class="tt-badge">đang chờ chấm</span>`}</div>
        ${s.feedback ? `<div class="tt-fb">👩‍🏫 <b>${esc(s.reviewerName || "Giáo viên")}:</b> ${esc(s.feedback)}</div>` : ""}
        <div class="tt-row" style="margin-top:.4rem"><button class="tt-link" data-listen="${s.id}">▶ Nghe lại bài của tôi</button></div><div data-audio-of="${s.id}"></div></div>`).join("")
      : `<div class="tt-empty">Bạn chưa nộp bài nào.</div>`;
    list.querySelectorAll("[data-listen]").forEach(b => b.addEventListener("click", () => showSubAudio(SPK.mySubs.find(x => x.id === b.dataset.listen), list.querySelector(`[data-audio-of="${b.dataset.listen}"]`))));
  } catch (e) { const l = $("ms-list"); if (l) l.innerHTML = `<div class="tt-empty">${esc(errText(e))}</div>`; }
}
async function showSubAudio(s, target) {
  if (!s || !target) return;
  target.innerHTML = `<span class="tt-spin"></span>`;
  try {
    const snap = await D().getDoc(D().doc(db(), "submissionAudio", s.id));
    if (!snap.exists()) { target.innerHTML = `<p class="tt-small">Không tìm thấy file ghi âm.</p>`; return; }
    const a = snap.data();
    if (a.audio) target.innerHTML = `<audio class="tt-audio" controls src="${safeMedia(a.audio)}" style="width:100%;margin-top:.4rem"></audio>`;
    else {
      const clips = a.clips || {};
      target.innerHTML = Object.keys(clips).sort((x, y) => x - y).map(i => {
        const line = (s.lines || [])[i] || {};
        return `<div class="tt-row" style="margin-top:.35rem;flex-wrap:nowrap"><span class="tt-role ${line.role === "B" ? "r2" : "r1"}">${esc(line.role || Number(i) + 1)}</span><span class="tt-hz" style="flex:1;min-width:0;font-size:15px">${esc(line.cn || "")}</span><audio controls src="${safeMedia(clips[i])}" style="height:32px;max-width:55%"></audio></div>`;
      }).join("");
    }
  } catch (e) { target.innerHTML = `<p class="tt-small">${esc(errText(e))}</p>`; }
}
onState(() => { SPK.mySubs = null; SPK.topics = null; renderSpeaking(); });

/* =====================================================================
   4) HỘI THOẠI 《贯通中文》 — VIP
   Nội dung + âm thanh nằm trong Firestore (vip/gt1, vipAudio/*), luật Firestore
   chỉ cho tài khoản có quyền can_access_vip_dialogue đọc → người ngoài không tải được.
   ===================================================================== */
const VIP = { data: null, loading: false, err: "", lessonNo: null, textIdx: 0, showPy: true, showVi: true, roleFilter: "all", heard: {}, takes: {}, rec: null, recIdx: -1 };
const VA = { el: new Audio(), urls: {}, stopAt: null, raf: 0, playingIdx: -1 };
VA.el.preload = "auto";

async function loadVipData() {
  if (VIP.data || VIP.loading) return;
  VIP.loading = true; VIP.err = "";
  try {
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    // Lần đọc đầu tiên ngay khi vừa mở trang đôi khi trả về "chưa có" → thử lại vài lần trước khi kết luận
    let snap = null;
    for (let k = 0; k < 4; k++) {
      try { snap = await D().getDoc(D().doc(db(), "vip", "gt1")); } catch (e) { if (k === 3) throw e; }
      if (snap && snap.exists()) break;
      await sleep(1200 * (k + 1));
    }
    if (!snap || !snap.exists()) VIP.err = isAdmin() ? "Chưa nạp dữ liệu giáo trình. Vào trang “Lớp học & phân quyền” → tab “Dữ liệu 贯通中文” để nạp file gt1-vip.json." : "Giáo viên chưa nạp dữ liệu giáo trình. Vui lòng quay lại sau.";
    else VIP.data = snap.data();
  } catch (e) { VIP.err = errText(e); }
  VIP.loading = false;
}
async function trackUrl(track) {
  if (VA.urls[track] !== undefined) return VA.urls[track];
  try {
    const s = await D().getDoc(D().doc(db(), "vipAudio", track));
    VA.urls[track] = s.exists() ? URL.createObjectURL(dataURLToBlob(`data:${s.data().mime || "audio/mpeg"};base64,${s.data().data}`)) : null;
  } catch (e) { VA.urls[track] = null; }
  return VA.urls[track];
}
function stopVipAudio() { VA.el.pause(); cancelAnimationFrame(VA.raf); VA.stopAt = null; TTS.stop(); markPlaying(-1); }
function markPlaying(i) { VA.playingIdx = i; document.querySelectorAll("#tt-vip .tt-line").forEach(el => el.classList.toggle("playing", Number(el.dataset.i) === i)); }
/** Phát 1 đoạn [s, e] giây của file; resolve khi phát xong */
function playRange(url, s, e) {
  return new Promise(async (res) => {
    stopVipAudio();
    const a = VA.el;
    if (a.src !== url) { a.src = url; await new Promise(r => { a.onloadedmetadata = r; a.onerror = r; setTimeout(r, 4000); }); }
    try { a.currentTime = s; await a.play(); } catch (err) { return res(false); }
    VA.stopAt = e;
    const loop = () => {
      if (a.paused) return res(true);
      if (VA.stopAt != null && a.currentTime >= VA.stopAt) { a.pause(); return res(true); }
      VA.raf = requestAnimationFrame(loop);
    };
    VA.raf = requestAnimationFrame(loop);
  });
}
async function playLine(text, i) {
  const line = text.lines[i];
  markPlaying(i);
  const url = await trackUrl(text.track);
  const seg = (text.segs || [])[i];
  if (url && seg) await playRange(url, seg[0], seg[1]);
  else await TTS.speak(line.cn, 0.85);
  if (VA.playingIdx === i) markPlaying(-1);
  VIP.heard[text.id + ":" + i] = true;
  const rb = document.querySelector(`#tt-vip [data-rec="${i}"]`); if (rb) rb.disabled = false;
}
async function playAll(text) {
  const run = Symbol(); VIP.allRun = run;
  for (let i = 0; i < text.lines.length; i++) { if (VIP.allRun !== run) return; await playLine(text, i); await sleep(350); }
}

async function renderVip() {
  const box = $("tt-vip"); if (!box) return;
  const head = `<div class="tt-head"><span class="tt-stamp">贯</span><h3>Hội thoại 《贯通中文》</h3><span class="tt-badge vip">VIP</span></div>
    <p class="tt-desc">Luyện nói theo bài khoá giáo trình <b>贯通中文 综合教程 1</b>: đọc câu → nghe <b>file gốc</b> → bấm <b>Ghi âm</b> → nộp bài để hoàn thành nhiệm vụ.</p>`;
  if (!can("vipDialogue")) { box.innerHTML = head + lockedHtml("vipDialogue"); return; }
  if (!VIP.data) {
    box.innerHTML = head + `<div class="tt-empty"><span class="tt-spin"></span> Đang tải giáo trình…</div>`;
    await loadVipData();
    if (!VIP.data) { box.innerHTML = head + `<div class="tt-note warn">${esc(VIP.err || "Chưa tải được dữ liệu.")}</div>`; return; }
  }
  if (VIP.lessonNo == null) return renderVipLessons(box, head);
  renderVipPractice(box, head);
}
function vipDoneCount(lesson) { const done = getProg().vip || {}; return lesson.texts.filter(t => done[t.id]).length; }
function renderVipLessons(box, head) {
  const L = VIP.data.lessons || [];
  const totalT = L.reduce((s, l) => s + l.texts.length, 0), doneT = L.reduce((s, l) => s + vipDoneCount(l), 0);
  box.innerHTML = head + `
    <div class="tt-row between" style="margin-bottom:.7rem"><span class="tt-small">Đã hoàn thành <b>${doneT}/${totalT}</b> đoạn hội thoại</span></div>
    <div class="tt-progress"><i style="width:${totalT ? doneT / totalT * 100 : 0}%"></i></div>
    <div class="tt-grid">${L.map(l => { const d = vipDoneCount(l); return `
      <button class="tt-pick ${d === l.texts.length ? "done" : ""}" data-les="${l.no}">
        <span class="tt-small">Bài ${l.no} · Lesson ${l.no}</span>
        <span class="cn tt-hz">${esc(l.title)}</span><span class="t">${esc(l.vi)}</span>
        <span class="tt-row"><span class="tt-badge ${d === l.texts.length ? "green" : ""}">${d === l.texts.length ? "✓ " : ""}${d}/${l.texts.length} đoạn</span></span></button>`; }).join("")}</div>`;
  box.querySelectorAll("[data-les]").forEach(b => b.addEventListener("click", () => { VIP.lessonNo = Number(b.dataset.les); VIP.textIdx = 0; VIP.roleFilter = "all"; renderVip(); box.scrollIntoView({ behavior: "smooth" }); }));
}
function roleClass(r, roles) { if (!r) return "narr"; const k = roles.indexOf(r); return k === 0 ? "r1" : k === 1 ? "r2" : ""; }
function renderVipPractice(box, head) {
  const lesson = VIP.data.lessons.find(l => l.no === VIP.lessonNo);
  const text = lesson.texts[VIP.textIdx];
  const roles = [...new Set(text.lines.map(x => x.role).filter(r => r && !/[、,]/.test(r)))];
  const active = (x) => VIP.roleFilter === "all" || x.role === VIP.roleFilter || (x.role || "").includes(VIP.roleFilter);
  const takes = VIP.takes[text.id] || (VIP.takes[text.id] = {});
  const need = text.lines.map((x, i) => i).filter(i => active(text.lines[i]));
  const recorded = need.filter(i => takes[i]).length;
  const done = (getProg().vip || {})[text.id];
  box.innerHTML = head + `<div class="tt-card tt-fade">
    <button class="tt-link" id="vp-back">‹ Danh sách bài</button>
    <div class="tt-row between" style="margin:.5rem 0 .3rem"><div><span class="tt-small">Bài ${lesson.no} · ${esc(lesson.vi)}</span><div class="tt-hz" style="font-size:22px;color:#000080">${esc(lesson.title)}</div></div>
      ${done ? '<span class="tt-badge green">✓ Đã hoàn thành đoạn này</span>' : ""}</div>
    <div class="tt-tabs">${lesson.texts.map((t, i) => `<button class="tt-tab ${i === VIP.textIdx ? "active" : ""}" data-txt="${i}">${(getProg().vip || {})[t.id] ? "✓ " : ""}${i + 1}. <span class="tt-hz">${esc(t.title)}</span></button>`).join("")}</div>
    <div class="tt-note" style="margin-bottom:.8rem">🎧 Track ${esc(text.track)} · ${esc(text.vi)}</div>
    <div class="tt-row" style="margin-bottom:.8rem">
      <button class="tt-btn peach" id="vp-all">▶ Nghe cả đoạn</button>
      <button class="tt-btn ghost sm" id="vp-stop">■ Dừng</button>
      <label class="tt-radio"><input type="checkbox" id="vp-py" ${VIP.showPy ? "checked" : ""}> Pinyin</label>
      <label class="tt-radio"><input type="checkbox" id="vp-vi" ${VIP.showVi ? "checked" : ""}> Dịch</label>
      ${roles.length > 1 ? `<select class="tt-select" id="vp-role"><option value="all">Luyện tất cả các vai</option>${roles.map(r => `<option value="${esc(r)}" ${VIP.roleFilter === r ? "selected" : ""}>Chỉ luyện vai ${esc(r)}</option>`).join("")}</select>` : ""}
    </div>
    <div class="tt-lines ${VIP.showPy ? "" : "tt-hide-py"} ${VIP.showVi ? "" : "tt-hide-vi"}">${text.lines.map((x, i) => {
      const on = active(x); const heard = VIP.heard[text.id + ":" + i];
      return `<div class="tt-line ${on ? "" : "muted"} ${takes[i] ? "recorded" : ""}" data-i="${i}">
        <span class="tt-role ${roleClass(x.role, roles)}">${esc(x.role || (i + 1))}</span>
        <div><div class="cn tt-hz">${esc(x.cn)}</div><div class="py">${esc(x.py)}</div><div class="vi">${esc(x.vi)}</div>
          <div class="acts"><button class="tt-btn ghost sm" data-play="${i}">🔊 Nghe mẫu</button>
          ${on ? `<button class="tt-btn rec sm" data-rec="${i}" ${heard || takes[i] ? "" : "disabled title='Nghe mẫu trước rồi mới ghi âm'"}>${takes[i] ? "● Ghi lại" : "● Ghi âm"}</button>
          <span class="tt-timer" data-t="${i}"></span>
          ${takes[i] ? `<audio controls src="${safeMedia(takes[i].url)}" class="tt-audio" style="width:210px"></audio><span class="tt-badge green">✓</span>` : ""}` : ""}</div></div></div>`; }).join("")}</div>
    <div class="tt-row between" style="margin-top:1rem">
      <span class="tt-small">Đã ghi <b>${recorded}/${need.length}</b> câu${VIP.roleFilter !== "all" ? " (vai " + esc(VIP.roleFilter) + ")" : ""}. Mỗi câu tối đa 20 giây.</span>
      <div class="tt-row">${VIP.textIdx + 1 < lesson.texts.length ? `<button class="tt-btn ghost" id="vp-next">Đoạn tiếp ▶</button>` : ""}
      <button class="tt-btn peach" id="vp-submit" ${recorded === need.length && need.length ? "" : "disabled"}>📤 Nộp bài</button></div></div>
    </div>`;
  $("vp-back").addEventListener("click", () => { stopVipAudio(); cancelVipRec(); VIP.lessonNo = null; renderVip(); });
  box.querySelectorAll("[data-txt]").forEach(b => b.addEventListener("click", () => { stopVipAudio(); cancelVipRec(); VIP.textIdx = Number(b.dataset.txt); VIP.roleFilter = "all"; renderVip(); }));
  $("vp-next")?.addEventListener("click", () => { stopVipAudio(); cancelVipRec(); VIP.textIdx++; VIP.roleFilter = "all"; renderVip(); });
  $("vp-all").addEventListener("click", () => playAll(text));
  $("vp-stop").addEventListener("click", () => { VIP.allRun = null; stopVipAudio(); });
  $("vp-py").addEventListener("change", e => { VIP.showPy = e.target.checked; box.querySelector(".tt-lines").classList.toggle("tt-hide-py", !VIP.showPy); });
  $("vp-vi").addEventListener("change", e => { VIP.showVi = e.target.checked; box.querySelector(".tt-lines").classList.toggle("tt-hide-vi", !VIP.showVi); });
  $("vp-role")?.addEventListener("change", e => { VIP.roleFilter = e.target.value; renderVip(); });
  box.querySelectorAll("[data-play]").forEach(b => b.addEventListener("click", () => { VIP.allRun = null; cancelVipRec(); playLine(text, Number(b.dataset.play)); }));
  box.querySelectorAll("[data-rec]").forEach(b => b.addEventListener("click", () => toggleVipRec(text, Number(b.dataset.rec), b)));
  $("vp-submit").addEventListener("click", () => submitVip(lesson, text, need));
}
function cancelVipRec() { if (VIP.rec) { VIP.rec.cancel(); VIP.rec = null; VIP.recIdx = -1; } }
async function toggleVipRec(text, i, btn) {
  if (VIP.rec && VIP.recIdx === i) {
    const r = await VIP.rec.stop(); VIP.rec = null; VIP.recIdx = -1;
    VIP.takes[text.id][i] = r; renderVip(); return;
  }
  cancelVipRec(); stopVipAudio(); VIP.allRun = null;
  try {
    const finish = (r) => { if (VIP.recIdx !== i) return; VIP.rec = null; VIP.recIdx = -1; VIP.takes[text.id][i] = r; renderVip(); };
    VIP.rec = await REC.start({ maxSec: 20, onAutoStop: finish, onTick: s => { const t = document.querySelector(`#tt-vip [data-t="${i}"]`); if (t) t.textContent = "● " + fmtClock(s); } });
    VIP.recIdx = i; btn.classList.add("live"); btn.textContent = "■ Dừng";
  } catch (e) { toast(e.message); }
}
async function submitVip(lesson, text, need) {
  if (!T.user) return;
  const b = $("vp-submit"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…';
  try {
    const takes = VIP.takes[text.id]; const clips = {};
    need.forEach(i => { clips[i] = takes[i].dataUrl; });
    const size = Object.values(clips).reduce((s, c) => s + c.length, 0);
    if (size > 950000) throw new Error("Tổng ghi âm quá dài. Hãy ghi lại các câu ngắn gọn hơn.");
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    const ref = D().doc(D().collection(db(), "submissions"));
    await D().setDoc(D().doc(db(), "submissionAudio", ref.id), { uid: T.user.uid, clips, createdAt: D().serverTimestamp() });
    await D().setDoc(ref, {
      type: "vip", taskId: text.id, taskTitle: `贯通中文 Bài ${lesson.no} · ${text.title}`, role: VIP.roleFilter,
      lines: text.lines.map(x => ({ role: x.role || "", cn: x.cn })), uid: T.user.uid, name: myName(), email: T.user.email || "",
      classIds: (T.profile && T.profile.classIds) || [], status: "submitted", createdAt: D().serverTimestamp(),
    });
    setProg(p => { p.vip = p.vip || {}; p.vip[text.id] = Date.now(); });
    if (window.trackStudyActivity) window.trackStudyActivity();
    VIP.takes[text.id] = {}; SPK.mySubs = null;
    toast("🎉 Đã nộp bài — hoàn thành nhiệm vụ đoạn này!");
    renderVip(); renderSpeaking();
  } catch (e) { toast(errText(e)); b.disabled = false; b.textContent = "📤 Nộp bài"; }
}
onState(() => { if (!can("vipDialogue")) { VIP.data = null; } renderVip(); });

/* =====================================================================
   5a) LỚP CỦA TÔI (học viên): nhập mã lớp, xem quyền đang có
   ===================================================================== */
function renderMyClass() {
  const box = $("tt-myclass"); if (!box) return;
  const head = `<div class="tt-head"><span class="tt-stamp navy">班</span><h3>Lớp của tôi</h3></div>
    <p class="tt-desc">Nhập <b>mã lớp</b> giáo viên gửi để vào lớp — các tính năng của lớp (VD: hội thoại 贯通中文) sẽ tự mở cho bạn.</p>`;
  if (!T.user) { box.innerHTML = head + needLoginHtml("tham gia lớp học"); return; }
  const mine = T.myClasses;
  box.innerHTML = head + `<div class="tt-card">
    <div class="tt-row"><input class="tt-input" id="mc-code" maxlength="12" placeholder="Mã lớp (VD: K7M2QX)" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700;width:190px">
      <button class="tt-btn peach" id="mc-join">Vào lớp</button></div>
    <div id="mc-msg" style="margin-top:.6rem"></div>
    <h5 style="font-weight:700;margin:1rem 0 .5rem">Lớp đang tham gia</h5>
    ${mine.length ? mine.map(c => `<div class="tt-sub"><div class="tt-row between"><div><b>${esc(c.name)}</b> <span class="tt-small">· GV ${esc(c.teacherName || "")}</span></div>
        <button class="tt-btn danger sm" data-leave="${c.id}">Rời lớp</button></div>
        <div class="tt-row" style="margin-top:.4rem">${FLAGS.filter(f => c.enabledFeatures && c.enabledFeatures[f.feat]).map(f => `<span class="tt-badge">${f.icon} ${esc(f.label)}</span>`).join("") || '<span class="tt-small">Lớp chưa bật thêm tính năng nào.</span>'}</div></div>`).join("")
      : `<div class="tt-empty">Bạn chưa tham gia lớp nào.</div>`}
    <h5 style="font-weight:700;margin:1rem 0 .5rem">Quyền của tài khoản</h5>
    <div class="tt-row">${FLAGS.map(f => `<span class="tt-badge ${can(f.feat) ? "green" : "seal"}">${can(f.feat) ? "✓" : "✗"} ${esc(f.label)}</span>`).join("")}</div>
  </div>`;
  $("mc-join").addEventListener("click", joinClass);
  $("mc-code").addEventListener("keydown", e => { if (e.key === "Enter") joinClass(); });
  box.querySelectorAll("[data-leave]").forEach(b => b.addEventListener("click", () => leaveClass(b.dataset.leave)));
}
async function joinClass() {
  const code = ($("mc-code").value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const msg = $("mc-msg");
  if (code.length < 4) { msg.innerHTML = `<div class="tt-note err">Mã lớp chưa đúng.</div>`; return; }
  msg.innerHTML = `<span class="tt-spin"></span>`;
  try {
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    const ref = D().doc(db(), "classes", code);
    const snap = await D().getDoc(ref);
    if (!snap.exists()) { msg.innerHTML = `<div class="tt-note err">Không tìm thấy lớp với mã <b>${esc(code)}</b>.</div>`; return; }
    const c = snap.data();
    if (c.joinOpen === false) { msg.innerHTML = `<div class="tt-note warn">Lớp này đang tạm khoá tự vào bằng mã. Hãy nhờ giáo viên thêm bạn.</div>`; return; }
    if (!(c.studentIds || []).includes(T.user.uid)) {
      await D().updateDoc(ref, { studentIds: D().arrayUnion(T.user.uid), [`students.${T.user.uid}`]: { name: myName(), email: T.user.email || "" } });
    }
    const ids = [code, ...((T.profile && T.profile.classIds) || []).filter(x => x !== code)].slice(0, 10);
    await D().updateDoc(D().doc(db(), "users", T.user.uid), { classIds: ids });
    msg.innerHTML = `<div class="tt-note ok">🎉 Đã vào lớp <b>${esc(c.name)}</b>!</div>`;
    if (window.tnReloadProfile) await window.tnReloadProfile(); else { await loadAccountData(); emit(); }
  } catch (e) { msg.innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; }
}
async function leaveClass(id) {
  if (!confirm("Rời lớp này? Các tính năng của lớp sẽ bị khoá lại.")) return;
  try {
    await D().updateDoc(D().doc(db(), "classes", id), { studentIds: D().arrayRemove(T.user.uid), [`students.${T.user.uid}`]: D().deleteField() });
    await D().updateDoc(D().doc(db(), "users", T.user.uid), { classIds: ((T.profile && T.profile.classIds) || []).filter(x => x !== id) });
    toast("Đã rời lớp.");
    if (window.tnReloadProfile) await window.tnReloadProfile();
  } catch (e) { toast(errText(e)); }
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-go-myclass], [data-go-lophoc]")) document.getElementById("auth-menu")?.classList.remove("is-open");
  if (e.target.closest("[data-go-myclass]")) {
    const nav = document.querySelector('[data-nav-btn][data-target="chinese"]'); if (nav) nav.click();
    setTimeout(() => showSec("tt-myclass"), 60);
  }
  if (e.target.closest("[data-go-lophoc]")) {
    const nav = document.querySelector('[data-nav-btn][data-target="lophoc"]'); if (nav) nav.click(); else location.hash = "#lophoc";
  }
});
onState(renderMyClass);

/* =====================================================================
   5b) TRANG “LỚP HỌC & PHÂN QUYỀN” (giáo viên + quản trị)
   ===================================================================== */
const LMS = { tab: "classes", classes: null, users: null, openClass: null, subs: null, subFilter: "submitted", contribs: null, userSearch: "" };
const LMS_TABS = [
  { id: "classes", label: "🏫 Lớp học" },
  { id: "users", label: "👥 Phân quyền từng người" },
  { id: "subs", label: "🎙️ Bài nộp ghi âm" },
  { id: "contrib", label: "📝 Góp ý chờ duyệt" },
  { id: "topics", label: "🗣️ Chủ đề khẩu ngữ" },
  { id: "defaults", label: "⚙️ Mặc định", admin: true },
  { id: "vipdata", label: "⭐ Dữ liệu 贯通中文", admin: true },
  { id: "pvdata", label: "🎤 Dữ liệu phỏng vấn", admin: true },
  { id: "readdata", label: "📖 Dữ liệu bài đọc", admin: true },
];
function renderLms() {
  const box = $("tt-lms"); if (!box) return;
  if (!isStaff()) {
    box.innerHTML = `<div class="tt-lock"><div class="ico">👩‍🏫</div><b>Trang dành cho giáo viên & quản trị viên</b><p>${T.user ? "Tài khoản của bạn là học viên. Nhờ quản trị viên chuyển vai trò sang “Giáo viên” để dùng trang này." : "Vui lòng đăng nhập bằng tài khoản giáo viên."}</p>${T.user ? "" : '<button class="tt-btn" data-tt-login>Đăng nhập</button>'}</div>`;
    return;
  }
  const tabs = LMS_TABS.filter(t => !t.admin || isAdmin());
  if (!tabs.some(t => t.id === LMS.tab)) LMS.tab = "classes";
  box.innerHTML = `<div class="tt-tabs">${tabs.map(t => `<button class="tt-tab ${t.id === LMS.tab ? "active" : ""}" data-lt="${t.id}">${t.label}</button>`).join("")}</div><div id="lms-body" class="tt-fade"></div>`;
  box.querySelectorAll("[data-lt]").forEach(b => b.addEventListener("click", () => { LMS.tab = b.dataset.lt; renderLms(); }));
  ({ classes: lmsClasses, users: lmsUsers, subs: lmsSubs, contrib: lmsContrib, topics: lmsTopics, defaults: lmsDefaults, vipdata: lmsVipData, readdata: lmsReadData,
    pvdata: () => window.tnInterviewAdmin ? window.tnInterviewAdmin(lmsBody()) : (lmsBody().innerHTML = `<div class="tt-note warn">Chưa tải được phong-van.js — hãy kiểm tra file này đã có trên GitHub.</div>`) })[LMS.tab]();
}
const lmsBody = () => $("lms-body");
const loading = () => { lmsBody().innerHTML = `<div class="tt-empty"><span class="tt-spin"></span> Đang tải…</div>`; };

/* ---------- Lớp học ---------- */
async function fetchClasses() {
  const snap = await D().getDocs(D().collection(db(), "classes"));
  let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!isAdmin()) list = list.filter(c => c.teacherId === T.user.uid);
  list.sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
  LMS.classes = list;
}
async function lmsClasses() {
  loading();
  try { if (!LMS.classes) await fetchClasses(); } catch (e) { lmsBody().innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
  if (LMS.openClass) return lmsClassDetail(LMS.classes.find(c => c.id === LMS.openClass));
  lmsBody().innerHTML = `<div class="tt-card">
      <b>Tạo lớp mới</b>
      <div class="tt-row" style="margin-top:.6rem"><input class="tt-input" id="cl-name" maxlength="80" placeholder="Tên lớp (VD: 贯通中文 1 – K12 tối 2-4-6)" style="flex:1;min-width:220px">
      <button class="tt-btn peach" id="cl-create">＋ Tạo lớp</button></div>
      <p class="tt-small" style="margin-top:.4rem">Mỗi lớp có 1 <b>mã mời</b> 6 ký tự. Học viên nhập mã ở mục “Lớp của tôi” để tự vào lớp.</p></div>
    <div class="tt-card">${LMS.classes.length ? `<div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>Lớp</th><th>Mã mời</th><th>Sĩ số</th><th>Tính năng đang bật</th><th></th></tr></thead><tbody>
      ${LMS.classes.map(c => `<tr><td><b>${esc(c.name)}</b>${isAdmin() ? `<div class="tt-small">GV: ${esc(c.teacherName || "")}</div>` : ""}</td><td><span class="tt-code" style="font-size:14px">${esc(c.id)}</span></td><td>${(c.studentIds || []).length}</td>
        <td>${FLAGS.filter(f => c.enabledFeatures && c.enabledFeatures[f.feat]).map(f => f.icon).join(" ") || "—"}</td><td><button class="tt-btn ghost sm" data-open="${c.id}">Quản lý ›</button></td></tr>`).join("")}</tbody></table></div>`
      : `<div class="tt-empty">Chưa có lớp nào.</div>`}</div>`;
  $("cl-create").addEventListener("click", async () => {
    const name = $("cl-name").value.trim(); if (!name) { toast("Hãy nhập tên lớp."); return; }
    $("cl-create").disabled = true;
    try {
      let code = randomCode();
      for (let k = 0; k < 5 && (await D().getDoc(D().doc(db(), "classes", code))).exists(); k++) code = randomCode();
      await D().setDoc(D().doc(db(), "classes", code), {
        name, teacherId: T.user.uid, teacherName: myName(), studentIds: [], students: {}, joinOpen: true,
        enabledFeatures: { dictation: true, speakingTasks: true, vipDialogue: false, contributeEdits: true, interview: false }, createdAt: D().serverTimestamp(),
      });
      LMS.classes = null; LMS.openClass = code; toast("✅ Đã tạo lớp — mã mời: " + code); lmsClasses();
    } catch (e) { toast(errText(e)); $("cl-create").disabled = false; }
  });
  lmsBody().querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => { LMS.openClass = b.dataset.open; lmsClasses(); }));
}
function lmsClassDetail(c) {
  if (!c) { LMS.openClass = null; return lmsClasses(); }
  const students = c.students || {};
  const ids = c.studentIds || [];
  lmsBody().innerHTML = `<div class="tt-card">
    <button class="tt-link" id="cd-back">‹ Tất cả lớp</button>
    <div class="tt-row between" style="margin:.5rem 0 .8rem"><div><input class="tt-input" id="cd-name" value="${esc(c.name)}" maxlength="80" style="font-weight:700;font-size:16px;min-width:240px"> <button class="tt-btn ghost sm" id="cd-rename">Lưu tên</button></div>
      <div class="tt-row"><span class="tt-small">Mã mời</span><span class="tt-code">${esc(c.id)}</span><button class="tt-btn ghost sm" id="cd-copy">Sao chép lời mời</button></div></div>
    <label class="tt-switch"><input type="checkbox" id="cd-join" ${c.joinOpen !== false ? "checked" : ""}><span class="knob"></span> Cho phép học viên tự vào lớp bằng mã mời</label>
    <h5 style="font-weight:700;margin:1.1rem 0 .5rem">Tính năng bật cho cả lớp</h5>
    <div class="tt-switch-list">${FLAGS.map(f => `<label class="tt-switch"><input type="checkbox" data-feat="${f.feat}" ${c.enabledFeatures && c.enabledFeatures[f.feat] ? "checked" : ""}><span class="knob"></span> ${f.icon} ${esc(f.label)}</label>`).join("")}</div>
    <p class="tt-small" style="margin-top:.5rem">Quyền riêng từng người (tab “Phân quyền từng người”) được ưu tiên hơn quyền của lớp.</p>
    <h5 style="font-weight:700;margin:1.2rem 0 .5rem">Thành viên (${ids.length})</h5>
    <div class="tt-row" style="margin-bottom:.6rem"><input class="tt-input" id="cd-email" type="email" placeholder="Thêm học viên bằng email đăng ký" style="flex:1;min-width:220px"><button class="tt-btn" id="cd-add">＋ Thêm</button></div>
    ${ids.length ? `<div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>#</th><th>Họ tên</th><th>Email</th><th></th></tr></thead><tbody>
      ${ids.map((u, i) => `<tr><td>${i + 1}</td><td>${esc((students[u] || {}).name || "—")}</td><td>${esc((students[u] || {}).email || u)}</td><td style="text-align:right"><button class="tt-btn danger sm" data-rm="${u}">Xoá khỏi lớp</button></td></tr>`).join("")}</tbody></table></div>`
      : `<div class="tt-empty">Lớp chưa có học viên. Gửi mã mời <b>${esc(c.id)}</b> cho học viên nhé.</div>`}
    <div class="tt-row" style="justify-content:flex-end;margin-top:1.2rem"><button class="tt-btn danger" id="cd-del">Xoá lớp</button></div></div>`;
  const ref = D().doc(db(), "classes", c.id);
  const save = async (patch, msg) => { try { await D().updateDoc(ref, patch); Object.assign(c, patch); toast(msg || "Đã lưu"); } catch (e) { toast(errText(e)); } };
  $("cd-back").addEventListener("click", () => { LMS.openClass = null; lmsClasses(); });
  $("cd-rename").addEventListener("click", () => save({ name: $("cd-name").value.trim() || c.name }, "Đã đổi tên lớp"));
  $("cd-copy").addEventListener("click", () => {
    const t = `Mời bạn vào lớp “${c.name}” trên tndihoc 👉 ${location.origin}${location.pathname}#chinese — đăng nhập, kéo xuống mục “Lớp của tôi” và nhập mã: ${c.id}`;
    navigator.clipboard ? navigator.clipboard.writeText(t).then(() => toast("Đã sao chép lời mời"), () => prompt("Sao chép lời mời:", t)) : prompt("Sao chép lời mời:", t);
  });
  $("cd-join").addEventListener("change", e => save({ joinOpen: e.target.checked }));
  lmsBody().querySelectorAll("[data-feat]").forEach(i => i.addEventListener("change", () => {
    const ef = { ...(c.enabledFeatures || {}), [i.dataset.feat]: i.checked };
    save({ enabledFeatures: ef }, (i.checked ? "Đã bật: " : "Đã tắt: ") + flagOf(i.dataset.feat).label);
  }));
  $("cd-add").addEventListener("click", async () => {
    const email = $("cd-email").value.trim().toLowerCase(); if (!email) return;
    $("cd-add").disabled = true;
    try {
      let snap = await D().getDocs(D().query(D().collection(db(), "users"), D().where("email", "==", email), D().limit(1)));
      if (snap.empty) snap = await D().getDocs(D().query(D().collection(db(), "users"), D().where("email", "==", $("cd-email").value.trim()), D().limit(1)));
      if (snap.empty) { toast("Không tìm thấy tài khoản với email này (học viên cần đăng ký trên web trước)."); $("cd-add").disabled = false; return; }
      const u = snap.docs[0]; const ud = u.data();
      await D().updateDoc(ref, { studentIds: D().arrayUnion(u.id), [`students.${u.id}`]: { name: ud.name || "", email: ud.email || email } });
      const classIds = [c.id, ...((ud.classIds || []).filter(x => x !== c.id))].slice(0, 10);
      await D().updateDoc(D().doc(db(), "users", u.id), { classIds });
      c.studentIds = [...new Set([...(c.studentIds || []), u.id])]; c.students = { ...(c.students || {}), [u.id]: { name: ud.name || "", email: ud.email || email } };
      toast("✅ Đã thêm " + (ud.name || email)); lmsClassDetail(c);
    } catch (e) { toast(errText(e)); $("cd-add").disabled = false; }
  });
  lmsBody().querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", async () => {
    const uid = b.dataset.rm; if (!confirm("Xoá học viên này khỏi lớp?")) return;
    try {
      await D().updateDoc(ref, { studentIds: D().arrayRemove(uid), [`students.${uid}`]: D().deleteField() });
      const us = await D().getDoc(D().doc(db(), "users", uid));
      if (us.exists()) await D().updateDoc(D().doc(db(), "users", uid), { classIds: (us.data().classIds || []).filter(x => x !== c.id) });
      c.studentIds = c.studentIds.filter(x => x !== uid); delete (c.students || {})[uid];
      toast("Đã xoá khỏi lớp"); lmsClassDetail(c);
    } catch (e) { toast(errText(e)); }
  }));
  $("cd-del").addEventListener("click", async () => {
    if (!confirm(`Xoá hẳn lớp “${c.name}”? Học viên sẽ mất các quyền của lớp.`)) return;
    try { await D().deleteDoc(ref); LMS.classes = null; LMS.openClass = null; toast("Đã xoá lớp"); lmsClasses(); } catch (e) { toast(errText(e)); }
  });
}

/* ---------- Phân quyền từng người ---------- */
async function lmsUsers() {
  loading();
  try {
    if (!LMS.users) {
      const snap = await D().getDocs(D().collection(db(), "users"));
      LMS.users = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
    }
  } catch (e) { lmsBody().innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
  const q = LMS.userSearch.toLowerCase();
  const list = LMS.users.filter(u => !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  const triSel = (u, f) => { const v = (u.permissions || {})[f.perm]; const val = v === true ? "on" : v === false ? "off" : "def";
    return `<select data-u="${u.id}" data-p="${f.perm}" class="${val === "on" ? "tt-sel-on" : val === "off" ? "tt-sel-off" : ""}"><option value="def" ${val === "def" ? "selected" : ""}>Theo lớp/mặc định</option><option value="on" ${val === "on" ? "selected" : ""}>✓ Luôn bật</option><option value="off" ${val === "off" ? "selected" : ""}>✗ Luôn tắt</option></select>`; };
  lmsBody().innerHTML = `<div class="tt-card">
    <div class="tt-row between" style="margin-bottom:.7rem"><input class="tt-input" id="us-q" placeholder="Tìm theo tên hoặc email…" value="${esc(LMS.userSearch)}" style="flex:1;min-width:200px"><button class="tt-btn ghost sm" id="us-reload">↻ Làm mới</button></div>
    <p class="tt-small" style="margin-bottom:.6rem"><b>Theo lớp/mặc định</b>: dùng quyền của lớp học viên tham gia (hoặc cài đặt mặc định). <b>Luôn bật / Luôn tắt</b>: ghi đè riêng cho người này.</p>
    <div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>Người dùng</th><th>Vai trò</th>${FLAGS.map(f => `<th title="${esc(f.label)}">${f.icon} ${esc(f.label.split(" (")[0])}</th>`).join("")}</tr></thead><tbody>
    ${list.slice(0, 300).map(u => `<tr><td><b>${esc(u.name || "—")}</b><div class="tt-small">${esc(u.email || "")}</div></td>
      <td>${isAdmin() && u.id !== T.user.uid ? `<select data-role="${u.id}"><option value="user" ${u.role === "user" ? "selected" : ""}>Học viên</option><option value="teacher" ${u.role === "teacher" ? "selected" : ""}>Giáo viên</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>Quản trị</option></select>` : `<span class="tt-badge ${u.role === "admin" ? "peach" : u.role === "teacher" ? "" : "green"}">${u.role === "admin" ? "Quản trị" : u.role === "teacher" ? "Giáo viên" : "Học viên"}</span>`}</td>
      ${FLAGS.map(f => `<td>${u.role === "admin" || u.role === "teacher" ? '<span class="tt-small">tất cả</span>' : triSel(u, f)}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div>${list.length > 300 ? `<p class="tt-small">Hiển thị 300/${list.length} — hãy dùng ô tìm kiếm.</p>` : ""}</div>`;
  $("us-q").addEventListener("input", e => { LMS.userSearch = e.target.value; clearTimeout(LMS.qt); LMS.qt = setTimeout(() => { lmsUsers().then(() => { const i = $("us-q"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); });
  $("us-reload").addEventListener("click", () => { LMS.users = null; lmsUsers(); });
  lmsBody().querySelectorAll("select[data-p]").forEach(s => s.addEventListener("change", async () => {
    const u = LMS.users.find(x => x.id === s.dataset.u); const perms = { ...(u.permissions || {}) };
    if (s.value === "def") delete perms[s.dataset.p]; else perms[s.dataset.p] = s.value === "on";
    try { await D().updateDoc(D().doc(db(), "users", u.id), { permissions: perms }); u.permissions = perms; s.className = s.value === "on" ? "tt-sel-on" : s.value === "off" ? "tt-sel-off" : ""; toast("Đã lưu quyền cho " + (u.name || u.email)); }
    catch (e) { toast(errText(e)); }
  }));
  lmsBody().querySelectorAll("select[data-role]").forEach(s => s.addEventListener("change", async () => {
    const u = LMS.users.find(x => x.id === s.dataset.role);
    if (!confirm(`Đổi vai trò của ${u.name || u.email} thành “${s.options[s.selectedIndex].text}”?`)) { s.value = u.role; return; }
    try { await D().updateDoc(D().doc(db(), "users", u.id), { role: s.value }); u.role = s.value; toast("Đã đổi vai trò"); lmsUsers(); }
    catch (e) { toast(errText(e)); s.value = u.role; }
  }));
}

/* ---------- Bài nộp ghi âm ---------- */
async function lmsSubs() {
  loading();
  try {
    if (!LMS.subs) {
      const snap = await D().getDocs(D().query(D().collection(db(), "submissions"), D().orderBy("createdAt", "desc"), D().limit(150)));
      LMS.subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!LMS.classes) await fetchClasses().catch(() => {});
    }
  } catch (e) { lmsBody().innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
  const cls = LMS.classes || [];
  const fc = LMS.subClass || "";
  const ft = LMS.subType || "";
  const list = LMS.subs.filter(s => (LMS.subFilter === "all" || s.status === LMS.subFilter) && (!fc || (s.classIds || []).includes(fc)) && (!ft || (s.type || "speaking") === ft));
  lmsBody().innerHTML = `<div class="tt-card">
    <div class="tt-row" style="margin-bottom:.8rem">
      <select class="tt-select" id="sb-st"><option value="submitted">⏳ Chờ nhận xét</option><option value="reviewed">✓ Đã nhận xét</option><option value="all">Tất cả</option></select>
      <select class="tt-select" id="sb-ty"><option value="">Mọi loại bài</option><option value="speaking">🎙️ Khẩu ngữ</option><option value="vip">⭐ 贯通中文</option><option value="interview">🎤 Phỏng vấn</option></select>
      <select class="tt-select" id="sb-cl"><option value="">Mọi lớp</option>${cls.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
      <button class="tt-btn ghost sm" id="sb-reload">↻ Làm mới</button><span class="tt-small">${list.length} bài</span></div>
    ${list.length ? list.map(s => `<div class="tt-sub" data-sub="${s.id}">
        <div class="tt-row between"><div><b>${esc(s.name)}</b> <span class="tt-small">${esc(s.email || "")} · ${fmtTime(s.createdAt)}</span><div>${s.type === "vip" ? "⭐ " : s.type === "interview" ? "🎤 " : "🎙️ "}${esc(s.taskTitle)}${s.role && s.role !== "all" ? ` <span class="tt-badge">vai ${esc(s.role)}</span>` : ""}${s.duration ? ` <span class="tt-small">· ${fmtClock(s.duration)}</span>` : ""}</div></div>
          ${s.status === "reviewed" ? `<span class="tt-badge green">đã nhận xét${s.score ? " · " + esc(s.score) : ""}</span>` : `<span class="tt-badge peach">chờ nhận xét</span>`}</div>
        <div class="tt-row" style="margin-top:.4rem"><button class="tt-btn ghost sm" data-review="${s.id}">${s.status === "reviewed" ? "Xem / sửa nhận xét" : "▶ Nghe & nhận xét"}</button></div>
        <div data-review-box="${s.id}"></div></div>`).join("") : `<div class="tt-empty">Không có bài nộp nào.</div>`}</div>`;
  $("sb-st").value = LMS.subFilter; $("sb-cl").value = fc; $("sb-ty").value = ft;
  $("sb-ty").addEventListener("change", e => { LMS.subType = e.target.value; lmsSubs(); });
  $("sb-st").addEventListener("change", e => { LMS.subFilter = e.target.value; lmsSubs(); });
  $("sb-cl").addEventListener("change", e => { LMS.subClass = e.target.value; lmsSubs(); });
  $("sb-reload").addEventListener("click", () => { LMS.subs = null; lmsSubs(); });
  lmsBody().querySelectorAll("[data-review]").forEach(b => b.addEventListener("click", () => openReview(LMS.subs.find(x => x.id === b.dataset.review))));
}
async function openReview(s) {
  const box = lmsBody().querySelector(`[data-review-box="${s.id}"]`); if (!box) return;
  box.innerHTML = `<div style="margin-top:.6rem" id="rv-audio-${s.id}"></div>
    <label class="tt-label">Nhận xét của giáo viên</label>
    <textarea class="tt-textarea" id="rv-fb-${s.id}" maxlength="1500" placeholder="VD: Phát âm thanh 3 ở 你好 rất chuẩn! Chú ý âm 'zh' trong 中文…">${esc(s.feedback || "")}</textarea>
    <div class="tt-row" style="margin-top:.5rem"><select class="tt-select" id="rv-sc-${s.id}"><option value="">Đánh giá (không bắt buộc)</option>${["Xuất sắc", "Tốt", "Khá", "Cần cố gắng"].map(x => `<option ${s.score === x ? "selected" : ""}>${x}</option>`).join("")}</select>
      <button class="tt-btn peach" id="rv-save-${s.id}">Lưu nhận xét</button>
      <button class="tt-btn danger sm" id="rv-del-${s.id}">Xoá bài</button></div>`;
  showSubAudio(s, $(`rv-audio-${s.id}`));
  $(`rv-save-${s.id}`).addEventListener("click", async () => {
    const patch = { feedback: $(`rv-fb-${s.id}`).value.trim(), score: $(`rv-sc-${s.id}`).value, status: "reviewed", reviewerName: myName(), reviewerId: T.user.uid, reviewedAt: D().serverTimestamp() };
    try { await D().updateDoc(D().doc(db(), "submissions", s.id), patch); Object.assign(s, patch); toast("✅ Đã lưu nhận xét"); lmsSubs(); } catch (e) { toast(errText(e)); }
  });
  $(`rv-del-${s.id}`).addEventListener("click", async () => {
    if (!confirm("Xoá bài nộp này?")) return;
    try { await D().deleteDoc(D().doc(db(), "submissions", s.id)); await D().deleteDoc(D().doc(db(), "submissionAudio", s.id)).catch(() => {}); LMS.subs = LMS.subs.filter(x => x.id !== s.id); lmsSubs(); }
    catch (e) { toast(errText(e)); }
  });
}

/* ---------- Góp ý bản dịch chờ duyệt ---------- */
async function lmsContrib() {
  loading();
  try {
    const snap = await D().getDocs(D().query(D().collection(db(), "contributions"), D().where("status", "==", "pending"), D().limit(200)));
    LMS.contribs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((a.createdAt && a.createdAt.seconds) || 0) - ((b.createdAt && b.createdAt.seconds) || 0));
  } catch (e) { lmsBody().innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
  lmsBody().innerHTML = `<div class="tt-card">
    <div class="tt-row between" style="margin-bottom:.7rem"><span class="tt-small"><b>${LMS.contribs.length}</b> góp ý đang chờ. Bấm <b>Duyệt</b> → bài đọc trên web cập nhật ngay cho mọi người.</span>
      ${isAdmin() ? `<button class="tt-btn ghost sm" id="ct-export" title="Ghi các bản dịch đã duyệt thẳng vào kho bài đọc trên máy chủ">⤒ Gộp bản dịch đã duyệt vào kho bài đọc</button>` : ""}</div>
    ${LMS.contribs.length ? LMS.contribs.map(c => `<div class="tt-sub" data-c="${c.id}">
      <div class="tt-row between"><div><span class="tt-badge">${c.hsk ? "HSK " + esc(c.hsk) : ""}</span> <b>${esc(c.readingTitle)}</b> <span class="tt-small">· câu ${c.lineIndex + 1} · ${c.field === "note" ? "💡 ghi chú" : "✏️ bản dịch"}</span></div><span class="tt-small">${esc(c.name)} · ${fmtTime(c.createdAt)}</span></div>
      <div class="tt-hz" style="font-size:18px;margin:.4rem 0 .2rem">${esc(c.cn)}</div>
      <div class="tt-small">Hiện tại: ${esc(c.originalText || "—")}</div>
      <label class="tt-label">Đề xuất (có thể sửa trước khi duyệt)</label>
      <textarea class="tt-textarea" data-ctext="${c.id}" style="min-height:52px">${esc(c.suggestedText)}</textarea>
      ${c.reason ? `<div class="tt-small" style="margin-top:.3rem">Lý do: ${esc(c.reason)}</div>` : ""}
      <div class="tt-row" style="margin-top:.5rem;justify-content:flex-end"><button class="tt-btn danger sm" data-reject="${c.id}">Từ chối</button><button class="tt-btn peach sm" data-approve="${c.id}">✓ Duyệt & cập nhật</button></div></div>`).join("")
      : `<div class="tt-empty">🎉 Không còn góp ý nào chờ duyệt.</div>`}</div>`;
  lmsBody().querySelectorAll("[data-approve]").forEach(b => b.addEventListener("click", () => decideContrib(b.dataset.approve, true)));
  lmsBody().querySelectorAll("[data-reject]").forEach(b => b.addEventListener("click", () => decideContrib(b.dataset.reject, false)));
  $("ct-export")?.addEventListener("click", exportBaiDoc);
}
async function decideContrib(id, ok) {
  const c = LMS.contribs.find(x => x.id === id);
  const text = lmsBody().querySelector(`[data-ctext="${id}"]`).value.trim();
  try {
    if (ok) {
      if (!text) { toast("Nội dung trống."); return; }
      await D().setDoc(D().doc(db(), "readingOverrides", c.readingId), { lines: { [String(c.lineIndex)]: { [c.field === "note" ? "note" : "vi"]: text } }, updatedAt: D().serverTimestamp() }, { merge: true });
      applyOverride(c.readingId, { lines: { [c.lineIndex]: { [c.field === "note" ? "note" : "vi"]: text } } });
      window.tnReadingRerender && window.tnReadingRerender();
    }
    await D().updateDoc(D().doc(db(), "contributions", id), { status: ok ? "approved" : "rejected", finalText: ok ? text : "", reviewedBy: myName(), reviewedAt: D().serverTimestamp() });
    toast(ok ? "✅ Đã duyệt — bài đọc đã cập nhật" : "Đã từ chối góp ý");
    lmsContrib();
  } catch (e) { toast(errText(e)); }
}
async function exportBaiDoc() {
  if (!confirm("Ghi toàn bộ kho bài đọc (đã gộp các bản dịch được duyệt) lên máy chủ?")) return;
  try { const n = await publishReadings(lessons()); toast(`✅ Đã cập nhật kho bài đọc (${n} bài).`); }
  catch (e) { toast(errText(e)); }
}

/* ---------- Kho bài đọc trên máy chủ (chỉ tài khoản đã đăng nhập mới đọc được) ---------- */
/** Chia mảng bài đọc thành nhiều tài liệu ≤ ~850 KB (Firestore giới hạn 1 MB/tài liệu) rồi ghi lên readings/* */
async function publishReadings(arr, onStep) {
  if (!Array.isArray(arr) || !arr.length) throw new Error("Không có bài đọc nào để lưu.");
  const enc = new TextEncoder(), LIMIT = 850000;
  const parts = []; let cur = [], size = 2;
  arr.forEach(l => {
    const b = enc.encode(JSON.stringify(l)).length + 1;
    if (cur.length && size + b > LIMIT) { parts.push(cur); cur = []; size = 2; }
    cur.push(l); size += b;
  });
  if (cur.length) parts.push(cur);
  const ids = parts.map((_, i) => "p" + (i + 1));
  for (let i = 0; i < parts.length; i++) {
    onStep && onStep(i + 1, parts.length);
    await D().setDoc(D().doc(db(), "readings", ids[i]), { json: JSON.stringify(parts[i]), count: parts[i].length });
  }
  await D().setDoc(D().doc(db(), "readings", "_meta"), { version: Date.now(), parts: ids, count: arr.length, updatedAt: D().serverTimestamp() });
  return arr.length;
}
async function lmsReadData() {
  lmsBody().innerHTML = `<div class="tt-card"><b>Kho bài đọc trên máy chủ</b>
    <p class="tt-small" style="margin:.4rem 0 .8rem;line-height:1.7">Nội dung bài đọc không còn nằm trên GitHub — chỉ tài khoản <b>đã đăng nhập</b> mới tải được.
      Muốn thêm/sửa nhiều bài: nhờ Claude sửa file <b>bai-doc-data.json</b> rồi nạp lại ở đây (ghi đè toàn bộ kho). Bản dịch học viên góp ý được duyệt vẫn tự cập nhật như cũ.</p>
    <div id="rd-now" class="tt-small" style="margin-bottom:.6rem"><span class="tt-spin"></span></div>
    <input type="file" accept=".json,application/json" id="rd-file" class="tt-input" style="width:100%">
    <div class="tt-row" style="justify-content:flex-end;margin-top:.6rem"><button class="tt-btn peach" id="rd-go" disabled>⤒ Nạp lên máy chủ</button></div>
    <div id="rd-log" style="margin-top:.7rem"></div></div>`;
  (async () => {
    try { const m = await D().getDoc(D().doc(db(), "readings", "_meta"));
      $("rd-now") && ($("rd-now").innerHTML = m.exists() ? `✓ Đang có <b>${m.data().count}</b> bài · ${m.data().parts.length} phần · cập nhật ${esc(fmtTime(m.data().updatedAt))}` : "✗ Chưa nạp kho bài đọc — web đang hiện “Đang tải…” cho học viên.");
    } catch (e) { $("rd-now") && ($("rd-now").textContent = errText(e)); }
  })();
  let arr = null;
  $("rd-file").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const pkg = JSON.parse(await f.text());
      if (pkg.kind !== "tndihoc-readings" || !Array.isArray(pkg.lessons)) throw new Error("File không đúng định dạng bai-doc-data.json");
      arr = pkg.lessons;
      const lv = {}; arr.forEach(l => lv[l.hsk] = (lv[l.hsk] || 0) + 1);
      $("rd-log").innerHTML = `<div class="tt-note ok">Đã đọc ${arr.length} bài: ${Object.entries(lv).map(([k, v]) => `HSK ${esc(k)}: ${v}`).join(" · ")}</div>`;
      $("rd-go").disabled = false;
    } catch (err) { arr = null; $("rd-log").innerHTML = `<div class="tt-note err">${esc(err.message)}</div>`; }
  });
  $("rd-go").addEventListener("click", async () => {
    if (!arr) return; const b = $("rd-go"); b.disabled = true;
    try {
      await publishReadings(arr, (i, n) => { $("rd-log").innerHTML = `<div class="tt-note">Đang nạp phần ${i}/${n}…</div><div class="tt-progress"><i style="width:${i / n * 100}%"></i></div>`; });
      $("rd-log").innerHTML = `<div class="tt-note ok">🎉 Xong! Đã nạp ${arr.length} bài. Tải lại trang để thấy kho bài đọc mới.</div>`;
    } catch (e) { $("rd-log").innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; b.disabled = false; }
  });
}

/* ---------- Chủ đề khẩu ngữ do giáo viên giao ---------- */
async function lmsTopics() {
  loading();
  let custom = [];
  try { const snap = await D().getDocs(D().collection(db(), "speakingTopics")); custom = snap.docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { lmsBody().innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
  lmsBody().innerHTML = `<div class="tt-card"><b>Giao chủ đề khẩu ngữ mới</b>
    <div class="tt-row" style="margin-top:.6rem"><input class="tt-input" id="tp-icon" value="🗣️" style="width:60px;text-align:center"><input class="tt-input tt-hz" id="tp-title" placeholder="Tiêu đề tiếng Trung (VD: 介绍你的城市)" style="flex:1;min-width:200px"><input class="tt-input" id="tp-vi" placeholder="Tiêu đề tiếng Việt" style="flex:1;min-width:180px"></div>
    <div class="tt-row" style="margin-top:.5rem"><input class="tt-input" id="tp-level" placeholder="Cấp độ (VD: HSK 3)" style="width:150px"><input class="tt-input" id="tp-sec" type="number" value="60" min="20" max="120" style="width:100px"><span class="tt-small">giây gợi ý</span></div>
    <label class="tt-label">Tình huống / yêu cầu</label><textarea class="tt-textarea" id="tp-scene" placeholder="Mô tả nhiệm vụ cho học viên…"></textarea>
    <label class="tt-label">Câu hỏi gợi ý — mỗi dòng: chữ Hán | pinyin | nghĩa</label><textarea class="tt-textarea" id="tp-prompts" placeholder="你住在哪个城市？ | Nǐ zhù zài nǎge chéngshì? | Bạn sống ở thành phố nào?"></textarea>
    <label class="tt-label">Từ vựng hữu ích — mỗi dòng: chữ Hán | pinyin | nghĩa</label><textarea class="tt-textarea" id="tp-words" placeholder="城市 | chéngshì | thành phố"></textarea>
    <label class="tt-label">💬 Hội thoại mẫu (không bắt buộc) — mỗi dòng: Tên nhân vật：chữ Hán | pinyin | nghĩa</label><textarea class="tt-textarea" id="tp-dialogue" style="min-height:120px" placeholder="小明：你好！ | Nǐ hǎo! | Xin chào!&#10;小丽：你好！你去哪儿？ | Nǐ hǎo! Nǐ qù nǎr? | Chào bạn! Bạn đi đâu thế?"></textarea>
    <p class="tt-small">Pinyin và nghĩa có thể để trống (chỉ ghi chữ Hán). Câu nào chưa có tên nhân vật thì máy tự xếp vai A / B xen kẽ.</p>
    <div class="tt-row" style="justify-content:flex-end;margin-top:.6rem"><button class="tt-btn peach" id="tp-add">＋ Thêm chủ đề</button></div></div>
    <div class="tt-card"><b>📥 Nạp nhiều chủ đề cùng lúc từ file .json</b>
      <p class="tt-small" style="margin:.3rem 0 .6rem">Dùng file do Claude soạn sẵn (ví dụ <code>hoi-thoai-khau-ngu.json</code>). Nạp lại cùng một file sẽ <b>cập nhật</b> chủ đề cũ, không tạo bản trùng.</p>
      <div class="tt-row"><input type="file" id="tp-file" accept=".json,application/json"><button class="tt-btn" id="tp-import" disabled>Nạp lên máy chủ</button></div>
      <div id="tp-log" style="margin-top:.5rem"></div></div>
    <div class="tt-card"><b>Chủ đề giáo viên đã giao (${custom.length})</b>${custom.length ? custom.map(t => `<div class="tt-sub" style="margin-top:.6rem"><div class="tt-row between"><div>${esc(t.icon || "")} <span class="tt-hz" style="font-size:17px">${esc(t.title)}</span> · ${esc(t.vi)} <span class="tt-badge">${esc(t.level || "")}</span>${(t.dialogueRows || []).length ? ` <span class="tt-badge green">💬 ${t.dialogueRows.length} câu</span>` : ""}</div><button class="tt-btn danger sm" data-tdel="${t.id}">Xoá</button></div></div>`).join("") : `<div class="tt-empty">Chưa có. (Ngoài ra web có sẵn ${BUILTIN_TOPICS.length} chủ đề mẫu.)</div>`}</div>`;
  const rows = (v) => v.split("\n").map(l => l.split("|").map(x => x.trim())).filter(r => r[0]);
  // "小明：你好！ | Nǐ hǎo! | Xin chào!" → { role, cn, py, vi }
  const dlgRows = (v) => {
    const out = rows(v).map(r => { const m = r[0].match(/^([^：:]{1,12})[：:]\s*(.+)$/); return { role: m ? m[1].trim() : "", cn: m ? m[2].trim() : r[0], py: r[1] || "", vi: r[2] || "" }; });
    const named = [...new Set(out.map(r => r.role).filter(Boolean))];
    out.forEach((r, i) => { if (!r.role) r.role = named[i % 2] || (i % 2 ? "B" : "A"); });
    return out;
  };
  const cleanTopic = (x) => ({
    icon: String(x.icon || "🗣️").slice(0, 8), title: String(x.title || "").trim(), titlePy: String(x.titlePy || ""), vi: String(x.vi || "").trim(),
    level: String(x.level || ""), sec: Math.min(Math.max(Number(x.sec) || 60, 20), 120), scene: String(x.scene || ""),
    speakers: Array.isArray(x.speakers) ? x.speakers.map(String).slice(0, 6) : [],
    promptRows: (x.promptRows || []).map(r => ({ cn: String(r.cn || ""), py: String(r.py || ""), vi: String(r.vi || "") })),
    wordRows: (x.wordRows || []).map(r => ({ cn: String(r.cn || ""), py: String(r.py || ""), vi: String(r.vi || "") })),
    dialogueRows: (x.dialogueRows || []).map(r => ({ role: String(r.role || ""), cn: String(r.cn || ""), py: String(r.py || ""), vi: String(r.vi || "") })),
  });
  let importList = null;
  $("tp-file").addEventListener("change", async (e) => {
    const f = e.target.files[0]; importList = null; $("tp-import").disabled = true; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const arr = (Array.isArray(data) ? data : (data.topics || [])).map(x => ({ id: String(x.id || ""), ...cleanTopic(x) })).filter(x => x.title && x.vi);
      if (!arr.length) throw new Error("File không có chủ đề nào hợp lệ.");
      importList = arr; $("tp-import").disabled = false;
      $("tp-log").innerHTML = `<div class="tt-note">Tìm thấy <b>${arr.length}</b> chủ đề: ${arr.map(x => esc(x.title)).join(" · ")}</div>`;
    } catch (err) { $("tp-log").innerHTML = `<div class="tt-note err">Không đọc được file: ${esc(err.message)}</div>`; }
  });
  $("tp-import").addEventListener("click", async () => {
    if (!importList) return;
    const b = $("tp-import"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nạp…';
    let n = 0;
    try {
      for (const x of importList) {
        const { id, ...t } = x;
        const safeId = /^[A-Za-z0-9_-]{3,60}$/.test(id) ? id : null;
        const ref = safeId ? D().doc(db(), "speakingTopics", safeId) : D().doc(D().collection(db(), "speakingTopics"));
        await D().setDoc(ref, { ...t, createdBy: T.user.uid, createdAt: D().serverTimestamp() });
        n++; b.innerHTML = `<span class="tt-spin"></span> ${n}/${importList.length}`;
      }
      toast(`✅ Đã nạp ${n} chủ đề`); SPK.topics = null; renderSpeaking(); lmsTopics();
    } catch (e) { $("tp-log").innerHTML = `<div class="tt-note err">Đã nạp ${n}/${importList.length}. Lỗi: ${esc(errText(e))}</div>`; b.disabled = false; b.textContent = "Nạp lên máy chủ"; }
  });
  $("tp-add").addEventListener("click", async () => {
    const t = { icon: $("tp-icon").value.trim() || "🗣️", title: $("tp-title").value.trim(), vi: $("tp-vi").value.trim(), level: $("tp-level").value.trim(), sec: Number($("tp-sec").value) || 60, scene: $("tp-scene").value.trim() };
    if (!t.title || !t.vi) { toast("Cần nhập tiêu đề tiếng Trung và tiếng Việt."); return; }
    // Firestore không lưu được mảng lồng mảng → lưu dạng mảng đối tượng rồi chuyển lại khi đọc
    t.promptRows = rows($("tp-prompts").value).map(r => ({ cn: r[0], py: r[1] || "", vi: r[2] || "" }));
    t.wordRows = rows($("tp-words").value).map(r => ({ cn: r[0], py: r[1] || "", vi: r[2] || "" }));
    t.dialogueRows = dlgRows($("tp-dialogue").value);
    t.speakers = [...new Set(t.dialogueRows.map(r => r.role))];
    t.createdBy = T.user.uid; t.createdAt = D().serverTimestamp();
    try { await D().addDoc(D().collection(db(), "speakingTopics"), t); toast("✅ Đã thêm chủ đề"); SPK.topics = null; renderSpeaking(); lmsTopics(); } catch (e) { toast(errText(e)); }
  });
  lmsBody().querySelectorAll("[data-tdel]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Xoá chủ đề này?")) return;
    try { await D().deleteDoc(D().doc(db(), "speakingTopics", b.dataset.tdel)); SPK.topics = null; renderSpeaking(); lmsTopics(); } catch (e) { toast(errText(e)); }
  }));
}

/* ---------- Mặc định cho mọi tài khoản (admin) ---------- */
function lmsDefaults() {
  lmsBody().innerHTML = `<div class="tt-card"><b>Tính năng mở sẵn cho MỌI người</b>
    <p class="tt-small" style="margin:.3rem 0 .8rem">Bật ở đây = ai cũng dùng được (kể cả chưa vào lớp). Tắt = chỉ người được lớp hoặc quyền riêng mở mới dùng được. Gợi ý: để <b>Hội thoại 贯通中文</b> và <b>Training phỏng vấn</b> ở trạng thái tắt (tính năng VIP).</p>
    <div class="tt-switch-list">${FLAGS.map(f => `<label class="tt-switch"><input type="checkbox" data-def="${f.feat}" ${T.defaults[f.feat] ? "checked" : ""}><span class="knob"></span> ${f.icon} ${esc(f.label)}</label>`).join("")}</div></div>`;
  lmsBody().querySelectorAll("[data-def]").forEach(i => i.addEventListener("change", async () => {
    const next = { ...T.defaults, [i.dataset.def]: i.checked };
    const clean = {}; FLAGS.forEach(f => clean[f.feat] = !!next[f.feat]);
    try { await D().setDoc(D().doc(db(), "settings", "defaults"), clean); T.defaults = clean; toast("Đã lưu cài đặt mặc định"); emit(); }
    catch (e) { toast(errText(e)); i.checked = !i.checked; }
  }));
}

/* ---------- Nạp dữ liệu 贯通中文 (admin) ---------- */
function lmsVipData() {
  lmsBody().innerHTML = `<div class="tt-card"><b>Nạp nội dung + âm thanh giáo trình 《贯通中文 综合教程 1》</b>
    <ol class="tt-small" style="margin:.5rem 0 .8rem 1.1rem;list-style:decimal;line-height:1.8">
      <li>Chọn file <b>gt1-vip.json</b> (Claude đã chuẩn bị: 15 bài · 50 đoạn hội thoại · 268 câu, kèm file nghe gốc đã nén và mốc thời gian từng câu).</li>
      <li>Bấm <b>Nạp lên máy chủ</b> và chờ ~1 phút. <b>Không</b> tải file này lên GitHub (để giữ bản quyền giáo trình, chỉ học viên có quyền VIP mới nghe/xem được).</li></ol>
    <input type="file" accept=".json,application/json" id="vd-file" class="tt-input" style="width:100%">
    <div class="tt-row" style="justify-content:flex-end;margin-top:.6rem"><button class="tt-btn peach" id="vd-go" disabled>⤒ Nạp lên máy chủ</button></div>
    <div id="vd-log" style="margin-top:.7rem"></div></div>`;
  let pkg = null;
  $("vd-file").addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      pkg = JSON.parse(await f.text());
      if (pkg.kind !== "tndihoc-vip" || !Array.isArray(pkg.lessons)) throw new Error("File không đúng định dạng gt1-vip.json");
      const nT = pkg.lessons.reduce((s, l) => s + l.texts.length, 0);
      $("vd-log").innerHTML = `<div class="tt-note ok">Đã đọc: ${esc(pkg.book)} · ${pkg.lessons.length} bài · ${nT} đoạn · ${Object.keys(pkg.audio || {}).length} file nghe.</div>`;
      $("vd-go").disabled = false;
    } catch (err) { pkg = null; $("vd-log").innerHTML = `<div class="tt-note err">${esc(err.message)}</div>`; }
  });
  $("vd-go").addEventListener("click", async () => {
    if (!pkg) return;
    const btn = $("vd-go"); btn.disabled = true;
    const log = $("vd-log"); const tracks = Object.keys(pkg.audio || {});
    try {
      log.innerHTML = `<div class="tt-note">Đang nạp nội dung bài khoá…</div>`;
      // Firestore không nhận mảng lồng mảng → mốc thời gian [bắt đầu, kết thúc] đổi thành {0: bắt đầu, 1: kết thúc}
      const lessons = pkg.lessons.map(l => ({ ...l, texts: l.texts.map(t => ({ ...t, segs: (t.segs || []).map(x => Array.isArray(x) ? { 0: x[0], 1: x[1] } : x) })) }));
      await D().setDoc(D().doc(db(), "vip", "gt1"), { book: pkg.book, version: pkg.version || 1, lessons, updatedAt: D().serverTimestamp() });
      for (let k = 0; k < tracks.length; k++) {
        const t = tracks[k];
        log.innerHTML = `<div class="tt-note">Đang nạp file nghe ${k + 1}/${tracks.length} (track ${esc(t)})…</div><div class="tt-progress"><i style="width:${(k + 1) / tracks.length * 100}%"></i></div>`;
        await D().setDoc(D().doc(db(), "vipAudio", t), { mime: pkg.audio[t].mime || "audio/mpeg", data: pkg.audio[t].data });
      }
      VIP.data = null; VA.urls = {};
      log.innerHTML = `<div class="tt-note ok">🎉 Xong! Đã nạp ${pkg.lessons.length} bài và ${tracks.length} file nghe. Mở mục “Hội thoại 贯通中文” để kiểm tra.</div>`;
      renderVip();
    } catch (e) { log.innerHTML += `<div class="tt-note err">${esc(errText(e))}</div>`; btn.disabled = false; }
  });
}
onState(() => { LMS.classes = null; LMS.users = null; LMS.subs = null; renderLms(); });

/* ---------------- Cho các file khác dùng chung (phong-van.js) ---------------- */
window.tnApi = { T, can, isStaff, isAdmin, myName, fbReady, db, D, REC, TTS, toast, errText, esc, modal, fmtClock, fmtTime, blobToDataURL,
  lockedHtml, needLoginHtml, onState, showSubAudio, invalidateMySubs: () => { SPK.mySubs = null; renderSpeaking(); } };
document.dispatchEvent(new CustomEvent("tn-api-ready"));

/* ---------------- Khởi động ---------------- */
// auth.js chạy trước file này nên có thể đã phát sự kiện "tn-auth" từ trước → đọc lại trạng thái hiện có
handleAuth(window.tnAuth || null);
