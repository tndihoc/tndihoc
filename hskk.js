/* =====================================================================
   LUYỆN KHẨU NGỮ HSKK — tndihoc
   ---------------------------------------------------------------------
   • Nằm trong thẻ "Khẩu ngữ" (mục Học tiếng Trung) → tab "📝 Luyện HSKK".
   • 3 trình độ: Sơ cấp (8 đề) · Trung cấp (16 đề) · Cao cấp (17 đề).
   • Mỗi đề: nghe đề, 🧩 cấu trúc gợi ý (gộp từ 3 tài liệu, đã bỏ trùng),
     📝 bài mẫu 1 / 2 / 3, ghi âm → nghe lại → nộp cho giáo viên.
   • Quyền xem bài mẫu:
       - Bài mẫu 1 của 2 đề đầu mỗi trình độ: mọi tài khoản đã đăng nhập.
       - Các bài mẫu còn lại: người có quyền "Bài mẫu HSKK (VIP)" (can_access_hskk),
         admin cấp theo lớp hoặc từng người.
   • Dữ liệu trong Firestore: hskk/open (đề + cấu trúc + bài mẫu mở) và hskk/full
     (toàn bộ bài mẫu — luật Firestore chỉ cho người có quyền đọc).
     Admin nạp file hskk-data.json ở "Lớp học & phân quyền" → tab "📝 Dữ liệu HSKK".
   • Bản ghi CHƯA nộp chỉ lưu trên máy học viên (IndexedDB) — giống Training phỏng vấn.
   Cần tải file này lên GitHub cùng thư mục với index.html (sau tinh-nang-moi.js).
   ===================================================================== */

const LV_META = {
  so: { title: "Sơ cấp", cn: "初级", icon: "🌱", hsk: "HSK 1–3", maxSec: 120, hint: "khoảng 1,5 phút",
    bg: "#E8F6EE", ink: "#1E7A46", line: "#BFE5CD", desc: "Câu ngắn, rõ ràng; từ vựng HSK 1–3. Đề quen thuộc: bản thân, gia đình, sở thích, cuối tuần…" },
  trung: { title: "Trung cấp", cn: "中级", icon: "🌿", hsk: "HSK 4–5", maxSec: 150, hint: "khoảng 2 phút",
    bg: "#EEF2FC", ink: "#2E48C4", line: "#D6E0F7", desc: "Lập luận có từ nối, câu phức HSK 4–5, chèn vài thành ngữ đơn giản." },
  cao: { title: "Cao cấp", cn: "高级", icon: "🌳", hsk: "HSK 6–9", maxSec: 180, hint: "khoảng 2,5 phút",
    bg: "#F3F0FA", ink: "#4B3C8C", line: "#DCD3F2", desc: "Nghị luận đa chiều, thành ngữ – tục ngữ – cụm 4 chữ, mở – kết ấn tượng." },
};

function start(api) {
  const { T, can, isStaff, isAdmin, myName, fbReady, db, D, REC, TTS, toast, errText, esc, fmtClock, fmtTime, blobToDataURL, needLoginHtml, lockedHtml, onState, showSubAudio } = api;
  const $ = (id) => document.getElementById(id);
  const root = $("tt-hskk"); if (!root) return;

  const HK = { open: null, full: null, loadErr: "", fullErr: "", lv: null, tab: "q", filter: "all", query: "", openN: null, smp: {}, takes: {}, rec: null, recN: null, subs: null, subsLoading: false };
  const vip = () => can("hskk");

  /* ---------- Bản ghi nháp trên máy (IndexedDB) — không gửi đi đâu ---------- */
  const IDB = {
    _db: null,
    open() {
      if (this._db) return Promise.resolve(this._db);
      return new Promise((res) => {
        try {
          const r = indexedDB.open("tndihoc-hskk", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("takes");
          r.onsuccess = () => { this._db = r.result; res(this._db); };
          r.onerror = () => res(null);
        } catch (e) { res(null); }
      });
    },
    async run(mode, fn) {
      const d = await this.open(); if (!d) return null;
      return new Promise((res) => {
        try { const tx = d.transaction("takes", mode); fn(tx.objectStore("takes")); tx.oncomplete = () => res(true); tx.onerror = () => res(null); }
        catch (e) { res(null); }
      });
    },
    put(k, v) { return this.run("readwrite", s => s.put(v, k)); },
    del(k) { return this.run("readwrite", s => s.delete(k)); },
    async listPrefix(prefix) {
      const d = await this.open(); if (!d) return {};
      return new Promise((res) => {
        const out = {};
        try {
          const tx = d.transaction("takes", "readonly");
          const req = tx.objectStore("takes").openCursor(IDBKeyRange.bound(prefix, prefix + "￿"));
          req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } };
          tx.oncomplete = () => res(out); tx.onerror = () => res(out);
        } catch (e) { res(out); }
      });
    },
  };
  const uidKey = () => (T.user ? T.user.uid : "guest");
  const takeKey = (lv, n) => `${uidKey()}|${lv}|${n}`;
  async function loadTakes(lv) {
    const prefix = `${uidKey()}|${lv}|`;
    const all = await IDB.listPrefix(prefix);
    const map = {};
    Object.entries(all).forEach(([k, v]) => { if (v && v.blob) map[Number(k.slice(prefix.length))] = { ...v, url: URL.createObjectURL(v.blob) }; });
    Object.values(HK.takes[lv] || {}).forEach(t => t && t.url && URL.revokeObjectURL(t.url));
    HK.takes[lv] = map;
  }

  /* ---------- Dữ liệu (Firestore) ---------- */
  async function getDocRetry(id) {
    let snap = null;
    for (let k = 0; k < 3; k++) {
      try { snap = await D().getDoc(D().doc(db(), "hskk", id)); } catch (e) { if (k === 2 || (e.code || "").includes("permission")) throw e; }
      if (snap && snap.exists()) break;
      await new Promise(r => setTimeout(r, 900 * (k + 1)));
    }
    return snap;
  }
  async function loadOpen() {
    if (HK.open) return HK.open;
    HK.loadErr = "";
    try {
      if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
      const snap = await getDocRetry("open");
      if (!snap || !snap.exists()) HK.loadErr = isAdmin() ? "Chưa nạp dữ liệu HSKK. Vào “Lớp học & phân quyền” → tab “📝 Dữ liệu HSKK” để nạp file hskk-data.json." : "Giáo viên chưa nạp đề luyện HSKK. Vui lòng quay lại sau.";
      else HK.open = snap.data();
    } catch (e) { HK.loadErr = errText(e); }
    return HK.open;
  }
  async function loadFull() {
    if (HK.full || !vip()) return HK.full;
    HK.fullErr = "";
    try {
      const snap = await getDocRetry("full");
      if (snap && snap.exists()) HK.full = snap.data().samples || {};
      else HK.fullErr = "Chưa có bộ bài mẫu đầy đủ trên máy chủ.";
    } catch (e) { HK.fullErr = errText(e); }
    return HK.full;
  }
  async function loadSubs() {
    if (HK.subs || HK.subsLoading || !T.user) return;
    HK.subsLoading = true;
    try {
      const snap = await D().getDocs(D().query(D().collection(db(), "submissions"), D().where("uid", "==", T.user.uid), D().limit(200)));
      HK.subs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.hskk)
        .sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
    } catch (e) { HK.subs = []; }
    HK.subsLoading = false;
  }
  const subsOf = (lv, n) => (HK.subs || []).filter(s => s.level === lv && s.qn === n);

  /* ---------- Giọng đọc ---------- */
  const RATES = [{ v: 0.85, t: "Chậm" }, { v: 1.0, t: "Vừa (tự nhiên)" }, { v: 1.12, t: "Nhanh" }];
  let rate = 1.0;
  try { const r = Number(localStorage.getItem("tn_hk_rate")); if (r >= 0.5 && r <= 1.5) rate = r; } catch (e) {}
  function say(text) {
    text = String(text || "").replace(/\n+/g, "");
    if (window.tnVoice) window.tnVoice.speak(text, { rate, pitch: 1.0, pause: 150 });
    else TTS.speak(text, rate);
  }
  function stopAll() { TTS.stop(); if (HK.rec) { HK.rec.cancel(); HK.rec = null; HK.recN = null; } }

  /* ---------- Tiện ích ---------- */
  const hanCount = (s) => (String(s || "").match(/[一-鿿]/g) || []).length;
  const paras = (s) => String(s || "").split(/\n{2,}/).map(p => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("");
  const blank = (s) => esc(s).replace(/……/g, '<span class="hk-blank">……</span>');
  function toTop() { const y = root.getBoundingClientRect().top + window.scrollY - 90; if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" }); }
  /** Nội dung bài mẫu thứ k (0-based) của đề, hoặc null nếu chưa được xem */
  function sampleText(it, k) {
    if (HK.full && HK.full[it.id] && HK.full[it.id][k]) return HK.full[it.id][k];
    if (k === 0 && it.free) return it.free;
    return null;
  }

  /* =================== TRANG CHÍNH =================== */
  function head() {
    return `<div class="tt-head"><span class="tt-stamp">考</span><h3>Luyện khẩu ngữ HSKK</h3></div>
      <p class="tt-desc">Luyện phần <b>trả lời câu hỏi</b> (回答问题) của đề thi HSKK: nghe đề, tự nói và <b>ghi âm</b>, mở <b>cấu trúc gợi ý</b> và <b>bài mẫu</b> để đối chiếu, rồi <b>nộp cho cô</b> nhận xét.</p>`;
  }
  async function render() {
    if (!T.ready) { root.innerHTML = head() + `<div class="tt-empty"><span class="tt-spin"></span></div>`; return; }
    if (!T.user) { stopAll(); HK.lv = null; root.innerHTML = head() + needLoginHtml("luyện đề khẩu ngữ HSKK"); return; }
    if (!can("speakingTasks")) { stopAll(); HK.lv = null; root.innerHTML = head() + lockedHtml("speakingTasks"); return; }
    if (!HK.lv) return renderHub();
    renderLevel();
  }

  async function renderHub() {
    root.innerHTML = head() + `<div class="tt-empty"><span class="tt-spin"></span></div>`;
    await loadOpen();
    if (HK.lv) return;
    if (!HK.open) { root.innerHTML = head() + `<div class="tt-note warn">${esc(HK.loadErr || "Chưa tải được dữ liệu.")}</div>`; return; }
    for (const k of Object.keys(LV_META)) { if (!HK.takes[k]) await loadTakes(k); }
    await loadSubs();
    if (HK.lv) return; // người dùng đã bấm vào 1 trình độ trong lúc chờ
    const L = HK.open.levels || {};
    root.innerHTML = head() + `
      <div class="hk-vip ${vip() ? "on" : ""}">${vip()
        ? `<span class="hk-vip-ico">⭐</span><span><b>Bạn đã được mở toàn bộ bài mẫu HSKK.</b> Mỗi đề có tối đa 3 bài mẫu để so sánh cách diễn đạt.</span>`
        : `<span class="hk-vip-ico">🔓</span><span><b>Miễn phí:</b> toàn bộ đề, cấu trúc gợi ý, ghi âm & nộp bài, và <b>bài mẫu 1</b> của 2 đề đầu mỗi trình độ. Các bài mẫu còn lại dành cho học viên được cô cấp quyền <b>Bài mẫu HSKK (VIP)</b>.</span><button type="button" class="tt-btn peach sm" data-go-myclass>🏫 Nhập mã lớp</button>`}</div>
      <div class="hoc-hub hk-hub">${Object.entries(LV_META).map(([k, m], i) => {
        const items = (L[k] && L[k].items) || [];
        const rec = items.filter(q => (HK.takes[k] || {})[q.n]).length;
        const sub = new Set((HK.subs || []).filter(s => s.level === k).map(s => s.qn)).size;
        return `<button type="button" class="hoc-card focus-ring" data-hklv="${k}" style="--c-bg:${m.bg};--c-ink:${m.ink};--c-line:${m.line};animation-delay:${i * 60}ms">
          <span class="hoc-num">${i + 1}</span>
          <span class="hoc-ico">${m.icon}</span>
          <span class="hoc-title">${esc(m.title)} <span class="tt-hz pv-card-cn">${esc(m.cn)}</span></span>
          <span class="hoc-desc">${esc(m.desc)}</span>
          <span class="hoc-subs"><span>${items.length} đề</span><span>${esc(m.hsk)}</span><span>⏱ ${esc(m.hint)}/đề</span></span>
          <span class="pv-card-prog"><span>🎙️ Đã ghi <b>${rec}</b>/${items.length}</span><span>📤 Đã nộp <b>${sub}</b>/${items.length}</span></span>
          <span class="hoc-go">Vào luyện ›</span></button>`;
      }).join("")}</div>
      <div class="pv-privacy">🔒 <span><b>Quyền riêng tư:</b> bản ghi âm chỉ lưu trên thiết bị này và <b>chỉ bạn nghe được</b>. Giáo viên chỉ nghe những đề bạn bấm <b>“Nộp bài”</b>.</span></div>
      ${isStaff() ? `<p class="tt-small" style="margin-top:.8rem">👩‍🏫 Bài học viên nộp nằm ở <button type="button" class="tt-link" data-go-lophoc>Lớp học & phân quyền</button> → tab “Bài nộp ghi âm” (lọc “📝 HSKK”). Cấp quyền xem đủ bài mẫu: bật “📝 Bài mẫu HSKK (VIP)” cho lớp hoặc từng người.</p>` : ""}`;
    root.querySelectorAll("[data-hklv]").forEach(b => b.addEventListener("click", () => openLevel(b.dataset.hklv)));
  }

  async function openLevel(lv) {
    stopAll();
    HK.lv = lv; HK.tab = "q"; HK.filter = "all"; HK.query = ""; HK.openN = null;
    root.innerHTML = `<div class="tt-empty"><span class="tt-spin"></span> Đang tải đề luyện…</div>`;
    toTop();
    await Promise.all([loadOpen(), loadFull(), loadTakes(lv), loadSubs()]);
    if (HK.lv === lv) renderLevel();
  }

  /* =================== MỘT TRÌNH ĐỘ =================== */
  function renderLevel() {
    const lv = HK.lv, m = LV_META[lv];
    const bar = `<div class="pv-bar">
        <button type="button" class="hoc-back focus-ring" id="hk-back">‹ Luyện HSKK</button>
        <span class="pv-bar-title" style="color:${m.ink}">${m.icon} HSKK ${esc(m.title)} <span class="tt-hz">${esc(m.cn)}</span></span></div>`;
    const L = HK.open && HK.open.levels && HK.open.levels[lv];
    if (!L) { root.innerHTML = bar + `<div class="tt-note warn">${esc(HK.loadErr || "Chưa tải được dữ liệu.")}</div>`; bindBack(); return; }
    const items = L.items || [];
    const takes = HK.takes[lv] || {};
    const subN = new Set((HK.subs || []).filter(s => s.level === lv).map(s => s.qn));
    const unsent = items.filter(q => takes[q.n] && !takes[q.n].sent).length;
    root.innerHTML = bar + `
      <div class="pv-stats">
        <div><b>${items.length}</b><span>đề luyện</span></div>
        <div><b>${items.filter(q => takes[q.n]).length}</b><span>đã ghi âm</span></div>
        <div><b>${subN.size}</b><span>đã nộp</span></div>
        <div><b>${(HK.subs || []).filter(s => s.level === lv && s.status === "reviewed").length}</b><span>có nhận xét</span></div>
      </div>
      ${HK.fullErr && vip() ? `<div class="tt-note warn" style="margin-bottom:.8rem">${esc(HK.fullErr)}</div>` : ""}
      <div class="tt-tabs" style="margin-bottom:1rem">
        <button class="tt-tab ${HK.tab === "q" ? "active" : ""}" data-hktab="q">📋 Đề luyện</button>
        <button class="tt-tab ${HK.tab === "guide" ? "active" : ""}" data-hktab="guide">📘 Hướng dẫn & khung câu</button>
      </div>
      <div id="hk-body" class="tt-fade"></div>`;
    bindBack();
    root.querySelectorAll("[data-hktab]").forEach(b => b.addEventListener("click", () => { stopAll(); HK.tab = b.dataset.hktab; renderLevel(); }));
    if (HK.tab === "guide") renderGuide(); else renderQuestions(items, unsent);
  }
  function bindBack() { $("hk-back")?.addEventListener("click", () => { stopAll(); HK.lv = null; render(); toTop(); }); }

  function renderGuide() {
    const G = (HK.open && HK.open.guide) || {}, lvTitle = LV_META[HK.lv].title;
    const col = { "Sơ cấp": 1, "Trung cấp": 2, "Cao cấp": 3 }[lvTitle] || 1;
    $("hk-body").innerHTML = `
      ${(G.levels || []).length ? `<div class="tt-card"><h4 class="pv-h4">Yêu cầu theo trình độ</h4>
        <div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>Trình độ</th><th>Thời gian nói</th><th>Độ dài bài</th><th>Từ vựng</th><th>Mục tiêu</th></tr></thead><tbody>
        ${G.levels.map(r => `<tr class="${r.lv === lvTitle ? "hk-cur" : ""}"><td><b>${esc(r.lv)}</b></td><td>${esc(r.time)}</td><td>${esc(r.len)}</td><td>${esc(r.words)}</td><td>${esc(r.aim)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${(G.steps || []).length ? `<div class="tt-card"><h4 class="pv-h4">Dàn ý chung “3 bước” — dùng được cho mọi đề</h4>
        <div class="pv-frame hk-frame3">${G.steps.map((s, i) => `<div class="pv-step"><div class="pv-step-a">${i + 1}. ${esc(s.t)}</div><div class="tt-hz pv-step-c">${esc(s.cn)}</div></div>`).join("")}</div></div>` : ""}
      ${(G.frames || []).length ? `<div class="tt-card"><h4 class="pv-h4">Khung trả lời theo dạng đề · <span class="tt-hz">口试表达的通用结构</span></h4>
        <div class="hk-frames">${G.frames.map(f => `<div class="hk-fr"><b>${esc(f.title)}</b> <span class="tt-hz tt-small">${esc(f.cn)}</span>
          <ol class="pv-ol" style="margin-top:.45rem">${f.steps.map(s => `<li><b>${esc(s[0])}:</b> <span class="tt-hz hk-fr-cn">${esc(s[1])}</span></li>`).join("")}</ol></div>`).join("")}</div></div>` : ""}
      ${(G.universal || []).length ? `<div class="tt-card"><h4 class="pv-h4">Khung câu “vạn năng” theo cấp độ</h4>
        <div class="tt-table-wrap"><table class="tt-table hk-uni"><thead><tr><th>Chức năng</th><th class="${col === 1 ? "hk-cur" : ""}">Sơ cấp</th><th class="${col === 2 ? "hk-cur" : ""}">Trung cấp</th><th class="${col === 3 ? "hk-cur" : ""}">Cao cấp</th></tr></thead><tbody>
        ${G.universal.map(r => `<tr><td><b>${esc(r[0])}</b></td>${[1, 2, 3].map(j => `<td class="tt-hz ${col === j ? "hk-cur" : ""}">${esc(r[j])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>` : ""}
      ${(G.connectors || []).length ? `<div class="tt-card"><h4 class="pv-h4">Từ nối linh hoạt · <span class="tt-hz">可灵活使用的连接表达</span></h4>
        <div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>功能</th><th>Chức năng</th><th>中文表达</th></tr></thead><tbody>
        ${G.connectors.map(c => `<tr><td class="tt-hz" style="font-size:15px">${esc(c[0])}</td><td>${esc(c[1])}</td><td class="tt-hz" style="font-size:15px">${esc(c[2])}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${(G.tips || []).length ? `<div class="tt-card"><h4 class="pv-h4">Lưu ý khi luyện</h4><ul class="pv-ul">${G.tips.map(t => `<li>${t}</li>`).join("")}</ul></div>` : ""}`;
  }

  function filtered(items) {
    const q = HK.query.trim().toLowerCase();
    return items.filter(it => (HK.filter === "all" || (HK.filter === "todo" && !(HK.takes[HK.lv] || {})[it.n]) || (HK.filter === "free" && it.free))
      && (!q || [it.q, it.vi, String(it.n)].some(x => String(x || "").toLowerCase().includes(q))));
  }

  function renderQuestions(items, unsent) {
    const body = $("hk-body");
    const list = filtered(items);
    body.innerHTML = `
      <div class="pv-tools">
        <div class="pv-chips">
          <button class="pv-chip ${HK.filter === "all" ? "on" : ""}" data-f="all">Tất cả (${items.length})</button>
          <button class="pv-chip ${HK.filter === "todo" ? "on" : ""}" data-f="todo">Chưa ghi âm</button>
          ${vip() ? "" : `<button class="pv-chip ${HK.filter === "free" ? "on" : ""}" data-f="free">Có bài mẫu miễn phí</button>`}
        </div>
        <div class="tt-row">
          <input class="tt-input" id="hk-q" placeholder="Tìm đề (chữ Hán / tiếng Việt / số đề)…" value="${esc(HK.query)}" style="flex:1;min-width:200px">
          <button class="tt-btn soft" id="hk-rand" title="Bốc ngẫu nhiên 1 đề, máy đọc đề như giám khảo">🎲 Bốc đề thi thử</button>
          <label class="pv-voice">🔊 Tốc độ đọc <select id="hk-rate">${RATES.map(r => `<option value="${r.v}" ${Math.abs(r.v - rate) < 0.01 ? "selected" : ""}>${r.t}</option>`).join("")}</select></label>
          ${unsent ? `<button class="tt-btn peach" id="hk-sendall">📤 Nộp tất cả đề đã ghi (${unsent})</button>` : ""}
        </div>
      </div>
      <div class="pv-list">${list.length ? list.map(qCard).join("") : `<div class="tt-empty">Không có đề nào phù hợp.</div>`}</div>`;
    body.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => { HK.filter = b.dataset.f; renderQuestions(items, unsent); }));
    const qi = $("hk-q");
    qi.addEventListener("input", () => { HK.query = qi.value; clearTimeout(HK.qt); HK.qt = setTimeout(() => { renderQuestions(items, unsent); const i = $("hk-q"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); });
    $("hk-rand").addEventListener("click", () => {
      const pool = filtered(items); if (!pool.length) return;
      const it = pool[Math.floor(Math.random() * pool.length)];
      stopAll(); HK.openN = it.n; renderQuestions(items, unsent);
      const el = body.querySelector(`[data-qn="${it.n}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => say(it.q), 400);
      toast("🎲 Đề " + it.n + " — hãy tự nói trước khi mở gợi ý!");
    });
    $("hk-sendall")?.addEventListener("click", () => sendAll(items));
    $("hk-rate").addEventListener("change", e => {
      rate = Number(e.target.value); try { localStorage.setItem("tn_hk_rate", String(rate)); } catch (err) {}
      const open = items.find(x => x.n === HK.openN); say(open ? open.q : "请你简单介绍一下自己。");
    });
    body.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => {
      const n = Number(b.dataset.toggle); stopAll(); HK.openN = HK.openN === n ? null : n; renderQuestions(items, unsent);
      if (HK.openN) { const el = body.querySelector(`[data-qn="${n}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
    }));
    const open = list.find(it => it.n === HK.openN);
    if (open) bindOpen(items, open);
  }

  function qCard(it) {
    const lv = HK.lv, take = (HK.takes[lv] || {})[it.n], subs = subsOf(lv, it.n), last = subs[0];
    const isOpen = HK.openN === it.n;
    const seen = [...Array(it.nSamples || 0).keys()].filter(k => sampleText(it, k)).length;
    const badges = [
      `<span class="pv-g">🧩 ${(it.patterns || []).length} mẫu câu${(it.phrases || []).length ? ` · ${it.phrases.length} thành ngữ/cụm từ` : ""}</span>`,
      `<span class="pv-g">📝 ${seen}/${it.nSamples} bài mẫu${seen < it.nSamples ? " 🔒" : ""}</span>`,
      take && !take.sent ? `<span class="tt-badge peach">🎙️ đã ghi</span>` : "",
      last ? (last.status === "reviewed" ? `<span class="tt-badge green">✓ có nhận xét${last.score ? " · " + esc(last.score) : ""}</span>` : `<span class="tt-badge">📤 đã nộp</span>`) : "",
    ].join("");
    return `<div class="pv-q hk-q ${isOpen ? "open" : ""}" data-qn="${it.n}" style="--c-ink:${LV_META[lv].ink}">
      <button type="button" class="pv-q-head" data-toggle="${it.n}" aria-expanded="${isOpen}">
        <span class="pv-n">${it.n}</span>
        <span class="pv-q-text"><span class="tt-hz pv-cn">${esc(it.q)}</span><span class="pv-vi">${esc(it.vi || "")}</span>
          <span class="pv-q-meta">${badges}</span></span>
        <span class="pv-caret">${isOpen ? "▴" : "▾"}</span>
      </button>
      ${isOpen ? qBody(it, take, subs) : ""}
    </div>`;
  }

  function samplesHtml(it) {
    const n = it.nSamples || 0;
    const cur = Math.min(HK.smp[it.id] || 0, Math.max(0, n - 1));
    const txt = sampleText(it, cur);
    const tabs = [...Array(n).keys()].map(k => {
      const ok = !!sampleText(it, k);
      return `<button type="button" class="hk-stab ${k === cur ? "on" : ""} ${ok ? "" : "locked"}" data-smp="${k}">${ok ? "" : "🔒 "}Bài mẫu ${k + 1}</button>`;
    }).join("");
    const content = txt
      ? `<div class="tt-hz hk-ans">${paras(txt)}</div>
         <div class="tt-row" style="margin-top:.6rem"><button class="tt-btn ghost sm" data-say-ans>🔊 Nghe đọc mẫu</button><button class="tt-btn ghost sm" data-stop>■ Dừng</button>
         <span class="tt-small">~${hanCount(txt)} chữ · đọc to để luyện ngữ điệu, rồi tự nói lại bằng ý của bạn.</span></div>`
      : `<div class="hk-locked"><div class="ico">🔒</div><b>Bài mẫu ${cur + 1} dành cho học viên được cấp quyền</b>
         <p>${vip() ? esc(HK.fullErr || "Chưa tải được bài mẫu, hãy tải lại trang.") : "Bạn đang xem bản miễn phí. Nhập mã lớp cô gửi, hoặc liên hệ cô Thúy để được mở <b>Bài mẫu HSKK (VIP)</b>."}</p>
         ${vip() ? "" : `<button type="button" class="tt-btn peach sm" data-go-myclass>🏫 Nhập mã lớp</button>`}</div>`;
    return `<div class="hk-stabs">${tabs}</div><div class="hk-sbody">${content}</div>`;
  }

  function qBody(it, take, subs) {
    const items = HK.open.levels[HK.lv].items, idx = items.findIndex(x => x.n === it.n);
    const prev = items[idx - 1], next = items[idx + 1], m = LV_META[HK.lv];
    return `<div class="pv-q-body tt-fade">
      <div class="tt-row" style="margin-bottom:.7rem"><button class="tt-btn ghost sm" data-say-q>🔊 Nghe đề</button>
        <span class="tt-small">⏱ Thời gian nói gợi ý: ${esc(m.hint)}</span></div>
      <p class="pv-tip">💭 Hãy thử tự nói và ghi âm trước, sau đó mới mở cấu trúc & bài mẫu để so sánh.</p>
      <details class="pv-d"><summary>🧩 Cấu trúc gợi ý · <span class="tt-hz">句型提示</span> (${(it.patterns || []).length + (it.phrases || []).length})</summary>
        <div class="pv-d-body">
          ${(it.patterns || []).length ? `<div class="hk-sub-t">Mẫu câu</div><div class="hk-pats">${it.patterns.map(p => `<div class="hk-pat"><div class="tt-hz hk-pat-p">${blank(p.p)}</div><div class="hk-pat-vi">${esc(p.vi)}</div></div>`).join("")}</div>` : ""}
          ${(it.phrases || []).length ? `<div class="hk-sub-t">Thành ngữ · tục ngữ · cụm từ hay</div><div class="hk-phr">${it.phrases.map(p => `<div class="hk-ph"><div class="hk-ph-w"><span class="tt-hz">${esc(p.w)}</span><button class="pv-mini" data-say-w="${esc(p.w.replace(/^[^：:]{1,4}[：:]/, ""))}" title="Nghe">🔊</button></div>${p.py ? `<div class="hk-ph-py">${esc(p.py)}</div>` : ""}<div class="hk-ph-vi">${esc(p.vi)}</div></div>`).join("")}</div>` : ""}
        </div></details>
      <details class="pv-d" data-hk-samples><summary>📝 Bài mẫu · <span class="tt-hz">参考范文</span> (${it.nSamples})</summary>
        <div class="pv-d-body">${samplesHtml(it)}</div></details>

      <div class="pv-rec">
        <div class="tt-row between"><b>🎙️ Bài nói của bạn</b><span class="tt-small">Gợi ý ${esc(m.hint)} · tối đa ${fmtClock(m.maxSec)}</span></div>
        <div class="tt-row" style="margin-top:.6rem">
          <button class="tt-btn rec" id="hk-rec-btn">${take ? "● Ghi lại" : "● Bắt đầu ghi âm"}</button>
          <span class="tt-timer" id="hk-timer"></span>
        </div>
        <div id="hk-take" style="margin-top:.6rem">${takeHtml(take)}</div>
        <p class="pv-lock-note">🔒 Bản ghi chưa nộp chỉ lưu trên thiết bị này — <b>chỉ bạn nghe được</b>. Giáo viên chỉ nghe khi bạn bấm “Nộp bài”.</p>
      </div>

      ${subs.length ? `<div class="pv-subs"><b class="pv-subs-t">📬 Bài đã nộp cho đề này (${subs.length})</b>${subs.slice(0, 5).map(s => `<div class="tt-sub">
          <div class="tt-row between"><span class="tt-small">${fmtTime(s.createdAt)}${s.duration ? " · " + fmtClock(s.duration) : ""}</span>
          ${s.status === "reviewed" ? `<span class="tt-badge green">đã nhận xét${s.score ? " · " + esc(s.score) : ""}</span>` : `<span class="tt-badge">đang chờ nhận xét</span>`}</div>
          ${s.feedback ? `<div class="tt-fb">👩‍🏫 <b>${esc(s.reviewerName || "Giáo viên")}:</b> ${esc(s.feedback)}</div>` : ""}
          <button class="tt-link" data-listen="${s.id}" style="margin-top:.3rem">▶ Nghe bản đã nộp</button><div data-audio-of="${s.id}"></div></div>`).join("")}</div>` : ""}

      <div class="tt-row between pv-nav">
        ${prev ? `<button class="tt-btn ghost sm" data-goto="${prev.n}">‹ Đề ${prev.n}</button>` : "<span></span>"}
        ${next ? `<button class="tt-btn ghost sm" data-goto="${next.n}">Đề ${next.n} ›</button>` : "<span></span>"}
      </div>
    </div>`;
  }
  function takeHtml(take) {
    if (!take) return `<p class="tt-small">Bấm ghi âm, nói xong bấm dừng. Bạn có thể nghe lại và ghi lại nhiều lần.</p>`;
    return `<audio class="tt-audio" controls src="${take.url}" style="width:100%"></audio>
      <div class="tt-row between" style="margin-top:.5rem"><span class="tt-small">Độ dài ${fmtClock(take.duration)}${take.sent ? " · ✓ đã nộp bản này" : ""}</span>
      <div class="tt-row"><button class="tt-btn danger sm" id="hk-del">Xoá bản ghi</button>
      ${take.sent ? "" : `<button class="tt-btn peach" id="hk-submit">📤 Nộp bài</button>`}</div></div>`;
  }

  function bindSamples(box, it) {
    const d = box.querySelector("[data-hk-samples] .pv-d-body"); if (!d) return;
    d.querySelectorAll("[data-smp]").forEach(b => b.addEventListener("click", () => {
      TTS.stop(); HK.smp[it.id] = Number(b.dataset.smp); d.innerHTML = samplesHtml(it); bindSamples(box, it);
    }));
    d.querySelector("[data-say-ans]")?.addEventListener("click", () => say(sampleText(it, HK.smp[it.id] || 0)));
    d.querySelector("[data-stop]")?.addEventListener("click", () => TTS.stop());
  }
  function bindOpen(items, it) {
    const box = root.querySelector(`[data-qn="${it.n}"]`); if (!box) return;
    box.querySelector("[data-say-q]").addEventListener("click", () => say(it.q));
    box.querySelectorAll("[data-say-w]").forEach(b => b.addEventListener("click", () => say(b.dataset.sayW)));
    bindSamples(box, it);
    box.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => {
      stopAll(); HK.openN = Number(b.dataset.goto);
      if (!filtered(items).some(x => x.n === HK.openN)) { HK.filter = "all"; HK.query = ""; }
      renderLevel(); const el = root.querySelector(`[data-qn="${HK.openN}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    box.querySelectorAll("[data-listen]").forEach(b => b.addEventListener("click", () => showSubAudio((HK.subs || []).find(x => x.id === b.dataset.listen), box.querySelector(`[data-audio-of="${b.dataset.listen}"]`))));
    bindTake(items, it);
    const btn = $("hk-rec-btn"), maxSec = LV_META[HK.lv].maxSec;
    const finish = async (r) => {
      if (HK.recN !== it.n) return;
      HK.rec = null; HK.recN = null;
      const v = { blob: r.blob, duration: r.duration, at: Date.now(), sent: false };
      await IDB.put(takeKey(HK.lv, it.n), v);
      const old = (HK.takes[HK.lv] || {})[it.n]; if (old && old.url) URL.revokeObjectURL(old.url);
      (HK.takes[HK.lv] = HK.takes[HK.lv] || {})[it.n] = { ...v, url: r.url };
      refreshOpen(it);
    };
    btn.addEventListener("click", async () => {
      if (HK.rec && HK.recN === it.n) { const r = await HK.rec.stop(); finish(r); return; }
      stopAll();
      try {
        HK.recN = it.n;
        HK.rec = await REC.start({ maxSec, onAutoStop: finish, onTick: s => { const t = $("hk-timer"); if (t) t.textContent = "● " + fmtClock(s) + " / " + fmtClock(maxSec); } });
        btn.classList.add("live"); btn.textContent = "■ Dừng ghi"; $("hk-take").innerHTML = `<p class="tt-small">Đang ghi âm… nói xong bấm “Dừng ghi”.</p>`;
      } catch (e) { HK.recN = null; toast(e.message); }
    });
  }
  function bindTake(items, it) {
    $("hk-del")?.addEventListener("click", async () => {
      if (!confirm("Xoá bản ghi này khỏi thiết bị?")) return;
      await IDB.del(takeKey(HK.lv, it.n));
      const t = (HK.takes[HK.lv] || {})[it.n]; if (t && t.url) URL.revokeObjectURL(t.url);
      delete HK.takes[HK.lv][it.n]; refreshOpen(it);
    });
    $("hk-submit")?.addEventListener("click", async () => {
      const b = $("hk-submit"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…';
      try { await submitOne(it); toast("✅ Đã nộp đề " + it.n + "! Cô sẽ nghe và nhận xét."); refreshOpen(it); }
      catch (e) { toast(errText(e)); b.disabled = false; b.textContent = "📤 Nộp bài"; }
    });
  }
  /** Vẽ lại đề đang mở, giữ nguyên các mục đang mở */
  function refreshOpen(it) {
    const box = root.querySelector(`[data-qn="${it.n}"]`);
    const openD = box ? [...box.querySelectorAll("details")].map(d => d.open) : [];
    const y = window.scrollY;
    renderLevel();
    const nb = root.querySelector(`[data-qn="${it.n}"]`);
    if (nb) nb.querySelectorAll("details").forEach((d, i) => { if (openD[i]) d.open = true; });
    window.scrollTo({ top: y });
  }

  async function submitOne(it) {
    const lv = HK.lv, take = (HK.takes[lv] || {})[it.n]; if (!take) throw new Error("Chưa có bản ghi.");
    if (!T.user) throw new Error("Hãy đăng nhập để nộp bài.");
    const dataUrl = await blobToDataURL(take.blob);
    if (dataUrl.length > 950000) throw new Error("Bản ghi quá dài. Hãy nói ngắn gọn hơn rồi ghi lại.");
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    const m = LV_META[lv];
    const ref = D().doc(D().collection(db(), "submissions"));
    await D().setDoc(D().doc(db(), "submissionAudio", ref.id), { uid: T.user.uid, audio: dataUrl, createdAt: D().serverTimestamp() });
    // type "speaking" (cùng quyền Khẩu ngữ) + hskk: true để giáo viên lọc riêng
    const doc = {
      type: "speaking", hskk: true, level: lv, qn: it.n, taskId: `hskk-${lv}-${it.n}`,
      taskTitle: `HSKK ${m.title} · Đề ${it.n}: ${it.q}`.slice(0, 300),
      uid: T.user.uid, name: myName(), email: T.user.email || "", classIds: (T.profile && T.profile.classIds) || [],
      duration: Math.round(take.duration), status: "submitted", createdAt: D().serverTimestamp(),
    };
    await D().setDoc(ref, doc);
    take.sent = true;
    await IDB.put(takeKey(lv, it.n), { blob: take.blob, duration: take.duration, at: take.at, sent: true });
    HK.subs = [{ id: ref.id, ...doc, createdAt: null }, ...(HK.subs || [])];
    if (window.trackStudyActivity) window.trackStudyActivity();
    api.invalidateMySubs && api.invalidateMySubs();
  }
  async function sendAll(items) {
    const list = items.filter(it => { const t = (HK.takes[HK.lv] || {})[it.n]; return t && !t.sent; });
    if (!list.length || !confirm(`Nộp ${list.length} đề đã ghi âm cho giáo viên?`)) return;
    const b = $("hk-sendall"); if (b) { b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…'; }
    let ok = 0;
    for (const it of list) {
      try { await submitOne(it); ok++; if (b) b.innerHTML = `<span class="tt-spin"></span> Đã nộp ${ok}/${list.length}…`; }
      catch (e) { toast(`Đề ${it.n}: ${errText(e)}`); }
    }
    toast(`✅ Đã nộp ${ok}/${list.length} đề.`);
    renderLevel();
  }

  /* =================== ADMIN: nạp dữ liệu =================== */
  window.tnHskkAdmin = async function (el) {
    if (!isAdmin()) { el.innerHTML = `<div class="tt-note warn">Chỉ quản trị viên mới nạp được dữ liệu.</div>`; return; }
    el.innerHTML = `<div class="tt-card"><b>Nạp đề luyện khẩu ngữ HSKK</b>
      <ol class="tt-small" style="margin:.5rem 0 .8rem 1.1rem;list-style:decimal;line-height:1.8">
        <li>Chọn file <b>hskk-data.json</b> (41 đề: sơ cấp 8 · trung cấp 16 · cao cấp 17; cấu trúc đã gộp + 3 bộ bài mẫu).</li>
        <li>Bấm <b>Nạp lên máy chủ</b>. <b>Không</b> tải file này lên GitHub — để bài mẫu chỉ người được cấp quyền mới xem được.</li>
        <li>Muốn sửa nội dung: nhờ Claude sửa file JSON rồi nạp lại (ghi đè, không ảnh hưởng bài đã nộp).</li></ol>
      <div id="hkd-now" class="tt-small" style="margin-bottom:.6rem"><span class="tt-spin"></span></div>
      <input type="file" accept=".json,application/json" id="hkd-file" class="tt-input" style="width:100%">
      <div class="tt-row" style="justify-content:flex-end;margin-top:.6rem"><button class="tt-btn peach" id="hkd-go" disabled>⤒ Nạp lên máy chủ</button></div>
      <div id="hkd-log" style="margin-top:.7rem"></div></div>`;
    (async () => {
      const now = $("hkd-now");
      try {
        const [o, f] = await Promise.all(["open", "full"].map(k => D().getDoc(D().doc(db(), "hskk", k))));
        const lvls = o.exists() ? Object.entries(o.data().levels || {}).map(([k, v]) => `${LV_META[k] ? LV_META[k].title : k}: ${(v.items || []).length} đề`).join(" · ") : "chưa nạp";
        if (now) now.innerHTML = `Trên máy chủ hiện có — ${esc(lvls)} · bài mẫu đầy đủ: ${f.exists() ? "✓ " + Object.keys(f.data().samples || {}).length + " đề" : "✗ chưa nạp"}`;
      } catch (e) { if (now) now.textContent = errText(e); }
    })();
    let pkg = null;
    $("hkd-file").addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        pkg = JSON.parse(await f.text());
        if (pkg.kind !== "tndihoc-hskk" || !pkg.open || !pkg.full) throw new Error("File không đúng định dạng hskk-data.json");
        $("hkd-log").innerHTML = `<div class="tt-note ok">Đã đọc: ${Object.entries(pkg.open.levels).map(([k, v]) => `${esc(v.title)} (${v.items.length} đề)`).join(" · ")} · ${Object.values(pkg.full.samples).reduce((a, s) => a + s.length, 0)} bài mẫu</div>`;
        $("hkd-go").disabled = false;
      } catch (err) { pkg = null; $("hkd-log").innerHTML = `<div class="tt-note err">${esc(err.message)}</div>`; }
    });
    $("hkd-go").addEventListener("click", async () => {
      if (!pkg) return;
      const btn = $("hkd-go"); btn.disabled = true;
      try {
        $("hkd-log").innerHTML = `<div class="tt-note">Đang nạp đề + cấu trúc…</div>`;
        await D().setDoc(D().doc(db(), "hskk", "open"), { ...pkg.open, version: pkg.version || 1, updatedAt: D().serverTimestamp() });
        $("hkd-log").innerHTML = `<div class="tt-note">Đang nạp bộ bài mẫu đầy đủ…</div>`;
        await D().setDoc(D().doc(db(), "hskk", "full"), { ...pkg.full, version: pkg.version || 1, updatedAt: D().serverTimestamp() });
        HK.open = null; HK.full = null;
        $("hkd-log").innerHTML = `<div class="tt-note ok">🎉 Xong! Mở Học tiếng Trung → Khẩu ngữ → “📝 Luyện HSKK” để kiểm tra.</div>`;
        render();
      } catch (e) { $("hkd-log").innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; btn.disabled = false; }
    });
  };

  /* ---------- Theo dõi đăng nhập / quyền ---------- */
  onState(() => {
    HK.subs = null; HK.takes = {};
    if (!T.user) { HK.open = null; HK.lv = null; }
    if (!vip()) HK.full = null;
    render();
  });
  // Rời khỏi mục (bấm sang tab/thẻ khác) → dừng ghi âm & giọng đọc
  document.addEventListener("click", e => {
    if (e.target.closest("[data-hoc-back],[data-hoc-part],[data-nav-btn],[data-go-home],.nav-jump")) stopAll();
  });
  render();
}

if (window.tnApi) start(window.tnApi);
else document.addEventListener("tn-api-ready", () => start(window.tnApi), { once: true });
