/* =====================================================================
   PIKACHU LƯỢNG TỪ 连连看 — tab "🀄 Pikachu lượng từ" trong khu Trò chơi
   ---------------------------------------------------------------------
   Luật kiểu Pikachu (Onet): nối 1 ô LƯỢNG TỪ (viền cam) với 1 ô DANH TỪ đi được với nó,
   bằng một đường nối đi qua ô trống và rẽ tối đa 2 lần (được đi vòng ra ngoài mép bảng).
     • Một lượng từ có thể đi với nhiều danh từ (条 → 鱼 / 河 / 裤子…) và ngược lại:
       mọi cặp đúng đều được chấp nhận.
     • Nếu người chơi ghép một cặp đúng khác với cách bảng được tạo ra, game tự kiểm tra
       các ô còn lại vẫn ghép hết được; nếu không, đổi chữ của ô danh từ bị "lẻ" cho khớp.
     • Hết đường nối → tự xáo bảng. Ghép sai → trừ 5 giây và hiện lượng từ đúng.
     • Từ màn 4, sau mỗi lần ghép các ô dồn về một phía (xuống / lên / trái / phải).
   Người chơi chọn trình độ riêng (KHÔNG dùng ô chọn cấp HSK chung của khu Trò chơi):
     sơ cấp = lượng từ + danh từ HSK1–3 · trung cấp = HSK1–5 · cao cấp = tất cả.
   Dữ liệu ở luong-tu-data.js (bảng 200 lượng từ, đã gắn cấp HSK).
   Kỷ lục lưu trên máy theo từng trình độ: localStorage "tn_pk_best_v2" = { so|trung|cao: { level, score } }.
   File này tự chèn giao diện + CSS vào <div id="game-pikachu">.
   ===================================================================== */

import { CLASSIFIERS, NOUNS, PHRASE_VI } from './luong-tu-data.js?v=3';

const LS_BEST = 'tn_pk_best_v2';
const LS_BEST_OLD = 'tn_pk_best_v1';
const LS_TR = 'tn_pk_trinhdo';
const TRINH = {
  so: { name: 'Sơ cấp', zh: '初级', sub: 'HSK 1–3', max: 3 },
  trung: { name: 'Trung cấp', zh: '中级', sub: 'HSK 1–5', max: 5 },
  cao: { name: 'Cao cấp', zh: '高级', sub: 'HSK 1–9 · tất cả', max: 99 },
};
// Cấp HSK 0 = không có trong danh sách HSK → chỉ xuất hiện ở cao cấp
const inLevel = (hsk, tr) => TRINH[tr].max >= 99 || (hsk >= 1 && hsk <= TRINH[tr].max);
const okCl = (c, tr) => inLevel(CLASSIFIERS[c][2], tr);
const okNoun = (n, tr) => inLevel(n.hsk, tr);
const LS_PY = 'tn_pk_pinyin';
const LS_VOICE = 'tn_pk_voice';
const PENALTY = 5;                       // giây bị trừ khi ghép sai
const IDLE_NUDGE = 20;                   // giây không thao tác → làm nổi bật nút Gợi ý / Xáo
const TIME_WARN = 30;                    // còn ≤ 30 giây → thanh thời gian nhấp nháy cảnh báo
const PRAISE = ['太牛了！', '你很棒！', '干得漂亮！', '很好！', '太棒了！', '真厉害！', '好样的！', '非常好！', '加油！'];
const PRAISE_STREAK = ['连连看高手！', '越来越厉害了！', '一口气连对！'];
const SHIFTS = ['down', 'left', 'up', 'right', 'none'];
const SHIFT_TXT = { none: '', down: 'các ô dồn xuống dưới', up: 'các ô dồn lên trên', left: 'các ô dồn sang trái', right: 'các ô dồn sang phải' };

function levelCfg(L) {
  if (L === 1) return { rows: 4, cols: 6, time: 180, shift: 'none' };
  if (L === 2) return { rows: 5, cols: 6, time: 200, shift: 'none' };
  if (L === 3) return { rows: 6, cols: 6, time: 230, shift: 'none' };
  if (L === 4) return { rows: 6, cols: 8, time: 300, shift: 'down' };
  if (L === 5) return { rows: 6, cols: 8, time: 300, shift: 'left' };
  return { rows: 7, cols: 8, time: Math.max(260, 340 - (L - 6) * 10), shift: SHIFTS[(L - 6) % SHIFTS.length] };
}

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const call = (name, ...a) => { try { return typeof window[name] === 'function' ? window[name](...a) : undefined; } catch (e) { console.warn(name, e); } };
const rnd = n => (Math.random() * n) | 0;
const pick = arr => arr[rnd(arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => Number(n).toLocaleString('vi-VN');
const clPy = c => CLASSIFIERS[c][0];
// 一 đọc yí trước thanh 4, yì trước thanh 1/2/3
const yiPy = c => /[àèìòùǜ]/.test(clPy(c)) ? 'yí' : 'yì';
const phrasePy = (c, n) => `${yiPy(c)} ${clPy(c)} ${n.p}`;
// Nghĩa cụ thể của cụm (一粒米饭 → một hạt cơm); thiếu trong bảng thì ghép tạm từ nghĩa lượng từ + danh từ
const phraseVi = (c, n) => PHRASE_VI[c + n.h] || `một ${CLASSIFIERS[c][1].split(/[,;(]/)[0].trim()} ${n.v}`;

const panel = $('game-pikachu');

function init() {
  injectCss();
  panel.innerHTML = TEMPLATE;

  const el = {
    setup: $('pk-setup'), play: $('pk-play'), result: $('pk-result'),
    start: $('pk-start'), restart1: $('pk-restart1'), startLv: $('pk-start-level'),
    bestLv: $('pk-best-level'), trs: $('pk-trs'), trName: $('pk-tr-name'), trPill: $('pk-tr-pill'), bestSc: $('pk-best-score'), py: $('pk-py'), voice: $('pk-voice'),
    board: $('pk-board'), svg: $('pk-svg'), lv: $('pk-lv'), left: $('pk-left'), score: $('pk-score'),
    time: $('pk-time'), bar: $('pk-bar'), info: $('pk-info'), log: $('pk-log'), shiftNote: $('pk-shift'),
    hint: $('pk-hint'), hintN: $('pk-hint-n'), shuf: $('pk-shuf'), shufN: $('pk-shuf-n'), quit: $('pk-quit'),
    wrap: $('pk-board-wrap'), timePill: $('pk-time-pill'),
  };

  /* ---------------- Kỷ lục + tuỳ chọn ---------------- */
  let tr = 'so';
  try { if (TRINH[localStorage.getItem(LS_TR)]) tr = localStorage.getItem(LS_TR); } catch (e) {}
  const loadAll = () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(LS_BEST)) || {}; } catch (e) {}
    if (!all.cao) { try { const old = JSON.parse(localStorage.getItem(LS_BEST_OLD)); if (old) all.cao = old; } catch (e) {} }
    return all;
  };
  const loadBest = (t = tr) => loadAll()[t] || { level: 1, score: 0 };
  const saveBest = (b, t = tr) => { const all = loadAll(); all[t] = b; try { localStorage.setItem(LS_BEST, JSON.stringify(all)); } catch (e) {} };
  try { el.py.checked = localStorage.getItem(LS_PY) !== '0'; el.voice.checked = localStorage.getItem(LS_VOICE) !== '0'; } catch (e) {}
  el.py.addEventListener('change', () => { try { localStorage.setItem(LS_PY, el.py.checked ? '1' : '0'); } catch (e) {} panel.classList.toggle('pk-nopy', !el.py.checked); });
  el.voice.addEventListener('change', () => { try { localStorage.setItem(LS_VOICE, el.voice.checked ? '1' : '0'); } catch (e) {} });
  panel.classList.toggle('pk-nopy', !el.py.checked);
  const speak = t => { if (el.voice.checked && window.tnVoice) { try { window.tnVoice.speak(t, { rate: 0.85 }); } catch (e) {} } };

  function refreshSetup() {
    el.trs.querySelectorAll('[data-pk-tr]').forEach(btn => {
      const k = btn.dataset.pkTr; btn.classList.toggle('pk-tr-on', k === tr); btn.setAttribute('aria-pressed', k === tr);
      btn.querySelector('.pk-tr-best').textContent = 'Màn cao nhất: ' + loadBest(k).level;
    });
    el.trName.textContent = TRINH[tr].name;
    const b = loadBest();
    el.startLv.textContent = b.level; el.bestLv.textContent = b.level; el.bestSc.textContent = fmt(b.score || 0);
    el.restart1.classList.toggle('hidden', b.level <= 1);
  }
  el.trs.addEventListener('click', e => {
    const b = e.target.closest('[data-pk-tr]'); if (!b) return;
    tr = b.dataset.pkTr; try { localStorage.setItem(LS_TR, tr); } catch (x) {}
    refreshSetup();
  });
  refreshSetup();

  /* ---------------- Trạng thái ---------------- */
  let S = null;
  let uid = 1;
  const nodes = new Map();              // tile.id → DOM

  function show(which) {
    el.setup.classList.toggle('hidden', which !== 'setup');
    el.play.classList.toggle('hidden', which !== 'play');
    el.result.classList.toggle('hidden', which !== 'result');
  }
  function stop() {
    if (S) { S.dead = true; clearInterval(S.timer); }
    S = null; nodes.clear(); el.board.querySelectorAll('.pk-tile').forEach(d => d.remove());
    show('setup'); refreshSetup();
  }
  if (Array.isArray(window.gameStopHandlers)) window.gameStopHandlers.push(stop);
  el.quit.addEventListener('click', stop);
  el.start.addEventListener('click', () => startLevel(loadBest().level));
  el.restart1.addEventListener('click', () => startLevel(1));

  /* ---------------- Tạo màn ---------------- */
  function makePairs(n, t) {
    const pool = Object.keys(CLASSIFIERS).filter(c => okCl(c, t));
    const usedNoun = new Set(); const usedCl = new Map(); const pairs = [];
    const candOf = c => NOUNS.filter(x => x.cl.includes(c) && okNoun(x, t) && !usedNoun.has(x.h));
    // Mỗi lượng từ tối đa 2 lần; trình độ ít lượng từ (sơ cấp) không đủ thì nới dần lên 5 lần
    let cls = shuffle(pool); let cap = 2;
    while (pairs.length < n) {
      while (!cls.length && cap <= 5) {
        cls = shuffle(pool.filter(x => (usedCl.get(x) || 0) < cap && candOf(x).length));
        if (!cls.length) cap++;
      }
      if (!cls.length) break;
      const c = cls.shift();
      const cand = candOf(c);
      if (!cand.length) continue;
      const noun = pick(cand);
      usedNoun.add(noun.h); usedCl.set(c, (usedCl.get(c) || 0) + 1);
      pairs.push([c, noun]);
    }
    return pairs;
  }

  function startLevel(L) {
    const cfg = levelCfg(L);
    // Màn hình hẹp (điện thoại) → xoay bảng cho cao hơn rộng
    let { rows, cols } = cfg;
    if (panel.clientWidth && panel.clientWidth < 600 && cols > rows) [rows, cols] = [cols, rows];
    const shift = cfg.shift === 'none' ? 'none'
      : (rows !== cfg.rows ? { down: 'right', up: 'left', left: 'up', right: 'down' }[cfg.shift] : cfg.shift);
    const pairs = makePairs(rows * cols / 2, tr);
    if (S) { S.dead = true; clearInterval(S.timer); }
    S = { tr, L, R: rows, C: cols, shift, total: cfg.time, timeLeft: cfg.time, score: 0, sel: null, busy: false, dead: false,
          hints: 3, shufs: 2, grid: [], done: [], timer: null, last: Date.now(), streak: 0, lastMatch: 0,
          lastAct: Date.now(), nudged: false, warned: false };
    nodes.clear(); el.board.querySelectorAll('.pk-tile').forEach(d => d.remove());
    const tiles = [];
    pairs.forEach(([c, noun]) => { tiles.push({ id: uid++, k: 'c', c }); tiles.push({ id: uid++, k: 'n', n: noun }); });
    S.grid = Array.from({ length: rows + 2 }, () => new Array(cols + 2).fill(null));
    const pos = [];
    for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) pos.push([r, c]);
    shuffle(tiles).forEach((t, i) => { S.grid[pos[i][0]][pos[i][1]] = t; });
    if (!findMove()) reshuffle(true);

    // Viền ngoài (đường nối được đi vòng) chỉ rộng nửa ô → bảng rộng (cols + 1) ô, cao (rows + 1) ô
    el.board.style.setProperty('--c2', cols + 1); el.board.style.setProperty('--r2', rows + 1);
    el.board.style.aspectRatio = `${(cols + 1) * 4} / ${(rows + 1) * 5}`;
    S.ar = ((cols + 1) * 4) / ((rows + 1) * 5);
    el.svg.setAttribute('viewBox', `0 0 ${(cols + 1) * 4} ${(rows + 1) * 5}`);
    el.svg.innerHTML = '';
    el.shiftNote.textContent = shift === 'none' ? '' : `Màn này: sau mỗi lần nối, ${SHIFT_TXT[shift]}.`;
    el.info.innerHTML = `<p class="pk-tip">Bấm 1 ô <b class="pk-tip-c">lượng từ</b> rồi 1 ô <b>danh từ</b> đi được với nó.<br>Đường nối rẽ tối đa <b>2 lần</b>. Một lượng từ có thể hợp với nhiều danh từ — chọn cặp nào đúng cũng được!</p>`;
    el.log.innerHTML = '';
    el.trPill.textContent = `${TRINH[tr].name} · ${TRINH[tr].sub}`;
    show('play');
    fitBoard();
    render(); renderHud(); setNudge(false);
    // Đưa khu chơi lên ngay dưới thanh menu để thấy trọn bảng + thanh công cụ
    const hdr = document.querySelector('.site-header');
    requestAnimationFrame(() => {
      const top = el.play.getBoundingClientRect().top + window.scrollY - (hdr ? hdr.offsetHeight : 0) - 10;
      if (Math.abs(window.scrollY - top) > 4) window.scrollTo({ top, behavior: 'smooth' });
    });
    S.timer = setInterval(tick, 250);
    call('trackStudyActivity');
  }

  /* ---------------- Vừa khít màn hình ----------------
     Bảng giữ đúng tỉ lệ ô; chiều rộng tối đa được tính sao cho cả thanh công cụ + thanh thời gian + bảng
     nằm gọn trong chiều cao cửa sổ (trừ thanh menu cố định) → không phải cuộn lên/xuống khi chơi. */
  function fitBoard() {
    if (!S || el.play.classList.contains('hidden')) return;
    const hdr = document.querySelector('.site-header');
    const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) - (hdr ? hdr.offsetHeight : 0);
    const above = el.wrap.getBoundingClientRect().top - el.play.getBoundingClientRect().top;
    const avail = Math.max(220, vh - above - 22);
    el.wrap.style.maxWidth = Math.min(760, avail * S.ar) + 'px';
  }
  let fitT = 0;
  const onResize = () => { clearTimeout(fitT); fitT = setTimeout(fitBoard, 120); };
  window.addEventListener('resize', onResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

  /* ---------------- Nhắc trợ giúp khi suy nghĩ lâu ---------------- */
  function setNudge(on) {
    if (!S) return;
    S.nudged = on;
    el.hint.classList.toggle('pk-nudge', on && S.hints > 0);
    el.shuf.classList.toggle('pk-nudge', on && S.shufs > 0);
  }
  function active() { if (!S) return; S.lastAct = Date.now(); if (S.nudged) setNudge(false); }

  /* ---------------- Vẽ ---------------- */
  function faceHtml(t) {
    const h = t.k === 'c' ? t.c : t.n.h; const len = Math.min([...h].length, 3);
    const py = t.k === 'c' ? clPy(t.c) : t.n.p;
    return `${t.k === 'c' ? '<span class="pk-badge">量</span>' : ''}<span class="pk-h font-hanzi pk-l${len}">${esc(h)}</span><span class="pk-p">${esc(py)}</span>`;
  }
  function render() {
    const seen = new Set();
    for (let r = 1; r <= S.R; r++) for (let c = 1; c <= S.C; c++) {
      const t = S.grid[r][c]; if (!t) continue;
      seen.add(t.id);
      let d = nodes.get(t.id);
      const sig = t.k === 'c' ? t.c : t.n.h;
      if (!d) {
        d = document.createElement('button'); d.type = 'button';
        d.className = 'pk-tile ' + (t.k === 'c' ? 'pk-c' : 'pk-n');
        d.dataset.id = t.id; el.board.appendChild(d); nodes.set(t.id, d);
      }
      if (d.dataset.sig !== sig) { if (d.dataset.sig) { d.classList.remove('pk-morph'); void d.offsetWidth; d.classList.add('pk-morph'); } d.innerHTML = faceHtml(t); d.dataset.sig = sig; d.title = t.k === 'c' ? `${t.c} ${clPy(t.c)} — ${CLASSIFIERS[t.c][1]}` : `${t.n.h} ${t.n.p} — ${t.n.v}`; }
      d.style.left = `calc(${c - 0.5} * 100% / ${S.C + 1})`; d.style.top = `calc(${r - 0.5} * 100% / ${S.R + 1})`;
      d.classList.toggle('pk-sel', !!(S.sel && S.sel.id === t.id));
    }
    nodes.forEach((d, id) => { if (!seen.has(id)) { nodes.delete(id); d.classList.add('pk-gone'); setTimeout(() => d.remove(), 320); } });
  }
  function remaining() { let n = 0; for (let r = 1; r <= S.R; r++) for (let c = 1; c <= S.C; c++) if (S.grid[r][c]) n++; return n; }
  function renderHud() {
    el.lv.textContent = S.L; el.score.textContent = fmt(S.score);
    el.left.textContent = remaining() / 2;
    const s = Math.max(0, Math.ceil(S.timeLeft));
    el.time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    el.bar.style.width = Math.max(0, S.timeLeft / S.total * 100) + '%';
    const low = S.timeLeft <= TIME_WARN && S.timeLeft > 0;
    el.bar.classList.toggle('pk-bar-low', low); el.timePill.classList.toggle('pk-time-low', low);
    el.hintN.textContent = S.hints; el.shufN.textContent = S.shufs;
    el.hint.disabled = S.hints <= 0; el.shuf.disabled = S.shufs <= 0;
  }
  function tick() {
    if (!S || S.dead) return;
    const now = Date.now(); S.timeLeft -= (now - S.last) / 1000; S.last = now;
    if (S.timeLeft <= 0) { S.timeLeft = 0; renderHud(); finish(false); return; }
    if (!S.warned && S.timeLeft <= TIME_WARN) { S.warned = true; toast(`⏰ Còn ${TIME_WARN} giây — nhanh lên nào!`, 'pk-toast-warn'); call('sndWrong'); }
    if (!S.busy && !S.nudged && now - S.lastAct > IDLE_NUDGE * 1000 && (S.hints > 0 || S.shufs > 0)) {
      setNudge(true); toast('Bí quá? Thử 💡 Gợi ý hoặc 🔀 Xáo nhé!');
    }
    renderHud();
  }

  /* ---------------- Thông tin bên cạnh ---------------- */
  const tileAt = id => { for (let r = 1; r <= S.R; r++) for (let c = 1; c <= S.C; c++) { const t = S.grid[r][c]; if (t && t.id === id) return [t, r, c]; } return null; };
  function infoTile(t) {
    el.info.innerHTML = t.k === 'c'
      ? `<div class="pk-card pk-card-c"><span class="pk-card-h font-hanzi">${esc(t.c)}</span><span class="pk-card-p">${esc(clPy(t.c))}</span><span class="pk-card-m">Lượng từ: ${esc(CLASSIFIERS[t.c][1])}</span></div>`
      : `<div class="pk-card"><span class="pk-card-h font-hanzi">${esc(t.n.h)}</span><span class="pk-card-p">${esc(t.n.p)}</span><span class="pk-card-m">${esc(t.n.v)}</span></div>`;
  }
  function infoMatch(c, n) {
    const others = n.cl.filter(x => x !== c && okCl(x, S.tr));
    el.info.innerHTML = `<div class="pk-card pk-card-ok">
      <span class="pk-ok">✓ Chính xác</span>
      <span class="pk-card-h font-hanzi">一${esc(c)}${esc(n.h)}</span>
      <span class="pk-card-p">${esc(phrasePy(c, n))}</span>
      <span class="pk-card-vi">${esc(phraseVi(c, n))}</span>
      <span class="pk-card-m"><b class="font-hanzi">${esc(c)}</b> ${esc(clPy(c))}: ${esc(CLASSIFIERS[c][1])} · <b class="font-hanzi">${esc(n.h)}</b>: ${esc(n.v)}</span>
      ${others.length ? `<span class="pk-also">Cũng nói được: ${others.map(x => `<b class="font-hanzi">一${esc(x)}${esc(n.h)}</b> <small>(${esc(phraseVi(x, n))})</small>`).join(' · ')}</span>` : ''}</div>`;
  }
  function infoWrong(c, n) {
    el.info.innerHTML = `<div class="pk-card pk-card-bad">
      <span class="pk-bad">✗ Chưa đúng (−${PENALTY} giây)</span>
      <span class="pk-card-h font-hanzi"><s>一${esc(c)}${esc(n.h)}</s></span>
      <span class="pk-card-m"><b class="font-hanzi">${esc(n.h)}</b> ${esc(n.p)} · ${esc(n.v)} — dùng với:
        ${n.cl.filter(x => okCl(x, S.tr)).map(x => `<b class="font-hanzi">${esc(x)}</b> <small>${esc(clPy(x))}</small>`).join(' / ')}</span>
      <span class="pk-also"><b class="font-hanzi">${esc(c)}</b> ${esc(clPy(c))}: ${esc(CLASSIFIERS[c][1])}</span></div>`;
  }
  function pushLog(c, n) {
    const i = S.done.length - 1;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pk-chip font-hanzi'; b.dataset.pkSay = i;
    b.textContent = '一' + c + n.h; b.title = phrasePy(c, n) + ' · ' + phraseVi(c, n);
    el.log.prepend(b);
  }
  el.log.addEventListener('click', e => {
    const b = e.target.closest('[data-pk-say]'); if (!b || !S) return;
    const d = S.done[+b.dataset.pkSay]; if (d && window.tnVoice) window.tnVoice.speak('一' + d.c + d.n.h, { rate: 0.85 });
  });

  /* ---------------- Tìm đường nối (≤ 2 lần rẽ) ---------------- */
  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  function findPath(a, b) {           // a, b = [r, c]; trả về danh sách điểm gấp khúc hoặc null
    const R2 = S.R + 2, C2 = S.C + 2;
    const seen = new Map();
    const q = [{ r: a[0], c: a[1], d: -1, t: -1, pts: [] }];
    while (q.length) {
      const cur = q.shift();
      for (let d = 0; d < 4; d++) {
        if (d === cur.d) continue;
        const t = cur.t + 1; if (t > 2) continue;
        const pts = cur.pts.concat([[cur.r, cur.c]]);
        let r = cur.r + DIRS[d][0], c = cur.c + DIRS[d][1];
        while (r >= 0 && r < R2 && c >= 0 && c < C2) {
          if (r === b[0] && c === b[1]) return pts.concat([[r, c]]);
          if (S.grid[r][c]) break;
          const k = (r * C2 + c) * 4 + d;
          if (seen.has(k) && seen.get(k) <= t) break;
          seen.set(k, t);
          q.push({ r, c, d, t, pts });
          r += DIRS[d][0]; c += DIRS[d][1];
        }
      }
    }
    return null;
  }
  const fits = (x, y) => x && y && x.k !== y.k && (x.k === 'c' ? y.n.cl.includes(x.c) : x.n.cl.includes(y.c));

  /* ---------------- Luôn ghép hết được: kiểm tra bằng cặp ghép cực đại ---------------- */
  function tilesOnBoard() { const cs = [], ns = []; for (let r = 1; r <= S.R; r++) for (let c = 1; c <= S.C; c++) { const t = S.grid[r][c]; if (t) (t.k === 'c' ? cs : ns).push(t); } return { cs, ns }; }
  function maxMatching(cs, ns) {
    const matchN = new Array(ns.length).fill(-1);
    const adj = cs.map(c => ns.map((n, j) => n.n.cl.includes(c.c) ? j : -1).filter(j => j >= 0));
    function aug(i, vis) {
      for (const j of adj[i]) { if (vis[j]) continue; vis[j] = true; if (matchN[j] < 0 || aug(matchN[j], vis)) { matchN[j] = i; return true; } }
      return false;
    }
    let size = 0; cs.forEach((_, i) => { if (aug(i, new Array(ns.length).fill(false))) size++; });
    return { size, matchN };
  }
  function perfectWithout(x, y) {
    const { cs, ns } = tilesOnBoard();
    const c2 = cs.filter(t => t !== x && t !== y), n2 = ns.filter(t => t !== x && t !== y);
    return maxMatching(c2, n2).size === c2.length;
  }
  function repairMatching() {          // đổi chữ các ô danh từ bị "lẻ" để bảng vẫn ghép hết được
    const { cs, ns } = tilesOnBoard();
    const { size, matchN } = maxMatching(cs, ns);
    if (size === cs.length) return false;
    const freeC = cs.filter((_, i) => !matchN.includes(i));
    const freeN = ns.filter((_, j) => matchN[j] < 0);
    const onBoard = new Set(ns.map(t => t.n.h));
    freeN.forEach((t, i) => {
      const c = freeC[i]; if (!c) return;
      const cand = NOUNS.filter(x => x.cl.includes(c.c) && okNoun(x, S.tr));
      const fresh = cand.filter(x => !onBoard.has(x.h));
      t.n = pick(fresh.length ? fresh : cand); onBoard.add(t.n.h);
    });
    return true;
  }

  function allMoves() {
    const list = [];
    for (let r = 1; r <= S.R; r++) for (let c = 1; c <= S.C; c++) {
      const x = S.grid[r][c]; if (!x || x.k !== 'c') continue;
      for (let r2 = 1; r2 <= S.R; r2++) for (let c2 = 1; c2 <= S.C; c2++) {
        const y = S.grid[r2][c2]; if (!fits(x, y)) continue;
        const p = findPath([r, c], [r2, c2]); if (p) list.push({ a: [r, c], b: [r2, c2], x, y, p });
      }
    }
    return list;
  }
  const findMove = () => allMoves()[0] || null;
  function reshuffle(silent) {
    const pos = []; const ts = [];
    for (let r = 1; r <= S.R; r++) for (let c = 1; c <= S.C; c++) if (S.grid[r][c]) { pos.push([r, c]); ts.push(S.grid[r][c]); }
    for (let i = 0; i < 60; i++) {
      const sh = shuffle(ts); pos.forEach(([r, c], j) => { S.grid[r][c] = sh[j]; });
      if (findMove()) break;
    }
    if (!silent) render();
  }

  /* ---------------- Điều khiển ---------------- */
  el.board.addEventListener('click', e => {
    const d = e.target.closest('.pk-tile'); if (!d || !S || S.busy) return;
    const found = tileAt(+d.dataset.id); if (!found) return;
    const [t, r, c] = found;
    clearHint(); active();
    if (!S.sel) { S.sel = { id: t.id }; infoTile(t); speakTile(t); render(); return; }
    if (S.sel.id === t.id) { S.sel = null; render(); return; }
    const prev = tileAt(S.sel.id); if (!prev) { S.sel = { id: t.id }; render(); return; }
    const [p, pr, pc] = prev;
    if (p.k === t.k) { S.sel = { id: t.id }; infoTile(t); speakTile(t); render(); return; }   // cùng loại → đổi ô chọn
    const cl = p.k === 'c' ? p : t, no = p.k === 'c' ? t : p;
    if (!fits(p, t)) { wrong(cl, no, [d, nodes.get(p.id)]); return; }
    const path = findPath([pr, pc], [r, c]);
    if (!path) {
      S.sel = { id: t.id }; render();
      el.info.innerHTML = `<div class="pk-card pk-card-warn"><span class="pk-card-h font-hanzi">一${esc(cl.c)}${esc(no.n.h)}</span><span class="pk-card-m">Đúng cặp rồi, nhưng chưa nối được: đường nối chỉ được <b>rẽ tối đa 2 lần</b> và không đi xuyên qua ô khác.</span></div>`;
      return;
    }
    match([pr, pc], [r, c], cl, no, path);
  });
  function speakTile(t) { speak(t.k === 'c' ? t.c : t.n.h); }

  function wrong(cl, no, ds) {
    S.sel = null; S.streak = 0; S.timeLeft = Math.max(0, S.timeLeft - PENALTY);
    infoWrong(cl.c, no.n); call('sndWrong');
    ds.forEach(d => { if (d) { d.classList.remove('pk-nope'); void d.offsetWidth; d.classList.add('pk-nope'); } });
    render(); renderHud();
  }

  async function match(a, b, cl, no, path) {
    const me = S; S.busy = true; S.sel = null;
    drawPath(path);
    [a, b].forEach(([r, c]) => { const d = nodes.get(S.grid[r][c].id); if (d) d.classList.add('pk-hit'); });
    call('sndCorrect'); speak('一' + cl.c + no.n.h);
    const now = Date.now(); S.streak = now - S.lastMatch < 5000 ? S.streak + 1 : 1; S.lastMatch = now;
    const gain = 100 + (S.streak - 1) * 20; S.score += gain;
    S.done.push({ c: cl.c, n: no.n }); infoMatch(cl.c, no.n); pushLog(cl.c, no.n);
    praise(S.streak >= 3 ? pick(PRAISE_STREAK) : pick(PRAISE), S.streak);
    await new Promise(res => setTimeout(res, 280)); if (me.dead) return;
    S.grid[a[0]][a[1]] = null; S.grid[b[0]][b[1]] = null;
    applyShift(a, b);
    render(); renderHud(); el.svg.innerHTML = '';
    if (!remaining()) { finish(true); return; }
    if (repairMatching()) { await new Promise(res => setTimeout(res, 300)); if (me.dead) return; render(); }
    if (!findMove()) {
      toast('洗牌 xǐpái · Hết đường nối — xáo lại bảng');
      await new Promise(res => setTimeout(res, 500)); if (me.dead) return;
      reshuffle();
    }
    S.busy = false; S.lastAct = Date.now();
  }

  function applyShift(a, b) {
    const sh = S.shift; if (sh === 'none') return;
    if (sh === 'down' || sh === 'up') {
      new Set([a[1], b[1]]).forEach(c => {
        const col = []; for (let r = 1; r <= S.R; r++) if (S.grid[r][c]) col.push(S.grid[r][c]);
        for (let r = 1; r <= S.R; r++) S.grid[r][c] = null;
        col.forEach((t, i) => { S.grid[sh === 'down' ? S.R - col.length + 1 + i : 1 + i][c] = t; });
      });
    } else {
      new Set([a[0], b[0]]).forEach(r => {
        const row = []; for (let c = 1; c <= S.C; c++) if (S.grid[r][c]) row.push(S.grid[r][c]);
        for (let c = 1; c <= S.C; c++) S.grid[r][c] = null;
        row.forEach((t, i) => { S.grid[r][sh === 'right' ? S.C - row.length + 1 + i : 1 + i] = t; });
      });
    }
  }

  function drawPath(pts) {
    const mid = (i, n) => i === 0 ? 0.25 : i === n + 1 ? n + 0.75 : i;   // tâm ô theo đơn vị ô (viền nửa ô)
    const P = pts.map(([r, c]) => `${mid(c, S.C) * 4},${mid(r, S.R) * 5}`).join(' ');
    el.svg.innerHTML = `<polyline points="${P}" class="pk-line-bg"/><polyline points="${P}" class="pk-line"/>`;
  }
  function toast(text, cls = '') {
    el.wrap.querySelectorAll('.pk-toast').forEach(x => x.remove());
    const d = document.createElement('div'); d.className = 'pk-toast ' + cls; d.textContent = text;
    el.wrap.appendChild(d); setTimeout(() => d.remove(), 1800);
  }
  function praise(text, streak) {
    el.wrap.querySelectorAll('.pk-praise').forEach(x => x.remove());
    const d = document.createElement('div'); d.className = 'pk-praise font-hanzi';
    d.innerHTML = esc(text) + (streak >= 2 ? `<small>连对 ×${streak}</small>` : '');
    el.wrap.appendChild(d); setTimeout(() => d.remove(), 1300);
  }

  /* ---------------- Gợi ý / xáo bảng ---------------- */
  function clearHint() { el.board.querySelectorAll('.pk-hinted').forEach(d => d.classList.remove('pk-hinted')); }
  el.hint.addEventListener('click', () => {
    if (!S || S.busy || S.hints <= 0) return;
    const moves = allMoves(); if (!moves.length) return;
    const m = moves.find(x => perfectWithout(x.x, x.y)) || moves[0];
    S.hints--; active(); renderHud(); clearHint();
    [m.x, m.y].forEach(t => { const d = nodes.get(t.id); if (d) d.classList.add('pk-hinted'); });
  });
  el.shuf.addEventListener('click', () => {
    if (!S || S.busy || S.shufs <= 0) return;
    S.shufs--; S.sel = null; active(); clearHint(); reshuffle(); renderHud();
  });

  /* ---------------- Kết thúc ---------------- */
  function finish(win) {
    const me = S; S.busy = true; clearInterval(S.timer); setNudge(false);
    let bonus = 0;
    if (win) { bonus = Math.ceil(S.timeLeft) * 10; S.score += bonus; }
    const best = loadBest(S.tr); let newRec = false;
    if (win && S.L + 1 > best.level) best.level = S.L + 1;
    if (S.score > (best.score || 0)) { best.score = S.score; newRec = true; }
    saveBest(best, S.tr);
    call('trackStudyActivity');
    call(win ? (typeof window.sndWin === 'function' ? 'sndWin' : 'sndCorrect') : (typeof window.sndLose === 'function' ? 'sndLose' : 'sndWrong'));

    $('pk-r-emoji').textContent = win ? '🏆' : '⏰';
    $('pk-r-title').textContent = win ? `Qua màn ${S.L}! 过关了！` : `Hết giờ rồi — màn ${S.L}`;
    $('pk-r-sub').innerHTML = win
      ? `Nối hết <b>${S.done.length}</b> cặp, còn dư <b>${Math.ceil(S.timeLeft)}</b> giây (+${fmt(bonus)} điểm thưởng).`
      : `Đã nối <b>${S.done.length}</b> cặp, còn <b>${remaining() / 2}</b> cặp. Thử lại nhé!`;
    $('pk-r-score').textContent = fmt(S.score);
    $('pk-r-best').textContent = fmt(best.score) + (newRec ? ' 🎉' : '');
    $('pk-r-words').innerHTML = S.done.map((d, i) => `
      <div class="pk-rw">
        <button type="button" class="pk-rw-say" data-pk-rsay="${i}" title="Nghe đọc">🔊</button>
        <span class="pk-rw-h font-hanzi">一${esc(d.c)}${esc(d.n.h)}</span>
        <span class="pk-rw-t"><b>${esc(phrasePy(d.c, d.n))}</b> · ${esc(phraseVi(d.c, d.n))}</span>
      </div>`).join('') || '<p class="text-sm text-ink/70">Chưa nối được cặp nào.</p>';
    const next = $('pk-next');
    next.textContent = win ? `Màn ${S.L + 1} →` : 'Chơi lại màn này';
    next.dataset.level = win ? S.L + 1 : S.L;
    setTimeout(() => { if (S === me) show('result'); }, win ? 600 : 300);
  }
  $('pk-r-words').addEventListener('click', e => {
    const b = e.target.closest('[data-pk-rsay]'); if (!b || !S) return;
    const d = S.done[+b.dataset.pkRsay]; if (d && window.tnVoice) window.tnVoice.speak('一' + d.c + d.n.h, { rate: 0.85 });
  });
  $('pk-next').addEventListener('click', e => startLevel(+e.currentTarget.dataset.level || 1));
  $('pk-back').addEventListener('click', stop);
}

/* ===================================================================== */
const CLOUD = '<svg class="jn-cloud" fill="#fff" style="{S}" viewBox="0 0 100 60"><ellipse cx="30" cy="35" rx="28" ry="20"></ellipse><ellipse cx="55" cy="25" rx="22" ry="18"></ellipse><ellipse cx="72" cy="38" rx="20" ry="15"></ellipse></svg>';
const TEMPLATE = `
<div class="jn-sky pk-sky">
  ${CLOUD.replace('{S}', 'top:10px; left:6%; width:64px;')}
  ${CLOUD.replace('{S}', 'top:4px; right:8%; width:50px;')}
  ${CLOUD.replace('{S}', 'bottom:14px; left:42%; width:58px;')}

  <div id="pk-setup">
    <div class="flex items-center gap-3 mb-4">
      <span class="jn-sun">🀄</span>
      <div>
        <h3 class="font-sans font-semibold text-lg text-ink">Pikachu lượng từ 连连看 <span class="pk-pyh">liánliánkàn</span></h3>
        <p class="text-xs text-ink/70">Nối mỗi <strong>lượng từ</strong> với một <strong>danh từ</strong> đi được với nó (一<b>条</b>鱼, 一<b>本</b>书…). Một lượng từ có thể hợp với nhiều danh từ — chọn cặp nào đúng cũng được. Nối hết bảng trước khi hết giờ để qua màn!</p>
      </div>
    </div>
    <div class="jn-setup-card">
      <div class="pk-rules">
        <div><span class="pk-mini pk-c">条</span><b>Ô viền cam = lượng từ</b><small>có chữ 量 nhỏ ở góc</small></div>
        <div><span class="pk-mini pk-n">鱼</span><b>Ô trắng = danh từ</b><small>bấm vào ô để nghe và xem nghĩa</small></div>
        <div><span class="pk-mini pk-mini-path">↱</span><b>Đường nối rẽ tối đa 2 lần</b><small>đi qua ô trống, được vòng ra ngoài mép bảng</small></div>
        <div><span class="pk-mini pk-mini-bad">−5</span><b>Ghép sai trừ 5 giây</b><small>và hiện các lượng từ đúng của danh từ đó</small></div>
      </div>
      <p class="pk-tr-h">Chọn trình độ <small>(game này dùng trình độ riêng, không theo ô chọn cấp HSK ở trên)</small></p>
      <div class="pk-trs" id="pk-trs">${Object.entries(TRINH).map(([k, t]) => {
        const cls = Object.keys(CLASSIFIERS).filter(c => okCl(c, k));
        return `<button type="button" class="pk-tr" data-pk-tr="${k}">
          <span class="pk-tr-zh font-hanzi">${t.zh}</span><b>Trình độ ${t.name.toLowerCase()}</b>
          <small>${t.sub} · ${cls.length} lượng từ</small>
          <span class="pk-tr-ex font-hanzi">${cls.slice(0, 8).join(' ')}…</span>
          <span class="pk-tr-best"></span></button>`;
      }).join('')}</div>
      <p class="text-xs text-ink/70 mt-3">Lượng từ và danh từ lấy theo danh sách từ vựng HSK của web (bảng 200 lượng từ). Màn càng cao bảng càng to, thời gian ít hơn, và các ô dồn về một phía sau mỗi lần nối.</p>
      <div class="flex flex-wrap items-center gap-3 mt-3">
        <button class="px-5 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold hover:opacity-90 focus-ring" id="pk-start" type="button">🀄 Chơi màn <span id="pk-start-level">1</span> · <span id="pk-tr-name">Sơ cấp</span></button>
        <button class="hidden text-xs font-semibold text-ink/70 hover:text-ink underline" id="pk-restart1" type="button">Chơi lại từ màn 1</button>
        <span class="jn-progress-pill">Màn cao nhất: <span class="text-mint" id="pk-best-level">1</span></span>
        <span class="jn-progress-pill">Điểm cao nhất: <span class="text-mint" id="pk-best-score">0</span></span>
      </div>
      <div class="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        <label class="pk-tg"><input type="checkbox" id="pk-py" checked> Hiện pinyin trên ô</label>
        <label class="pk-tg"><input type="checkbox" id="pk-voice" checked> 🔊 Đọc to</label>
      </div>
    </div>
  </div>

  <div class="hidden" id="pk-play">
    <div class="jn-topbar pk-topbar">
      <span class="jn-progress-pill pk-tr-pill" id="pk-tr-pill"></span>
      <span class="jn-progress-pill">Màn <span class="text-mint" id="pk-lv">1</span></span>
      <span class="jn-progress-pill" id="pk-time-pill">⏱ <span id="pk-time">0:00</span></span>
      <span class="jn-progress-pill">Còn <span class="text-mint" id="pk-left">0</span> cặp</span>
      <span class="jn-progress-pill">Điểm: <span class="text-mint" id="pk-score">0</span></span>
      <span class="pk-tools">
        <button class="pk-tool" id="pk-hint" type="button">💡 Gợi ý (<span id="pk-hint-n">3</span>)</button>
        <button class="pk-tool" id="pk-shuf" type="button">🔀 Xáo (<span id="pk-shuf-n">2</span>)</button>
        <button class="pk-tool underline" id="pk-quit" type="button">Dừng lại</button>
      </span>
    </div>
    <div class="jn-timebar-track"><div class="jn-timebar-fill pk-bar" id="pk-bar" style="width:100%"></div></div>
    <p class="pk-shift" id="pk-shift"></p>
    <div class="pk-stage">
      <div class="pk-board-wrap" id="pk-board-wrap">
        <div class="pk-board" id="pk-board"><svg class="pk-svg" id="pk-svg" preserveAspectRatio="none"></svg></div>
      </div>
      <div class="pk-side">
        <div class="pk-info" id="pk-info"></div>
        <p class="pk-side-h">Các cặp đã nối <small>(bấm để nghe)</small></p>
        <div class="pk-log" id="pk-log"></div>
      </div>
    </div>
  </div>

  <div class="hidden jn-celebrate" id="pk-result">
    <p class="text-5xl mb-2" id="pk-r-emoji">🏆</p>
    <h3 class="font-sans font-semibold text-xl text-ink mb-1" id="pk-r-title"></h3>
    <p class="text-sm text-ink/80 mb-4" id="pk-r-sub"></p>
    <div class="flex flex-wrap items-center justify-center gap-3 mb-4">
      <div class="jn-stat-card"><p class="text-xs text-slate mb-0.5">Điểm màn này</p><p class="font-black text-2xl text-ink" id="pk-r-score">0</p></div>
      <div class="jn-stat-card"><p class="text-xs text-slate mb-0.5">Điểm cao nhất</p><p class="font-black text-2xl text-ink" id="pk-r-best">0</p></div>
    </div>
    <div class="pk-rwords text-left mb-5">
      <p class="text-sm font-semibold text-ink mb-2">Các cụm lượng từ đã nối</p>
      <div id="pk-r-words"></div>
    </div>
    <div class="flex flex-wrap justify-center gap-3">
      <button class="px-5 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold hover:opacity-90 focus-ring" id="pk-next" type="button">Màn tiếp theo →</button>
      <button class="px-5 py-2.5 rounded-xl bg-white text-ink text-sm font-semibold hover:opacity-90 focus-ring" id="pk-back" type="button">Về màn hình chính</button>
    </div>
  </div>
</div>`;

function injectCss() {
  if (document.getElementById('pk-style')) return;
  const st = document.createElement('style'); st.id = 'pk-style';
  st.textContent = `
  .pk-pyh { font-size:12px; font-weight:600; color:#5B6472; margin-left:4px; }
  .pk-rules { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  @media (max-width:560px){ .pk-rules { grid-template-columns:1fr; } }
  .pk-rules > div { display:grid; grid-template-columns:34px 1fr; column-gap:10px; align-items:center; background:#fff; border-radius:14px; padding:8px 10px; }
  .pk-rules b { font-size:13px; color:#2E3440; } .pk-rules small { grid-column:2; font-size:11.5px; color:#5B6472; }
  .pk-mini { grid-row:span 2; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; font-family:'KaiTi','STKaiti','SimSun',serif; }
  .pk-mini.pk-c { background:#FFE8D4; color:#A64B00; box-shadow: inset 0 0 0 2px #FF9A3D; }
  .pk-mini.pk-n { background:#fff; color:#1E2A5A; box-shadow: inset 0 0 0 2px #C9D3EA; }
  .pk-mini-path { background:#E6EEFF; color:#FF7D00; font-weight:800; font-family:inherit; }
  .pk-mini-bad { background:#FFE1E1; color:#C0392B; font-weight:800; font-size:13px; font-family:inherit; }
  .pk-tr-h { font-size:13px; font-weight:700; color:#2E3440; margin:14px 0 8px; } .pk-tr-h small { font-weight:500; color:#5B6472; }
  .pk-trs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
  @media (max-width:640px){ .pk-trs { grid-template-columns:1fr; } }
  .pk-tr { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:2px; text-align:left; background:#fff; border-radius:16px; padding:12px 14px; border:2px solid transparent; box-shadow:0 2px 6px rgba(0,0,0,.05); transition: border-color .15s ease, transform .15s ease; }
  .pk-tr:hover { transform:translateY(-1px); }
  .pk-tr b { font-size:14px; color:#2E3440; } .pk-tr small { font-size:12px; color:#5B6472; }
  .pk-tr-zh { position:absolute; top:10px; right:12px; font-size:20px; color:#FFB877; }
  .pk-tr-ex { font-size:15px; color:#A64B00; letter-spacing:2px; margin-top:2px; }
  .pk-tr-best { font-size:11.5px; font-weight:700; color:#000080; margin-top:4px; }
  .pk-tr-on { border-color:#FF7D00; background:#FFF6EE; }
  .pk-tr-on::after { content:'✓'; position:absolute; bottom:10px; right:12px; width:20px; height:20px; border-radius:9999px; background:#FF7D00; color:#fff; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; }
  .pk-tg { display:inline-flex; align-items:center; gap:8px; font-size:13px; color:#2E3440; cursor:pointer; }
  .pk-tg input { width:16px; height:16px; accent-color:#000080; }
  .pk-tool { font-size:12px; font-weight:600; color:rgba(46,52,64,.8); background:rgba(255,255,255,.75); border-radius:9999px; padding:6px 12px; }
  .pk-tool:hover { color:#2E3440; } .pk-tool:disabled { opacity:.45; cursor:not-allowed; }
  .pk-bar { background:#FF7D00; transition: width .25s linear; }
  .pk-bar-low { background:#D6524F; animation: pkBarWarn .8s ease-in-out infinite; }
  @keyframes pkBarWarn { 0%,100%{ opacity:1; box-shadow:0 0 0 rgba(214,82,79,0); } 50%{ opacity:.55; box-shadow:0 0 10px rgba(214,82,79,.8); } }
  .pk-time-low { color:#C0392B; background:#FFE1E1; animation: pkPulse .8s ease-in-out infinite; }
  @keyframes pkPulse { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.08); } }
  .pk-shift { min-height:0; font-size:12px; font-weight:600; color:#B35900; margin:0 0 4px; position:relative; z-index:2; }
  .pk-shift:empty { display:none; }

  /* Thanh công cụ gọn: 1 hàng trên máy tính, tự xuống hàng gọn gàng trên điện thoại */
  #pk-play .pk-topbar { gap:8px; margin-bottom:8px; justify-content:flex-start; }
  #pk-play .jn-timebar-track { margin-bottom:8px; }
  .pk-topbar .jn-progress-pill { padding:5px 12px; }
  .pk-tools { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-left:auto; }
  .pk-nudge { color:#fff !important; background:#FF7D00 !important; animation: pkNudge 1s ease-in-out infinite; }
  @keyframes pkNudge { 0%,100%{ transform:scale(1); box-shadow:0 0 0 0 rgba(255,125,0,.55); } 50%{ transform:scale(1.1); box-shadow:0 0 0 7px rgba(255,125,0,0); } }
  @media (max-width:640px){
    #pk-play .pk-topbar { gap:5px; }
    .pk-topbar .jn-progress-pill { padding:4px 9px; font-size:12px; }
    .pk-tr-pill { display:none; }
    .pk-tools { width:100%; margin-left:0; justify-content:space-between; }
    .pk-tool { padding:6px 10px; }
  }

  .pk-stage { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:16px; align-items:start; position:relative; z-index:2; }
  @media (max-width:860px){ .pk-stage { grid-template-columns:1fr; } }
  .pk-board-wrap { position:relative; width:100%; max-width:640px; margin:0 auto; transition:max-width .2s ease; }
  .pk-board { position:relative; width:100%; background:rgba(255,255,255,.5); border:3px solid #fff; border-radius:18px; box-shadow:0 10px 24px rgba(0,60,120,.16); container-type:inline-size; user-select:none; -webkit-user-select:none; --tw: calc(100cqw / var(--c2, 8)); }
  .pk-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:4; overflow:visible; }
  .pk-line-bg { fill:none; stroke:#fff; stroke-width:1.3; stroke-linejoin:round; stroke-linecap:round; opacity:.9; }
  .pk-line { fill:none; stroke:#FF7D00; stroke-width:.6; stroke-linejoin:round; stroke-linecap:round; }
  .pk-tile { position:absolute; width:calc(100% / var(--c2, 8)); height:calc(100% / var(--r2, 1)); padding:2px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
    transition: left .28s ease, top .28s ease, transform .15s ease, opacity .3s ease; cursor:pointer; z-index:2; }
  .pk-tile::before { content:''; position:absolute; inset:2px; border-radius:9px; z-index:-1; transition: box-shadow .15s ease, background .15s ease; }
  .pk-n::before { background:#fff; box-shadow: inset 0 -3px 0 #D5DCEC, 0 1px 3px rgba(0,0,0,.08); }
  .pk-c::before { background:#FFE8D4; box-shadow: inset 0 0 0 2px #FF9A3D, inset 0 -4px 0 #FFB877, 0 1px 3px rgba(0,0,0,.08); }
  .pk-h { line-height:1.05; white-space:nowrap; }
  .pk-n .pk-h { color:#1E2A5A; } .pk-c .pk-h { color:#A64B00; }
  .pk-l1 { font-size:calc(var(--tw) * .5); } .pk-l2 { font-size:calc(var(--tw) * .36); } .pk-l3 { font-size:calc(var(--tw) * .26); }
  .pk-p { font-size:max(8px, calc(var(--tw) * .16)); line-height:1.1; color:#5B6472; white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; }
  .pk-c .pk-p { color:#B35900; }
  .pk-nopy .pk-p { display:none; }
  .pk-badge { position:absolute; top:3px; left:5px; font-size:max(7px, calc(var(--tw) * .14)); color:#FF7D00; font-weight:700; line-height:1; }
  .pk-tile:hover::before { filter:brightness(.98); }
  .pk-sel { transform:scale(.92); } .pk-sel::before { box-shadow: inset 0 0 0 3px #000080, 0 0 0 2px #fff !important; }
  .pk-hinted::before { animation: pkHint 1s ease infinite; }
  .pk-hit::before { box-shadow: inset 0 0 0 3px #2EAD62, 0 0 10px rgba(46,173,98,.6) !important; }
  .pk-gone { opacity:0; transform:scale(.3) rotate(10deg); pointer-events:none; }
  .pk-nope { animation: pkShake .35s ease; }
  .pk-morph { animation: pkMorph .5s ease; }
  @keyframes pkHint { 0%,100%{ box-shadow: inset 0 0 0 3px #FF7D00; } 50%{ box-shadow: inset 0 0 0 3px #FF7D00, 0 0 12px #FF7D00; } }
  @keyframes pkShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  @keyframes pkMorph { 0%{transform:rotateY(0)} 50%{transform:rotateY(90deg)} 100%{transform:rotateY(0)} }
  .pk-toast { position:absolute; left:50%; top:45%; transform:translate(-50%,-50%); background:rgba(255,255,255,.95); color:#000080; font-weight:700; font-size:14px; border-radius:14px; padding:8px 16px; box-shadow:0 8px 20px rgba(0,0,128,.2); z-index:6; animation: pkToast 1.8s ease forwards; width:max-content; max-width:92%; text-align:center; }
  @keyframes pkToast { 0%{opacity:0} 15%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
  .pk-toast-warn { color:#C0392B; box-shadow:0 8px 20px rgba(214,82,79,.3); }
  .pk-praise { position:absolute; left:50%; top:38%; z-index:7; pointer-events:none; display:flex; flex-direction:column; align-items:center;
    font-size:clamp(26px, 7vw, 46px); font-weight:700; color:#FF7D00; white-space:nowrap;
    text-shadow:0 2px 0 #fff, 0 0 12px #fff, 0 0 4px #fff; animation: pkPraise 1.3s ease forwards; }
  .pk-praise small { font-family:'Noto Sans',sans-serif; font-size:14px; color:#1F6B43; background:#EFFAF3; border-radius:9999px; padding:2px 10px; margin-top:4px; text-shadow:none; }
  @keyframes pkPraise { 0%{ opacity:0; transform:translate(-50%,-30%) scale(.6); } 18%{ opacity:1; transform:translate(-50%,-50%) scale(1.12); } 30%{ transform:translate(-50%,-50%) scale(1); } 75%{ opacity:1; } 100%{ opacity:0; transform:translate(-50%,-90%) scale(1); } }

  .pk-side { display:flex; flex-direction:column; gap:10px; }
  .pk-info { min-height:140px; background:rgba(255,255,255,.72); border-radius:18px; padding:12px; display:flex; align-items:center; justify-content:center; }
  .pk-tip { font-size:13px; color:#2E3440; text-align:center; line-height:1.6; } .pk-tip-c { color:#B35900; }
  .pk-card { width:100%; display:flex; flex-direction:column; align-items:center; gap:3px; background:#fff; border-radius:14px; padding:10px 12px; text-align:center; animation: pkIn .3s ease; }
  .pk-card-c { background:#FFF3E8; box-shadow: inset 0 0 0 2px #FFC796; }
  .pk-card-ok { background:#EFFAF3; box-shadow: inset 0 0 0 2px #A8E2BF; }
  .pk-card-bad { background:#FFF1F1; box-shadow: inset 0 0 0 2px #F5B5B5; }
  .pk-card-warn { background:#FFF8E6; box-shadow: inset 0 0 0 2px #F3D58A; }
  @keyframes pkIn { from{transform:scale(.94); opacity:.4} to{transform:scale(1); opacity:1} }
  .pk-card-h { font-size:38px; line-height:1.15; color:#1E2A5A; }
  .pk-card-p { font-size:15px; font-weight:700; color:#2E3440; }
  .pk-card-vi { font-size:16px; font-weight:700; color:#B35900; }
  .pk-card-m { font-size:13.5px; color:#2E3440; line-height:1.5; } .pk-card-m small { color:#5B6472; }
  .pk-ok { font-size:12px; font-weight:800; color:#1F6B43; } .pk-bad { font-size:12px; font-weight:800; color:#C0392B; }
  .pk-also { font-size:12.5px; color:#5B6472; margin-top:2px; } .pk-also b { color:#B35900; font-weight:400; font-size:15px; } .pk-also small { font-size:12px; }
  .pk-side-h { font-size:13px; font-weight:700; color:#2E3440; } .pk-side-h small { font-weight:500; color:#5B6472; }
  .pk-log { display:flex; flex-wrap:wrap; gap:6px; max-height:220px; overflow:auto; }
  .pk-chip { font-size:16px; line-height:1; padding:7px 10px; border-radius:9999px; background:#fff; color:#1E2A5A; box-shadow: inset 0 -2px 0 #FFC796; }
  .pk-chip:hover { background:#FFF3E8; }

  .pk-rwords { max-width:560px; margin-left:auto; margin-right:auto; background:rgba(255,255,255,.72); border-radius:18px; padding:14px 16px; max-height:420px; overflow:auto; }
  .pk-rw { display:flex; align-items:center; gap:10px; background:#fff; border-radius:12px; padding:6px 8px; margin-top:6px; border-left:5px solid #FF9A3D; }
  .pk-rw-h { font-size:20px; color:#1E2A5A; min-width:72px; }
  .pk-rw-t { flex:1; min-width:0; font-size:13px; color:#2E3440; }
  .pk-rw-say { font-size:15px; }
  @media (prefers-reduced-motion: reduce) { .pk-tile { transition:none; } .pk-hinted::before, .pk-morph, .pk-nudge, .pk-time-low { animation:none; } }
  `;
  document.head.appendChild(st);
}

if (panel) init();
