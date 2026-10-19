/* =====================================================================
   PHẦN THƯỞNG THÁNG — bản chạy tự động trên GitHub Actions (mỗi ngày 00:10 giờ VN)
   ---------------------------------------------------------------------
   Cùng logic với phan-thuong-thang.js (bản chạy trong trình duyệt của quản trị):
     1) Thu hồi phần thưởng đã quá hạn 30 ngày, trả quyền về như trước khi được thưởng.
     2) Trao thưởng tháng trước (mỗi tháng 1 lần) cho 3 HỌC VIÊN điểm cao nhất bảng tháng
        — quản trị / giáo viên vẫn có thể đứng trên bảng nhưng không nhận và không bị thu hồi thưởng.
     3) Ghi danh sách vinh danh vào settings/defaults.rewards.
   Cần secret FIREBASE_SERVICE_ACCOUNT = nội dung file khoá JSON của tài khoản dịch vụ Firebase.
   Chạy thử không ghi gì: DRY_RUN=1 node scripts/phan-thuong-thang.mjs
   ===================================================================== */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const TZ = 7, DAYS = 30;
const PERMS = ['can_access_hskk', 'can_access_culture'];
const DRY = !!process.env.DRY_RUN;
const FIRST_MONTH = 'm-2026-10';   // phần thưởng bắt đầu áp dụng từ bảng tháng 10/2026 (công bố 19/10/2026)
const pad = n => String(n).padStart(2, '0');
const isStaffRole = r => r === 'admin' || r === 'teacher';
function monthId(offset = 0) {
  const d = new Date(Date.now() + TZ * 3600e3);
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
  return { id: `m-${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}`, label: `tháng ${x.getUTCMonth() + 1}/${x.getUTCFullYear()}` };
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) { console.error('Thiếu secret FIREBASE_SERVICE_ACCOUNT'); process.exit(1); }
initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore();
const update = async (ref, data, what) => { console.log((DRY ? '[chạy thử] ' : '') + what); if (!DRY) await ref.update(data); };

const now = Date.now();
const snap = await db.collection('users').get();
const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

// 1) Thu hồi
for (const u of users) {
  const r = u.monthReward;
  if (!r || r.revoked || !(r.until <= now) || isStaffRole(u.role)) continue;
  const perms = { ...(u.permissions || {}) };
  (r.granted || []).forEach(p => { const v = (r.prev || {})[p]; if (typeof v === 'boolean') perms[p] = v; else delete perms[p]; });
  await update(db.collection('users').doc(u.id), { permissions: perms, 'monthReward.revoked': true }, `Thu hồi thưởng ${r.label || r.month}: ${u.name || u.email || u.id}`);
  u.permissions = perms; u.monthReward = { ...r, revoked: true };
}

// 2) Trao thưởng tháng trước
const prev = monthId(-1);
if (prev.id < FIRST_MONTH) {
  console.log(`Phần thưởng áp dụng từ ${FIRST_MONTH} — chưa trao cho ${prev.label}.`);
} else if (users.some(u => u.monthReward && u.monthReward.month === prev.id)) {
  console.log(`Đã trao thưởng ${prev.label} rồi — bỏ qua.`);
} else {
  const top = await db.collection('leaderboard').doc(prev.id).collection('scores').orderBy('points', 'desc').limit(10).get();
  const byId = new Map(users.map(u => [u.id, u]));
  const winners = top.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(s => (s.points || 0) > 0 && byId.has(s.id) && !isStaffRole(byId.get(s.id).role))
    .slice(0, 3);
  if (!winners.length) console.log(`Bảng ${prev.label} chưa có học viên nào có điểm.`);
  const until = now + DAYS * 864e5;
  for (const [i, w] of winners.entries()) {
    const u = byId.get(w.id);
    const perms = { ...(u.permissions || {}) };
    const old = u.monthReward && !u.monthReward.revoked && u.monthReward.until > now ? u.monthReward.granted || [] : [];
    const granted = PERMS.filter(p => old.includes(p) || perms[p] !== true);
    const prevVals = {};
    granted.forEach(p => { prevVals[p] = old.includes(p) ? ((u.monthReward.prev || {})[p] ?? null) : (typeof perms[p] === 'boolean' ? perms[p] : null); perms[p] = true; });
    await update(db.collection('users').doc(w.id), {
      permissions: perms,
      monthReward: { month: prev.id, label: prev.label, rank: i + 1, points: w.points || 0, until, granted, prev: prevVals, grantedAt: now, revoked: false },
    }, `Trao thưởng hạng ${i + 1} ${prev.label}: ${w.name} (${w.points} điểm)`);
  }
  if (winners.length && !DRY) {
    await db.collection('settings').doc('defaults').set({
      rewards: { month: prev.id, label: prev.label, until, winners: winners.map((w, i) => ({ rank: i + 1, name: String(w.name || 'Học viên').slice(0, 60), points: w.points || 0 })) },
    }, { merge: true });
  }
}
console.log('Xong.');
