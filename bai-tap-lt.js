/* =====================================================================
   BÀI TẬP 练习册 (贯通中文 — Sách bài tập 1) — tndihoc
   Vị trí: Học tiếng Trung → Lớp học của tôi → tab “📝 Bài tập 练习册”.
   • Học viên: chọn bài → làm 24 câu (Nghe 12 + Đọc 12) → bấm “Nộp bài” → mới thấy đáp án, điểm và văn bản nghe.
   • Giáo viên / admin: xem danh sách bài nộp (ai nộp, điểm, số lần), bấm “Xem bài” để xem từng câu học viên chọn.
   • Dữ liệu (Firestore):
       workbook/index, workbook/L{n}, workbook/L{n}-a{1..4}  — đề, ảnh, đáp án, audio (admin nạp ở khung “Nạp dữ liệu”)
       workbookSubs/{uid}_L{n}                               — bài nộp của học viên
   • Quyền xem đề: cùng quyền “Hội thoại 贯通中文 (VIP)”. Luật Firestore: xem file luat-firestore-bai-tap-lt.txt.
   ===================================================================== */

const KEY = "tn_wb_v2";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } };
const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };

const CSS = `
#tt-workbook .wb-grid{display:grid;gap:.9rem;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-top:1rem}
#tt-workbook .wb-lcard{text-align:left;background:#fff;border:1px solid var(--t2,#FFCB94);border-radius:1rem;padding:1rem 1.1rem;cursor:pointer;transition:translate .15s,box-shadow .15s}
#tt-workbook .wb-lcard:hover{translate:0 -3px;box-shadow:0 8px 20px -10px rgba(179,86,0,.45)}
#tt-workbook .wb-no{font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--t5,#B35600)}
#tt-workbook .wb-zh{font-family:KaiTi,"Kaiti SC",STKaiti,"Noto Serif SC",serif;font-size:1.5rem;line-height:1.3;color:#222}
#tt-workbook .wb-sub{font-size:13px;color:#555}
#tt-workbook .wb-bar{height:6px;border-radius:99px;background:var(--t1,#FFE6CC);overflow:hidden;margin-top:.6rem}
#tt-workbook .wb-bar i{display:block;height:100%;background:var(--t4,#F08A24)}
#tt-workbook .wb-top{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:space-between;margin-bottom:1rem}
#tt-workbook .wb-part{background:#fff;border:1px solid var(--t2,#FFCB94);border-radius:1rem;padding:1.1rem 1.2rem;margin-top:1rem}
#tt-workbook .wb-part h4{font-size:1rem;font-weight:700;color:#222;margin:0}
#tt-workbook .wb-part .wb-vi{font-size:13px;color:#666;margin:.15rem 0 .7rem}
#tt-workbook .wb-sk{display:inline-block;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;background:var(--t1,#FFE6CC);color:var(--t5,#B35600);margin-bottom:.4rem}
#tt-workbook .wb-ex{font-size:13px;color:#777;margin-bottom:.6rem}
#tt-workbook .wb-bank{display:grid;gap:.6rem;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin:.4rem 0 1rem}
#tt-workbook .wb-bank figure{margin:0;position:relative}
#tt-workbook .wb-bank img,#tt-workbook .wb-opt img{width:100%;display:block;border-radius:.6rem;border:1px solid #ddd}
#tt-workbook .wb-bank b{position:absolute;left:6px;top:6px;background:#fff;border:1px solid #999;border-radius:4px;padding:0 6px;font-size:13px}
#tt-workbook .wb-q{padding:.9rem 0;border-top:1px dashed #e6e6e6}
#tt-workbook .wb-q:first-of-type{border-top:0}
#tt-workbook .wb-qrow{display:flex;gap:.5rem;align-items:flex-end;flex-wrap:wrap}
#tt-workbook .wb-qn{font-weight:700;color:var(--t5,#B35600);min-width:1.6rem;font-size:1.2rem;line-height:1.3;margin-bottom:.15em}
#tt-workbook .wb-p{font-size:1.2rem;line-height:1.3;font-family:KaiTi,"Kaiti SC",STKaiti,"Noto Serif SC",serif}
#tt-workbook .wb-p.qq{margin-left:2.1rem;display:block}
#tt-workbook .rc{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;margin:0 .02em .15em}
#tt-workbook .rc i{font-style:normal;font-size:.5em;line-height:1.35;min-height:1.35em;color:#8a8a8a;font-family:"Be Vietnam Pro","Times New Roman",serif;white-space:nowrap;padding:0 .08em}
#tt-workbook .rc b{font-weight:400;line-height:1.25}
#tt-workbook.nopy .rc i{display:none}
#tt-workbook .wb-opts{display:flex;flex-wrap:wrap;gap:.5rem;margin:.5rem 0 0 2.1rem}
#tt-workbook .wb-opts.col{flex-direction:column;align-items:stretch}
#tt-workbook .wb-opt{display:inline-flex;align-items:flex-end;gap:.45rem;border:1.5px solid #ddd;background:#fff;border-radius:.7rem;padding:.35rem .8rem;cursor:pointer;text-align:left;font-size:1.1rem;font-family:KaiTi,"Kaiti SC",STKaiti,"Noto Serif SC",serif;line-height:1.3;color:#222;transition:background .12s,border-color .12s}
#tt-workbook .wb-opt:disabled{color:#222;opacity:1}
#tt-workbook .wb-opt:hover{border-color:var(--t4,#F08A24)}
#tt-workbook .wb-opt.sel{background:var(--t1,#FFE6CC);border-color:var(--t4,#F08A24)}
#tt-workbook .wb-opt.pic{display:block;width:min(200px,30%);min-width:120px;padding:4px}
#tt-workbook .wb-opt .wb-k{font-family:"Be Vietnam Pro","Times New Roman",serif;font-weight:700;color:var(--t5,#B35600);font-size:1rem;line-height:1.3;margin-bottom:.15em}
#tt-workbook .wb-opt.ok{background:#E3F5EA;border-color:#2E9E5B}
#tt-workbook .wb-opt.bad{background:#FDE6E3;border-color:#D2634B}
#tt-workbook .wb-opt.miss{border-color:#2E9E5B;border-style:dashed}
#tt-workbook .wb-opt.fix{cursor:default}
#tt-workbook .wb-fb{margin:.5rem 0 0 2.1rem;font-size:13px;color:#444;background:#FAFAF7;border-radius:.6rem;padding:.4rem .7rem}
#tt-workbook .wb-fb b{color:#2E7D4F}
#tt-workbook .wb-score{background:var(--t0,#FFF6EC);border:1px solid var(--t3,#FFA95A);border-radius:1rem;padding:1rem 1.2rem;margin-top:1rem}
#tt-workbook .wb-score big{font-size:1.9rem;font-weight:800;color:var(--t5,#B35600)}
#tt-workbook .wb-sbar{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:space-between}
#tt-workbook .wb-ban{background:#FFF1DD;border:1px solid #F5C98F;border-radius:.8rem;padding:.6rem .9rem;font-size:13.5px;margin-top:.8rem}
#tt-workbook audio{width:100%;margin:.2rem 0 .8rem}
#tt-workbook .wb-can{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between;padding:.5rem 0;border-top:1px dashed #e6e6e6}
#tt-workbook .wb-star{background:none;border:0;font-size:1.5rem;color:#ccc;cursor:pointer;padding:0 2px}
#tt-workbook .wb-star.on{color:#F5A623}
#tt-workbook .wb-admin{border:1.5px dashed var(--t3,#FFA95A);border-radius:1rem;padding:1rem 1.2rem;margin-top:1rem;background:#fff}
#tt-workbook .wb-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:.6rem}
#tt-workbook .wb-tbl th,#tt-workbook .wb-tbl td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid #eee}
#tt-workbook .wb-tbl-wrap{overflow-x:auto}
`;

function start(api) {
  const { T, can, isAdmin, isStaff, myName, fbReady, db, D, toast, errText, esc, onState, lockedHtml, needLoginHtml, fmtTime } = api;
  const root = document.getElementById("tt-workbook");
  if (!root) return;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const W = { index: null, lessons: {}, audio: {}, err: "", busy: false, cur: null, prog: load(), py: true,
    review: null, confirm: false, subs: null, subsBusy: false, saving: false };
  const keyOf = (p, q) => `${p}.${q}`;
  const rec = (no) => (W.prog[no] = W.prog[no] || { a: {}, done: false, ok: 0, attempts: 0, can: {} });
  const persist = () => save(W.prog);
  const uid = () => (T.user && T.user.uid) || "";
  const answersOf = (no) => W.review ? (W.review.answers || {}) : rec(no).a;
  const isChecked = (no) => !!W.review || rec(no).done;

  /* ---------- Chữ + pinyin thẳng hàng (ruby) ---------- */
  function rb(t, py) {
    return Array.from(t).map((c, i) => /\s/.test(c) ? " " : `<span class="rc"><i>${py && py[i] ? esc(py[i]) : ""}</i><b>${esc(c)}</b></span>`).join("");
  }

  /* ---------- Máy chủ ---------- */
  async function fetchDoc(id, col) {
    const fb = await fbReady(); if (!fb) throw new Error("Không kết nối được máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.");
    const snap = await D().getDoc(D().doc(db(), col || "workbook", id));
    if (!snap.exists()) { const e = new Error("Dữ liệu này chưa được nạp lên máy chủ. (Admin: nạp ở khung “Nạp dữ liệu” bên dưới.)"); e.missing = true; throw e; }
    return snap.data();
  }
  const permMsg = (e) => ((e && e.code) || "").includes("permission") ? "Tài khoản chưa có quyền, hoặc luật Firestore cho “workbook” / “workbookSubs” chưa được cập nhật." : (e && e.message) || "Có lỗi xảy ra.";

  async function loadIndex() {
    if (W.index || W.busy) return;
    W.busy = true; W.err = ""; draw();
    try { W.index = JSON.parse((await fetchDoc("index")).json); } catch (e) { W.err = permMsg(e); }
    W.busy = false; draw();
  }
  async function openLesson(no) {
    W.cur = no; W.review = null; W.confirm = false; draw();
    W.busy = true; W.err = ""; draw();
    try {
      if (!W.lessons[no]) W.lessons[no] = JSON.parse((await fetchDoc("L" + no)).json);
      // khôi phục bài đã nộp (đổi máy / xoá dữ liệu trình duyệt)
      if (!rec(no).done) {
        try {
          const s = await fetchDoc(`${uid()}_L${no}`, "workbookSubs");
          const r = rec(no); r.a = s.answers || {}; r.done = true; r.ok = s.ok; r.attempts = s.attempts || 1; persist();
        } catch (e) { /* chưa nộp lần nào */ }
      }
    } catch (e) { W.err = permMsg(e); }
    W.busy = false; draw();
  }
  async function loadAudio(no, a, btn) {
    const k = `L${no}-a${a}`;
    if (btn) { btn.disabled = true; btn.textContent = "Đang tải audio…"; }
    try { W.audio[k] = (await fetchDoc(k)).data; } catch (e) { toast(permMsg(e)); }
    draw();
  }

  /* ---------- Chấm điểm / Nộp bài ---------- */
  function score(L, a) {
    let ok = 0, total = 0; const per = {};
    L.parts.forEach(p => { per[p.id] = { ok: 0, n: p.qs.length }; p.qs.forEach(q => { total++; if (a[keyOf(p.id, q.n)] === q.ans) { ok++; per[p.id].ok++; } }); });
    return { ok, total, per };
  }
  async function submit() {
    const L = W.lessons[W.cur]; const r = rec(L.no); const s = score(L, r.a);
    W.saving = true; draw();
    try {
      await fbReady();
      const per = {}; Object.keys(s.per).forEach(k => per[k] = s.per[k].ok);
      await D().setDoc(D().doc(db(), "workbookSubs", `${uid()}_L${L.no}`), {
        uid: uid(), name: myName(), email: (T.user && T.user.email) || "", lesson: L.no, answers: r.a,
        ok: s.ok, total: s.total, per, attempts: (r.attempts || 0) + 1, submittedAt: D().serverTimestamp(),
      });
      r.done = true; r.ok = s.ok; r.attempts = (r.attempts || 0) + 1; persist(); W.confirm = false;
      toast("✅ Đã nộp bài. Cô giáo có thể xem bài của bạn.");
    } catch (e) { toast("❌ Chưa nộp được: " + permMsg(e)); }
    W.saving = false; draw();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function loadSubs() {
    W.subsBusy = true; draw();
    try {
      await fbReady();
      const snap = await D().getDocs(D().collection(db(), "workbookSubs"));
      W.subs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ((b.submittedAt && b.submittedAt.seconds) || 0) - ((a.submittedAt && a.submittedAt.seconds) || 0));
    } catch (e) { W.err = permMsg(e); W.subs = []; }
    W.subsBusy = false; draw();
  }

  /* ---------- Vẽ ---------- */
  const head = (title, extra) => `<div class="wb-top"><div><h3 style="font-size:1.25rem;font-weight:800;margin:0">${title}</h3></div><div>${extra || ""}</div></div>`;
  const pyBox = () => `<label style="font-size:13px"><input type="checkbox" id="wb-py" ${W.py ? "checked" : ""}> Hiện pinyin</label>`;

  function subsBox() {
    if (!isStaff()) return "";
    let body = `<button class="tt-btn peach sm" id="wb-loadsubs">${W.subs ? "↻ Làm mới" : "Xem bài nộp"}</button>`;
    if (W.subsBusy) body = `<span class="tt-spin"></span>`;
    else if (W.subs) body += W.subs.length ? `<div class="wb-tbl-wrap"><table class="wb-tbl"><thead><tr><th>Học viên</th><th>Bài</th><th>Điểm</th><th>Lần nộp</th><th>Thời gian</th><th></th></tr></thead><tbody>${W.subs.map((s, i) =>
      `<tr><td>${esc(s.name || "")}<div class="wb-sub">${esc(s.email || "")}</div></td><td>${s.lesson}</td><td><b>${s.ok}/${s.total}</b></td><td>${s.attempts || 1}</td><td>${fmtTime(s.submittedAt)}</td><td><button class="tt-btn ghost sm" data-wb-view="${i}">Xem bài</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="wb-sub" style="margin-top:.6rem">Chưa có học viên nào nộp bài.</p>`;
    return `<div class="wb-admin"><b>📥 Bài nộp của học viên</b><div style="margin-top:.5rem">${body}</div></div>`;
  }
  function adminBox() {
    return `<div class="wb-admin"><b>⬆️ Nạp dữ liệu (chỉ admin)</b>
      <p style="font-size:13px;color:#555;margin:.3rem 0 .6rem">Chọn file <code>bai-tap-lt-package.json</code> → <b>Nạp lên máy chủ</b>. Nạp lại cùng file = cập nhật; bài mới được thêm vào danh sách, bài cũ giữ nguyên.</p>
      <input type="file" id="wb-file" accept=".json,application/json"> <button class="tt-btn peach" id="wb-up">Nạp lên máy chủ</button>
      <div id="wb-upmsg" style="font-size:13px;margin-top:.5rem"></div></div>`;
  }
  function drawHome() {
    const list = W.index || [];
    return head("📝 Bài tập 练习册 — 《贯通中文》Sách bài tập 1", pyBox()) +
      `<p style="font-size:14px;color:#555;margin:0 0 .3rem">Làm bài theo từng bài học rồi bấm <b>Nộp bài</b>. Sau khi nộp, bạn xem được đáp án, điểm và văn bản nghe; cô giáo cũng xem được bài của bạn. Dạng đề giống HSK 3.0: Nghe 12 câu + Đọc 12 câu.</p>` +
      (W.err ? `<div class="tt-note err" style="margin:.8rem 0">${esc(W.err)} <button class="tt-link" id="wb-retry">Thử lại</button></div>` : "") +
      (W.busy && !W.index ? `<div class="tt-empty"><span class="tt-spin"></span></div>` : "") +
      `<div class="wb-grid">${list.map(l => {
        const r = W.prog[l.no]; const n = r ? Object.keys(r.a || {}).length : 0;
        return `<button type="button" class="wb-lcard" data-wb-open="${l.no}">
          <div class="wb-no">BÀI ${l.no} · ${l.n} CÂU</div><div class="wb-zh">${esc(l.zh)}</div><div class="wb-sub">${esc(l.vi)}</div>
          <div class="wb-bar"><i style="width:${r && r.done ? 100 : Math.round(n / l.n * 100)}%"></i></div>
          <div class="wb-sub" style="margin-top:.35rem">${r && r.done ? `✅ Đã nộp · <b>${r.ok}/${l.n}</b> câu đúng` : n ? `Đang làm ${n}/${l.n} câu` : "Chưa làm"}</div></button>`; }).join("")}</div>` +
      subsBox() + (isAdmin() ? adminBox() : "");
  }

  const optHtml = (o, sel, q, checked) => {
    let cls = "wb-opt" + (o.img ? " pic" : "") + (sel === o.k ? " sel" : "");
    if (checked) {
      cls += " fix";
      if (o.k === q.ans) cls += sel === o.k ? " ok" : " miss";
      else if (sel === o.k) cls += " bad";
    }
    const L = W.lessons[W.cur];
    const body = o.img ? `<span class="wb-k">${o.k}</span><img alt="${o.k}" loading="lazy" src="${L.imgs[o.img]}">` :
      `<span class="wb-k">${o.k}</span>${o.t ? `<span>${rb(o.t, o.py)}</span>` : ""}`;
    return `<button type="button" class="${cls}" data-k="${o.k}" ${checked ? "disabled" : ""}>${body}</button>`;
  };
  function qHtml(L, p, q, a, checked) {
    const sel = a[keyOf(p.id, q.n)];
    const opts = q.opts || (p.banktext ? p.banktext : p.bank.map(b => ({ k: b.k })));
    let fb = "";
    if (checked) {
      const right = sel === q.ans;
      fb = `<div class="wb-fb">${right ? "✅ Đúng" : sel ? "❌ Chưa đúng" : "⚪ Chưa chọn"} — đáp án: <b>${q.ans}</b>${q.tr ? `<br>🎧 Văn bản nghe: ${esc(q.tr)}` : ""}</div>`;
    }
    const long = opts.some(o => o.t && Array.from(o.t).length > 9);
    return `<div class="wb-q" data-q="${q.n}" data-p="${p.id}">
      <div class="wb-qrow"><span class="wb-qn">${q.n}.</span>${q.p ? `<span class="wb-p">${rb(q.p, q.py)}</span>` : ""}</div>
      ${q.q ? `<div class="wb-p qq">${rb(q.q, q.qpy)}</div>` : ""}
      <div class="wb-opts ${long ? "col" : ""}">${opts.map(o => optHtml(o, sel, q, checked)).join("")}</div>${fb}</div>`;
  }
  function partHtml(L, p, a, checked) {
    const au = p.audio ? `L${L.no}-a${p.audio}` : null;
    return `<section class="wb-part"><span class="wb-sk">${p.skill === "listen" ? "🎧 NGHE" : "📖 ĐỌC"}</span>
      <h4>${esc(p.zh)}</h4><div class="wb-vi">${esc(p.vi)}</div>
      ${p.ex ? `<div class="wb-ex">${esc(p.ex)}</div>` : ""}
      ${au ? (W.audio[au] ? `<audio controls preload="none" src="${W.audio[au]}"></audio>` : `<button type="button" class="tt-btn soft" data-wb-audio="${p.audio}">🔊 Tải & nghe audio phần này</button><div style="height:.7rem"></div>`) : ""}
      ${p.bank ? `<div class="wb-bank">${p.bank.map(b => `<figure><b>${b.k}</b><img loading="lazy" alt="${b.k}" src="${L.imgs[b.img]}"></figure>`).join("")}</div>` : ""}
      ${p.qs.map(q => qHtml(L, p, q, a, checked)).join("")}</section>`;
  }
  function drawLesson() {
    const L = W.lessons[W.cur];
    const back = `<button type="button" class="tt-btn ghost sm" id="wb-back">‹ ${W.review ? "Danh sách bài nộp" : "Danh sách bài"}</button>`;
    if (!L) return head(`Bài ${W.cur}`, back) + (W.err ? `<div class="tt-note err">${esc(W.err)} <button class="tt-link" data-wb-open="${W.cur}">Thử lại</button></div>` : `<div class="tt-empty"><span class="tt-spin"></span></div>`);
    const checked = isChecked(L.no); const a = answersOf(L.no); const r = rec(L.no);
    const total = L.parts.reduce((s, p) => s + p.qs.length, 0), n = Object.keys(a).length;
    let top = "";
    if (W.review) top = `<div class="wb-ban">👩‍🏫 Bài nộp của <b>${esc(W.review.name || "")}</b> · lần ${W.review.attempts || 1} · ${fmtTime(W.review.submittedAt)}</div>`;
    if (checked) {
      const s = score(L, a);
      top += `<div class="wb-score"><big>${s.ok}/${s.total}</big> câu đúng · ${Math.round(s.ok / s.total * 100)}%
        <div style="font-size:13px;margin-top:.4rem;color:#555">${L.parts.map(p => `${p.skill === "listen" ? "🎧" : "📖"} Phần ${p.id.slice(1)}: ${s.per[p.id].ok}/${s.per[p.id].n}`).join(" · ")}</div>
        ${W.review ? "" : `<div style="margin-top:.7rem"><button class="tt-btn ghost" id="wb-redo">↻ Làm lại (nộp lần mới)</button></div>`}</div>`;
    }
    let foot = "";
    if (!checked) {
      foot = `<div class="wb-score"><div class="wb-sbar"><span>Đã chọn <b id="wb-n">${n}/${total}</b> câu</span>
        <button class="tt-btn peach" id="wb-submit" ${W.saving ? "disabled" : ""}>${W.saving ? "Đang nộp…" : "📤 Nộp bài"}</button></div>
        ${W.confirm ? `<div class="wb-ban">Bạn còn <b>${total - n}</b> câu chưa chọn. Nộp bài luôn?<div style="margin-top:.5rem;display:flex;gap:.5rem"><button class="tt-btn peach sm" id="wb-yes">Nộp luôn</button><button class="tt-btn ghost sm" id="wb-no">Làm tiếp</button></div></div>` : ""}
        <div class="wb-sub" style="margin-top:.5rem">Nộp xong bạn mới xem được đáp án.</div></div>`;
    }
    const can3 = W.review ? "" : `<section class="wb-part"><h4>⭐ 学习评价 Tự đánh giá</h4><div class="wb-vi">Chọn số sao cho từng mục (3 sao = làm tốt)</div>
      ${(L.can || []).map((t, i) => `<div class="wb-can"><span class="wb-p" style="font-size:1.05rem">${i + 1}. ${esc(t)}</span><span>${[1, 2, 3].map(s => `<button type="button" class="wb-star ${(r.can[i] || 0) >= s ? "on" : ""}" data-wb-star="${i}:${s}">★</button>`).join("")}</span></div>`).join("")}</section>`;
    return head(`Bài ${L.no} · <span class="wb-zh" style="font-size:1.4rem">${esc(L.zh)}</span> <span style="font-weight:500;font-size:.9rem;color:#666">${esc(L.vi)}</span>`,
      `${back} <span style="margin-left:.6rem">${pyBox()}</span>`) + top + L.parts.map(p => partHtml(L, p, a, checked)).join("") + foot + can3;
  }
  function draw() {
    root.classList.toggle("nopy", !W.py);
    if (!T.user) { root.innerHTML = needLoginHtml("làm bài tập sách bài tập 贯通中文"); return; }
    if (!can("vipDialogue")) { root.innerHTML = lockedHtml("vipDialogue"); return; }
    if (!W.index && !W.busy && !W.err) loadIndex();
    root.innerHTML = W.cur ? drawLesson() : drawHome();
  }

  /* ---------- Sự kiện ---------- */
  root.addEventListener("click", async (e) => {
    const t = e.target;
    const op = t.closest("[data-wb-open]"); if (op) return openLesson(Number(op.dataset.wbOpen));
    if (t.closest("#wb-back")) { const wasReview = !!W.review; W.cur = null; W.review = null; W.err = ""; W.confirm = false; draw(); if (wasReview) root.scrollIntoView({ behavior: "smooth" }); return; }
    if (t.closest("#wb-retry")) { W.err = ""; W.index = null; return loadIndex(); }
    if (t.closest("#wb-loadsubs")) return loadSubs();
    const vw = t.closest("[data-wb-view]");
    if (vw) { const s = W.subs[Number(vw.dataset.wbView)]; W.review = s; W.cur = s.lesson; if (!W.lessons[s.lesson]) { W.busy = true; W.err = ""; draw(); try { W.lessons[s.lesson] = JSON.parse((await fetchDoc("L" + s.lesson)).json); } catch (er) { W.err = permMsg(er); } W.busy = false; } draw(); root.scrollIntoView({ behavior: "smooth" }); return; }
    const au = t.closest("[data-wb-audio]"); if (au) return loadAudio(W.cur, au.dataset.wbAudio, au);
    const sb = t.closest("[data-wb-star]"); if (sb) { const [i, s] = sb.dataset.wbStar.split(":").map(Number); const r = rec(W.cur); r.can[i] = r.can[i] === s ? s - 1 : s; persist(); return draw(); }
    const ob = t.closest(".wb-opt");
    if (ob && W.cur && !isChecked(W.cur)) {
      const qe = ob.closest(".wb-q"); const L = W.lessons[W.cur];
      const r = rec(L.no); r.a[keyOf(qe.dataset.p, qe.dataset.q)] = ob.dataset.k; persist();
      qe.querySelectorAll(".wb-opt").forEach(b => b.classList.toggle("sel", b === ob));
      const total = L.parts.reduce((s, p) => s + p.qs.length, 0);
      const nEl = document.getElementById("wb-n"); if (nEl) nEl.textContent = Object.keys(r.a).length + "/" + total;
      return;
    }
    if (t.closest("#wb-submit")) {
      const L = W.lessons[W.cur]; const total = L.parts.reduce((s, p) => s + p.qs.length, 0);
      if (Object.keys(rec(L.no).a).length < total) { W.confirm = true; draw(); return; }
      return submit();
    }
    if (t.closest("#wb-yes")) return submit();
    if (t.closest("#wb-no")) { W.confirm = false; return draw(); }
    if (t.closest("#wb-redo")) { const r = rec(W.cur); r.a = {}; r.done = false; persist(); draw(); root.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.closest("#wb-up")) return upload();
  });
  root.addEventListener("change", (e) => { if (e.target.id === "wb-py") { W.py = e.target.checked; root.classList.toggle("nopy", !W.py); root.querySelectorAll("#wb-py").forEach(c => c.checked = W.py); } });

  /* ---------- Admin nạp dữ liệu ---------- */
  async function upload() {
    const f = document.getElementById("wb-file").files[0]; const msg = document.getElementById("wb-upmsg");
    if (!f) { msg.textContent = "Hãy chọn file bai-tap-lt-package.json trước."; return; }
    try {
      const pkg = JSON.parse(await f.text());
      const ids = Object.keys(pkg.docs || {}); let i = 0;
      await fbReady();
      for (const id of ids) {
        const isAudio = /-a\d+$/.test(id);
        i++; msg.textContent = `Đang nạp ${i}/${ids.length}: ${id}…`;
        await D().setDoc(D().doc(db(), "workbook", id), isAudio ? { data: pkg.docs[id] } : { json: pkg.docs[id] });
      }
      let cur = [];
      try { cur = JSON.parse((await fetchDoc("index")).json); } catch (e) { if (!e.missing) throw e; }
      const map = new Map(cur.map(x => [x.no, x])); (pkg.index || []).forEach(x => map.set(x.no, x));
      // Tự tìm lại các bài đã nạp trước đó nhưng chưa có trong danh sách (phòng khi danh sách cũ bị ghi đè)
      for (let no = 1; no <= 30; no++) {
        if (map.has(no)) continue;
        try {
          const L = JSON.parse((await fetchDoc("L" + no)).json);
          map.set(no, { no, zh: L.zh, en: L.en, vi: L.vi, n: L.parts.reduce((t, p) => t + p.qs.length, 0) });
        } catch (e) { /* chưa có bài này */ }
      }
      const merged = [...map.values()].sort((a, b) => a.no - b.no);
      await D().setDoc(D().doc(db(), "workbook", "index"), { json: JSON.stringify(merged) });
      msg.innerHTML = `✅ Đã nạp ${ids.length} mục (${merged.length} bài).`;
      W.index = merged; W.lessons = {}; W.audio = {};
      toast("✅ Đã nạp xong bài tập");
    } catch (e) { msg.textContent = "❌ " + errText(e); }
  }

  onState(() => { if (!T.user || !can("vipDialogue")) { W.index = null; W.lessons = {}; W.audio = {}; W.cur = null; W.review = null; W.subs = null; } draw(); });
  new MutationObserver(() => { if (root.classList.contains("hub-show")) draw(); }).observe(root, { attributes: true, attributeFilter: ["class"] });
  draw();
}

if (window.tnApi) start(window.tnApi);
else document.addEventListener("tn-api-ready", () => start(window.tnApi), { once: true });
