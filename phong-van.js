/* =====================================================================
   TRAINING PHỎNG VẤN (VIP) — tndihoc
   ---------------------------------------------------------------------
   • 2 bộ câu hỏi: Các ngành xã hội (25 câu) · Các ngành kinh tế (45 câu)
   • Mỗi câu: ý chính cần có, câu trả lời mẫu (参考答案), mẫu câu (常用句型), lưu ý
   • Ghi âm câu trả lời → nghe lại. Bản ghi CHƯA nộp chỉ lưu trên máy học viên
     (IndexedDB), không gửi lên máy chủ → chỉ học viên nghe được.
   • Bấm "Nộp bài" → lưu vào submissions/submissionAudio → giáo viên nghe & nhận xét
     ở trang "Lớp học & phân quyền" → tab "Bài nộp ghi âm".
   • Quyền: can_access_interview (tính năng VIP, admin cấp theo lớp hoặc từng người).
   • Nội dung câu hỏi nằm trong Firestore (interview/xh, interview/kt) — luật Firestore
     chỉ cho người có quyền đọc. Admin nạp file phong-van-data.json ở tab "🎤 Dữ liệu phỏng vấn".
   Cần tải file này lên GitHub cùng thư mục với index.html (sau tinh-nang-moi.js).
   ===================================================================== */

const SETS_META = {
  xh: { title: "Các ngành xã hội", cn: "人文社科类", icon: "🏛️", n: 25, bg: "#FFF1E3", ink: "#C2570C", line: "#FBD3AE",
    desc: "Giáo dục, Ngôn ngữ, Văn hoá, Giáo dục Hán ngữ quốc tế… — 25 câu hỏi thường gặp.", tags: ["Bản thân & động lực", "Nghiên cứu", "Văn hoá", "AI & chuyển ngành"] },
  kt: { title: "Các ngành kinh tế", cn: "经济类", icon: "📈", n: 45, bg: "#EAF3FF", ink: "#2E5AAC", line: "#CFE0FA",
    desc: "Kinh tế, Tài chính, Thương mại quốc tế — 45 câu tổng hợp từ review phỏng vấn thực tế (ZJU, SUFE, BUAA, BNU…).", tags: ["8 nhóm câu hỏi", "Kiến thức chuyên ngành", "Có câu hỏi tiếng Anh"] },
};
const MAX_SEC = 150; // tối đa 2 phút 30 giây / câu

function start(api) {
  const { T, can, isStaff, isAdmin, myName, fbReady, db, D, REC, TTS, toast, errText, esc, fmtClock, fmtTime, blobToDataURL, lockedHtml, onState, showSubAudio } = api;
  const $ = (id) => document.getElementById(id);
  const root = $("pv-root"); if (!root) return;

  const PV = { data: {}, loadErr: {}, set: null, tab: "q", group: "all", query: "", openN: null, takes: {}, rec: null, recN: null, subs: null, subsLoading: false };

  /* ---------- Lưu bản ghi nháp trên máy (IndexedDB) — không gửi đi đâu ---------- */
  const IDB = {
    _db: null,
    open() {
      if (this._db) return Promise.resolve(this._db);
      return new Promise((res) => {
        try {
          const r = indexedDB.open("tndihoc-phongvan", 1);
          r.onupgradeneeded = () => r.result.createObjectStore("takes");
          r.onsuccess = () => { this._db = r.result; res(this._db); };
          r.onerror = () => res(null);
        } catch (e) { res(null); }
      });
    },
    async run(mode, fn) {
      const d = await this.open(); if (!d) return null;
      return new Promise((res) => {
        try { const tx = d.transaction("takes", mode); const out = fn(tx.objectStore("takes")); tx.oncomplete = () => res(out && "result" in out ? out.result : true); tx.onerror = () => res(null); }
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
  const takeKey = (set, n) => `${uidKey()}|${set}|${n}`;
  async function loadTakes(set) {
    const prefix = `${uidKey()}|${set}|`;
    const all = await IDB.listPrefix(prefix);
    const map = {};
    Object.entries(all).forEach(([k, v]) => { if (v && v.blob) map[Number(k.slice(prefix.length))] = { ...v, url: URL.createObjectURL(v.blob) }; });
    Object.values(PV.takes[set] || {}).forEach(t => t && t.url && URL.revokeObjectURL(t.url));
    PV.takes[set] = map;
  }

  /* ---------- Dữ liệu câu hỏi (Firestore, chỉ người có quyền mới đọc được) ---------- */
  async function loadSet(set) {
    if (PV.data[set]) return PV.data[set];
    PV.loadErr[set] = "";
    try {
      if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
      let snap = null;
      for (let k = 0; k < 3; k++) {
        try { snap = await D().getDoc(D().doc(db(), "interview", set)); } catch (e) { if (k === 2) throw e; }
        if (snap && snap.exists()) break;
        await new Promise(r => setTimeout(r, 1000 * (k + 1)));
      }
      if (!snap || !snap.exists()) PV.loadErr[set] = isAdmin() ? "Chưa nạp bộ câu hỏi. Vào “Lớp học & phân quyền” → tab “🎤 Dữ liệu phỏng vấn” để nạp file phong-van-data.json." : "Giáo viên chưa nạp bộ câu hỏi. Vui lòng quay lại sau.";
      else PV.data[set] = snap.data();
    } catch (e) { PV.loadErr[set] = errText(e); }
    return PV.data[set];
  }
  async function loadSubs() {
    if (PV.subs || PV.subsLoading || !T.user) return;
    PV.subsLoading = true;
    try {
      const snap = await D().getDocs(D().query(D().collection(db(), "submissions"), D().where("uid", "==", T.user.uid), D().limit(200)));
      PV.subs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.type === "interview")
        .sort((a, b) => ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0));
    } catch (e) { PV.subs = []; }
    PV.subsLoading = false;
  }
  const subsOf = (set, n) => (PV.subs || []).filter(s => s.set === set && s.qn === n);

  /* ---------- Tiện ích hiển thị ---------- */
  const hl = (s) => esc(s).replace(/【([^】]*)】/g, '<mark class="pv-fill">【$1】</mark>').replace(/\n/g, "<br>");
  const plain = (s) => String(s || "").replace(/[【】]/g, "").replace(/（如果听不懂：.*?）/g, "");
  const isEnglish = (s) => !/[一-鿿]/.test(s.replace(/（.*?）/g, ""));
  function say(text) {
    text = plain(text);
    if (isEnglish(text) && "speechSynthesis" in window) {
      TTS.stop(); const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find(x => /^en[-_]US/i.test(x.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u); return;
    }
    TTS.speak(text, 0.85);
  }
  function stopAll() { TTS.stop(); if (PV.rec) { PV.rec.cancel(); PV.rec = null; PV.recN = null; } }

  /* =================== TRANG CHÍNH =================== */
  async function render() {
    const head = `<div class="pv-hero">
        <div><p class="pv-kicker">Du học Trung Quốc · <span class="tt-badge vip">VIP</span></p>
        <h1 class="pv-h1">Training phỏng vấn</h1>
        <p class="pv-lead">Luyện trả lời phỏng vấn học bổng / xét tuyển bằng tiếng Trung: xem <b>ý chính</b>, <b>câu trả lời mẫu</b> và <b>mẫu câu</b>, rồi <b>ghi âm</b> câu trả lời của bạn để nghe lại. Bấm <b>Nộp bài</b> khi muốn cô nhận xét.</p></div>
        <span class="pv-seal tt-hz">面试</span></div>`;
    if (!T.ready) { root.innerHTML = head + `<div class="tt-empty"><span class="tt-spin"></span></div>`; return; }
    if (!can("interview")) { stopAll(); PV.set = null; root.innerHTML = head + lockedHtml("interview"); return; }
    if (!PV.set) return renderHub(head);
    renderSet();
  }

  async function renderHub(head) {
    const prog = {};
    for (const k of Object.keys(SETS_META)) { if (!PV.takes[k]) await loadTakes(k); }
    await loadSubs();
    Object.keys(SETS_META).forEach(k => {
      const sub = new Set((PV.subs || []).filter(s => s.set === k).map(s => s.qn));
      prog[k] = { rec: Object.keys(PV.takes[k] || {}).length, sub: sub.size };
    });
    if (PV.set) return; // người dùng đã bấm vào 1 bộ trong lúc chờ
    root.innerHTML = head + `<div class="hoc-hub pv-hub">${Object.entries(SETS_META).map(([k, m], i) => `
      <button type="button" class="hoc-card focus-ring" data-pvset="${k}" style="--c-bg:${m.bg};--c-ink:${m.ink};--c-line:${m.line};animation-delay:${i * 60}ms">
        <span class="hoc-num">${i + 1}</span>
        <span class="hoc-ico">${m.icon}</span>
        <span class="hoc-title">${esc(m.title)} <span class="tt-hz pv-card-cn">${esc(m.cn)}</span></span>
        <span class="hoc-desc">${esc(m.desc)}</span>
        <span class="hoc-subs">${m.tags.map(t => `<span>${esc(t)}</span>`).join("")}</span>
        <span class="pv-card-prog"><span>🎙️ Đã ghi <b>${prog[k].rec}</b>/${m.n}</span><span>📤 Đã nộp <b>${prog[k].sub}</b>/${m.n}</span></span>
        <span class="hoc-go">Vào luyện ›</span>
      </button>`).join("")}</div>
      <div class="pv-privacy">🔒 <span><b>Quyền riêng tư:</b> bản ghi âm của bạn chỉ lưu trên thiết bị này và <b>chỉ bạn nghe được</b>. Giáo viên chỉ nghe được những câu bạn bấm <b>“Nộp bài”</b>.</span></div>
      ${isStaff() ? `<p class="tt-small" style="margin-top:.8rem">👩‍🏫 Bài học viên nộp nằm ở <button type="button" class="tt-link" data-go-lophoc>Lớp học & phân quyền</button> → tab “Bài nộp ghi âm” (lọc “🎤 Phỏng vấn”). Cấp quyền: bật “🎤 Training phỏng vấn (VIP)” cho lớp hoặc từng người.</p>` : ""}`;
    root.querySelectorAll("[data-pvset]").forEach(b => b.addEventListener("click", () => openSet(b.dataset.pvset)));
  }

  async function openSet(set) {
    stopAll();
    PV.set = set; PV.tab = "q"; PV.group = "all"; PV.query = ""; PV.openN = null;
    root.innerHTML = `<div class="tt-empty"><span class="tt-spin"></span> Đang tải bộ câu hỏi…</div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    await Promise.all([loadSet(set), loadTakes(set), loadSubs()]);
    if (PV.set === set) renderSet();
  }

  /* =================== MỘT BỘ CÂU HỎI =================== */
  function renderSet() {
    const set = PV.set, m = SETS_META[set], S = PV.data[set];
    const bar = `<div class="pv-bar" style="--c-ink:${m.ink}">
        <button type="button" class="hoc-back focus-ring" id="pv-back">‹ Training phỏng vấn</button>
        <span class="pv-bar-title" style="color:${m.ink}">${m.icon} ${esc(m.title)} <span class="tt-hz">${esc(m.cn)}</span></span></div>`;
    if (!S) { root.innerHTML = bar + `<div class="tt-note warn">${esc(PV.loadErr[set] || "Chưa tải được dữ liệu.")}</div>`; bindBack(); return; }
    const items = S.items || [];
    const takes = PV.takes[set] || {};
    const subN = new Set((PV.subs || []).filter(s => s.set === set).map(s => s.qn));
    const recCount = items.filter(q => takes[q.n]).length;
    const unsent = items.filter(q => takes[q.n] && !takes[q.n].sent).length;
    root.innerHTML = bar + `
      <div class="pv-stats">
        <div><b>${items.length}</b><span>câu hỏi</span></div>
        <div><b>${recCount}</b><span>đã ghi âm</span></div>
        <div><b>${subN.size}</b><span>đã nộp</span></div>
        <div><b>${(PV.subs || []).filter(s => s.set === set && s.status === "reviewed").length}</b><span>có nhận xét</span></div>
      </div>
      <div class="tt-tabs" style="margin-bottom:1rem">
        <button class="tt-tab ${PV.tab === "q" ? "active" : ""}" data-pvtab="q">📋 Bộ câu hỏi</button>
        <button class="tt-tab ${PV.tab === "guide" ? "active" : ""}" data-pvtab="guide">📘 Hướng dẫn & mẹo</button>
      </div>
      <div id="pv-body" class="tt-fade"></div>`;
    bindBack();
    root.querySelectorAll("[data-pvtab]").forEach(b => b.addEventListener("click", () => { stopAll(); PV.tab = b.dataset.pvtab; renderSet(); }));
    if (PV.tab === "guide") renderGuide(S); else renderQuestions(S, unsent);
  }
  function bindBack() { $("pv-back")?.addEventListener("click", () => { stopAll(); PV.set = null; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }); }

  function renderGuide(S) {
    const body = $("pv-body");
    let chk = {}; try { chk = JSON.parse(localStorage.getItem("tn_pv_check") || "{}"); } catch (e) {}
    const ck = chk[PV.set] || {};
    body.innerHTML = `
      ${(S.guide || []).length ? `<div class="tt-card"><h4 class="pv-h4">Cách dùng bộ câu hỏi</h4><ol class="pv-ol">${S.guide.map(g => `<li>${hl(g)}</li>`).join("")}</ol></div>` : ""}
      ${(S.frame || []).length ? `<div class="tt-card"><h4 class="pv-h4">Khung trả lời chung · <span class="tt-hz">回答的通用结构</span></h4>
        <div class="pv-frame">${S.frame.map(f => `<div class="pv-step"><div class="tt-hz pv-step-a">${esc(f.a)}</div><div class="pv-step-b">${esc(f.b)}</div><div class="tt-hz pv-step-c">${esc(f.c)}</div></div>`).join("")}</div></div>` : ""}
      ${(S.tips || []).length ? `<div class="tt-card"><h4 class="pv-h4">Kinh nghiệm rút ra từ các bài review</h4><ul class="pv-ul">${S.tips.map(t => `<li>${hl(t)}</li>`).join("")}</ul></div>` : ""}
      ${(S.connectors || []).length ? `<div class="tt-card"><h4 class="pv-h4">Phụ lục · <span class="tt-hz">常用连接表达</span></h4>
        <div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>功能</th><th>Chức năng</th><th>中文表达</th></tr></thead><tbody>
        ${S.connectors.map(c => `<tr><td class="tt-hz" style="font-size:15px">${esc(c.a)}</td><td>${esc(c.b)}</td><td class="tt-hz" style="font-size:15px">${esc(c.c)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${(S.checklist || []).length ? `<div class="tt-card"><h4 class="pv-h4">Checklist trước buổi phỏng vấn</h4>
        ${S.checklist.map((c, i) => `<label class="pv-check"><input type="checkbox" data-ck="${i}" ${ck[i] ? "checked" : ""}><span>${hl(c)}</span></label>`).join("")}</div>` : ""}`;
    body.querySelectorAll("[data-ck]").forEach(i => i.addEventListener("change", () => {
      ck[i.dataset.ck] = i.checked; chk[PV.set] = ck;
      try { localStorage.setItem("tn_pv_check", JSON.stringify(chk)); } catch (e) {}
    }));
  }

  function filtered(S) {
    const q = PV.query.trim().toLowerCase();
    return (S.items || []).filter(it => (PV.group === "all" || it.group === PV.group || (PV.group === "todo" && !(PV.takes[PV.set] || {})[it.n]))
      && (!q || [it.q, it.vi, it.orig, String(it.n)].some(x => String(x || "").toLowerCase().includes(q))));
  }

  function renderQuestions(S, unsent) {
    const body = $("pv-body");
    const groups = S.groups || [];
    const list = filtered(S);
    body.innerHTML = `
      <div class="pv-tools">
        <div class="pv-chips">
          <button class="pv-chip ${PV.group === "all" ? "on" : ""}" data-g="all">Tất cả</button>
          ${groups.map(g => `<button class="pv-chip ${PV.group === g.id ? "on" : ""}" data-g="${esc(g.id)}">${esc(g.id)}. ${esc(g.name)}</button>`).join("")}
          <button class="pv-chip ${PV.group === "todo" ? "on" : ""}" data-g="todo">Chưa ghi âm</button>
        </div>
        <div class="tt-row">
          <input class="tt-input" id="pv-q" placeholder="Tìm câu hỏi (chữ Hán / tiếng Việt / số câu)…" value="${esc(PV.query)}" style="flex:1;min-width:200px">
          <button class="tt-btn soft" id="pv-rand" title="Bốc ngẫu nhiên 1 câu, máy đọc câu hỏi như hội đồng">🎲 Phỏng vấn thử</button>
          ${unsent ? `<button class="tt-btn peach" id="pv-sendall">📤 Nộp tất cả câu đã ghi (${unsent})</button>` : ""}
        </div>
      </div>
      <div class="pv-list">${list.length ? list.map(it => qCard(it, groups)).join("") : `<div class="tt-empty">Không có câu nào phù hợp.</div>`}</div>`;
    body.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { PV.group = b.dataset.g; renderQuestions(S, unsent); }));
    const qi = $("pv-q");
    qi.addEventListener("input", () => { PV.query = qi.value; clearTimeout(PV.qt); PV.qt = setTimeout(() => { renderQuestions(S, unsent); const i = $("pv-q"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); });
    $("pv-rand").addEventListener("click", () => {
      const pool = filtered(S); if (!pool.length) return;
      const it = pool[Math.floor(Math.random() * pool.length)];
      stopAll(); PV.openN = it.n; renderQuestions(S, unsent);
      const el = body.querySelector(`[data-qn="${it.n}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => say(it.q), 400);
      toast("🎲 Câu " + it.n + " — hãy tự trả lời trước khi mở gợi ý!");
    });
    $("pv-sendall")?.addEventListener("click", () => sendAll(S));
    body.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => {
      const n = Number(b.dataset.toggle); stopAll(); PV.openN = PV.openN === n ? null : n; renderQuestions(S, unsent);
      if (PV.openN) { const el = body.querySelector(`[data-qn="${n}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
    }));
    const open = list.find(it => it.n === PV.openN);
    if (open) bindOpen(S, open);
  }

  function qCard(it, groups) {
    const set = PV.set, take = (PV.takes[set] || {})[it.n], subs = subsOf(set, it.n), last = subs[0];
    const isOpen = PV.openN === it.n;
    const g = groups.find(x => x.id === it.group);
    const badges = [
      take && !take.sent ? `<span class="tt-badge peach">🎙️ đã ghi</span>` : "",
      last ? (last.status === "reviewed" ? `<span class="tt-badge green">✓ có nhận xét${last.score ? " · " + esc(last.score) : ""}</span>` : `<span class="tt-badge">📤 đã nộp</span>`) : "",
    ].join("");
    return `<div class="pv-q ${isOpen ? "open" : ""}" data-qn="${it.n}">
      <button type="button" class="pv-q-head" data-toggle="${it.n}" aria-expanded="${isOpen}">
        <span class="pv-n">${it.n}</span>
        <span class="pv-q-text"><span class="tt-hz pv-cn">${esc(it.q)}</span><span class="pv-vi">${esc(it.vi || "")}</span>
          <span class="pv-q-meta">${g ? `<span class="pv-g">${esc(g.id)} · ${esc(g.name)}</span>` : ""}${badges}</span></span>
        <span class="pv-caret">${isOpen ? "▴" : "▾"}</span>
      </button>
      ${isOpen ? qBody(it, take, subs) : ""}
    </div>`;
  }

  function qBody(it, take, subs) {
    const S = PV.data[PV.set], items = S.items, idx = items.findIndex(x => x.n === it.n);
    const prev = items[idx - 1], next = items[idx + 1];
    return `<div class="pv-q-body tt-fade">
      <div class="tt-row" style="margin-bottom:.7rem">
        <button class="tt-btn ghost sm" data-say-q>🔊 Nghe câu hỏi</button>
        ${it.orig ? `<span class="tt-small pv-orig">🗂️ Câu hỏi gốc: ${esc(it.orig)}</span>` : ""}
      </div>
      <p class="pv-tip">💭 Hãy thử tự trả lời trước, sau đó mới mở gợi ý bên dưới để so sánh.</p>
      <details class="pv-d"><summary>💡 Ý chính cần có</summary><div class="pv-d-body pv-key">${hl(it.key)}</div></details>
      <details class="pv-d"><summary>📝 Câu trả lời mẫu · <span class="tt-hz">参考答案</span></summary>
        <div class="pv-d-body"><div class="${isEnglish(it.answer) ? "pv-ans en" : "tt-hz pv-ans"}">${hl(it.answer)}</div>
        <div class="tt-row" style="margin-top:.6rem"><button class="tt-btn ghost sm" data-say-ans>🔊 Nghe đọc mẫu</button><button class="tt-btn ghost sm" data-stop>■ Dừng</button>
        <span class="tt-small">Phần <mark class="pv-fill">【 】</mark> là thông tin cá nhân — thay bằng thông tin thật của bạn.</span></div></div></details>
      <details class="pv-d"><summary>🧩 Mẫu câu hay dùng · <span class="tt-hz">常用句型</span> (${(it.patterns || []).length})</summary>
        <div class="pv-d-body"><div class="pv-pats">${(it.patterns || []).map((p, i) => `<div class="pv-pat">
          <div class="${isEnglish(p.p) ? "pv-pat-p en" : "tt-hz pv-pat-p"}">${esc(p.p)}</div>
          <div class="pv-pat-use">${esc(p.use)}</div>
          <div class="pv-pat-ex"><span class="${isEnglish(p.ex) ? "" : "tt-hz"}">${esc(p.ex)}</span><button class="pv-mini" data-say-ex="${i}" title="Nghe ví dụ">🔊</button></div></div>`).join("")}</div></div></details>
      ${it.note ? `<div class="tt-note warn" style="margin-top:.7rem">⚠️ <b>Lưu ý:</b> ${hl(it.note)}</div>` : ""}

      <div class="pv-rec">
        <div class="tt-row between"><b>🎙️ Câu trả lời của bạn</b><span class="tt-small">Gợi ý 30–60 giây · tối đa ${fmtClock(MAX_SEC)}</span></div>
        <div class="tt-row" style="margin-top:.6rem">
          <button class="tt-btn rec" id="pv-rec-btn">${take ? "● Ghi lại" : "● Bắt đầu ghi âm"}</button>
          <span class="tt-timer" id="pv-timer"></span>
        </div>
        <div id="pv-take" style="margin-top:.6rem">${takeHtml(take)}</div>
        <p class="pv-lock-note">🔒 Bản ghi chưa nộp chỉ lưu trên thiết bị này — <b>chỉ bạn nghe được</b>. Giáo viên chỉ nghe khi bạn bấm “Nộp bài”.</p>
      </div>

      ${subs.length ? `<div class="pv-subs"><b class="pv-subs-t">📬 Bài đã nộp cho câu này (${subs.length})</b>${subs.slice(0, 5).map(s => `<div class="tt-sub">
          <div class="tt-row between"><span class="tt-small">${fmtTime(s.createdAt)}${s.duration ? " · " + fmtClock(s.duration) : ""}</span>
          ${s.status === "reviewed" ? `<span class="tt-badge green">đã nhận xét${s.score ? " · " + esc(s.score) : ""}</span>` : `<span class="tt-badge">đang chờ nhận xét</span>`}</div>
          ${s.feedback ? `<div class="tt-fb">👩‍🏫 <b>${esc(s.reviewerName || "Giáo viên")}:</b> ${esc(s.feedback)}</div>` : ""}
          <button class="tt-link" data-listen="${s.id}" style="margin-top:.3rem">▶ Nghe bản đã nộp</button><div data-audio-of="${s.id}"></div></div>`).join("")}</div>` : ""}

      <div class="tt-row between pv-nav">
        ${prev ? `<button class="tt-btn ghost sm" data-goto="${prev.n}">‹ Câu ${prev.n}</button>` : "<span></span>"}
        ${next ? `<button class="tt-btn ghost sm" data-goto="${next.n}">Câu ${next.n} ›</button>` : "<span></span>"}
      </div>
    </div>`;
  }
  function takeHtml(take) {
    if (!take) return `<p class="tt-small">Bấm ghi âm, nói xong bấm dừng. Bạn có thể nghe lại và ghi lại nhiều lần.</p>`;
    return `<audio class="tt-audio" controls src="${take.url}" style="width:100%"></audio>
      <div class="tt-row between" style="margin-top:.5rem"><span class="tt-small">Độ dài ${fmtClock(take.duration)}${take.sent ? " · ✓ đã nộp bản này" : ""}</span>
      <div class="tt-row"><button class="tt-btn danger sm" id="pv-del">Xoá bản ghi</button>
      ${take.sent ? "" : `<button class="tt-btn peach" id="pv-submit">📤 Nộp bài</button>`}</div></div>`;
  }

  function bindOpen(S, it) {
    const box = root.querySelector(`[data-qn="${it.n}"]`); if (!box) return;
    box.querySelector("[data-say-q]").addEventListener("click", () => say(it.q));
    box.querySelector("[data-say-ans]")?.addEventListener("click", () => say(it.answer));
    box.querySelector("[data-stop]")?.addEventListener("click", () => TTS.stop());
    box.querySelectorAll("[data-say-ex]").forEach(b => b.addEventListener("click", () => say(it.patterns[Number(b.dataset.sayEx)].ex)));
    box.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => {
      stopAll(); PV.openN = Number(b.dataset.goto);
      if (!filtered(S).some(x => x.n === PV.openN)) { PV.group = "all"; PV.query = ""; }
      renderSet(); const el = root.querySelector(`[data-qn="${PV.openN}"]`); el && el.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    box.querySelectorAll("[data-listen]").forEach(b => b.addEventListener("click", () => showSubAudio((PV.subs || []).find(x => x.id === b.dataset.listen), box.querySelector(`[data-audio-of="${b.dataset.listen}"]`))));
    bindTake(S, it);
    const btn = $("pv-rec-btn");
    const finish = async (r) => {
      if (PV.recN !== it.n) return;
      PV.rec = null; PV.recN = null;
      const v = { blob: r.blob, duration: r.duration, at: Date.now(), sent: false };
      await IDB.put(takeKey(PV.set, it.n), v);
      const old = (PV.takes[PV.set] || {})[it.n]; if (old && old.url) URL.revokeObjectURL(old.url);
      (PV.takes[PV.set] = PV.takes[PV.set] || {})[it.n] = { ...v, url: r.url };
      refreshOpen(S, it);
    };
    btn.addEventListener("click", async () => {
      if (PV.rec && PV.recN === it.n) { const r = await PV.rec.stop(); finish(r); return; }
      stopAll();
      try {
        PV.recN = it.n;
        PV.rec = await REC.start({ maxSec: MAX_SEC, onAutoStop: finish, onTick: s => { const t = $("pv-timer"); if (t) t.textContent = "● " + fmtClock(s) + " / " + fmtClock(MAX_SEC); } });
        btn.classList.add("live"); btn.textContent = "■ Dừng ghi"; $("pv-take").innerHTML = `<p class="tt-small">Đang ghi âm… nói xong bấm “Dừng ghi”.</p>`;
      } catch (e) { PV.recN = null; toast(e.message); }
    });
  }
  function bindTake(S, it) {
    $("pv-del")?.addEventListener("click", async () => {
      if (!confirm("Xoá bản ghi này khỏi thiết bị?")) return;
      await IDB.del(takeKey(PV.set, it.n));
      const t = (PV.takes[PV.set] || {})[it.n]; if (t && t.url) URL.revokeObjectURL(t.url);
      delete PV.takes[PV.set][it.n]; refreshOpen(S, it);
    });
    $("pv-submit")?.addEventListener("click", async () => {
      const b = $("pv-submit"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…';
      try { await submitOne(S, it); toast("✅ Đã nộp câu " + it.n + "! Cô sẽ nghe và nhận xét."); refreshOpen(S, it); }
      catch (e) { toast(errText(e)); b.disabled = false; b.textContent = "📤 Nộp bài"; }
    });
  }
  /** Vẽ lại câu đang mở (giữ nguyên các mục gợi ý đang mở) */
  function refreshOpen(S, it) {
    const box = root.querySelector(`[data-qn="${it.n}"]`);
    const openD = box ? [...box.querySelectorAll("details")].map(d => d.open) : [];
    const y = window.scrollY;
    renderSet();
    const nb = root.querySelector(`[data-qn="${it.n}"]`);
    if (nb) nb.querySelectorAll("details").forEach((d, i) => { if (openD[i]) d.open = true; });
    window.scrollTo({ top: y });
  }

  async function submitOne(S, it) {
    const take = (PV.takes[PV.set] || {})[it.n]; if (!take) throw new Error("Chưa có bản ghi.");
    if (!T.user) throw new Error("Hãy đăng nhập để nộp bài.");
    const dataUrl = await blobToDataURL(take.blob);
    if (dataUrl.length > 950000) throw new Error("Bản ghi quá dài. Hãy trả lời ngắn gọn hơn (dưới 2 phút) rồi ghi lại.");
    if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
    const m = SETS_META[PV.set];
    const ref = D().doc(D().collection(db(), "submissions"));
    await D().setDoc(D().doc(db(), "submissionAudio", ref.id), { uid: T.user.uid, clips: { 0: dataUrl }, createdAt: D().serverTimestamp() });
    const doc = {
      type: "interview", set: PV.set, qn: it.n, taskId: `pv-${PV.set}-${it.n}`,
      taskTitle: `Phỏng vấn · ${m.title} · Câu ${it.n}: ${it.q}`.slice(0, 300),
      lines: [{ role: String(it.n), cn: it.q }],
      uid: T.user.uid, name: myName(), email: T.user.email || "", classIds: (T.profile && T.profile.classIds) || [],
      duration: Math.round(take.duration), status: "submitted", createdAt: D().serverTimestamp(),
    };
    await D().setDoc(ref, doc);
    take.sent = true;
    await IDB.put(takeKey(PV.set, it.n), { blob: take.blob, duration: take.duration, at: take.at, sent: true });
    PV.subs = [{ id: ref.id, ...doc, createdAt: null }, ...(PV.subs || [])];
    if (window.trackStudyActivity) window.trackStudyActivity();
    api.invalidateMySubs && api.invalidateMySubs();
  }
  async function sendAll(S) {
    const list = (S.items || []).filter(it => { const t = (PV.takes[PV.set] || {})[it.n]; return t && !t.sent; });
    if (!list.length) return;
    if (!confirm(`Nộp ${list.length} câu đã ghi âm cho giáo viên?`)) return;
    const b = $("pv-sendall"); if (b) { b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…'; }
    let ok = 0;
    for (const it of list) {
      try { await submitOne(S, it); ok++; if (b) b.innerHTML = `<span class="tt-spin"></span> Đã nộp ${ok}/${list.length}…`; }
      catch (e) { toast(`Câu ${it.n}: ${errText(e)}`); }
    }
    toast(`✅ Đã nộp ${ok}/${list.length} câu.`);
    renderSet();
  }

  /* =================== ADMIN: nạp bộ câu hỏi =================== */
  window.tnInterviewAdmin = async function (el) {
    if (!isAdmin()) { el.innerHTML = `<div class="tt-note warn">Chỉ quản trị viên mới nạp được dữ liệu.</div>`; return; }
    el.innerHTML = `<div class="tt-card"><b>Nạp bộ câu hỏi Training phỏng vấn</b>
      <ol class="tt-small" style="margin:.5rem 0 .8rem 1.1rem;list-style:decimal;line-height:1.8">
        <li>Chọn file <b>phong-van-data.json</b> (Claude đã chuẩn bị từ 2 file Word: 25 câu ngành xã hội + 45 câu ngành kinh tế).</li>
        <li>Bấm <b>Nạp lên máy chủ</b> (vài giây). <b>Không</b> tải file này lên GitHub — để chỉ tài khoản được cấp quyền VIP mới xem được.</li>
        <li>Muốn sửa nội dung sau này: nhờ Claude sửa file JSON rồi nạp lại (ghi đè bản cũ, không ảnh hưởng bài đã nộp).</li></ol>
      <div id="pvd-now" class="tt-small" style="margin-bottom:.6rem"><span class="tt-spin"></span></div>
      <input type="file" accept=".json,application/json" id="pvd-file" class="tt-input" style="width:100%">
      <div class="tt-row" style="justify-content:flex-end;margin-top:.6rem"><button class="tt-btn peach" id="pvd-go" disabled>⤒ Nạp lên máy chủ</button></div>
      <div id="pvd-log" style="margin-top:.7rem"></div></div>`;
    (async () => {
      const now = $("pvd-now"); const parts = [];
      for (const k of Object.keys(SETS_META)) {
        try { const s = await D().getDoc(D().doc(db(), "interview", k)); parts.push(s.exists() ? `✓ ${SETS_META[k].title}: ${(s.data().items || []).length} câu` : `✗ ${SETS_META[k].title}: chưa nạp`); }
        catch (e) { parts.push(`${SETS_META[k].title}: ${errText(e)}`); }
      }
      if (now) now.innerHTML = "Trên máy chủ hiện có — " + parts.map(esc).join(" · ");
    })();
    let pkg = null;
    $("pvd-file").addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        pkg = JSON.parse(await f.text());
        if (pkg.kind !== "tndihoc-interview" || !pkg.sets) throw new Error("File không đúng định dạng phong-van-data.json");
        $("pvd-log").innerHTML = `<div class="tt-note ok">Đã đọc: ${Object.values(pkg.sets).map(s => `${esc(s.title)} (${s.items.length} câu)`).join(" · ")}</div>`;
        $("pvd-go").disabled = false;
      } catch (err) { pkg = null; $("pvd-log").innerHTML = `<div class="tt-note err">${esc(err.message)}</div>`; }
    });
    $("pvd-go").addEventListener("click", async () => {
      if (!pkg) return;
      const btn = $("pvd-go"); btn.disabled = true;
      try {
        for (const [k, s] of Object.entries(pkg.sets)) {
          $("pvd-log").innerHTML = `<div class="tt-note">Đang nạp “${esc(s.title)}”…</div>`;
          await D().setDoc(D().doc(db(), "interview", k), { ...s, version: pkg.version || 1, updatedAt: D().serverTimestamp() });
        }
        PV.data = {};
        $("pvd-log").innerHTML = `<div class="tt-note ok">🎉 Xong! Mở mục “Training phỏng vấn” để kiểm tra.</div>`;
        render();
      } catch (e) { $("pvd-log").innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; btn.disabled = false; }
    });
  };

  /* ---------- Theo dõi đăng nhập / quyền ---------- */
  onState(() => {
    PV.subs = null; PV.takes = {};
    if (!can("interview")) { PV.data = {}; PV.set = null; }
    render();
  });
  // Rời trang phỏng vấn → dừng ghi âm / giọng đọc
  window.addEventListener("hashchange", () => { if (location.hash !== "#phongvan") stopAll(); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-nav-btn],[data-go-home]"); if (b && b.dataset.target !== "phongvan") stopAll(); });
  render();
}

if (window.tnApi) start(window.tnApi);
else document.addEventListener("tn-api-ready", () => start(window.tnApi), { once: true });
