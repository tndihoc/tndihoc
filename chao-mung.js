/* =====================================================================
   TRANG CHỦ: LỜI CHÀO MỪNG + NGỌN LỬA CHUỖI NGÀY ĐỔI MÀU
   ---------------------------------------------------------------------
   • Mỗi lần mở trang chủ đều có khối chào mừng, lời chúc đổi theo tình trạng của bạn:
       - lần đầu vào web ............. chào đón + mời học 5 phút đầu tiên
       - quay lại, hôm nay chưa học ... "Bạn đã quay lại rồi…" + nhắc giữ chuỗi
       - quay lại sau khi đứt chuỗi ... động viên bắt đầu chuỗi mới
       - vừa học xong hôm nay ......... "Lại thêm 1 ngày chăm chỉ!"
       - chạm mốc 7 / 15 / 30 ngày .... chúc mừng riêng + ngọn lửa đổi màu
   • Màu lửa theo chuỗi (nhạt → đậm):  1–6 ngày vàng nhạt · 7+ cam · 15+ đỏ cam · 30+ đỏ đậm.
     Cùng màu này cũng áp dụng cho ngọn lửa trong khối "Tổng quan" của Học tiếng Trung.
   • Số liệu chuỗi lấy từ index.html: window.tnStreakInfo + sự kiện "tn-streak".
   Muốn đổi lời chúc: sửa các mảng chữ trong MSG; đổi mốc/màu: sửa mảng TIERS.
   ===================================================================== */
(function () {
  /* ---------- Các bậc màu lửa ---------- */
  const TIERS = [
    { from: 0,  key: 'none',   name: 'chưa có lửa',     out: '#CDD2DA', mid: '#E3E6EB', core: '#F4F5F7', glow: 'rgba(160,168,180,0)',   bg: '#F7F8FA', ink: '#6B7280' },
    { from: 1,  key: 'light',  name: 'lửa vàng nhạt',   out: '#FFC93C', mid: '#FFDD75', core: '#FFF6C9', glow: 'rgba(255,201,60,.35)',  bg: '#FFFBEA', ink: '#9A6B00' },
    { from: 7,  key: 'orange', name: 'lửa cam',         out: '#FF8A1F', mid: '#FFB347', core: '#FFE29A', glow: 'rgba(255,138,31,.42)',  bg: '#FFF4E6', ink: '#B35900' },
    { from: 15, key: 'red',    name: 'lửa đỏ cam',      out: '#EE4B1C', mid: '#FF7A3D', core: '#FFC27A', glow: 'rgba(238,75,28,.45)',   bg: '#FFEEE8', ink: '#B13412' },
    { from: 30, key: 'deep',   name: 'lửa đỏ đậm',      out: '#B3121F', mid: '#E5352B', core: '#FF8A5B', glow: 'rgba(179,18,31,.5)',    bg: '#FDEAEA', ink: '#9B1420' },
  ];
  const MILESTONES = [7, 15, 30, 90];
  const tierOf = n => { let t = TIERS[0]; for (const x of TIERS) if (n >= x.from) t = x; return t; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Lời chúc ----------
     Mỗi nhóm có nhiều câu (tục ngữ, thành ngữ Việt – Hán, lời động viên). Cách chọn câu:
       • nhóm "done" (vừa học xong): chọn theo SỐ NGÀY CHUỖI → các ngày liên tiếp luôn khác nhau
         (chuỗi 2, 3, 4… mỗi ngày một câu; nhóm có 12 câu nên 12 ngày liền không lặp).
       • các nhóm còn lại: chọn theo ngày trong lịch → mỗi nhóm có ≥ 7 câu nên 7 ngày liền không lặp.
     Muốn thêm câu: thêm 1 dòng [tiêu đề, dòng phụ] vào đúng nhóm; {n} sẽ thành số ngày chuỗi. */
  const MSG = {
    first: [
      ['Hành trình vạn dặm bắt đầu từ một bước chân 🚶', 'Hãy bắt đầu với bước đầu tiên nhé! 千里之行，始于足下 (qiān lǐ zhī xíng, shǐ yú zú xià).'],
      ['Chào mừng bạn đến với tndihoc! 👋', '为时不晚 — không bao giờ là quá muộn để bắt đầu. Học 5 phút hôm nay để thắp ngọn lửa đầu tiên nhé.'],
      ['Vạn sự khởi đầu nan, nhưng bạn đã ở đây rồi! 🌱', 'Chỉ cần vài từ đầu tiên thôi — chữ Hán sẽ quen dần theo từng ngày.'],
      ['Rất vui được gặp bạn! 📖', 'Mỗi ngày một chút, chữ Hán sẽ thành người bạn. Bắt đầu với vài từ đầu tiên ngay bây giờ nhé.'],
      ['Đi một ngày đàng, học một sàng khôn 🎒', 'Hôm nay hãy học thử vài từ — ngọn lửa đầu tiên đang chờ bạn thắp lên.'],
      ['Có chí thì nên! 🌟', '有志者事竟成 (yǒu zhì zhě shì jìng chéng). Học 5 phút đầu tiên để bắt đầu chuỗi ngày của bạn nhé.'],
      ['Ngày mới, trang mới ☀️', 'Chào bạn đến với góc học tập nhỏ này. Thử một trò chơi từ vựng để làm quen nhé!'],
    ],
    back: [
      ['Bạn đã quay lại rồi, hãy tiếp tục cố gắng nhé! 💪', 'Chuỗi {n} ngày của bạn đang chờ — học một chút hôm nay để giữ lửa nào.'],
      ['Chào mừng bạn trở lại! 🌟', 'Ngọn lửa {n} ngày vẫn đang cháy. Hôm nay mình học tiếp nhé!'],
      ['Mừng bạn quay lại! 📖', 'Giữ chuỗi {n} ngày chỉ cần vài phút thôi — bắt đầu thôi nào.'],
      ['Gần đèn thì sáng 💡', 'Ở bên chữ Hán mỗi ngày, bạn sẽ sáng dần lên. Giữ chuỗi {n} ngày nào!'],
      ['Ngày mới, bước mới ☀️', 'Chuỗi {n} ngày đang đợi bạn ghé thăm hôm nay. Chỉ cần thêm một bước nhỏ thôi.'],
      ['Đi một ngày đàng, học một sàng khôn 🎒', 'Hôm nay học thêm một chút để chuỗi {n} ngày của bạn tiếp tục dài ra nhé.'],
      ['Trăm hay không bằng tay quen ✋', '熟能生巧 (shú néng shēng qiǎo) — ôn một chút hôm nay, chuỗi {n} ngày sẽ lại dài thêm.'],
    ],
    reset: [
      ['Chào mừng bạn quay lại! Hôm nay bắt đầu một chuỗi mới nhé 🌱', 'Không sao nếu những ngày qua bận — quan trọng là bạn đã trở lại. Tiếp tục cố gắng nhé!'],
      ['Bạn đã quay lại rồi, thật tuyệt! 🔥', 'Thắp lại ngọn lửa từ hôm nay: chỉ cần học 5 phút là chuỗi mới bắt đầu.'],
      ['Ngã ở đâu, đứng dậy ở đó 💪', '不怕慢，只怕站 (bù pà màn, zhǐ pà zhàn) — không sợ chậm, chỉ sợ dừng lại. Mình đi tiếp nhé!'],
      ['Hành trình mới, bước đầu tiên 🚶', 'Chuỗi cũ đã khép lại, chuỗi mới bắt đầu từ hôm nay. Chỉ cần một bước nhỏ thôi.'],
      ['Có chí thì nên! 🌟', '有志者事竟成 (yǒu zhì zhě shì jìng chéng). Học 5 phút hôm nay để thắp lại ngọn lửa nhé.'],
      ['Chào mừng bạn trở lại! ☀️', 'Việc học không có “muộn”, chỉ có “bắt đầu lại”. Hôm nay mình bắt đầu một chuỗi mới nhé.'],
      ['Mừng bạn quay lại với chữ Hán! 📖', 'Ai cũng có lúc bận — quan trọng là bạn vẫn quay về. Tiếp tục cố gắng nhé!'],
    ],
    done: [
      ['Lại thêm 1 ngày chăm chỉ! 🔥', 'Chuỗi {n} ngày rồi — tiếp tục cố gắng nhé, mỗi ngày một chút bạn sẽ đi rất xa.'],
      ['Hành trình vạn dặm bắt đầu từ một bước chân 🚶', 'Hôm nay bạn đã đi thêm một bước — chuỗi {n} ngày! 千里之行，始于足下 (qiān lǐ zhī xíng, shǐ yú zú xià).'],
      ['Kiến tha lâu cũng đầy tổ 🐜', 'Mỗi cố gắng nhỏ đều đáng được trân trọng. Chuỗi {n} ngày rồi — cứ thế nhé!'],
      ['Có công mài sắt, có ngày nên kim 🪡', '铁杵磨成针 (tiě chǔ mó chéng zhēn). Chuỗi {n} ngày kiên trì — từng chữ Hán đang dần thuộc về bạn.'],
      ['Nước chảy đá mòn 💧', '水滴石穿 (shuǐ dī shí chuān). Từng ngày một, {n} ngày liên tiếp — sức mạnh của sự đều đặn.'],
      ['Không sợ chậm, chỉ sợ dừng 🌱', '不怕慢，只怕站 (bù pà màn, zhǐ pà zhàn). Hôm nay bạn không dừng lại — chuỗi {n} ngày!'],
      ['Cần cù bù thông minh 💪', 'Chuỗi {n} ngày: sự chăm chỉ của bạn đang tạo ra khác biệt thật sự.'],
      ['Học như thuyền đi ngược dòng 🚣', '学如逆水行舟，不进则退 (xué rú nì shuǐ xíng zhōu, bù jìn zé tuì). Hôm nay bạn đã chèo thêm một nhịp — chuỗi {n} ngày!'],
      ['Quen tay hay việc 🎯', '熟能生巧 (shú néng shēng qiǎo). Chuỗi {n} ngày — càng học càng nhớ lâu.'],
      ['Mưa dầm thấm lâu 🌧️', 'Đừng xem nhẹ 10 phút mỗi ngày: chuỗi {n} ngày là cả một dòng kiến thức đã thấm vào bạn.'],
      ['Ngu Công dời núi ⛰️', '愚公移山 (yú gōng yí shān). Mỗi ngày chuyển một ít đất đá — chuỗi {n} ngày của bạn cũng vậy!'],
      ['Học, học nữa, học mãi 📚', 'Chuỗi {n} ngày. Lại thêm 1 ngày chăm chỉ — tiếp tục cố gắng nhé!'],
    ],
    doneFirst: [
      ['Ngọn lửa đầu tiên đã được thắp lên! 🔥', 'Ngày đầu tiên hoàn thành — mai quay lại để chuỗi của bạn dài thêm nhé. Cố lên!'],
      ['Bước đầu tiên đã xong! 🚶', 'Hành trình vạn dặm bắt đầu từ một bước chân — và bạn vừa bước xong bước đầu. Giỏi lắm!'],
      ['Khởi đầu tuyệt vời! 🌱', 'Vạn sự khởi đầu nan — bạn đã vượt qua rồi. Mai mình học tiếp nhé!'],
    ],
    milestone: {
      7:  ['🎉 Chúc mừng! Đủ 7 ngày liên tiếp!', 'Một tuần kiên trì trọn vẹn. Ngọn lửa của bạn đã chuyển sang màu cam — đỏ cam ở mốc 15 ngày nhé!'],
      15: ['🎉 Chúc mừng! Đủ 15 ngày liên tiếp!', 'Nửa tháng không bỏ cuộc! Ngọn lửa của bạn đã đổi sang màu đỏ cam — mốc đỏ đậm là 30 ngày.'],
      30: ['🏆 Chúc mừng! Đủ 30 ngày liên tiếp!', 'Trọn một tháng chăm chỉ! Ngọn lửa của bạn đã đạt màu đỏ đậm — thật đáng ngưỡng mộ.'],
      90: ['👑 Chúc mừng! Đủ 90 ngày liên tiếp!', 'Ba tháng bền bỉ — bạn là tấm gương học tập. Hãy liên hệ cô Thúy để nhận phần quà bí mật nhé!'],
    },
  };
  // Số ngày kể từ mốc cố định (theo lịch của máy) → 2 ngày liền nhau luôn khác nhau 1 đơn vị
  const epochDay = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  const pick = arr => arr[epochDay() % arr.length];
  const pickBy = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  const fill = (s, n) => s.replace(/\{n\}/g, n);

  /* ---------- Ngọn lửa SVG (đổi màu theo bậc) ---------- */
  let uid = 0;
  function flameSVG(tier, size) {
    const id = 'fl' + (++uid);
    return `<svg class="cm-flame-svg" width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 64 80" aria-hidden="true">
      <defs><linearGradient id="${id}a" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${tier.out}"/><stop offset="1" stop-color="${tier.mid}"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${tier.mid}"/><stop offset="1" stop-color="${tier.core}"/></linearGradient></defs>
      <path class="cm-flame-out" fill="url(#${id}a)" d="M32 3c4 15 21 23 21 43a21 21 0 0 1-42 0c0-10 5-17 9-22 1 7 4 11 8 12C25 26 26 14 32 3z"/>
      <path class="cm-flame-in" fill="url(#${id}b)" d="M32 38c3 7 11 11 11 20a11 11 0 0 1-22 0c0-6 4-10 6-13 1 3 3 5 5 5-1-4-1-8 0-12z"/></svg>`;
  }

  /* ---------- Style ---------- */
  function css() {
    const st = document.createElement('style');
    st.textContent = `
    .cm-banner { position:relative; overflow:hidden; display:flex; align-items:center; gap:18px; padding:18px 22px; margin:0 0 20px;
      border-radius:20px; border:1px solid rgba(46,52,64,.08); background:var(--cm-bg,#FFF4E6); animation:cmIn .5s ease both; }
    @keyframes cmIn { from { opacity:0; translate:0 8px; } to { opacity:1; translate:0 0; } }
    .cm-banner::after { content:""; position:absolute; right:-40px; top:-50px; width:190px; height:190px; border-radius:50%; background:var(--cm-glow,rgba(255,138,31,.2)); opacity:.45; filter:blur(26px); pointer-events:none; }
    .cm-flame { position:relative; flex:none; display:flex; align-items:flex-end; justify-content:center; width:80px; height:98px; }
    .cm-flame::before { content:""; position:absolute; inset:18% 8% 0; border-radius:50%; background:var(--cm-glow); filter:blur(14px); }
    .cm-flame-svg { position:relative; transform-origin:50% 92%; animation:cmFlicker 1.9s ease-in-out infinite; filter:drop-shadow(0 4px 8px var(--cm-glow)); }
    .cm-flame-in { transform-origin:50% 90%; animation:cmFlickerIn 1.3s ease-in-out infinite; }
    .cm-flame.is-off .cm-flame-svg, .cm-flame.is-off .cm-flame-in { animation:none; }
    @keyframes cmFlicker { 0%,100% { transform:scale(1,1) rotate(0); } 30% { transform:scale(1.04,1.07) rotate(-1.6deg); } 60% { transform:scale(.97,1.03) rotate(1.4deg); } }
    @keyframes cmFlickerIn { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12,1.18); } }
    .cm-body { position:relative; flex:1; min-width:0; }
    .cm-chip { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--cm-ink,#B35900);
      background:rgba(255,255,255,.7); border-radius:9999px; padding:3px 10px; margin-bottom:6px; }
    .cm-title { margin:0 0 3px; font-size:19px; line-height:1.35; font-weight:800; color:#1E293B; }
    .cm-sub { margin:0; font-size:13.5px; line-height:1.6; color:#4B5563; max-width:42rem; }
    .cm-prog { margin-top:10px; max-width:26rem; }
    .cm-prog-bar { position:relative; height:7px; border-radius:9999px; background:rgba(255,255,255,.75); overflow:visible; }
    .cm-prog-bar i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--cm-mid),var(--cm-out)); transition:width .6s ease; }
    .cm-prog small { display:block; margin-top:5px; font-size:12px; color:#6B7280; }
    .cm-prog small b { color:var(--cm-ink); }
    .cm-cta { position:relative; flex:none; align-self:center; border:0; cursor:pointer; background:#fff; color:var(--cm-ink,#B35900); font-weight:700; font-size:13.5px;
      padding:10px 18px; border-radius:9999px; box-shadow:0 6px 16px -8px rgba(46,52,64,.35); white-space:nowrap; }
    .cm-cta:hover { background:#FFFDFB; }
    .cm-banner.is-milestone { border-color:var(--cm-out); box-shadow:0 14px 30px -18px var(--cm-out); }
    .cm-banner.is-milestone .cm-title { color:var(--cm-ink); }
    @media (max-width:640px) {
      .cm-banner { flex-wrap:wrap; padding:16px; gap:12px 14px; } .cm-flame { width:56px; height:70px; } .cm-title { font-size:17px; }
      .cm-cta { width:100%; text-align:center; }
    }
    /* Ngọn lửa trong khối "Tổng quan" */
    #streak-flame .cm-flame-svg { display:block; }
    @media (prefers-reduced-motion: reduce) { .cm-banner { animation:none; } .cm-flame-svg, .cm-flame-in { animation:none; } }`;
    document.head.appendChild(st);
  }

  /* ---------- Vẽ khối chào mừng ---------- */
  let host = null;
  function info() {
    const i = window.tnStreakInfo;
    return i ? i : { current: 0, longest: 0, studiedToday: false, hasHistory: false };
  }
  function render() {
    if (!host) return;
    const { current: n, studiedToday, hasHistory } = info();
    const tier = tierOf(n);
    let title, sub, milestone = false;
    if (n === 0 && !hasHistory) [title, sub] = pick(MSG.first);
    else if (n === 0) [title, sub] = pick(MSG.reset);
    else if (!studiedToday) [title, sub] = pick(MSG.back);
    else if (MILESTONES.includes(n)) { [title, sub] = MSG.milestone[n]; milestone = true; }
    else if (n === 1) [title, sub] = pick(MSG.doneFirst);
    else [title, sub] = pickBy(MSG.done, n - 2);   // chuỗi 2 → câu đầu, 3 → câu thứ hai… (không lặp trong 12 ngày)
    title = fill(title, n); sub = fill(sub, n);

    // Thanh tiến độ tới mốc kế tiếp
    const next = MILESTONES.find(m => m > n);
    const prev = [0, ...MILESTONES].filter(m => m <= n).pop();
    let prog = '';
    if (next) {
      const pct = Math.round(((n - prev) / (next - prev)) * 100);
      const nt = tierOf(next);
      prog = `<div class="cm-prog"><div class="cm-prog-bar"><i style="width:${Math.max(4, pct)}%"></i></div>
        <small>Còn <b>${next - n} ngày</b> nữa tới mốc ${next} ngày${next === 90 ? ' (quà bí mật 🎁)' : ' — ngọn lửa đổi sang <b>' + esc(nt.name.replace('lửa ', '')) + '</b>'}</small></div>`;
    }
    const chip = n > 0 ? `<span class="cm-chip">🔥 Chuỗi ${n} ngày · ${esc(tier.name)}</span>` : `<span class="cm-chip">Hành trình mới</span>`;
    const html = `<div class="cm-flame ${n === 0 ? 'is-off' : ''}">${flameSVG(tier, 60)}</div>
      <div class="cm-body">${chip}<h2 class="cm-title">${esc(title)}</h2><p class="cm-sub">${esc(sub)}</p>${prog}</div>
      <button class="cm-cta" type="button" data-cm-go>${studiedToday ? 'Học thêm một chút' : 'Học ngay'} →</button>`;
    if (host.__last === html) return;
    host.__last = html;
    host.className = 'cm-banner' + (milestone ? ' is-milestone' : '');
    host.style.setProperty('--cm-bg', tier.bg); host.style.setProperty('--cm-glow', tier.glow); host.style.setProperty('--cm-ink', tier.ink);
    host.style.setProperty('--cm-out', tier.out); host.style.setProperty('--cm-mid', tier.mid);
    host.innerHTML = html;
    paintWidgetFlame(tier, n);
  }

  /* ---------- Ngọn lửa ở khối Tổng quan (Học tiếng Trung) ---------- */
  function paintWidgetFlame(tier, n) {
    const el = document.getElementById('streak-flame'); if (!el) return;
    const key = tier.key + (n > 0 ? '1' : '0');
    if (el.dataset.cmKey === key) return;
    el.dataset.cmKey = key;
    el.innerHTML = flameSVG(tier, 34);
    el.title = n > 0 ? 'Chuỗi ' + n + ' ngày · ' + tier.name : 'Học hôm nay để thắp lửa';
  }

  function init() {
    const home = document.getElementById('home'); if (!home) return;
    css();
    host = document.createElement('section');
    host.id = 'cm-welcome'; host.setAttribute('aria-label', 'Chào mừng');
    const anchor = document.getElementById('ts-card') || document.getElementById('qs-home') || home.querySelector('.grid.md\\:grid-cols-3');
    if (anchor) anchor.parentNode.insertBefore(host, anchor); else home.appendChild(host);
    host.addEventListener('click', e => {
      if (!e.target.closest('[data-cm-go]')) return;
      const nav = document.querySelector('[data-nav-btn][data-target="chinese"]') || document.querySelector('.nav-jump[data-target="chinese"]');
      if (nav) nav.click();
      setTimeout(() => { try { window.tnHocOpen && window.tnHocOpen('vocab-games'); } catch (err) {} }, 80);
    });
    render();
    document.addEventListener('tn-streak', render);
    document.addEventListener('tn-auth', () => setTimeout(render, 600));   // đăng nhập xong → tiến độ được đồng bộ
    window.addEventListener('hashchange', () => { if (home.classList.contains('is-active')) render(); });
  }
  window.tnFlame = { tierOf, flameSVG, TIERS, preview: n => (MILESTONES.includes(n) ? MSG.milestone[n] : n === 1 ? MSG.doneFirst[0] : pickBy(MSG.done, n - 2)).map(t => fill(t, n)) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
