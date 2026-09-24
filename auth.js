/* =====================================================================
   ĐĂNG NHẬP / ĐĂNG KÝ + TRANG QUẢN TRỊ (ADMIN) — tndihoc
   ---------------------------------------------------------------------
   Dùng Firebase (dịch vụ miễn phí của Google) để lưu tài khoản người dùng,
   nhờ vậy 1 tài khoản đăng nhập được trên mọi thiết bị.

   Đã kết nối với dự án Firebase "tndihoc" (không cần sửa gì thêm).
   ===================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyD1r4nBqXeUVuU8OhKutRRhu-JvkPcvQaQ",
  authDomain: "tndihoc.firebaseapp.com",
  projectId: "tndihoc",
  storageBucket: "tndihoc.firebasestorage.app",
  messagingSenderId: "385714939602",
  appId: "1:385714939602:web:4a2db3ea2da6ff2388af0b"
};

/* ===================== Từ đây trở xuống KHÔNG cần sửa ===================== */

const FB_VERSION = "10.12.2";
const CONFIG_READY = !Object.values(firebaseConfig).some(v => !v || v === "DAN_VAO_DAY");

const $ = (id) => document.getElementById(id);
const state = { user: null, profile: null, fb: null, adminUsers: [] };

/* ---------- Tải Firebase ---------- */
async function loadFirebase() {
  if (!CONFIG_READY) return null;
  const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;
  const [appMod, authMod, dbMod] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);
  const app = appMod.initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  auth.languageCode = "vi";
  const db = dbMod.getFirestore(app);
  return { auth, db, A: authMod, D: dbMod };
}

/* ---------- Thông báo lỗi tiếng Việt ---------- */
function viError(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/missing-email": "Vui lòng nhập email.",
    "auth/missing-password": "Vui lòng nhập mật khẩu.",
    "auth/email-already-in-use": "Email này đã được đăng ký. Hãy chuyển sang tab Đăng nhập.",
    "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/wrong-password": "Email hoặc mật khẩu không đúng.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/too-many-requests": "Thử sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.",
    "auth/network-request-failed": "Mất kết nối mạng. Kiểm tra internet rồi thử lại.",
    "auth/popup-closed-by-user": "Cửa sổ đăng nhập Google đã bị đóng.",
    "auth/popup-blocked": "Trình duyệt đã chặn cửa sổ bật lên. Hãy cho phép popup rồi thử lại.",
    "auth/unauthorized-domain": "Tên miền web chưa được cho phép trong Firebase (Authentication → Settings → Authorized domains).",
    "auth/operation-not-allowed": "Cách đăng nhập này chưa được bật trong Firebase.",
    "permission-denied": "Không có quyền truy cập dữ liệu này.",
  };
  return map[code] || ("Có lỗi xảy ra" + (code ? ` (${code})` : "") + ". Vui lòng thử lại.");
}

/* ---------- Hồ sơ người dùng trong Firestore ---------- */
async function ensureProfile(user, nameHint) {
  const { db, D } = state.fb;
  const ref = D.doc(db, "users", user.uid);
  const snap = await D.getDoc(ref);
  if (!snap.exists()) {
    await D.setDoc(ref, {
      name: nameHint || state.pendingName || user.displayName || (user.email || "").split("@")[0],
      email: user.email || "",
      role: "user",
      createdAt: D.serverTimestamp(),
      lastLogin: D.serverTimestamp(),
      loginCount: 1,
    });
  } else {
    await D.updateDoc(ref, { lastLogin: D.serverTimestamp(), loginCount: D.increment(1) });
  }
  const fresh = await D.getDoc(ref);
  return fresh.data();
}

/* ---------- Modal đăng nhập / đăng ký ---------- */
let mode = "login"; // "login" | "register" | "reset"

function openModal(m = "login") {
  setMode(m);
  $("auth-modal").classList.add("is-open");
  document.body.style.overflow = "hidden";
  setTimeout(() => $(m === "register" ? "auth-name" : "auth-email").focus(), 50);
}
function closeModal() {
  $("auth-modal").classList.remove("is-open");
  document.body.style.overflow = "";
  showMsg("");
}
function setMode(m) {
  mode = m;
  document.querySelectorAll("[data-auth-tab]").forEach(t => t.classList.toggle("active", t.dataset.authTab === m));
  $("auth-tabs").style.display = m === "reset" ? "none" : "";
  $("auth-name-row").style.display = m === "register" ? "" : "none";
  $("auth-pass-row").style.display = m === "reset" ? "none" : "";
  $("auth-pass2-row").style.display = m === "register" ? "" : "none";
  $("auth-forgot").style.display = m === "login" ? "" : "none";
  $("auth-back").style.display = m === "reset" ? "" : "none";
  $("auth-google-wrap").style.display = m === "reset" ? "none" : "";
  $("auth-title").textContent = m === "register" ? "Tạo tài khoản mới" : m === "reset" ? "Lấy lại mật khẩu" : "Chào mừng quay lại";
  $("auth-sub").textContent = m === "reset"
    ? "Nhập email đã đăng ký, hệ thống sẽ gửi link đặt lại mật khẩu vào hộp thư."
    : "Một tài khoản — học trên mọi thiết bị.";
  $("auth-submit").textContent = m === "register" ? "Đăng ký" : m === "reset" ? "Gửi link đặt lại" : "Đăng nhập";
  $("auth-pass").autocomplete = m === "register" ? "new-password" : "current-password";
  showMsg("");
}
function showMsg(text, ok = false) {
  const el = $("auth-msg");
  el.textContent = text;
  el.className = "auth-msg" + (text ? (ok ? " ok" : " err") : "");
}
function setBusy(b) {
  $("auth-submit").disabled = b;
  $("auth-google").disabled = b;
  $("auth-submit").style.opacity = b ? ".6" : "";
}

/* ---------- Đảm bảo Firebase đã tải xong trước khi đăng nhập/đăng ký ---------- */
let fbPromise = null;
function startLoadFb() {
  if (!fbPromise) {
    fbPromise = loadFirebase().then(fb => { state.fb = fb; if (fb) watchAuth(fb); return fb; })
      .catch(err => { console.error("Không tải được Firebase:", err); fbPromise = null; return null; });
  }
  return fbPromise;
}
async function ensureFb() {
  if (state.fb) return true;
  if (!CONFIG_READY) { showMsg("Chức năng tài khoản chưa được cấu hình (thiếu firebaseConfig trong file auth.js)."); return false; }
  showMsg("Đang kết nối máy chủ đăng nhập…", true);
  const fb = await Promise.race([startLoadFb(), new Promise(r => setTimeout(() => r(null), 15000))]);
  if (fb) { showMsg(""); return true; }
  showMsg("Không kết nối được máy chủ đăng nhập (dịch vụ của Google). Hãy kiểm tra mạng rồi tải lại trang. Nếu bạn đang ở Trung Quốc, cần bật VPN mới đăng nhập được.");
  return false;
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!(await ensureFb())) return;
  const { auth, A } = state.fb;
  const email = $("auth-email").value.trim();
  const pass = $("auth-pass").value;
  setBusy(true); showMsg("");
  try {
    if (mode === "register") {
      const name = $("auth-name").value.trim();
      if (!name) throw { code: "_", message: "Vui lòng nhập họ tên." };
      if (pass !== $("auth-pass2").value) throw { code: "_", message: "Hai mật khẩu nhập lại không khớp." };
      state.pendingName = name;
      const cred = await A.createUserWithEmailAndPassword(auth, email, pass);
      await A.updateProfile(cred.user, { displayName: name });
      closeModal();
    } else if (mode === "login") {
      await A.signInWithEmailAndPassword(auth, email, pass);
      closeModal();
    } else {
      await A.sendPasswordResetEmail(auth, email);
      showMsg("Đã gửi! Kiểm tra hộp thư (cả mục Spam) để đặt lại mật khẩu.", true);
    }
  } catch (err) {
    showMsg(err.code === "_" ? err.message : viError(err));
  } finally { setBusy(false); }
}

async function handleGoogle() {
  // Trình duyệt trong ứng dụng (Facebook, Messenger, Zalo, Instagram, TikTok, WeChat...) bị Google chặn đăng nhập.
  if (/FBAN|FBAV|FB_IAB|Messenger|Instagram|Zalo|TikTok|musical_ly|Line\/|MicroMessenger/i.test(navigator.userAgent)) {
    showMsg("Đăng nhập Google không dùng được trong trình duyệt của Facebook/Zalo/Messenger. Hãy bấm dấu ⋯ góc trên → \"Mở bằng trình duyệt\" (Chrome/Safari), hoặc đăng nhập bằng email + mật khẩu.");
    return;
  }
  if (!(await ensureFb())) return;
  const { auth, A } = state.fb;
  setBusy(true); showMsg("");
  try {
    await A.signInWithPopup(auth, new A.GoogleAuthProvider());
    closeModal();
  } catch (err) { showMsg(viError(err)); }
  finally { setBusy(false); }
}

/* ---------- Hiển thị trạng thái đăng nhập trên thanh menu ---------- */
function initialOf(name) { return (name || "?").trim().charAt(0).toUpperCase() || "?"; }

function renderUser() {
  const u = state.user, p = state.profile;
  const isAdmin = !!(p && p.role === "admin");
  const name = (p && p.name) || (u && (u.displayName || u.email)) || "";
  document.querySelectorAll("[data-auth-guest]").forEach(el => el.style.display = u ? "none" : "");
  document.querySelectorAll("[data-auth-user]").forEach(el => el.style.display = u ? "" : "none");
  document.querySelectorAll("[data-auth-name]").forEach(el => el.textContent = name);
  document.querySelectorAll("[data-auth-email]").forEach(el => el.textContent = (u && u.email) || "");
  document.querySelectorAll("[data-auth-initial]").forEach(el => el.textContent = initialOf(name));
  document.querySelectorAll("[data-admin-only]").forEach(el => el.style.display = isAdmin ? "" : "none");
  document.querySelectorAll("[data-auth-role]").forEach(el => el.textContent = isAdmin ? "Quản trị viên" : "Học viên");
  renderAdmin();
}

function toggleMenu(force) {
  const m = $("auth-menu");
  const open = force !== undefined ? force : !m.classList.contains("is-open");
  m.classList.toggle("is-open", open);
}

async function logout() {
  toggleMenu(false);
  if (state.fb) await state.fb.A.signOut(state.fb.auth);
  if (location.hash === "#admin") location.hash = "#home";
}

/* ---------- Trang quản trị ---------- */
function toDate(ts) { return ts && typeof ts.toDate === "function" ? ts.toDate() : null; }
function fmt(d) {
  if (!d) return "—";
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function renderAdmin() {
  const isAdmin = !!(state.profile && state.profile.role === "admin");
  $("admin-locked").style.display = isAdmin ? "none" : "";
  $("admin-panel").style.display = isAdmin ? "" : "none";
  $("admin-locked-text").textContent = state.user
    ? "Tài khoản của bạn không có quyền quản trị."
    : "Vui lòng đăng nhập bằng tài khoản quản trị để xem trang này.";
  if (isAdmin && !state.adminUsers.length) loadAdminData();
}

async function loadAdminData() {
  const { db, D } = state.fb;
  $("admin-refresh").disabled = true;
  $("admin-status").textContent = "Đang tải dữ liệu…";
  try {
    const snap = await D.getDocs(D.collection(db, "users"));
    state.adminUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    $("admin-status").textContent = "Cập nhật lúc " + fmt(new Date());
    drawAdmin();
  } catch (err) {
    $("admin-status").textContent = viError(err) + (err.code === "permission-denied" ? " Kiểm tra lại Rules của Firestore." : "");
  } finally { $("admin-refresh").disabled = false; }
}

function drawAdmin() {
  const users = state.adminUsers.slice().sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const week = new Date(now - 7 * 864e5);
  $("admin-stat-total").textContent = users.length;
  $("admin-stat-new").textContent = users.filter(u => (toDate(u.createdAt) || 0) >= week).length;
  $("admin-stat-today").textContent = users.filter(u => (toDate(u.lastLogin) || 0) >= startToday).length;
  $("admin-stat-admin").textContent = users.filter(u => u.role === "admin").length;

  const q = $("admin-search").value.trim().toLowerCase();
  const rows = users.filter(u => !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  $("admin-count").textContent = q ? `${rows.length} / ${users.length} người dùng` : `${users.length} người dùng`;
  $("admin-tbody").innerHTML = rows.length ? rows.map((u, i) => `
    <tr>
      <td class="text-slate">${i + 1}</td>
      <td><div class="flex items-center gap-2.5"><span class="auth-avatar sm">${esc(initialOf(u.name || u.email))}</span><span class="font-medium text-ink whitespace-nowrap">${esc(u.name || "—")}</span>${u.role === "admin" ? '<span class="admin-badge">admin</span>' : ""}</div></td>
      <td class="text-slate whitespace-nowrap">${esc(u.email)}</td>
      <td class="whitespace-nowrap">${fmt(toDate(u.createdAt))}</td>
      <td class="whitespace-nowrap">${fmt(toDate(u.lastLogin))}</td>
      <td class="text-center">${u.loginCount || 0}</td>
    </tr>`).join("")
    : `<tr><td colspan="6" class="text-center text-slate py-8">Không có người dùng phù hợp.</td></tr>`;
}

function exportCsv() {
  const head = ["Họ tên", "Email", "Vai trò", "Ngày đăng ký", "Truy cập gần nhất", "Số lần truy cập"];
  const lines = state.adminUsers.map(u => [u.name, u.email, u.role, fmt(toDate(u.createdAt)), fmt(toDate(u.lastLogin)), u.loginCount || 0]
    .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
  const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nguoi-dung-tndihoc.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Gắn sự kiện ---------- */
function bind() {
  document.querySelectorAll("[data-auth-open]").forEach(b => b.addEventListener("click", () => {
    const drawerClose = $("drawer-close"); if (drawerClose) drawerClose.click();
    openModal(b.dataset.authOpen || "login");
  }));
  document.querySelectorAll("[data-auth-tab]").forEach(t => t.addEventListener("click", () => setMode(t.dataset.authTab)));
  $("auth-close").addEventListener("click", closeModal);
  $("auth-modal").addEventListener("click", e => { if (e.target.id === "auth-modal") closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); toggleMenu(false); } });
  $("auth-form").addEventListener("submit", handleSubmit);
  $("auth-google").addEventListener("click", handleGoogle);
  $("auth-forgot").addEventListener("click", () => setMode("reset"));
  $("auth-back").addEventListener("click", () => setMode("login"));
  $("auth-avatar-btn").addEventListener("click", e => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener("click", e => { if (!e.target.closest("#auth-menu")) toggleMenu(false); });
  document.querySelectorAll("[data-auth-logout]").forEach(b => b.addEventListener("click", logout));
  document.querySelectorAll("[data-go-admin]").forEach(b => b.addEventListener("click", () => {
    toggleMenu(false);
    const navBtn = document.querySelector('[data-nav-btn][data-target="admin"]');
    if (navBtn) navBtn.click(); else location.hash = "#admin";
  }));
  $("admin-refresh").addEventListener("click", loadAdminData);
  $("admin-search").addEventListener("input", drawAdmin);
  $("admin-export").addEventListener("click", exportCsv);
}

function watchAuth(fb) {
  const { auth, A } = fb;
  A.onAuthStateChanged(auth, async (user) => {
    state.user = user;
    state.adminUsers = [];
    state.profile = null;
    if (user) {
      // Mỗi lần mở web khi đã đăng nhập: tạo hồ sơ (nếu mới) hoặc cập nhật "truy cập gần nhất"
      try { state.profile = await ensureProfile(user); } catch (err) { console.error(err); }
    }
    renderUser();
  });
}

(async function init() {
  bind();
  renderUser();
  await startLoadFb();
  if (!state.fb) console.info("tndihoc: chưa tải được Firebase — sẽ thử lại khi người dùng bấm Đăng nhập.");
})();
