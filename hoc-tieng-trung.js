/* =====================================================================
   HỌC TIẾNG TRUNG — bố cục dạng thẻ lớn + giọng đọc tiếng Trung dùng chung
   ---------------------------------------------------------------------
   1) window.tnVoice: chọn giọng đọc tốt nhất có trên máy (Natural / Google / zh-CN),
      tốc độ 0.85, cao độ 1.0, tự chia câu để có ngắt nghỉ ngắn (và tránh lỗi Chrome
      tự dừng khi đọc đoạn quá dài). Bài đọc, flashcard, chép chính tả… đều dùng chung.
   2) Trang "Học tiếng Trung": hiện 6 thẻ lớn; bấm thẻ mới mở phần chi tiết bên trong.
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

/* ---------------- 2) BỐ CỤC THẺ LỚN ---------------- */
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
    { id: "khaungu", icon: "🎙️", title: "Khẩu ngữ", desc: "Luyện nói theo tình huống, ghi âm và nộp cho giáo viên.", bg: "#EEF2FC", ink: "#2E48C4", line: "#D6E0F7",
      parts: [{ el: "tt-speaking", label: "🎙️ Khẩu ngữ" }] },
    { id: "lophoc", icon: "🏫", title: "Lớp học của tôi", desc: "Vào lớp bằng mã, góc luyện chữ và hội thoại 贯通中文.", bg: "#FFE8D1", ink: "#B35600", line: "#FFC98A",
      parts: [{ el: "tt-myclass", label: "🏫 Lớp của tôi" }, { el: "tt-gallery", label: "🖼️ Luyện chữ" }, { el: "tt-vip", label: "⭐ Hội thoại 贯通" }] },
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
  show(history.state && history.state.hoc, (history.state && history.state.part) || 0, false);
})();
