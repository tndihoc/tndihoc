/* =====================================================================
   ĐIỂM HỌC TẬP — điểm chung cho bảng xếp hạng tuần / tháng
   ---------------------------------------------------------------------
   Mọi hoạt động học trên web đều được cộng điểm theo 3 nhóm (tham khảo cách tính XP của
   Duolingo: mỗi bài ~10–20 XP, thưởng thêm khi làm đúng liên tiếp / vượt màn; và bài học
   của Memrise: bảng xếp hạng bị "cày" điểm nên phải có giới hạn mỗi ngày):

   1) TỪ VỰNG MỚI NHỚ ĐƯỢC (từ chưa từng được ghi nhớ trước đây)
        • trả lời đúng trong trò chơi (đã được kiểm tra) ........ +5 / từ  (tối đa 40 từ / ngày)
        • tự bấm "Đã nhớ" ở Flashcard (tự đánh giá, lật rất nhanh) +2 / từ (tối đa 30 từ / ngày)
   2) THỜI GIAN ÔN TẬP LIÊN TỤC (nghỉ quá 2 phút giữa 2 thao tác là ngắt phiên)
        • mỗi phút học ........................................... +1      (tối đa 90 phút / ngày)
        • mỗi mốc 10 phút liên tục trong 1 phiên ................. +10
   3) ĐIỂM THƯỞNG
        • mỗi câu trả lời / lần ghép đúng trong trò chơi ......... +1      (tối đa 300 / ngày)
        • hoàn thành 1 ván / vượt 1 màn .......................... +10
        • ván hoàn hảo hoặc thử thách khó ........................ +5 thêm (tối đa 20 ván thưởng / ngày)
   Lật thẻ flashcard KHÔNG được điểm riêng — chỉ tính vào thời gian học và từ "Đã nhớ".

   Điểm cộng dồn trên máy rồi được gửi lên bảng xếp hạng (auth.js → tnSubmitScore) mỗi 2 phút,
   khi kết thúc 1 ván và khi rời trang. Chưa đăng nhập: điểm được giữ lại, đăng nhập là gửi.
   API cho các trò chơi:
     window.tnPoints.correct(n = 1)                            — trả lời / ghép đúng
     window.tnPoints.round({ done, perfect, challenge }, noteEl) — kết thúc 1 ván
     window.tnPoints.today()                                    — điểm hôm nay theo 3 nhóm
   trackWordMemorized(word, 'flashcard') / trackStudyActivity() được bọc lại để tự cộng điểm.
   ===================================================================== */
(function () {
  const LS = 'tn_points_v1';
  const VOCAB_KEY = 'tn_vocab_mastery_v1';          // dữ liệu "từ đã ghi nhớ" (index.html)
  const RULE = {
    newGame: 5, newGameMax: 40,
    newFc: 2, newFcMax: 30,
    minute: 1, minuteMax: 90,
    block: 10, blockMs: 10 * 60e3,
    gapMs: 2 * 60e3,
    correct: 1, correctMax: 300,
    round: 10, perfect: 5, roundMax: 20,
  };
  const FLUSH_MS = 2 * 60e3;

  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const blank = () => ({ date: todayKey(), n: { newGame: 0, newFc: 0, activeMs: 0, minutes: 0, correct: 0, rounds: 0 }, pts: { vocab: 0, time: 0, bonus: 0 } });
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    if (!s || typeof s !== 'object') s = {};
    if (!s.day || s.day.date !== todayKey()) s.day = blank();
    s.pending = Math.max(0, Math.min(5000, Number(s.pending) || 0));
    s.sess = s.sess || { start: 0, last: 0, blocks: 0 };
    return s;
  }
  let S = load();
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} };
  const fresh = () => { if (S.day.date !== todayKey()) { S.day = blank(); S.sess = { start: 0, last: 0, blocks: 0 }; } };

  function give(group, pts) {
    if (pts <= 0) return 0;
    S.day.pts[group] += pts; S.pending += pts; save();
    pop(pts);
    return pts;
  }

  /* ---------- Thời gian học liên tục ---------- */
  function onActivity() {
    fresh();
    const now = Date.now(), ss = S.sess;
    if (!ss.last || now - ss.last > RULE.gapMs) { ss.start = now; ss.blocks = 0; }
    else S.day.n.activeMs += now - ss.last;
    ss.last = now;
    let pts = 0;
    const mins = Math.min(RULE.minuteMax, Math.floor(S.day.n.activeMs / 60e3));
    if (mins > S.day.n.minutes) { pts += (mins - S.day.n.minutes) * RULE.minute; S.day.n.minutes = mins; }
    const blocks = Math.floor((now - ss.start) / RULE.blockMs);
    if (blocks > ss.blocks) {
      if (S.day.n.minutes < RULE.minuteMax) pts += (blocks - ss.blocks) * RULE.block;
      ss.blocks = blocks;
    }
    if (pts) give('time', pts); else save();
  }

  /* ---------- Trả lời đúng / kết thúc ván ---------- */
  function correct(n = 1) {
    fresh();
    const can = Math.max(0, Math.min(n, RULE.correctMax - S.day.n.correct));
    S.day.n.correct += can;
    return give('bonus', can * RULE.correct);
  }
  function round(o = {}, noteEl) {
    fresh();
    let pts = 0;
    if (o.done && S.day.n.rounds < RULE.roundMax) {
      S.day.n.rounds++;
      pts = RULE.round + (o.perfect || o.challenge ? RULE.perfect : 0);
      give('bonus', pts);
    }
    flush(noteEl, pts);
    return pts;
  }

  /* ---------- Từ mới nhớ được ---------- */
  function knownBefore(hanzi) {
    try {
      const d = JSON.parse(localStorage.getItem(VOCAB_KEY));
      return !!(d && d.days && Object.values(d.days).some(a => Array.isArray(a) && a.includes(hanzi)));
    } catch (e) { return false; }
  }
  function wrapMemorized() {
    const orig = window.trackWordMemorized;
    if (typeof orig !== 'function' || orig.__tnPts) return;
    const wrapped = function (word, source) {
      const hanzi = !word ? '' : typeof word === 'string' ? word.trim() : String(word.hanzi || '').trim();
      const isNew = hanzi && !knownBefore(hanzi);
      const r = orig.apply(this, arguments);
      if (hanzi) {
        fresh();
        const fc = source === 'flashcard';
        if (!fc) correct(1);
        if (isNew) {
          const k = fc ? 'newFc' : 'newGame';
          if (S.day.n[k] < RULE[k + 'Max']) { S.day.n[k]++; give('vocab', fc ? RULE.newFc : RULE.newGame); }
        }
      }
      return r;
    };
    wrapped.__tnPts = true;
    window.trackWordMemorized = wrapped;
  }
  function wrapActivity() {
    const orig = window.trackStudyActivity;
    if (typeof orig !== 'function' || orig.__tnPts) return;
    const wrapped = function () { const r = orig.apply(this, arguments); onActivity(); return r; };
    wrapped.__tnPts = true;
    window.trackStudyActivity = wrapped;
  }

  /* ---------- Gửi lên bảng xếp hạng ---------- */
  let flushing = false;
  async function flush(noteEl, roundPts) {
    const user = window.tnAuth && window.tnAuth.user;
    const role = window.tnAuth && window.tnAuth.profile && window.tnAuth.profile.role;
    if (role === 'admin' || role === 'teacher') { S.pending = 0; save(); return; }   // giáo viên không tham gia xếp hạng
    if (!user || typeof window.tnSubmitScore !== 'function') {
      if (noteEl && roundPts) { noteEl.textContent = `+${roundPts} điểm thưởng ván này. Đăng nhập để điểm được tính vào bảng xếp hạng tuần & tháng.`; noteEl.className = 'lb-note is-guest'; }
      return;
    }
    if (flushing || S.pending <= 0) return;
    flushing = true;
    const pts = Math.min(20000, S.pending);
    S.pending -= pts; save();
    try { await window.tnSubmitScore('study', pts, noteEl || null); }
    catch (e) { S.pending += pts; save(); }
    finally { flushing = false; }
  }

  /* ---------- "+N điểm" nhỏ ở góc màn hình (gộp lại, không làm phiền) ---------- */
  let popEl = null, popSum = 0, popT = 0;
  function pop(pts) {
    popSum += pts;
    if (!popEl) {
      popEl = document.createElement('div'); popEl.className = 'tn-pts-pop'; popEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(popEl);
    }
    popEl.textContent = `⭐ +${popSum} điểm`;
    popEl.classList.remove('is-show'); void popEl.offsetWidth; popEl.classList.add('is-show');
    clearTimeout(popT); popT = setTimeout(() => { popSum = 0; popEl.classList.remove('is-show'); }, 1800);
    renderToday();
  }

  /* ---------- Điểm hôm nay (hiện ở bảng xếp hạng) ---------- */
  function today() { fresh(); return { ...S.day.pts, total: S.day.pts.vocab + S.day.pts.time + S.day.pts.bonus, n: { ...S.day.n } }; }
  function renderToday() {
    const el = document.getElementById('lb-today'); if (!el) return;
    const t = today();
    el.innerHTML = `<span class="lb-today-h">Hôm nay bạn đã tích được <b>${t.total}</b> điểm</span>
      <span class="lb-today-g"><b>📚 ${t.vocab}</b> từ vựng mới (${t.n.newGame + t.n.newFc} từ)</span>
      <span class="lb-today-g"><b>⏱ ${t.time}</b> thời gian học (${t.n.minutes} phút)</span>
      <span class="lb-today-g"><b>🎯 ${t.bonus}</b> thưởng làm đúng, vượt màn</span>`;
  }

  const css = document.createElement('style');
  css.textContent = `
  .tn-pts-pop { position:fixed; left:16px; bottom:22px; z-index:997; background:#fff; color:#B35900; font-weight:700; font-size:13.5px;
    padding:7px 14px; border-radius:9999px; border:1px solid #FFD9A8; box-shadow:0 6px 16px rgba(179,89,0,.18);
    opacity:0; transform:translateY(8px); transition:opacity .25s ease, transform .25s ease; pointer-events:none; }
  .tn-pts-pop.is-show { opacity:1; transform:translateY(0); }
  .lb-today { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:12px; padding:12px 16px; border-radius:14px; background:#FFF6EC; border:1px solid #FFE8D1; font-size:13px; color:#7A3D00; }
  .lb-today-h { width:100%; font-size:13.5px; } .lb-today b { color:#B35900; }
  @media (prefers-reduced-motion: reduce) { .tn-pts-pop { transition:none; } }`;
  document.head.appendChild(css);

  function init() {
    wrapMemorized(); wrapActivity();
    renderToday();
    setInterval(() => flush(), FLUSH_MS);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    document.addEventListener('tn-auth', () => setTimeout(() => flush(), 1500));
    document.querySelectorAll('[data-game-tab="leaderboard"]').forEach(t => t.addEventListener('click', () => { renderToday(); flush(); }));
  }
  window.tnPoints = { correct, round, today, flush: () => flush(), RULE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
