/* =====================================================================
   PHẦN THƯỞNG THÁNG — top 3 bảng xếp hạng tháng được mở VIP 30 ngày
   ---------------------------------------------------------------------
   Phần thưởng: "Bài mẫu HSKK (VIP)" + "Bổ túc văn hoá Trung Quốc (VIP)" trong 30 ngày.

   Trao / thu hồi TỰ ĐỘNG, không cần bấm gì: mỗi khi tài khoản QUẢN TRỊ (cô Thúy) mở web,
   trang tự làm trong nền (chỉ quản trị mới có quyền sửa hồ sơ người khác theo luật Firestore):
     1) Thu hồi phần thưởng đã quá 30 ngày (trả quyền về như trước khi được thưởng).
     2) Nếu tháng trước chưa trao: lấy top 10 bảng tháng trước, bỏ tài khoản giáo viên/quản trị,
        chọn 3 người điểm cao nhất → bật quyền + ghi users/{uid}.monthReward
          { month: "m-2026-10", rank, until: <ms>, granted: [quyền do phần thưởng bật] }.
     3) Ghi danh sách vinh danh vào settings/defaults.rewards để mọi người cùng xem.
   tinh-nang-moi.js → can(): quyền do phần thưởng bật tự hết hiệu lực khi qua "until",
   kể cả khi quản trị chưa mở web để thu hồi.
   ===================================================================== */
(function () {
  const TZ = 7;                                   // giờ Việt Nam
  const DAYS = 30;
  const PERMS = ['can_access_hskk', 'can_access_culture'];
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function monthId(offset = 0) {                  // offset -1 = tháng trước
    const d = new Date(Date.now() + TZ * 3600e3);
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
    return { id: `m-${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}`, label: `tháng ${x.getUTCMonth() + 1}/${x.getUTCFullYear()}` };
  }
  const fmtDate = ms => new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isStaffRole = r => r === 'admin' || r === 'teacher';

  /* ---------- Quản trị: trao + thu hồi ---------- */
  let running = false;
  async function adminRun(fb) {
    if (running) return; running = true;
    const { db, D } = fb;
    try {
      const snap = await D.getDocs(D.collection(db, 'users'));
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const now = Date.now();

      // 1) Thu hồi phần thưởng hết hạn
      for (const u of users) {
        const r = u.monthReward;
        if (!r || r.revoked || !(r.until <= now)) continue;
        const perms = { ...(u.permissions || {}) };
        (r.granted || []).forEach(p => { const v = (r.prev || {})[p]; if (typeof v === 'boolean') perms[p] = v; else delete perms[p]; });
        await D.updateDoc(D.doc(db, 'users', u.id), { permissions: perms, 'monthReward.revoked': true });
        u.permissions = perms; u.monthReward = { ...r, revoked: true };   // để bước trao thưởng bên dưới thấy quyền đã trả lại
      }

      // 2) Trao thưởng tháng trước (mỗi tháng 1 lần)
      const prev = monthId(-1);
      if (users.some(u => u.monthReward && u.monthReward.month === prev.id)) return;
      const top = await D.getDocs(D.query(D.collection(db, 'leaderboard', prev.id, 'scores'), D.orderBy('points', 'desc'), D.limit(10)));
      const byId = new Map(users.map(u => [u.id, u]));
      const winners = top.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(s => (s.points || 0) > 0 && byId.has(s.id) && !isStaffRole(byId.get(s.id).role))
        .slice(0, 3);
      if (!winners.length) return;
      const until = now + DAYS * 864e5;
      for (const [i, w] of winners.entries()) {
        const u = byId.get(w.id);
        const perms = { ...(u.permissions || {}) };
        const old = u.monthReward && !u.monthReward.revoked && u.monthReward.until > now ? u.monthReward.granted || [] : [];
        const granted = PERMS.filter(p => old.includes(p) || perms[p] !== true);   // không đụng quyền cô đã bật sẵn
        const prevVals = {};
        granted.forEach(p => { prevVals[p] = old.includes(p) ? ((u.monthReward.prev || {})[p] ?? null) : (typeof perms[p] === 'boolean' ? perms[p] : null); perms[p] = true; });
        await D.updateDoc(D.doc(db, 'users', w.id), {
          permissions: perms,
          monthReward: { month: prev.id, label: prev.label, rank: i + 1, points: w.points || 0, until, granted, prev: prevVals, grantedAt: now, revoked: false },
        });
      }
      // 3) Danh sách vinh danh công khai
      try {
        await D.setDoc(D.doc(db, 'settings', 'defaults'), {
          rewards: { month: prev.id, label: prev.label, until, winners: winners.map((w, i) => ({ rank: i + 1, name: String(w.name || 'Học viên').slice(0, 60), points: w.points || 0 })) },
        }, { merge: true });
      } catch (e) { console.warn('tndihoc: chưa ghi được danh sách vinh danh', e); }
      console.info('tndihoc: đã trao phần thưởng', prev.label, winners.map(w => w.name));
    } catch (e) {
      console.warn('tndihoc: phần thưởng tháng lỗi', e);
    } finally { running = false; }
  }

  /* ---------- Hiển thị công khai ở bảng xếp hạng ---------- */
  let hall = null;
  async function loadHall(fb) {
    try {
      const s = await fb.D.getDoc(fb.D.doc(fb.db, 'settings', 'defaults'));
      hall = s.exists() ? s.data().rewards || null : null;
    } catch (e) { hall = null; }
    render();
  }
  function render() {
    const el = document.getElementById('lb-reward'); if (!el) return;
    const medals = ['🥇', '🥈', '🥉'];
    const me = window.tnAuth && window.tnAuth.profile && window.tnAuth.profile.monthReward;
    const mine = me && !me.revoked && me.until > Date.now()
      ? `<div class="lb-rw-me">🎉 Chúc mừng bạn đạt <b>hạng ${me.rank}</b> bảng xếp hạng ${esc(me.label || '')}! Bài mẫu HSKK (VIP) và Bài đọc văn hoá (VIP) đã được mở cho bạn đến hết ngày <b>${fmtDate(me.until - 1)}</b>.</div>` : '';
    const showHall = hall && Array.isArray(hall.winners) && hall.winners.length && hall.month === monthId(-1).id;
    el.innerHTML = `
      <div class="lb-rw-h">🎁 Phần thưởng tháng</div>
      <p class="lb-rw-p"><b>Top 3</b> bảng xếp hạng tháng được <b>mở miễn phí 1 tháng</b>: <b>📝 Bài mẫu HSKK (VIP)</b> và <b>🏮 Bài đọc văn hoá Trung Quốc (VIP)</b>. Phần thưởng được trao tự động vào đầu tháng sau.</p>
      ${showHall ? `<div class="lb-rw-hall"><span class="lb-rw-hall-h">Vinh danh ${esc(hall.label)}</span>${hall.winners.map(w => `<span class="lb-rw-w">${medals[w.rank - 1] || ''} ${esc(w.name)}</span>`).join('')}</div>` : ''}
      ${mine}`;
  }

  /* ---------- Thông báo 1 lần cho người được thưởng ---------- */
  function congrats() {
    const r = window.tnAuth && window.tnAuth.profile && window.tnAuth.profile.monthReward;
    if (!r || r.revoked || !(r.until > Date.now())) return;
    const key = 'tn_reward_seen_' + r.month;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { return; }
    const wrap = document.createElement('div'); wrap.className = 'lb-rw-pop';
    wrap.innerHTML = `<div class="lb-rw-pop-box"><div class="lb-rw-pop-ico">${['🥇', '🥈', '🥉'][r.rank - 1] || '🏆'}</div>
      <b>Chúc mừng bạn đạt hạng ${r.rank} ${esc(r.label || '')}!</b>
      <p>Phần thưởng của bạn: <b>Bài mẫu HSKK (VIP)</b> và <b>Bài đọc văn hoá Trung Quốc (VIP)</b> được mở đến hết ngày <b>${fmtDate(r.until - 1)}</b>. Tiếp tục cố gắng nhé! 加油！</p>
      <button type="button">Tuyệt vời!</button></div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('button')) wrap.remove(); });
    document.body.appendChild(wrap);
  }

  const css = document.createElement('style');
  css.textContent = `
  .lb-reward { margin:14px 0 4px; padding:14px 16px; border-radius:14px; background:#FFF6EC; border:1px solid #FFD9A8; font-size:13.5px; color:#2E3440; }
  .lb-rw-h { font-weight:800; color:#B35900; margin-bottom:4px; }
  .lb-rw-p { line-height:1.6; color:#4B5563; }
  .lb-rw-hall { display:flex; flex-wrap:wrap; align-items:center; gap:6px 10px; margin-top:10px; }
  .lb-rw-hall-h { font-weight:700; font-size:12.5px; color:#7A3D00; }
  .lb-rw-w { background:#fff; border:1px solid #FFE8D1; border-radius:9999px; padding:3px 11px; font-weight:600; font-size:13px; }
  .lb-rw-me { margin-top:10px; padding:10px 12px; border-radius:12px; background:#fff; border:1px dashed #FF9A3D; color:#7A3D00; line-height:1.6; }
  .lb-rw-pop { position:fixed; inset:0; z-index:1001; background:rgba(46,52,64,.4); display:flex; align-items:center; justify-content:center; padding:16px; }
  .lb-rw-pop-box { max-width:380px; background:#fff; border-radius:20px; padding:22px 22px 18px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,.2); animation:fadeUp .3s ease both; }
  .lb-rw-pop-ico { font-size:48px; line-height:1.1; margin-bottom:6px; }
  .lb-rw-pop-box b { color:#2E3440; } .lb-rw-pop-box p { font-size:13.5px; color:#4B5563; line-height:1.6; margin:8px 0 14px; }
  .lb-rw-pop-box button { padding:9px 22px; border-radius:12px; background:#FF7D00; color:#fff; font-weight:700; font-size:14px; }`;
  document.head.appendChild(css);

  async function onAuth() {
    render();
    const fb = window.tnEnsureFb ? await window.tnEnsureFb().catch(() => null) : null;
    if (!fb) return;
    const p = window.tnAuth && window.tnAuth.profile;
    if (window.tnAuth && window.tnAuth.user && p && p.role === 'admin') await adminRun(fb);
    loadHall(fb);
    congrats();
  }
  document.addEventListener('tn-auth', () => { onAuth(); });
  document.querySelectorAll('[data-game-tab="leaderboard"]').forEach(t => t.addEventListener('click', render));
  render();
  if (window.tnAuth) onAuth();
})();
