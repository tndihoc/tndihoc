/* =====================================================================
   HỌC TIẾNG TRUNG — bố cục dạng thẻ lớn + giọng đọc tiếng Trung dùng chung
   ---------------------------------------------------------------------
   1) window.tnVoice: chọn giọng đọc tốt nhất có trên máy (Natural / Google / zh-CN),
      tốc độ 0.85, cao độ 1.0, tự chia câu để có ngắt nghỉ ngắn (và tránh lỗi Chrome
      tự dừng khi đọc đoạn quá dài). Bài đọc, flashcard, chép chính tả… đều dùng chung.
   2) Trang "Học tiếng Trung": hiện các thẻ lớn; bấm thẻ mới mở phần chi tiết bên trong.
      Chỉ ẩn/hiện các khối có sẵn — không sửa nội dung hay logic bên trong.
   ===================================================================== */

/* ---------------- 1) GIỌNG ĐỌC ---------------- */
window.tnVoice = (function () {
  const ok = "speechSynthesis" in window;
  let voice = null, run = 0, noOnline = false; // noOnline: giọng online (Google) lỗi mạng → chỉ dùng giọng trên máy
  function score(v) {
    const n = v.name + " " + v.lang;
    let s = 0;
    if (/zh[-_]CN|cmn[-_]Hans/i.test(v.lang)) s += 50; else if (/^(zh|cmn)/i.test(v.lang)) s += 20;
    if (/Natural|Neural|Online/i.test(n)) s += 40;          // giọng AI tự nhiên (Edge/Windows)
    if (/Google/i.test(n)) s += 30;                          // giọng Google (Chrome)
    if (/Xiaoxiao|Xiaoyi|Yunxi|Yunjian|Tingting|Ting-Ting|Lili|Meijia/i.test(n)) s += 10;
    if (/HK|TW|Hant|yue|Cantonese|粤|台/i.test(n)) s -= 45;   // tránh giọng Quảng Đông / Đài Loan
    if (v.localService === false) s += 3;
    return s;
  }
  function pick() {
    if (!ok) return null;
    const list = speechSynthesis.getVoices().filter(v => /^(zh|cmn)/i.test(v.lang) && !(noOnline && v.localService === false));
    voice = list.sort((a, b) => score(b) - score(a))[0] || null;
    return voice;
  }
  if (ok) { pick(); speechSynthesis.addEventListener("voiceschanged", pick); }
  // Chia theo dấu câu kết thúc → đọc từng câu, nghỉ ngắn giữa các câu
  function chunks(text) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    const parts = t.match(/[^。！？!?；;…\n]+[。！？!?；;…]*[”」』"]?/g) || [t];
    const out = [];
    parts.forEach(p => { p = p.trim(); if (!p) return; while (p.length > 120) { const k = p.lastIndexOf("，", 120); const c = k > 30 ? k + 1 : 120; out.push(p.slice(0, c)); p = p.slice(c); } if (p) out.push(p); });
    return out;
  }
  function stop() { run++; if (ok) speechSynthesis.cancel(); }
  /** Đọc văn bản tiếng Trung. Trả về Promise<true> khi đọc xong, <false> nếu bị dừng/lỗi. */
  function speak(text, opt = {}) {
    if (!ok || !text) return Promise.resolve(false);
    const my = ++run; speechSynthesis.cancel();
    if (!voice) pick();
    const list = chunks(text), rate = opt.rate || 0.85, pitch = opt.pitch || 1.0, gap = opt.pause == null ? 220 : opt.pause;
    return new Promise(resolve => {
      let i = 0, started = false;
      const next = () => {
        if (my !== run) return resolve(false);
        if (i >= list.length) { opt.onend && opt.onend(); return resolve(true); }
        const u = new SpeechSynthesisUtterance(list[i++]);
        u.lang = "zh-CN"; u.rate = rate; u.pitch = pitch; if (voice) u.voice = voice;
        u.onstart = () => { if (!started) { started = true; opt.onstart && opt.onstart(); } };
        u.onend = () => setTimeout(next, i < list.length ? gap : 0);
        u.onerror = (e) => {
          if (my !== run || e.error === "interrupted" || e.error === "canceled") return resolve(false);
          // Giọng Google cần internet (ở Trung Quốc không có VPN sẽ lỗi) → đổi sang giọng có sẵn trên máy, đọc lại câu này
          if (voice && voice.localService === false && !noOnline) { noOnline = true; pick(); i--; return next(); }
          opt.onend && opt.onend(); resolve(false);
        };
        speechSynthesis.speak(u);
      };
      next();
    });
  }
  return { ok, speak, stop, pick, speaking: () => ok && (speechSynthesis.speaking || speechSynthesis.pending), get voice() { return voice; } };
})();

/* ---------------- 2) BỐ CỤC THẺ LỚN (+ 3: ôn từ vựng theo bài, 4: bộ thủ — ở cuối file) ---------------- */
(function () {
  const page = document.getElementById("chinese");
  const hub = document.getElementById("hoc-hub");
  const bar = document.getElementById("hoc-bar");
  if (!page || !hub || !bar) return;
  const PANELS = [
    { id: "tongquan", icon: "📊", title: "Tổng quan", desc: "Chuỗi ngày học, lịch học và số từ đã ghi nhớ.", bg: "#E8F6EE", ink: "#1E7A46", line: "#BFE5CD",
      parts: [{ el: "streak-widget", label: "📊 Tổng quan" }] },
    { id: "trochoi", icon: "🎮", title: "Trò chơi", desc: "Flashcard, nối cặp, trắc nghiệm, đấu trường, bảng xếp hạng.", bg: "#F0EAFE", ink: "#52329E", line: "#D9CCFA",
      parts: [{ el: "vocab-games", label: "🎮 Trò chơi" }, { el: "notebook-section", label: "📓 Sổ tay từ vựng" }] },
    { id: "chinhta", icon: "✍️", title: "Chép chính tả", desc: "Nghe – gõ lại, đo tốc độ chữ/phút; hoặc chép tay rồi đăng ảnh.", bg: "#E6F4F1", ink: "#1F6F62", line: "#BCE3DA",
      parts: [{ el: "tt-dictation", label: "✍️ Chép chính tả" }] },
    { id: "baidoc", icon: "📖", title: "Bài đọc", desc: "Kho bài đọc HSK 2–6, tra từng chữ, nghe đọc, thảo luận.", bg: "#FDE8F1", ink: "#B0306A", line: "#F7C6DB",
      parts: [{ el: "baidoc-section", label: "📖 Bài đọc", with: ["tt-reading-extra"] }] },
    { id: "khaungu", icon: "🎙️", title: "Khẩu ngữ", desc: "Luyện nói theo chủ đề và theo đề thi HSKK (sơ – trung – cao cấp), ghi âm và nộp cho giáo viên.", bg: "#EEF2FC", ink: "#2E48C4", line: "#D6E0F7",
      parts: [{ el: "tt-speaking", label: "🗣️ Theo chủ đề" }, { el: "tt-hskk", label: "📝 Luyện HSKK" }] },
    { id: "lophoc", icon: "🏫", title: "Lớp học của tôi", desc: "Vào lớp bằng mã, ôn từ vựng theo bài, góc luyện chữ và hội thoại 贯通中文.", bg: "#FFE8D1", ink: "#B35600", line: "#FFC98A",
      parts: [{ el: "tt-myclass", label: "🏫 Lớp của tôi" }, { el: "tt-review", label: "📚 Ôn từ vựng" }, { el: "tt-gallery", label: "🖼️ Luyện chữ" }, { el: "tt-vip", label: "⭐ Hội thoại 贯通" }] },
    { id: "bothu", icon: "部", title: "Bộ thủ", desc: "214 bộ thủ Khang Hy: nghĩa, âm Hán Việt, ví dụ và luyện tập.", bg: "#F3F0FA", ink: "#4B3C8C", line: "#DCD3F2",
      parts: [{ el: "tt-radicals", label: "部 Bộ thủ" }] },
  ];
  const allIds = PANELS.flatMap(p => p.parts.flatMap(x => [x.el, ...(x.with || [])]));
  allIds.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add("hub-part"); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function drawHub() {
    const streak = (document.getElementById("streak-count") || {}).textContent;
    hub.innerHTML = PANELS.map((p, i) => `
      <button type="button" class="hoc-card focus-ring" data-hoc="${p.id}" style="--c-bg:${p.bg};--c-ink:${p.ink};--c-line:${p.line};animation-delay:${i * 45}ms">
        <span class="hoc-num">${i + 1}</span>
        <span class="hoc-ico">${p.icon}</span>
        <span class="hoc-title">${esc(p.title)}</span>
        <span class="hoc-desc">${esc(p.desc)}</span>
        ${p.parts.length > 1 ? `<span class="hoc-subs">${p.parts.map(x => `<span>${esc(x.label)}</span>`).join("")}</span>` : ""}
        ${p.id === "tongquan" && streak && streak !== "0" ? `<span class="hoc-subs"><span>🔥 ${esc(streak)} ngày liên tiếp</span></span>` : ""}
        <span class="hoc-go">Mở ›</span>
      </button>`).join("");
  }
  function show(panelId, partIdx, push) {
    const p = PANELS.find(x => x.id === panelId);
    page.dataset.view = p ? p.id : "hub";
    const target = p ? p.parts[Math.max(0, Math.min(partIdx || 0, p.parts.length - 1))].el : null;
    if (target !== "tt-review") reviewLeave();   // trả khu trò chơi về chỗ cũ nếu đang mượn cho "Ôn từ vựng"
    document.querySelectorAll("#chinese .hub-part").forEach(el => el.classList.remove("hub-show"));
    if (!p) {
      hub.hidden = false; bar.hidden = true; drawHub();
    } else {
      const k = Math.max(0, Math.min(partIdx || 0, p.parts.length - 1));
      hub.hidden = true; bar.hidden = false;
      bar.innerHTML = `<div class="hoc-bar-top"><button type="button" class="hoc-back focus-ring" data-hoc-back>‹ Học tiếng Trung</button>
          <span class="hoc-bar-title" style="color:${p.ink}">${p.icon} ${esc(p.title)}</span></div>
        ${p.parts.length > 1 ? `<div class="hoc-tabs">${p.parts.map((x, j) => `<button type="button" class="hoc-tab ${j === k ? "active" : ""}" data-hoc-part="${j}" style="--c-ink:${p.ink}">${esc(x.label)}</button>`).join("")}</div>` : ""}`;
      const part = p.parts[k];
      [part.el, ...(part.with || [])].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add("hub-show"); });
      bar.dataset.panel = p.id;
      if (part.el === "tt-review") renderReview();
      if (part.el === "tt-radicals") renderRadicals();
    }
    if (push) history.pushState({ hoc: p ? p.id : null, part: partIdx || 0 }, "", "#chinese");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  /** Mở đúng thẻ chứa phần tử có id cho trước rồi cuộn tới (dùng cho link nội bộ) */
  function openFor(id) {
    const target = document.getElementById(id);
    if (!target || !page.contains(target)) return false;
    const host = target.closest(".hub-part");
    if (!host) return false;
    for (const p of PANELS) {
      const j = p.parts.findIndex(x => [x.el, ...(x.with || [])].includes(host.id));
      if (j >= 0) {
        if (window.showPage && !page.classList.contains("is-active")) window.showPage("chinese");
        show(p.id, j, true);
        if (target !== host) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        return true;
      }
    }
    return false;
  }
  window.tnHocOpen = openFor;

  hub.addEventListener("click", e => { const b = e.target.closest("[data-hoc]"); if (b) show(b.dataset.hoc, 0, true); });
  bar.addEventListener("click", e => {
    if (e.target.closest("[data-hoc-back]")) return show(null, 0, true);
    const t = e.target.closest("[data-hoc-part]"); if (t) show(bar.dataset.panel, Number(t.dataset.hocPart), true);
  });
  // Link nội bộ kiểu href="#tt-gallery", "#notebook-section"… → mở đúng thẻ
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id && openFor(id)) e.preventDefault();
  });
  // Bấm lại "Học tiếng Trung" trên thanh menu → về màn hình thẻ
  document.querySelectorAll('[data-nav-btn][data-target="chinese"], .nav-jump[data-target="chinese"]').forEach(b =>
    b.addEventListener("click", () => show(null, 0, false)));
  // Nút Back của trình duyệt / điện thoại: từ phần chi tiết quay về màn hình thẻ
  window.addEventListener("popstate", e => { if (location.hash === "#chinese") show(e.state && e.state.hoc, (e.state && e.state.part) || 0, false); });

  /* ================== 3) ÔN TỪ VỰNG THEO BÀI (trong "Lớp học của tôi") ==================
     Mượn nguyên khu "Trò chơi" (flashcard, nối cặp, trắc nghiệm, đấu trường, phản xạ) và
     chỉ đổi bộ từ sang từ vựng của 1 bài 《贯通中文》 (tu-vung-gt1.js). Rời mục này → trả lại như cũ. */
  const PKEY = "tn_tt_progress_v1";
  const getProg = () => { try { return JSON.parse(localStorage.getItem(PKEY) || "{}") || {}; } catch (e) { return {}; } };
  const setProg = (fn) => { const p = getProg(); fn(p); try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} };
  const UNITS = (window.tnUnitDecks && window.tnUnitDecks.units) || [];
  try {
    UNITS.forEach(u => { decks[u.key] = u.words; levelLabels[u.key] = "贯通 Bài " + u.no; });
    if (UNITS.length) { decks["gt1-all"] = UNITS.flatMap(u => u.words); levelLabels["gt1-all"] = "贯通 Bài 1–15"; }
  } catch (e) { console.warn("tndihoc: chưa nạp được bộ từ theo bài", e); }
  const games = document.getElementById("vocab-games");
  const gamesHome = document.createComment("vị trí gốc của khu trò chơi");
  if (games) {
    games.parentNode.insertBefore(gamesHome, games);
    const picker = document.getElementById("game-hsk-pills"); const pk = picker && picker.closest(".mb-7"); if (pk) pk.classList.add("tt-hsk-picker");
  }
  let unitActive = null, prevLevel = null;
  const say = (t) => window.tnVoice && window.tnVoice.speak(t, { rate: 0.85 });
  const unitOf = (key) => key === "gt1-all" ? { key, no: "1–15", title: "全书复习", vi: "Ôn tất cả 15 bài", words: decks["gt1-all"] || [] } : UNITS.find(u => u.key === key);
  function reviewLeave() {
    if (!unitActive || !games) return;
    gamesHome.parentNode.insertBefore(games, gamesHome);
    games.classList.remove("tt-unit-mode", "hub-show");
    unitActive = null;
    if (window.tnSetGameLevel) window.tnSetGameLevel(prevLevel == null ? 1 : prevLevel);
  }
  window.tnReviewLeave = reviewLeave;
  function startUnit(key) {
    const u = unitOf(key); if (!u || !games || !window.tnSetGameLevel) return;
    if (!unitActive) prevLevel = window.tnGetGameLevel ? window.tnGetGameLevel() : 1;
    unitActive = key;
    document.getElementById("rv-slot").appendChild(games);
    games.classList.add("tt-unit-mode", "hub-show");
    const lb = games.querySelector('.game-tab[data-game-tab="leaderboard"]');
    if (lb && lb.classList.contains("active")) { const f = games.querySelector('.game-tab[data-game-tab="flashcard"]') || games.querySelector(".game-tab"); f && f.click(); }
    window.tnSetGameLevel(key);
    setProg(p => { p.units = p.units || {}; p.units[key] = Date.now(); });
    renderReview();
    setTimeout(() => document.getElementById("tt-review").scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function renderReview() {
    const box = document.getElementById("tt-review"); if (!box) return;
    if (!box.dataset.init) { box.innerHTML = '<div id="rv-top"></div><div id="rv-slot"></div>'; box.dataset.init = "1"; }
    const top = document.getElementById("rv-top");
    const head = `<div class="tt-head"><span class="tt-stamp">复</span><h3>Ôn từ vựng 《贯通中文 1》</h3></div>
      <p class="tt-desc">Mỗi bài là một <b>đơn nguyên</b>: chọn bài → ôn bằng đủ các trò chơi của web (flashcard, nối cặp, trắc nghiệm, đấu trường, phản xạ nhanh) nhưng chỉ dùng từ vựng của bài đó.</p>`;
    const allowed = window.tnCan ? window.tnCan("vipDialogue") : false;
    if (!allowed) {
      reviewLeave();
      const logged = window.tnAuth && window.tnAuth.user;
      top.innerHTML = head + `<div class="tt-lock"><div class="ico">🔒</div><b>Dành cho học viên lớp 《贯通中文》</b><p>${logged ? "Hãy nhập <b>mã lớp</b> ở mục “Lớp của tôi” để mở phần ôn từ vựng theo bài." : "Đăng nhập và vào lớp bằng mã giáo viên gửi để dùng phần này."}</p>${logged ? '<a class="tt-btn peach" href="#tt-myclass">🏫 Nhập mã lớp</a>' : '<button class="tt-btn" data-tt-login>Đăng nhập</button>'}</div>`;
      return;
    }
    if (unitActive) {
      const u = unitOf(unitActive);
      if (games) games.classList.add("hub-show");
      top.innerHTML = head + `<div class="rv-banner">
          <div><span class="tt-small">Đang ôn</span><div class="rv-banner-t"><span class="tt-hz">${esc(u.title)}</span> · Bài ${esc(u.no)} · ${esc(u.vi)}</div><span class="tt-small">${u.words.length} từ · tất cả trò chơi bên dưới đang dùng bộ từ này</span></div>
          <div class="tt-row"><button class="tt-btn ghost sm" id="rv-list">📋 Danh sách từ</button><button class="tt-btn soft sm" id="rv-back">‹ Chọn bài khác</button></div></div>
        <div id="rv-words" hidden></div>`;
      document.getElementById("rv-back").onclick = () => { reviewLeave(); renderReview(); };
      document.getElementById("rv-list").onclick = () => {
        const w = document.getElementById("rv-words"); w.hidden = !w.hidden;
        if (!w.hidden && !w.innerHTML) w.innerHTML = `<div class="tt-table-wrap" style="margin-bottom:1rem"><table class="tt-table"><thead><tr><th>#</th><th>Chữ Hán</th><th>Pinyin</th><th>Hán Việt</th><th>Nghĩa</th><th></th></tr></thead><tbody>${u.words.map((x, i) => `<tr><td>${i + 1}</td><td class="tt-hz" style="font-size:18px">${esc(x.hanzi)}</td><td>${esc(x.pinyin)}</td><td>${esc(x.hv || "")}</td><td>${esc(x.mean)}</td><td><button class="tt-link" data-say="${esc(x.hanzi.split("/")[0])}">🔊</button></td></tr>`).join("")}</tbody></table></div>`;
      };
      return;
    }
    const done = getProg().units || {};
    top.innerHTML = head + `<div class="tt-grid">${UNITS.map(u => `
        <button class="tt-pick ${done[u.key] ? "done" : ""}" data-unit="${u.key}"><span class="tt-small">Bài ${u.no} · Lesson ${u.no}</span>
          <span class="cn tt-hz">${esc(u.title)}</span><span class="t">${esc(u.vi)}</span>
          <span class="tt-row"><span class="tt-badge ${done[u.key] ? "green" : ""}">${done[u.key] ? "✓ đã ôn · " : ""}${u.words.length} từ</span></span></button>`).join("")}
        <button class="tt-pick" data-unit="gt1-all" style="background:linear-gradient(160deg,#FFE8D1,#fff 80%)"><span class="tt-small">Tổng ôn</span><span class="cn tt-hz">全书复习</span><span class="t">Trộn từ vựng cả 15 bài</span><span class="tt-row"><span class="tt-badge peach">${(decks["gt1-all"] || []).length} từ</span></span></button></div>`;
    top.querySelectorAll("[data-unit]").forEach(b => b.onclick = () => startUnit(b.dataset.unit));
  }
  document.getElementById("tt-review")?.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say); });

  /* ================== 4) BỘ THỦ — 214 bộ thủ Khang Hy (bo-thu.js) ================== */
  const RADS = window.tnRadicals || [];
  const RAD = { tab: "browse", filter: "hot", q: "", quiz: null, quizSet: "hot" };
  const radDone = () => getProg().rad || {};
  function radList(filter, q) {
    let list = RADS;
    if (filter === "hot") list = list.filter(r => r.hot);
    else if (filter === "learned") { const d = radDone(); list = list.filter(r => d[r.n]); }
    else if (filter !== "all") list = list.filter(r => r.s === Number(filter));
    q = (q || "").trim().toLowerCase();
    if (q) {
      const plain = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();
      const pq = plain(q);
      list = list.filter(r => r.r === q || r.v.includes(q) || plain(r.hv).includes(pq) || plain(r.vn).includes(pq) || plain(r.py).includes(pq) || String(r.n) === q || r.ex.some(e => e[0] === q));
    }
    return list;
  }
  function renderRadicals() {
    const box = document.getElementById("tt-radicals"); if (!box || !RADS.length) return;
    const d = radDone(), learned = Object.keys(d).length;
    box.innerHTML = `<div class="tt-head"><span class="tt-stamp navy">部</span><h3>214 bộ thủ</h3></div>
      <p class="tt-desc">Bộ thủ là “chìa khoá” để nhớ và tra chữ Hán. Bắt đầu với <b>${RADS.filter(r => r.hot).length} bộ thường gặp</b>, bấm vào từng bộ để xem nghĩa, âm Hán Việt, ví dụ và đánh dấu đã thuộc.</p>
      <div class="tt-row between" style="margin-bottom:.4rem"><span class="tt-small">Đã thuộc <b>${learned}/214</b> bộ</span></div>
      <div class="tt-progress"><i style="width:${learned / 214 * 100}%"></i></div>
      <div class="tt-tabs"><button class="tt-tab ${RAD.tab === "browse" ? "active" : ""}" data-rt="browse">📚 Tra cứu</button><button class="tt-tab ${RAD.tab === "quiz" ? "active" : ""}" data-rt="quiz">🎯 Luyện tập</button></div>
      <div id="rad-body"></div>`;
    box.querySelectorAll("[data-rt]").forEach(b => b.onclick = () => { RAD.tab = b.dataset.rt; RAD.quiz = null; renderRadicals(); });
    RAD.tab === "browse" ? radBrowse() : radQuiz();
  }
  const filterOptions = (sel) => `<option value="hot" ${sel === "hot" ? "selected" : ""}>⭐ Thường gặp</option><option value="all" ${sel === "all" ? "selected" : ""}>Tất cả 214 bộ</option><option value="learned" ${sel === "learned" ? "selected" : ""}>✓ Đã thuộc</option>${Array.from({ length: 17 }, (_, i) => i + 1).map(s => `<option value="${s}" ${String(sel) === String(s) ? "selected" : ""}>${s} nét</option>`).join("")}`;
  function radBrowse() {
    const body = document.getElementById("rad-body");
    body.innerHTML = `<div class="tt-row" style="margin-bottom:.9rem"><select class="tt-select" id="rad-filter">${filterOptions(RAD.filter)}</select>
        <input class="tt-input" id="rad-q" placeholder="Tìm: 水, thủy, nước, shui, 河…" value="${esc(RAD.q)}" style="flex:1;min-width:200px"></div>
      <div class="rad-grid" id="rad-grid"></div>`;
    const draw = () => {
      const list = radList(RAD.filter, RAD.q), dd = radDone();
      document.getElementById("rad-grid").innerHTML = list.length ? list.map(r => `
        <button class="rad-tile ${dd[r.n] ? "learned" : ""}" data-rad="${r.n}" title="${esc(r.hv)} – ${esc(r.vn)}">
          <span class="rad-n">${r.n}</span>${dd[r.n] ? '<span class="rad-ok">✓</span>' : ""}
          <span class="rad-ch">${esc(r.r)}</span>${r.v ? `<span class="rad-v">${esc(r.v)}</span>` : ""}
          <span class="rad-hv">${esc(r.hv)}</span><span class="rad-s">${r.s} nét</span></button>`).join("") : `<div class="tt-empty" style="grid-column:1/-1">Không tìm thấy bộ nào.</div>`;
    };
    draw();
    document.getElementById("rad-filter").onchange = e => { RAD.filter = e.target.value; draw(); };
    document.getElementById("rad-q").oninput = e => { RAD.q = e.target.value; draw(); };
    document.getElementById("rad-grid").onclick = e => { const t = e.target.closest("[data-rad]"); if (t) radDetail(Number(t.dataset.rad), radList(RAD.filter, RAD.q)); };
  }
  function radDetail(n, list) {
    let idx = list.findIndex(r => r.n === n);
    const wrap = document.createElement("div"); wrap.className = "tt-modal";
    document.body.appendChild(wrap); document.body.style.overflow = "hidden";
    const close = () => { wrap.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); radBrowseRefresh(); };
    const onKey = e => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", onKey);
    const go = (k) => { idx = (idx + k + list.length) % list.length; draw(); };
    const draw = () => {
      const r = list[idx], learned = !!radDone()[r.n];
      wrap.innerHTML = `<div class="tt-modal-box" style="max-width:560px"><div class="tt-row between"><span class="tt-small">Bộ thứ ${r.n}/214 · ${r.s} nét${r.hot ? " · ⭐ thường gặp" : ""}</span><button class="tt-x" data-x>×</button></div>
        <div class="rad-hero"><div class="rad-big">${esc(r.r)}</div><div>
          <div class="rad-name">Bộ ${esc(r.hv.charAt(0).toUpperCase() + r.hv.slice(1))}</div>
          <div class="rad-py">${esc(r.py)} <button class="tt-link" data-say="${esc(r.r)}">🔊</button></div>
          <div class="rad-mean">${esc(r.vn)}</div>
          ${r.v ? `<div class="tt-small" style="margin-top:.3rem">Biến thể / giản thể: <span class="tt-hz" style="font-size:20px;color:#2E3440">${esc(r.v)}</span></div>` : ""}</div></div>
        <h5 style="font-weight:700;margin:.9rem 0 .4rem">Chữ có bộ ${esc(r.hv)}</h5>
        <div class="tt-lines">${r.ex.map(e => `<div class="rad-ex"><span class="tt-hz">${esc(e[0])}</span><span class="py">${esc(e[1])}</span><span class="vi">${esc(e[2])}</span><button class="tt-link" data-say="${esc(e[0])}">🔊</button></div>`).join("")}</div>
        <div class="tt-row between" style="margin-top:1rem"><div class="tt-row"><button class="tt-btn ghost sm" data-go="-1">‹ Trước</button><button class="tt-btn ghost sm" data-go="1">Sau ›</button></div>
          <button class="tt-btn ${learned ? "soft" : "peach"}" data-learn>${learned ? "✓ Đã thuộc (bấm để bỏ)" : "Đánh dấu đã thuộc"}</button></div></div>`;
    };
    wrap.addEventListener("click", e => {
      if (e.target === wrap || e.target.closest("[data-x]")) return close();
      const s = e.target.closest("[data-say]"); if (s) return say(s.dataset.say);
      const g = e.target.closest("[data-go]"); if (g) return go(Number(g.dataset.go));
      if (e.target.closest("[data-learn]")) { const r = list[idx]; setProg(p => { p.rad = p.rad || {}; if (p.rad[r.n]) delete p.rad[r.n]; else p.rad[r.n] = Date.now(); }); draw(); }
    });
    draw();
  }
  function radBrowseRefresh() { if (RAD.tab === "browse" && document.getElementById("rad-grid")) { const q = RAD.q; renderRadicals(); RAD.q = q; } }
  // ---- Luyện tập: 10 câu trắc nghiệm, 2 dạng câu hỏi xen kẽ ----
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function radQuiz() {
    const body = document.getElementById("rad-body");
    const Q = RAD.quiz;
    if (!Q) {
      body.innerHTML = `<div class="tt-card" style="background:#FAFAFD"><b>Chọn phạm vi luyện tập</b>
        <div class="tt-row" style="margin:.7rem 0"><select class="tt-select" id="rq-set">${filterOptions(RAD.quizSet)}</select>
        <select class="tt-select" id="rq-n"><option value="10">10 câu</option><option value="20">20 câu</option><option value="30">30 câu</option></select>
        <button class="tt-btn peach" id="rq-go">Bắt đầu ▶</button></div>
        <p class="tt-small">2 dạng câu hỏi: nhìn bộ → chọn tên Hán Việt & nghĩa; đọc tên & nghĩa → chọn đúng bộ.</p><div id="rq-msg"></div></div>`;
      document.getElementById("rq-go").onclick = () => {
        RAD.quizSet = document.getElementById("rq-set").value;
        const pool = radList(RAD.quizSet, "");
        if (pool.length < 4) { document.getElementById("rq-msg").innerHTML = `<div class="tt-note warn">Cần ít nhất 4 bộ trong phạm vi này để luyện tập.</div>`; return; }
        const n = Math.min(Number(document.getElementById("rq-n").value), pool.length);
        RAD.quiz = { qs: shuffle(pool).slice(0, n).map((r, i) => ({ r, type: i % 2, opts: shuffle([r, ...shuffle(RADS.filter(x => x.n !== r.n && (pool.length > 8 ? pool.includes(x) : true))).slice(0, 3)]) })), i: 0, ok: 0, wrong: [], picked: null };
        radQuiz();
      };
      return;
    }
    if (Q.i >= Q.qs.length) {
      const pct = Math.round(Q.ok / Q.qs.length * 100);
      body.innerHTML = `<div class="tt-card tt-fade"><h4 style="font-weight:800;font-size:1.15rem">${pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"} Đúng ${Q.ok}/${Q.qs.length} câu (${pct}%)</h4>
        ${Q.wrong.length ? `<p class="tt-small" style="margin:.5rem 0">Ôn lại các bộ làm sai:</p><div class="rad-grid">${Q.wrong.map(r => `<button class="rad-tile" data-rad="${r.n}"><span class="rad-ch">${esc(r.r)}</span><span class="rad-hv">${esc(r.hv)}</span><span class="rad-s">${esc(r.vn)}</span></button>`).join("")}</div>` : ""}
        <div class="tt-row" style="margin-top:1rem"><button class="tt-btn peach" id="rq-again">↻ Làm lại</button><button class="tt-btn ghost" id="rq-new">Chọn phạm vi khác</button></div></div>`;
      document.getElementById("rq-again").onclick = () => { const set = RAD.quizSet; RAD.quiz = null; radQuiz(); document.getElementById("rq-set").value = set; document.getElementById("rq-go").click(); };
      document.getElementById("rq-new").onclick = () => { RAD.quiz = null; radQuiz(); };
      body.querySelectorAll("[data-rad]").forEach(b => b.onclick = () => radDetail(Number(b.dataset.rad), Q.wrong));
      return;
    }
    const q = Q.qs[Q.i];
    const label = r => q.type === 0 ? `<b>${esc(r.hv)}</b> — ${esc(r.vn)}` : `<span class="rad-opt-ch">${esc(r.r)}</span>`;
    body.innerHTML = `<div class="tt-card tt-fade"><div class="tt-row between"><b>Câu ${Q.i + 1}/${Q.qs.length}</b><span class="tt-live">✓ ${Q.ok}</span></div>
      <div class="tt-progress"><i style="width:${Q.i / Q.qs.length * 100}%"></i></div>
      <div class="rad-q">${q.type === 0 ? `<div class="rad-big">${esc(q.r.r)}</div><div class="tt-small">Bộ này tên là gì, nghĩa là gì?</div>` : `<div class="rad-name">Bộ ${esc(q.r.hv)}</div><div class="rad-mean">${esc(q.r.vn)}</div><div class="tt-small">Chọn đúng bộ thủ:</div>`}</div>
      <div class="rad-opts ${q.type === 1 ? "chars" : ""}">${q.opts.map((o, k) => `<button class="rad-opt" data-k="${k}">${label(o)}</button>`).join("")}</div>
      <div id="rq-fb" style="min-height:2.4rem;margin-top:.6rem"></div></div>`;
    body.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
      if (Q.picked != null) return;
      const o = q.opts[Number(b.dataset.k)]; Q.picked = o; const right = o.n === q.r.n;
      body.querySelectorAll("[data-k]").forEach(x => { const oo = q.opts[Number(x.dataset.k)]; if (oo.n === q.r.n) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      if (right) Q.ok++; else Q.wrong.push(q.r);
      document.getElementById("rq-fb").innerHTML = `<div class="tt-note ${right ? "ok" : "err"}">${right ? "Chính xác!" : "Chưa đúng."} <span class="tt-hz" style="font-size:18px">${esc(q.r.r)}</span> = bộ <b>${esc(q.r.hv)}</b> (${esc(q.r.py)}) — ${esc(q.r.vn)} · ví dụ: <span class="tt-hz">${q.r.ex.map(e => esc(e[0])).join(" ")}</span></div>
        <div class="tt-row" style="justify-content:flex-end;margin-top:.5rem"><button class="tt-btn" id="rq-next">${Q.i + 1 < Q.qs.length ? "Câu tiếp ▶" : "Xem kết quả"}</button></div>`;
      document.getElementById("rq-next").onclick = () => { Q.i++; Q.picked = null; radQuiz(); };
      say(q.r.r);
    });
  }
  document.addEventListener("tt-state", () => {
    const v = page.dataset.view;
    if (v === "lophoc" && document.getElementById("tt-review").classList.contains("hub-show")) renderReview();
  });

  show(history.state && history.state.hoc, (history.state && history.state.part) || 0, false);
})();
