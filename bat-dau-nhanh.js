/* =====================================================================
   TRANG CHỦ: "BẮT ĐẦU NHANH" + "NHIỆM VỤ HÔM NAY"
   ---------------------------------------------------------------------
   • Bắt đầu nhanh: 4 bước cho người mới (đăng nhập → ôn 5 từ → đọc thử 1 bài → luyện chép chữ).
       Bước tự tick khi hệ thống thấy bạn đã làm (hoặc khi bấm mở mục đó). Có nút "Ẩn" — ẩn rồi
       thì không hiện lại; làm xong cả 4 bước cũng tự ẩn ở lần mở trang sau.
       Người đã học từ trước (có dữ liệu từ đã nhớ) được tick sẵn bước "ôn từ vựng".
   • Nhiệm vụ hôm nay: 3 mục tiêu nhỏ, tính theo số liệu của diem-hoc-tap.js (window.tnPoints.today()),
       tự về 0 mỗi ngày. Không cộng thêm điểm xếp hạng — chỉ là gợi ý nhịp học.
   Dữ liệu lưu trên máy (localStorage "tn_quickstart_v1"); không gọi máy chủ.
   Muốn đổi mục tiêu hằng ngày: sửa số trong mảng DAILY ngay bên dưới.
   ===================================================================== */
(function () {
  const KEY = 'tn_quickstart_v1';
  const DAILY = [
    { id: 'words', icon: '📚', label: 'Ôn 10 từ vựng mới', goal: 10, unit: 'từ', get: n => (n.newGame || 0) + (n.newFc || 0), open: 'vocab-games' },
    { id: 'minutes', icon: '⏱', label: 'Học liên tục 5 phút', goal: 5, unit: 'phút', get: n => n.minutes || 0, open: 'baidoc-section' },
    { id: 'rounds', icon: '🎯', label: 'Hoàn thành 3 ván trò chơi', goal: 3, unit: 'ván', get: n => n.rounds || 0, open: 'vocab-games' },
  ];
  const STEPS = [
    { id: 'login', icon: '👤', title: 'Đăng nhập để lưu tiến độ', sub: 'Điểm và chuỗi ngày học được giữ lại, có mặt trên bảng xếp hạng.', btn: 'Đăng nhập', act: 'login' },
    { id: 'vocab', icon: '📚', title: 'Ôn 5 từ vựng đầu tiên', sub: 'Mở Trò chơi: lật flashcard hoặc nối cặp từ.', btn: 'Vào ôn từ', act: 'vocab-games' },
    { id: 'read', icon: '📖', title: 'Đọc thử một bài đọc', sub: 'Chọn cấp độ HSK phù hợp, bấm vào bài bất kỳ.', btn: 'Mở bài đọc', act: 'baidoc-section' },
    { id: 'write', icon: '✍️', title: 'Thử chép chính tả', sub: 'Luyện nghe – viết chữ Hán từng câu ngắn.', btn: 'Luyện chép', act: 'tt-dictation' },
  ];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') return { done: s.done || {}, hidden: !!s.hidden }; } catch (e) {} return { done: {}, hidden: false }; };
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  let S = load();

  const today = () => { try { return window.tnPoints ? window.tnPoints.today() : null; } catch (e) { return null; } };
  const loggedIn = () => !!(window.tnAuth && window.tnAuth.user);
  function hadVocabBefore() {
    try { const d = JSON.parse(localStorage.getItem('tn_vocab_mastery_v1')); return !!(d && d.days && Object.values(d.days).some(a => Array.isArray(a) && a.length)); } catch (e) { return false; }
  }

  /* ---- Tự nhận biết bước đã làm ---- */
  function detect() {
    let changed = false;
    const mark = id => { if (!S.done[id]) { S.done[id] = 1; changed = true; } };
    if (loggedIn()) mark('login');
    const t = today();
    if (t && ((t.n.newGame || 0) + (t.n.newFc || 0) >= 5 || (t.n.correct || 0) >= 5)) mark('vocab');
    if (hadVocabBefore()) mark('vocab');
    if (changed) store();
  }

  /* ---- Mở đúng mục trong "Học tiếng Trung" ---- */
  function go(target) {
    if (target === 'login') { const b = document.querySelector('[data-auth-open="login"]'); if (b) b.click(); return; }
    const nav = document.querySelector('[data-nav-btn][data-target="chinese"]') || document.querySelector('.nav-jump[data-target="chinese"]');
    if (nav) nav.click();
    setTimeout(() => { try { window.tnHocOpen && window.tnHocOpen(target); } catch (e) {} }, 80);
  }

  /* ---- Giao diện ---- */
  function css() {
    const st = document.createElement('style');
    st.textContent = `
    .qs-wrap { display:grid; grid-template-columns:1fr; gap:16px; margin:0 0 28px; }
    @media (min-width:768px){ .qs-wrap.has-both { grid-template-columns:1.15fr 1fr; } }
    .qs-card { position:relative; background:#fff; border:1px solid #EFE6DA; border-radius:18px; padding:18px 18px 16px; box-shadow:0 6px 18px rgba(255,125,0,.06); }
    .qs-h { display:flex; align-items:center; gap:10px; margin-bottom:4px; }
    .qs-stamp { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:9px; background:#FFF1E0; color:#E56A00; font-family:'Noto Serif SC','SimSun',serif; font-weight:700; font-size:16px; }
    .qs-title { font-weight:700; font-size:16.5px; color:#1E293B; margin:0; }
    .qs-desc { font-size:12.5px; color:#6B7280; margin:2px 0 12px; line-height:1.55; }
    .qs-hide { margin-left:auto; border:0; background:transparent; color:#9AA3B2; font-size:12.5px; cursor:pointer; padding:4px 6px; border-radius:8px; }
    .qs-hide:hover { background:#F5F1EA; color:#6B7280; }
    .qs-list { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
    .qs-step { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:12px; background:#FFFAF4; border:1px solid #FBEBD7; }
    .qs-step.is-done { background:#F3FAF4; border-color:#D5EDD9; }
    .qs-dot { flex:none; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; background:#fff; border:2px solid #F5C58E; color:#E56A00; }
    .qs-step.is-done .qs-dot { background:#5BB974; border-color:#5BB974; color:#fff; }
    .qs-txt { flex:1; min-width:0; }
    .qs-txt b { display:block; font-size:14px; color:#1E293B; font-weight:600; }
    .qs-txt span { display:block; font-size:12px; color:#7A8394; line-height:1.45; margin-top:1px; }
    .qs-step.is-done .qs-txt b { color:#4B7A57; }
    .qs-go { flex:none; border:1px solid #F2B574; background:#fff; color:#B35900; font-weight:600; font-size:12.5px; padding:6px 12px; border-radius:9999px; cursor:pointer; white-space:nowrap; }
    .qs-go:hover { background:#FFF1E0; }
    .qs-step.is-done .qs-go { border-color:#CFE6D4; color:#4B7A57; }
    .qs-bar { height:6px; border-radius:9999px; background:#F4EADB; overflow:hidden; margin-top:8px; }
    .qs-bar i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#FFB766,#FF8A1F); transition:width .5s ease; }
    .qs-task.is-done .qs-bar i { background:linear-gradient(90deg,#7CCB92,#5BB974); }
    .qs-task { padding:10px 12px; border-radius:12px; background:#FFFAF4; border:1px solid #FBEBD7; cursor:pointer; }
    .qs-task.is-done { background:#F3FAF4; border-color:#D5EDD9; }
    .qs-task-top { display:flex; align-items:center; gap:10px; font-size:14px; color:#1E293B; font-weight:600; }
    .qs-task-top em { margin-left:auto; font-style:normal; font-weight:700; font-size:12.5px; color:#B35900; }
    .qs-task.is-done .qs-task-top em { color:#4B7A57; }
    .qs-foot { margin:12px 0 0; font-size:12.5px; color:#6B7280; text-align:center; }
    .qs-foot b { color:#B35900; }
    .qs-done-msg { margin:12px 0 0; padding:9px 12px; border-radius:12px; background:#F3FAF4; color:#3F7A4F; font-size:13px; text-align:center; }
    @media (prefers-reduced-motion: reduce) { .qs-bar i { transition:none; } }`;
    document.head.appendChild(st);
  }

  let host = null;
  function render() {
    if (!host) return;
    detect();
    const doneAll = STEPS.every(s => S.done[s.id]);
    const showStart = !S.hidden && !doneAll;
    const t = today();
    const n = (t && t.n) || {};

    const startHtml = showStart ? `<section class="qs-card" aria-label="Bắt đầu nhanh">
      <div class="qs-h"><span class="qs-stamp" aria-hidden="true">启</span><h3 class="qs-title">Bắt đầu nhanh</h3><button class="qs-hide" data-qs-hide type="button" title="Ẩn khối này">Ẩn</button></div>
      <p class="qs-desc">Mới vào web? Làm lần lượt 4 bước nhỏ (${STEPS.filter(s => S.done[s.id]).length}/${STEPS.length}) để quen với cách học ở đây.</p>
      <ol class="qs-list">${STEPS.map((s, i) => { const d = !!S.done[s.id]; return `<li class="qs-step ${d ? 'is-done' : ''}">
        <span class="qs-dot" aria-hidden="true">${d ? '✓' : i + 1}</span>
        <div class="qs-txt"><b>${s.icon} ${esc(s.title)}</b><span>${esc(s.sub)}</span></div>
        ${d && s.id === 'login' ? '' : `<button class="qs-go" data-qs-act="${s.act}" data-qs-id="${s.id}" type="button">${d ? 'Xem lại' : esc(s.btn)}</button>`}</li>`; }).join('')}</ol></section>` : '';

    let all = true;
    const rows = DAILY.map(d => {
      const v = Math.min(d.goal, d.get(n)); const done = v >= d.goal; if (!done) all = false;
      return `<div class="qs-task ${done ? 'is-done' : ''}" data-qs-open="${d.open}" role="button" tabindex="0">
        <div class="qs-task-top"><span aria-hidden="true">${done ? '✅' : d.icon}</span><span>${esc(d.label)}</span><em>${v}/${d.goal} ${d.unit}</em></div>
        <div class="qs-bar"><i style="width:${Math.round(v / d.goal * 100)}%"></i></div></div>`;
    }).join('');
    const pts = t ? t.total : 0;
    const dailyHtml = `<section class="qs-card" aria-label="Nhiệm vụ hôm nay">
      <div class="qs-h"><span class="qs-stamp" aria-hidden="true">今</span><h3 class="qs-title">Nhiệm vụ hôm nay</h3></div>
      <p class="qs-desc">3 mục tiêu nhỏ cho mỗi ngày, tự làm mới lúc 0 giờ. Bấm vào một mục để học ngay.</p>
      <div class="qs-list">${rows}</div>
      ${all ? '<p class="qs-done-msg">🎉 Bạn đã hoàn thành cả 3 nhiệm vụ hôm nay — giữ nhịp này nhé!</p>' : `<p class="qs-foot">Hôm nay đã tích <b>${pts}</b> điểm học tập</p>`}</section>`;

    const html = startHtml + dailyHtml;
    if (host.__last === html) return;           // không đổi → không vẽ lại (tránh nháy)
    host.__last = html;
    host.classList.toggle('has-both', showStart);
    host.innerHTML = html;
  }

  function bind() {
    host.addEventListener('click', e => {
      if (e.target.closest('[data-qs-hide]')) { S.hidden = true; store(); render(); return; }
      const b = e.target.closest('[data-qs-act]');
      if (b) {
        const id = b.dataset.qsId;
        if (id === 'read' || id === 'write') { S.done[id] = 1; store(); }   // bước chỉ cần mở là tính
        go(b.dataset.qsAct); render(); return;
      }
      const t = e.target.closest('[data-qs-open]');
      if (t) go(t.dataset.qsOpen);
    });
    host.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-qs-open]')) { e.preventDefault(); go(e.target.dataset.qsOpen); }
    });
  }

  function init() {
    const home = document.getElementById('home');
    const grid = home && home.querySelector('.grid.md\\:grid-cols-3');
    if (!home || !grid) return;
    css();
    host = document.createElement('div');
    host.className = 'qs-wrap'; host.id = 'qs-home';
    grid.parentNode.insertBefore(host, grid);
    bind(); render();
    // Cập nhật số liệu khi đang ở trang chủ (nhẹ: chỉ vẽ lại nếu có thay đổi)
    setInterval(() => { if (home.classList.contains('is-active') && document.visibilityState === 'visible') render(); }, 3000);
    document.addEventListener('tn-auth', () => setTimeout(render, 300));
    window.addEventListener('hashchange', () => setTimeout(render, 150));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
