/* =====================================================================
   BÀI TẬP 练习册 (贯通中文 — Sách bài tập 1) — tndihoc
   Vị trí: Học tiếng Trung → Lớp học của tôi → tab “📝 Bài tập 练习册”.
   • Học viên: chọn bài → làm 24 câu (Nghe 12 + Đọc 12) → bấm “Chấm điểm” → thấy đúng/sai, đáp án, văn bản nghe.
   • Dữ liệu (đề, ảnh, đáp án, audio) nằm trên Firestore, collection “workbook” — KHÔNG nằm trong kho GitHub.
       workbook/index        → danh sách bài
       workbook/L{n}         → nội dung bài n (chuỗi JSON, có ảnh nhúng + đáp án)
       workbook/L{n}-a{1..4} → audio 4 phần nghe của bài n (data URL mp3)
   • Quyền xem: cùng quyền “Hội thoại 贯通中文 (VIP)” (lớp được bật VIP). Admin nạp dữ liệu ngay trong tab này.
   • Kết quả làm bài lưu trên máy (localStorage “tn_wb_v1”).
   ===================================================================== */

const KEY = "tn_wb_v1";
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
#tt-workbook .wb-btxt{display:flex;flex-wrap:wrap;gap:.5rem;margin:.3rem 0 1rem}
#tt-workbook .wb-btxt>span{background:var(--t0,#FFF6EC);border:1px solid var(--t2,#FFCB94);border-radius:.6rem;padding:.3rem .7rem;font-size:1.05rem}
#tt-workbook .wb-btxt em{font-style:normal;font-weight:700;color:var(--t5,#B35600);margin-right:.3rem}
#tt-workbook .wb-q{padding:.8rem 0;border-top:1px dashed #e6e6e6}
#tt-workbook .wb-q:first-of-type{border-top:0}
#tt-workbook .wb-qn{font-weight:700;color:var(--t5,#B35600);margin-right:.4rem}
#tt-workbook .wb-p{font-size:1.15rem;line-height:1.7}
#tt-workbook .wb-py{display:block;font-size:12px;color:#8a8a8a;line-height:1.3}
#tt-workbook.nopy .wb-py{display:none}
#tt-workbook .wb-opts{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem}
#tt-workbook .wb-opt{border:1.5px solid #ddd;background:#fff;border-radius:.7rem;padding:.4rem .8rem;cursor:pointer;text-align:left;font-size:1.05rem;transition:background .12s,border-color .12s}
#tt-workbook .wb-opt:hover{border-color:var(--t4,#F08A24)}
#tt-workbook .wb-opt.sel{background:var(--t1,#FFE6CC);border-color:var(--t4,#F08A24)}
#tt-workbook .wb-opt.pic{width:min(200px,30%);min-width:120px;padding:4px}
#tt-workbook .wb-opt .wb-k{font-weight:700;color:var(--t5,#B35600);margin-right:.35rem}
#tt-workbook .wb-opt.ok{background:#E3F5EA;border-color:#2E9E5B}
#tt-workbook .wb-opt.bad{background:#FDE6E3;border-color:#D2634B}
#tt-workbook .wb-opt.miss{border-color:#2E9E5B;border-style:dashed}
#tt-workbook .wb-opt.fix{cursor:default}
#tt-workbook .wb-fb{margin-top:.5rem;font-size:13px;color:#444;background:#FAFAF7;border-radius:.6rem;padding:.4rem .7rem}
#tt-workbook .wb-fb b{color:#2E7D4F}
#tt-workbook .wb-warn{font-size:12px;color:#B35600;background:#FFF1DD;border-radius:6px;padding:1px 8px;margin-left:.4rem}
#tt-workbook .wb-score{background:var(--t0,#FFF6EC);border:1px solid var(--t3,#FFA95A);border-radius:1rem;padding:1rem 1.2rem;margin-top:1rem}
#tt-workbook .wb-score big{font-size:1.9rem;font-weight:800;color:var(--t5,#B35600)}
#tt-workbook audio{width:100%;margin:.2rem 0 .8rem}
#tt-workbook .wb-can{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between;padding:.5rem 0;border-top:1px dashed #e6e6e6}
#tt-workbook .wb-star{background:none;border:0;font-size:1.5rem;color:#ccc;cursor:pointer;padding:0 2px}
#tt-workbook .wb-star.on{color:#F5A623}
#tt-workbook .wb-admin{border:1.5px dashed var(--t3,#FFA95A);border-radius:1rem;padding:1rem 1.2rem;margin-top:1rem;background:#fff}
`;

function start(api) {
  const { T, can, isAdmin, isStaff, fbReady, db, D, toast, errText, esc, onState, lockedHtml, needLoginHtml } = api;
  const root = document.getElementById("tt-workbook");
  if (!root) return;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const W = { index: null, lessons: {}, audio: {}, err: "", busy: false, cur: null, prog: load(), py: true, checked: false };
  const keyOf = (L, p, q) => `${L}.${p}.${q}`;
  const ans = (no) => (W.prog[no] && W.prog[no].a) || {};
  const rec = (no) => (W.prog[no] = W.prog[no] || { a: {}, best: 0, done: false, can: {} });
  const persist = () => save(W.prog);
  const rubyLine = (t, py) => `<span class="wb-zh-line">${esc(t)}</span>${py ? `<span class="wb-py">${esc(py)}</span>` : ""}`;

  async function fetchDoc(id) {
    const fb = await fbReady(); if (!fb) throw new Error("Không kết nối được máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.");
    const snap = await D().getDoc(D().doc(db(), "workbook", id));
    if (!snap.exists()) throw new Error("Dữ liệu này chưa được nạp lên máy chủ. (Admin: nạp ở khung “Nạp dữ liệu” bên dưới.)");
    return snap.data();
  }
  const permMsg = (e) => ((e && e.code) || "").includes("permission") ? "Tài khoản chưa có quyền đọc mục này, hoặc luật Firestore cho “workbook” chưa được cập nhật." : (e && e.message) || "Không tải được dữ liệu.";

  async function loadIndex() {
    if (W.index || W.busy) return;
    W.busy = true; W.err = ""; draw();
    try { W.index = JSON.parse((await fetchDoc("index")).json); } catch (e) { W.err = permMsg(e); }
    W.busy = false; draw();
  }
  async function openLesson(no) {
    W.cur = no; W.checked = !!(W.prog[no] && W.prog[no].done); draw();
    if (W.lessons[no]) return;
    W.busy = true; W.err = ""; draw();
    try { W.lessons[no] = JSON.parse((await fetchDoc("L" + no)).json); } catch (e) { W.err = permMsg(e); }
    W.busy = false; draw();
  }
  async function loadAudio(no, a, btn) {
    const k = `L${no}-a${a}`;
    if (btn) { btn.disabled = true; btn.textContent = "Đang tải audio…"; }
    try { W.audio[k] = (await fetchDoc(k)).data; } catch (e) { toast(permMsg(e)); }
    draw();
  }

  /* ---------- Chấm điểm ---------- */
  function score(L) {
    const a = ans(L.no); let ok = 0, total = 0; const per = {};
    L.parts.forEach(p => { per[p.id] = { ok: 0, n: p.qs.length }; p.qs.forEach(q => { total++; if (a[keyOf(L.no, p.id, q.n)] === q.ans) { ok++; per[p.id].ok++; } }); });
    return { ok, total, per };
  }

  /* ---------- Vẽ ---------- */
  function head(title, extra) {
    return `<div class="wb-top"><div><h3 style="font-size:1.25rem;font-weight:800;margin:0">${title}</h3></div><div>${extra || ""}</div></div>`;
  }
  function drawHome() {
    const list = W.index || [];
    const staff = isStaff();
    return head("📝 Bài tập 练习册 — 《贯通中文》Sách bài tập 1",
      `<label style="font-size:13px"><input type="checkbox" id="wb-py" ${W.py ? "checked" : ""}> Hiện pinyin</label>`) +
      `<p style="font-size:14px;color:#555;margin:0 0 .3rem">Làm bài theo từng bài học, bấm <b>Chấm điểm</b> để xem đáp án và văn bản nghe. Dạng đề giống đề thi HSK 3.0: Nghe 12 câu + Đọc 12 câu.</p>` +
      (W.err ? `<div class="tt-note err" style="margin:.8rem 0">${esc(W.err)} <button class="tt-link" id="wb-retry">Thử lại</button></div>` : "") +
      (W.busy && !W.index ? `<div class="tt-empty"><span class="tt-spin"></span></div>` : "") +
      `<div class="wb-grid">${list.map(l => {
        const r = W.prog[l.no]; const n = r ? Object.keys(r.a || {}).length : 0;
        return `<button type="button" class="wb-lcard" data-wb-open="${l.no}">
          <div class="wb-no">BÀI ${l.no} · ${l.n} CÂU</div><div class="wb-zh">${esc(l.zh)}</div><div class="wb-sub">${esc(l.vi)}</div>
          <div class="wb-bar"><i style="width:${Math.round(n / l.n * 100)}%"></i></div>
          <div class="wb-sub" style="margin-top:.35rem">${r && r.done ? `✅ Điểm gần nhất: <b>${r.best}/${l.n}</b>` : n ? `Đã làm ${n}/${l.n} câu` : "Chưa làm"}</div></button>`; }).join("")}</div>` +
      (isAdmin() ? adminBox() : "") ;
  }
  function adminBox() {
    return `<div class="wb-admin"><b>📥 Nạp dữ liệu (chỉ admin)</b>
      <p style="font-size:13px;color:#555;margin:.3rem 0 .6rem">Chọn file <code>bai-tap-lt-package.json</code> do Claude gửi → <b>Nạp lên máy chủ</b>. Nạp lại cùng file = cập nhật; bài mới được thêm vào danh sách, bài cũ giữ nguyên.</p>
      <input type="file" id="wb-file" accept=".json,application/json"> <button class="tt-btn peach" id="wb-up">Nạp lên máy chủ</button>
      <div id="wb-upmsg" style="font-size:13px;margin-top:.5rem"></div></div>`;
  }
  const optHtml = (o, sel, q, p, checked) => {
    let cls = "wb-opt" + (o.img ? " pic" : "") + (sel === o.k ? " sel" : "");
    if (checked) {
      cls += " fix";
      if (o.k === q.ans) cls += sel === o.k ? " ok" : " miss";
      else if (sel === o.k) cls += " bad";
    }
    const body = o.img ? `<span class="wb-k">${o.k}</span><img alt="${o.k}" loading="lazy" src="${W.cur && W.lessons[W.cur].imgs[o.img]}">` :
      `<span class="wb-k">${o.k}</span>${o.t ? esc(o.t) : ""}${o.py ? `<span class="wb-py">${esc(o.py)}</span>` : ""}`;
    return `<button type="button" class="${cls}" data-k="${o.k}" ${checked ? "disabled" : ""}>${body}</button>`;
  };
  function qHtml(L, p, q) {
    const sel = ans(L.no)[keyOf(L.no, p.id, q.n)];
    const opts = q.opts || (p.bank || p.banktext).map(b => ({ k: b.k }));
    const checked = W.checked;
    let fb = "";
    if (checked) {
      const right = sel === q.ans;
      fb = `<div class="wb-fb">${right ? "✅ Đúng" : sel ? "❌ Chưa đúng" : "⚪ Chưa chọn"} — đáp án: <b>${q.ans}</b>${q.tr ? `<br>🎧 Văn bản nghe: ${esc(q.tr)}` : ""}</div>`;
    }
    return `<div class="wb-q" data-q="${q.n}" data-p="${p.id}">
      <div>${`<span class="wb-qn">${q.n}.</span>`}${q.p ? `<span class="wb-p">${rubyLine(q.p, q.py)}</span>` : ""}${q.check && isStaff() ? `<span class="wb-warn">⚠️ đáp án chờ cô xác nhận</span>` : ""}</div>
      ${q.q ? `<div class="wb-p" style="margin-left:1.3rem">${rubyLine(q.q, q.qpy)}</div>` : ""}
      <div class="wb-opts">${opts.map(o => o.img || o.t ? optHtml(o, sel, q, p, checked) : optHtml({ k: o.k, t: "" }, sel, q, p, checked)).join("")}</div>${fb}</div>`;
  }
  function partHtml(L, p) {
    const au = p.audio ? `L${L.no}-a${p.audio}` : null;
    return `<section class="wb-part"><span class="wb-sk">${p.skill === "listen" ? "🎧 NGHE" : "📖 ĐỌC"}</span>
      <h4>${esc(p.zh)}</h4><div class="wb-vi">${esc(p.vi)}</div>
      ${p.ex ? `<div class="wb-ex">${esc(p.ex)}</div>` : ""}
      ${au ? (W.audio[au] ? `<audio controls preload="none" src="${W.audio[au]}"></audio>` : `<button type="button" class="tt-btn soft" data-wb-audio="${p.audio}">🔊 Tải & nghe audio phần này</button><div style="height:.7rem"></div>`) : ""}
      ${p.bank ? `<div class="wb-bank">${p.bank.map(b => `<figure><b>${b.k}</b><img loading="lazy" alt="${b.k}" src="${L.imgs[b.img]}"></figure>`).join("")}</div>` : ""}
      ${p.banktext ? `<div class="wb-btxt">${p.banktext.map(b => `<span><em>${b.k}</em>${esc(b.t)}${b.py ? `<span class="wb-py">${esc(b.py)}</span>` : ""}</span>`).join("")}</div>` : ""}
      ${p.qs.map(q => qHtml(L, p, q)).join("")}</section>`;
  }
  function drawLesson() {
    const L = W.lessons[W.cur];
    const back = `<button type="button" class="tt-btn ghost sm" id="wb-back">‹ Danh sách bài</button>`;
    if (!L) return head(`Bài ${W.cur}`, back) + (W.err ? `<div class="tt-note err">${esc(W.err)} <button class="tt-link" data-wb-open="${W.cur}">Thử lại</button></div>` : `<div class="tt-empty"><span class="tt-spin"></span></div>`);
    const r = rec(L.no); const a = ans(L.no); const n = Object.keys(a).length;
    const total = L.parts.reduce((s, p) => s + p.qs.length, 0);
    let sc = "";
    if (W.checked) {
      const s = score(L);
      sc = `<div class="wb-score"><big>${s.ok}/${s.total}</big> câu đúng · ${Math.round(s.ok / s.total * 100)}%
        <div style="font-size:13px;margin-top:.4rem;color:#555">${L.parts.map(p => `${p.skill === "listen" ? "🎧" : "📖"} P${p.id.slice(1)}: ${s.per[p.id].ok}/${s.per[p.id].n}`).join(" · ")}</div>
        <div style="margin-top:.7rem"><button class="tt-btn ghost" id="wb-redo">↻ Làm lại</button></div></div>`;
    }
    const can3 = `<section class="wb-part"><h4>⭐ 学习评价 Tự đánh giá</h4><div class="wb-vi">Chọn số sao cho từng mục (3 sao = làm tốt)</div>
      ${(L.can || []).map((t, i) => `<div class="wb-can"><span>${i + 1}. ${esc(t)}</span><span>${[1, 2, 3].map(s => `<button type="button" class="wb-star ${(r.can[i] || 0) >= s ? "on" : ""}" data-wb-star="${i}:${s}">★</button>`).join("")}</span></div>`).join("")}</section>`;
    return head(`Bài ${L.no} · <span class="wb-zh" style="font-size:1.4rem">${esc(L.zh)}</span> <span style="font-weight:500;font-size:.9rem;color:#666">${esc(L.vi)}</span>`,
      `${back} <label style="font-size:13px;margin-left:.6rem"><input type="checkbox" id="wb-py" ${W.py ? "checked" : ""}> Pinyin</label>`) +
      sc + L.parts.map(p => partHtml(L, p)).join("") +
      (W.checked ? "" : `<div class="wb-score" style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:space-between"><span>Đã chọn <b>${n}/${total}</b> câu</span><button class="tt-btn peach" id="wb-check">✔ Chấm điểm</button></div>`) +
      can3;
  }
  function draw() {
    root.classList.toggle("nopy", !W.py);
    if (!T.user) { root.innerHTML = needLoginHtml("làm bài tập sách bài tập 贯通中文"); return; }
    if (!can("vipDialogue")) { root.innerHTML = lockedHtml("vipDialogue"); return; }
    if (!W.index && !W.busy && !W.err) { loadIndex(); }
    root.innerHTML = W.cur ? drawLesson() : drawHome();
  }

  /* ---------- Sự kiện ---------- */
  root.addEventListener("click", async (e) => {
    const t = e.target;
    const op = t.closest("[data-wb-open]"); if (op) return openLesson(Number(op.dataset.wbOpen));
    if (t.closest("#wb-back")) { W.cur = null; W.err = ""; return draw(); }
    if (t.closest("#wb-retry")) { W.err = ""; W.index = null; return loadIndex(); }
    const au = t.closest("[data-wb-audio]"); if (au) return loadAudio(W.cur, au.dataset.wbAudio, au);
    const sb = t.closest("[data-wb-star]"); if (sb) { const [i, s] = sb.dataset.wbStar.split(":").map(Number); const r = rec(W.cur); r.can[i] = r.can[i] === s ? s - 1 : s; persist(); return draw(); }
    const ob = t.closest(".wb-opt");
    if (ob && !W.checked) {
      const qe = ob.closest(".wb-q"); const L = W.lessons[W.cur];
      const r = rec(L.no); r.a[keyOf(L.no, qe.dataset.p, qe.dataset.q)] = ob.dataset.k; persist();
      qe.querySelectorAll(".wb-opt").forEach(b => b.classList.toggle("sel", b === ob));
      const total = L.parts.reduce((s, p) => s + p.qs.length, 0);
      const bar = root.querySelector(".wb-score b"); if (bar) bar.textContent = Object.keys(r.a).length + "/" + total;
      return;
    }
    if (t.closest("#wb-check")) {
      const L = W.lessons[W.cur]; const s = score(L); const r = rec(L.no);
      r.done = true; r.best = s.ok; persist(); W.checked = true; draw();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (t.closest("#wb-redo")) { const r = rec(W.cur); r.a = {}; r.done = false; persist(); W.checked = false; draw(); root.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.closest("#wb-up")) return upload();
  });
  root.addEventListener("change", (e) => { if (e.target.id === "wb-py") { W.py = e.target.checked; root.classList.toggle("nopy", !W.py); } });

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
        i++; msg.textContent = `Đang nạp ${i}/${ids.length + 1}: ${id}…`;
        await D().setDoc(D().doc(db(), "workbook", id), isAudio ? { data: pkg.docs[id] } : { json: pkg.docs[id] });
      }
      let cur = []; try { cur = JSON.parse((await fetchDoc("index")).json); } catch (e) {}
      const map = new Map(cur.map(x => [x.no, x])); (pkg.index || []).forEach(x => map.set(x.no, x));
      const merged = [...map.values()].sort((a, b) => a.no - b.no);
      await D().setDoc(D().doc(db(), "workbook", "index"), { json: JSON.stringify(merged) });
      msg.innerHTML = `✅ Đã nạp ${ids.length} mục (${merged.length} bài). Tải lại trang để xem.`;
      W.index = merged; W.lessons = {}; W.audio = {};
      toast("✅ Đã nạp xong bài tập");
    } catch (e) { msg.textContent = "❌ " + errText(e); }
  }

  onState(() => { if (!T.user || !can("vipDialogue")) { W.index = null; W.lessons = {}; W.audio = {}; W.cur = null; } draw(); });
  // vẽ khi tab được mở
  new MutationObserver(() => { if (root.classList.contains("hub-show")) draw(); }).observe(root, { attributes: true, attributeFilter: ["class"] });
  draw();
}

if (window.tnApi) start(window.tnApi);
else document.addEventListener("tn-api-ready", () => start(window.tnApi), { once: true });
