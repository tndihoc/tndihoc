/* =====================================================================
   XẾP CHỮ 消消乐 — tab "🍬 Xếp chữ 消消乐" trong khu Trò chơi
   ---------------------------------------------------------------------
   Luật kiểu Candy Crush, nhưng "kẹo" là từ tiếng Trung:
     • Đổi chỗ 2 ô cạnh nhau (bấm 2 ô, hoặc vuốt) để có ≥ 3 ô CÙNG CHỮ thẳng hàng → biến mất.
     • 4 ô thẳng hàng  → tạo "chữ sọc"  (nổ nguyên hàng / cột).
     • Xếp hình chữ L / T → tạo "chữ bọc" (nổ vùng 3×3).
     • 5 ô thẳng hàng  → tạo "ngôi sao ✦"  (đổi với ô nào thì xoá mọi ô cùng chữ đó).
   Mỗi màn có 10 → 20 từ (tăng dần theo màn), nhưng trên bảng chỉ có 5–6 từ cùng lúc:
   mỗi khi một từ được xếp đủ số lượng, nó rời bảng và từ tiếp theo trong hàng chờ thế chỗ
   (các ô của từ cũ biến thành từ mới). Thu thập đủ mọi từ trước khi hết lượt để qua màn.
   Mỗi lần xếp, hiện chữ Hán + pinyin + nghĩa và (tuỳ chọn) đọc to từ đó.

   Từ lấy theo cấp độ đang chọn ở khu Trò chơi (hàm chung gameWords() trong index.html).
   Kỷ lục lưu trên máy: localStorage "tn_xc_best_v1" = { level, score }.
   File này tự chèn giao diện + CSS vào <div id="game-match3">, không cần file CSS riêng.
   ===================================================================== */

const N = 8;                       // bảng 8 × 8
const PTS = 50;                    // điểm mỗi ô bị xoá (combo thứ n: × 1 + 0,5·(n−1))
const LS_BEST = 'tn_xc_best_v1';
const LS_VOICE = 'tn_xc_voice';
const PRAISE = [
  ['好！', 'hǎo'], ['很好！', 'hěn hǎo'], ['太棒了！', 'tài bàng le'],
  ['厉害！', 'lìhai'], ['了不起！', 'liǎobuqǐ'], ['完美！', 'wánměi'],
];
const COLORS = 8;                  // số màu pastel (xc-k0 … xc-k7)
// Độ khó theo màn: số từ (10 → 20), số loại chữ cùng lúc trên bảng, số ô cần xếp cho mỗi từ.
// Số lượt được tính từ mô phỏng (≈ ô xoá được mỗi lượt), biên dư giảm dần theo màn.
function levelCfg(L, poolSize) {
  const words = Math.max(5, Math.min(20, 9 + L, poolSize));
  const kinds = Math.min(L <= 3 ? 5 : 6, words);
  const quota = L <= 4 ? 12 : 15;
  const perMove = kinds <= 5 ? 8 : 6;
  const margin = Math.max(1.2, 1.5 - (L - 1) * 0.03);
  return { words, kinds, quota, moves: Math.max(15, Math.round(words * quota / perMove * margin)) };
}

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const call = (name, ...a) => { try { return typeof window[name] === 'function' ? window[name](...a) : undefined; } catch (e) { console.warn(name, e); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => (Math.random() * n) | 0;
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const key = (r, c) => r * N + c;
const fmt = n => Number(n).toLocaleString('vi-VN');

const panel = $('game-match3');

function init() {
  injectCss();
  panel.innerHTML = TEMPLATE;

  const el = {
    setup: $('xc-setup'), play: $('xc-play'), result: $('xc-result'), queue: $('xc-queue'),
    start: $('xc-start'), restart1: $('xc-restart1'), startLv: $('xc-start-level'),
    warn: $('xc-warn'), deck: $('xc-deck'), bestLv: $('xc-best-level'), bestSc: $('xc-best-score'),
    voice: $('xc-voice'),
    board: $('xc-board'), fx: $('xc-fx'), lv: $('xc-lv'), moves: $('xc-moves'), score: $('xc-score'),
    target: $('xc-target'), bar: $('xc-bar'), word: $('xc-word'), legend: $('xc-legend'),
    quit: $('xc-quit'), hintBtn: $('xc-hint'),
  };

  /* ---------------- Kỷ lục + giọng đọc ---------------- */
  const loadBest = () => { try { return JSON.parse(localStorage.getItem(LS_BEST)) || { level: 1, score: 0 }; } catch (e) { return { level: 1, score: 0 }; } };
  const saveBest = b => { try { localStorage.setItem(LS_BEST, JSON.stringify(b)); } catch (e) {} };
  try { el.voice.checked = localStorage.getItem(LS_VOICE) !== '0'; } catch (e) {}
  el.voice.addEventListener('change', () => { try { localStorage.setItem(LS_VOICE, el.voice.checked ? '1' : '0'); } catch (e) {} });
  const speak = t => { if (el.voice.checked && window.tnVoice) { try { window.tnVoice.speak(t, { rate: 0.85 }); } catch (e) {} } };

  /* ---------------- Chọn bộ từ ---------------- */
  function pool() {
    const all = (call('gameWords') || []).filter(w => w && w.hanzi && w.mean);
    const seen = new Set(); const uniq = [];
    all.forEach(w => { const h = String(w.hanzi).trim(); if (h && !seen.has(h)) { seen.add(h); uniq.push(w); } });
    const short = uniq.filter(w => [...w.hanzi].length <= 2);
    return short.length >= 6 ? short : uniq.filter(w => [...w.hanzi].length <= 3);
  }
  function refreshSetup() {
    const p = pool(); const ok = p.length >= 5;
    el.start.disabled = !ok; el.start.classList.toggle('opacity-50', !ok);
    el.warn.classList.toggle('hidden', ok);
    const lbl = $('game-hsk-label'); el.deck.textContent = lbl ? lbl.textContent : '';
    const b = loadBest();
    el.startLv.textContent = b.level; el.bestLv.textContent = b.level; el.bestSc.textContent = fmt(b.score || 0);
    el.restart1.classList.toggle('hidden', b.level <= 1);
  }
  // Làm mới khi mở tab / đổi cấp độ HSK
  document.addEventListener('click', e => {
    if (e.target.closest('.game-hsk-pill') || e.target.closest('[data-game-tab="match3"]')) setTimeout(refreshSetup, 0);
  });
  if (typeof window.tnSetGameLevel === 'function') {
    const orig = window.tnSetGameLevel;
    window.tnSetGameLevel = function (...a) { const r = orig.apply(this, a); setTimeout(refreshSetup, 0); return r; };
  }
  refreshSetup();

  /* ---------------- Trạng thái ván chơi ---------------- */
  let S = null;               // ván hiện tại
  let uid = 1;
  const tiles = new Map();    // id → phần tử DOM

  function show(which) {
    el.setup.classList.toggle('hidden', which !== 'setup');
    el.play.classList.toggle('hidden', which !== 'play');
    el.result.classList.toggle('hidden', which !== 'result');
  }
  function stop() {
    if (S) { S.dead = true; clearTimeout(S.hintTimer); }
    S = null; tiles.clear(); el.board.innerHTML = '';
    show('setup'); refreshSetup();
  }
  if (Array.isArray(window.gameStopHandlers)) window.gameStopHandlers.push(stop);
  el.quit.addEventListener('click', stop);

  el.start.addEventListener('click', () => startLevel(loadBest().level));
  el.restart1.addEventListener('click', () => startLevel(1));

  function startLevel(L) {
    const p = pool();
    if (p.length < 5) { refreshSetup(); return; }
    const cfg = levelCfg(L, p.length);
    const words = shuffle(p).slice(0, cfg.words);
    const kinds = cfg.kinds;
    if (S) S.dead = true;
    // tile.t = số thứ tự "ô từ" (slot) trên bảng; S.slot[t] = từ đang nằm ở slot đó.
    S = { L, words, kinds, quota: cfg.quota, moves: cfg.moves, score: 0, busy: false, dead: false,
          grid: [], sel: null, cleared: new Array(words.length).fill(0), hintTimer: null, won: false,
          slot: [], retired: new Array(kinds).fill(false), queue: [], wcolor: new Array(words.length).fill(0) };
    for (let i = 0; i < words.length; i++) (i < kinds ? S.slot : S.queue).push(i);
    S.slot.forEach((w, i) => { S.wcolor[w] = i; });
    tiles.clear(); el.board.innerHTML = '';
    fillBoard();
    show('play');
    renderLegend(); renderHud(); render(true);
    el.word.innerHTML = `<p class="xc-word-tip">Đổi chỗ 2 ô cạnh nhau để có <b>3 chữ giống nhau</b> thẳng hàng.<br>Màn này có <b>${words.length} từ</b> — mỗi từ xếp đủ <b>${S.quota} ô</b> thì từ mới sẽ thay thế.</p>`;
    call('trackStudyActivity');
    armHint();
  }

  /* ---------------- Tạo bảng ---------------- */
  const newTile = (t, s = null) => ({ id: uid++, t, s, fresh: true });
  const liveSlots = () => S.slot.map((w, i) => i).filter(i => !S.retired[i]);
  const spawnType = () => { const l = liveSlots(); return l[rnd(l.length)]; };
  const wordOf = t => S.slot[t];                    // slot → chỉ số từ
  const colorOf = t => 'xc-k' + S.wcolor[S.slot[t]];
  function fillBoard() {
    for (let tries = 0; tries < 50; tries++) {
      S.grid = [];
      for (let r = 0; r < N; r++) {
        S.grid.push([]);
        for (let c = 0; c < N; c++) {
          let t;
          do { t = spawnType(); } while (
            (c >= 2 && S.grid[r][c - 1].t === t && S.grid[r][c - 2].t === t) ||
            (r >= 2 && S.grid[r - 1][c].t === t && S.grid[r - 2][c].t === t));
          const tile = newTile(t); tile.from = r - N; S.grid[r].push(tile);
        }
      }
      if (findMove()) return;
    }
  }

  /* ---------------- Vẽ ---------------- */
  function faceHtml(tile) {
    if (tile.s === 'b') return '<span class="xc-face"><span class="xc-star">✦</span></span>';
    const h = S.words[wordOf(tile.t)].hanzi; const len = [...h].length;
    return `<span class="xc-face"><span class="xc-han font-hanzi xc-len${Math.min(len, 3)}">${esc(h)}</span></span>`;
  }
  function tileClass(tile) {
    return 'xc-tile ' + (tile.s === 'b' ? 'xc-bomb' : colorOf(tile.t)) + (tile.s && tile.s !== 'b' ? ' xc-s-' + tile.s : '');
  }
  const sigOf = tile => (tile.s || '') + tile.t + ':' + (tile.s === 'b' ? '' : wordOf(tile.t));
  function render(first) {
    const fresh = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const tile = S.grid[r][c]; if (!tile) continue;
      let d = tiles.get(tile.id);
      if (!d) {
        d = document.createElement('div');
        d.innerHTML = faceHtml(tile); d.className = tileClass(tile); d.dataset.sig = sigOf(tile);
        const fr = tile.from ?? -1;
        d.style.transition = 'none';
        d.style.transform = `translate(${c * 100}%, ${fr * 100}%)`;
        el.board.appendChild(d); tiles.set(tile.id, d); fresh.push([d, r, c]);
      } else {
        const sig = sigOf(tile);
        if (d.dataset.sig !== sig) { d.innerHTML = faceHtml(tile); d.className = tileClass(tile); d.dataset.sig = sig; d.classList.add('xc-born'); }
        d.style.transform = `translate(${c * 100}%, ${r * 100}%)`;
      }
      d.classList.toggle('xc-sel', !!(S.sel && S.sel[0] === r && S.sel[1] === c));
      tile.fresh = false; delete tile.from;
    }
    if (fresh.length) {
      void el.board.offsetWidth;   // ép trình duyệt vẽ vị trí xuất phát trước khi cho rơi
      fresh.forEach(([d, r, c]) => { d.style.transition = ''; d.style.transform = `translate(${c * 100}%, ${r * 100}%)`; });
    }
  }
  function renderHud() {
    el.lv.textContent = S.L; el.moves.textContent = S.moves;
    el.score.textContent = fmt(S.score);
    el.target.textContent = `${doneCount()}/${S.words.length}`;
    const got = S.cleared.reduce((a, n) => a + Math.min(n, S.quota), 0);
    el.bar.style.width = Math.min(100, got / (S.words.length * S.quota) * 100) + '%';
    el.moves.parentElement.classList.toggle('xc-low', S.moves <= 3);
  }
  const doneCount = () => S.cleared.filter(n => n >= S.quota).length;
  function legCount(w) {
    const n = Math.min(S.cleared[w], S.quota);
    return { txt: n >= S.quota ? '✓' : `${n}/${S.quota}`, pct: n / S.quota * 100 };
  }
  function renderLegend() {
    el.legend.innerHTML = S.slot.map((w, t) => {
      if (S.retired[t]) return '';
      const x = S.words[w]; const k = legCount(w);
      return `
      <button type="button" class="xc-leg xc-k${S.wcolor[w]}${S.cleared[w] >= S.quota ? ' xc-leg-done' : ''}" data-xc-say="${w}" title="Nghe đọc">
        <span class="xc-leg-h font-hanzi">${esc(x.hanzi)}</span>
        <span class="xc-leg-t"><b>${esc(x.pinyin || '')}</b><small>${esc(x.mean)}</small>
          <span class="xc-leg-bar"><i data-xc-bar="${w}" style="width:${k.pct}%"></i></span></span>
        <span class="xc-leg-n" data-xc-n="${w}">${k.txt}</span>
      </button>`;
    }).join('');
    const done = S.words.map((x, i) => i).filter(i => S.cleared[i] >= S.quota && !S.slot.some((w, t) => w === i && !S.retired[t]));
    el.queue.innerHTML = `
      <p class="xc-side-h">Đã thu thập <b>${doneCount()}/${S.words.length}</b> từ${S.queue.length ? ` · còn <b>${S.queue.length}</b> từ chờ xuất hiện` : ''}</p>
      <div class="xc-chips">${done.map(i => `<button type="button" class="xc-chip xc-k${S.wcolor[i]} font-hanzi" data-xc-say="${i}" title="${esc(S.words[i].pinyin || '')} · ${esc(S.words[i].mean)}">✓ ${esc(S.words[i].hanzi)}</button>`).join('')}${S.queue.map(() => '<span class="xc-chip xc-chip-q">?</span>').join('')}</div>`;
  }
  el.queue.addEventListener('click', e => {
    const b = e.target.closest('[data-xc-say]'); if (!b || !S) return;
    const w = S.words[+b.dataset.xcSay]; if (window.tnVoice) window.tnVoice.speak(w.hanzi, { rate: 0.85 });
  });
  el.legend.addEventListener('click', e => {
    const b = e.target.closest('[data-xc-say]'); if (!b || !S) return;
    const w = S.words[+b.dataset.xcSay]; if (window.tnVoice) window.tnVoice.speak(w.hanzi, { rate: 0.85 });
  });
  function showWord(wi, label) {
    const w = S.words[wi];
    el.word.innerHTML = `<div class="xc-word-card xc-k${S.wcolor[wi]}">${label ? `<span class="xc-word-new">${label}</span>` : ''}
      <span class="xc-word-h font-hanzi">${esc(w.hanzi)}</span>
      <span class="xc-word-p">${esc(w.pinyin || '')}</span>
      <span class="xc-word-m">${esc(w.mean)}</span></div>`;
  }
  function fx(text, sub) {
    const d = document.createElement('div');
    d.className = 'xc-fx-pop';
    d.innerHTML = `<b class="font-hanzi">${esc(text)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    el.fx.appendChild(d); setTimeout(() => d.remove(), 1100);
  }

  /* ---------------- Điều khiển: bấm 2 ô hoặc vuốt ---------------- */
  let drag = null;
  function cellAt(ev) {
    const rc = el.board.getBoundingClientRect(); const sz = rc.width / N;
    const c = Math.floor((ev.clientX - rc.left) / sz), r = Math.floor((ev.clientY - rc.top) / sz);
    return (r >= 0 && r < N && c >= 0 && c < N) ? [r, c] : null;
  }
  el.board.addEventListener('pointerdown', ev => {
    if (!S || S.busy) return;
    const p = cellAt(ev); if (!p) return;
    drag = { p, x: ev.clientX, y: ev.clientY, moved: false };
    try { el.board.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  el.board.addEventListener('pointermove', ev => {
    if (!drag || drag.moved || !S || S.busy) return;
    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    const sz = el.board.getBoundingClientRect().width / N;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < sz * 0.35) return;
    drag.moved = true;
    const [r, c] = drag.p;
    const to = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    if (to[0] >= 0 && to[0] < N && to[1] >= 0 && to[1] < N) { S.sel = null; attempt(drag.p, to); }
  });
  el.board.addEventListener('pointerup', ev => {
    if (!drag || !S) { drag = null; return; }
    const d = drag; drag = null;
    if (d.moved || S.busy) return;
    const p = d.p;
    if (S.sel) {
      const [sr, sc] = S.sel;
      if (sr === p[0] && sc === p[1]) { S.sel = null; render(); return; }
      if (Math.abs(sr - p[0]) + Math.abs(sc - p[1]) === 1) { const from = S.sel; S.sel = null; attempt(from, p); return; }
    }
    S.sel = p; render();
  });
  el.board.addEventListener('pointercancel', () => { drag = null; });
  el.hintBtn.addEventListener('click', () => { if (S && !S.busy) showHint(); });

  /* ---------------- Gợi ý khi đứng yên lâu ---------------- */
  function armHint() {
    if (!S) return; clearTimeout(S.hintTimer);
    const me = S; S.hintTimer = setTimeout(() => { if (S === me && !S.busy) showHint(); }, 7000);
  }
  function showHint() {
    el.board.querySelectorAll('.xc-hint').forEach(d => d.classList.remove('xc-hint'));
    const m = findMove(); if (!m) return;
    m.forEach(([r, c]) => { const d = tiles.get(S.grid[r][c].id); if (d) { d.classList.remove('xc-hint'); void d.offsetWidth; d.classList.add('xc-hint'); } });
  }

  /* ---------------- Tìm hàng 3+ ---------------- */
  const typeAt = (r, c) => { const t = S.grid[r] && S.grid[r][c]; return t && t.s !== 'b' ? t.t : -1; };
  function findRuns() {
    const runs = [];
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        const t = typeAt(r, c); let e = c + 1;
        while (e < N && t >= 0 && typeAt(r, e) === t) e++;
        if (t >= 0 && e - c >= 3) { const cells = []; for (let i = c; i < e; i++) cells.push([r, i]); runs.push({ cells, dir: 'h' }); }
        c = e;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        const t = typeAt(r, c); let e = r + 1;
        while (e < N && t >= 0 && typeAt(e, c) === t) e++;
        if (t >= 0 && e - r >= 3) { const cells = []; for (let i = r; i < e; i++) cells.push([i, c]); runs.push({ cells, dir: 'v' }); }
        r = e;
      }
    }
    return runs;
  }
  function groupRuns(runs) {          // gộp các hàng có chung ô (hình L / T)
    const groups = []; const owner = new Map();
    runs.forEach(run => {
      let g = null;
      run.cells.forEach(([r, c]) => { const o = owner.get(key(r, c)); if (o && !g) g = o; });
      if (!g) { g = { runs: [], cells: new Map() }; groups.push(g); }
      g.runs.push(run);
      run.cells.forEach(([r, c]) => { g.cells.set(key(r, c), [r, c]); owner.set(key(r, c), g); });
    });
    return groups;
  }
  function lineAt(r, c) {            // ô (r,c) có nằm trong hàng ≥ 3 không
    const t = typeAt(r, c); if (t < 0) return false;
    let h = 1, v = 1;
    for (let i = c - 1; i >= 0 && typeAt(r, i) === t; i--) h++;
    for (let i = c + 1; i < N && typeAt(r, i) === t; i++) h++;
    for (let i = r - 1; i >= 0 && typeAt(i, c) === t; i--) v++;
    for (let i = r + 1; i < N && typeAt(i, c) === t; i++) v++;
    return h >= 3 || v >= 3;
  }
  function swapCells(a, b) { const t = S.grid[a[0]][a[1]]; S.grid[a[0]][a[1]] = S.grid[b[0]][b[1]]; S.grid[b[0]][b[1]] = t; }
  const isSpecialPair = (A, B) => A && B && (A.s === 'b' || B.s === 'b' || (A.s && B.s));
  function findMove() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc; if (r2 >= N || c2 >= N) continue;
        if (isSpecialPair(S.grid[r][c], S.grid[r2][c2])) return [[r, c], [r2, c2]];
        swapCells([r, c], [r2, c2]);
        const ok = lineAt(r, c) || lineAt(r2, c2);
        swapCells([r, c], [r2, c2]);
        if (ok) return [[r, c], [r2, c2]];
      }
    }
    return null;
  }

  /* ---------------- Một nước đi ---------------- */
  async function attempt(a, b) {
    if (!S || S.busy || S.moves <= 0) return;
    const me = S; S.busy = true; clearTimeout(S.hintTimer);
    el.board.querySelectorAll('.xc-hint').forEach(d => d.classList.remove('xc-hint'));
    const A = S.grid[a[0]][a[1]], B = S.grid[b[0]][b[1]];
    swapCells(a, b); render(); await sleep(190); if (me.dead) return;

    let firstClear = null;
    if (isSpecialPair(A, B)) {
      // Ngôi sao ✦ đổi với ô thường → xoá mọi ô cùng chữ; 2 ô đặc biệt đổi nhau → cùng nổ
      const set = new Set([key(...a), key(...b)]);
      if (A.s === 'b' && B.s === 'b') { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) set.add(key(r, c)); }
      else if (A.s === 'b' || B.s === 'b') {
        const other = A.s === 'b' ? B : A;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (S.grid[r][c].s !== 'b' && S.grid[r][c].t === other.t) set.add(key(r, c));
        firstClear = other.t;
      }
      S.moves--; renderHud(); sndOk();
      await blast(set, [], 1, firstClear); if (me.dead) return;
    } else if (!(lineAt(...a) || lineAt(...b))) {
      sndBad();
      swapCells(a, b); render();
      [A, B].forEach(t => { const d = tiles.get(t.id); if (d) { d.classList.remove('xc-nope'); void d.offsetWidth; d.classList.add('xc-nope'); } });
      await sleep(200); S.busy = false; armHint(); return;
    } else {
      S.moves--; renderHud();
    }

    // Xoá liên hoàn (combo) cho tới khi bảng ổn định
    let combo = 1, swapPos = [a, b];
    while (!me.dead && await resolve(combo, swapPos)) { combo++; swapPos = null; }
    if (me.dead) return;
    if (combo >= 3) { const p = PRAISE[Math.min(combo - 3, PRAISE.length - 1)]; fx(p[0], p[1]); }

    if (doneCount() >= S.words.length) return finish(true);
    if (S.moves <= 0) return finish(false);
    if (!findMove()) {
      fx('洗牌', 'xǐpái · xáo lại bảng'); await sleep(500); if (me.dead) return;
      reshuffle(); render(); await sleep(300);
    }
    S.busy = false; armHint();
  }

  async function resolve(combo, swapPos) {
    const runs = findRuns(); if (!runs.length) return false;
    const groups = groupRuns(runs);
    const set = new Set(); const creates = [];
    groups.forEach(g => {
      const cells = [...g.cells.values()];
      const t = typeAt(cells[0][0], cells[0][1]);
      const maxLen = Math.max(...g.runs.map(x => x.cells.length));
      const hasH = g.runs.some(x => x.dir === 'h'), hasV = g.runs.some(x => x.dir === 'v');
      let s = null;
      if (maxLen >= 5) s = 'b'; else if (hasH && hasV) s = 'w'; else if (maxLen === 4) s = g.runs[0].dir; // 'h' nổ hàng, 'v' nổ cột
      let pivot = null;
      if (s) {
        const inGroup = p => p && g.cells.has(key(p[0], p[1])) && !S.grid[p[0]][p[1]].s;
        if (swapPos) pivot = swapPos.find(inGroup) || null;
        if (!pivot) {
          if (hasH && hasV) { const cnt = new Map(); g.runs.forEach(x => x.cells.forEach(([r, c]) => cnt.set(key(r, c), (cnt.get(key(r, c)) || 0) + 1))); const k = [...cnt].find(([, n]) => n > 1); if (k) pivot = g.cells.get(k[0]); }
          if (!pivot || S.grid[pivot[0]][pivot[1]].s) { const plain = cells.filter(([r, c]) => !S.grid[r][c].s); pivot = plain[(plain.length / 2) | 0] || null; }
        }
        if (pivot) creates.push({ pos: pivot, t, s });
      }
      cells.forEach(([r, c]) => set.add(key(r, c)));
    });
    sndOk(combo);
    await blast(set, creates, combo, typeAt(...[...groups[0].cells.values()][0]));
    return true;
  }

  // Xoá các ô trong set (kích nổ dây chuyền các ô đặc biệt), tạo ô đặc biệt mới, rồi cho rơi.
  async function blast(set, creates, combo, wordType) {
    const me = S;
    const protect = new Set(creates.map(x => key(...x.pos)));
    const fired = new Set(); const queue = [...set];
    while (queue.length) {
      const k = queue.shift(); const r = (k / N) | 0, c = k % N; const tile = S.grid[r][c];
      if (!tile || !tile.s || fired.has(k) || protect.has(k)) continue;
      fired.add(k);
      const add = (rr, cc) => { if (rr < 0 || rr >= N || cc < 0 || cc >= N) return; const kk = key(rr, cc); if (!set.has(kk)) { set.add(kk); queue.push(kk); } };
      if (tile.s === 'h') for (let i = 0; i < N; i++) add(r, i);
      if (tile.s === 'v') for (let i = 0; i < N; i++) add(i, c);
      if (tile.s === 'w') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
      if (tile.s === 'b') {           // ngôi sao bị nổ dây chuyền → xoá loại chữ nhiều nhất
        const cnt = new Array(S.kinds).fill(0);
        for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) { const t = S.grid[rr][cc]; if (t && t.s !== 'b') cnt[t.t]++; }
        const best = cnt.indexOf(Math.max(...cnt));
        for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) { const t = S.grid[rr][cc]; if (t && t.s !== 'b' && t.t === best) add(rr, cc); }
      }
    }
    if (fired.size) flashLines(fired);
    protect.forEach(k => set.delete(k));

    let n = 0;
    set.forEach(k => {
      const r = (k / N) | 0, c = k % N; const tile = S.grid[r][c]; if (!tile) return;
      n++; if (tile.s !== 'b') S.cleared[wordOf(tile.t)]++;
      const d = tiles.get(tile.id);
      if (d) { d.classList.add('xc-pop'); tiles.delete(tile.id); setTimeout(() => d.remove(), 260); }
      S.grid[r][c] = null;
    });
    creates.forEach(({ pos, t, s }) => { const tile = S.grid[pos[0]][pos[1]]; if (tile) { tile.s = s; tile.t = s === 'b' ? -1 : t; } n += 1; });
    const gain = Math.round(n * PTS * (1 + (combo - 1) * 0.5)) + creates.length * 100;
    S.score += gain;
    const clearedWord = wordType != null && wordType >= 0 ? wordOf(wordType) : -1;
    const arrived = rotateWords();
    if (arrived.length) {
      const w = arrived[arrived.length - 1];
      showWord(w, '✨ Từ mới xuất hiện');
      fx('新词', 'Từ mới: ' + arrived.map(i => S.words[i].hanzi).join(' · '));
      setTimeout(() => { if (S === me) speak(S.words[w].hanzi); }, 650);
    } else if (clearedWord >= 0) {
      showWord(clearedWord);
      if (combo === 1) speak(S.words[clearedWord].hanzi);
    }
    if (arrived.length) { /* đã báo từ mới */ }
    else if (creates.length) fx(creates.some(x => x.s === 'b') ? '✦ 星星' : creates.some(x => x.s === 'w') ? '炸弹' : '条纹', creates.some(x => x.s === 'b') ? 'Ngôi sao cầu vồng!' : creates.some(x => x.s === 'w') ? 'Chữ bọc · nổ 3×3' : 'Chữ sọc · nổ cả hàng');
    else if (combo === 2) fx('+' + fmt(gain), 'combo ×2');
    renderHud(); if (arrived.length || retiredNow) renderLegend(); else updateLegendCounts(); render();
    retiredNow = false;
    await sleep(240); if (me.dead) return;
    gravity(); render();
    await sleep(300);
  }
  function flashLines(fired) {
    fired.forEach(k => {
      const r = (k / N) | 0, c = k % N; const tile = S.grid[r][c]; if (!tile) return;
      const f = document.createElement('div'); f.className = 'xc-beam xc-beam-' + tile.s;
      f.style.setProperty('--r', r); f.style.setProperty('--c', c);
      el.board.appendChild(f); setTimeout(() => f.remove(), 450);
    });
  }
  function updateLegendCounts() {
    let changed = false;
    S.slot.forEach(w => {
      const k = legCount(w); const x = el.legend.querySelector(`[data-xc-n="${w}"]`); const b = el.legend.querySelector(`[data-xc-bar="${w}"]`);
      if (x) x.textContent = k.txt; if (b) b.style.width = k.pct + '%';
      if (S.cleared[w] >= S.quota && x && !x.closest('.xc-leg-done')) changed = true;
    });
    if (changed) renderLegend();
  }

  // Từ nào đã xếp đủ số lượng → rời bảng, từ kế tiếp trong hàng chờ thế chỗ (ô cũ đổi thành từ mới).
  // Hết hàng chờ → bỏ hẳn slot đó (ô chuyển sang các từ còn lại) nhưng luôn giữ ít nhất 3 loại chữ.
  let retiredNow = false;
  function rotateWords() {
    const arrived = [];
    S.slot.forEach((w, t) => {
      if (S.retired[t] || S.cleared[w] < S.quota) return;
      if (S.queue.length) {
        const nw = S.queue.shift();
        const used = new Set(S.slot.filter((x, i) => !S.retired[i] && i !== t).map(x => S.wcolor[x]));
        const free = [...Array(COLORS).keys()].filter(c => !used.has(c) && c !== S.wcolor[w]);
        S.wcolor[nw] = free.length ? free[rnd(free.length)] : S.wcolor[w];
        S.slot[t] = nw; arrived.push(nw);
      } else if (liveSlots().length > 3) {
        S.retired[t] = true; retiredNow = true;
        const l = liveSlots();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const x = S.grid[r][c]; if (x && x.t === t) x.t = l[rnd(l.length)]; }
      }
    });
    return arrived;
  }

  function gravity() {
    for (let c = 0; c < N; c++) {
      let w = N - 1;
      for (let r = N - 1; r >= 0; r--) if (S.grid[r][c]) { const t = S.grid[r][c]; S.grid[r][c] = null; S.grid[w][c] = t; w--; }
      const missing = w + 1;
      for (let r = w; r >= 0; r--) { const t = newTile(spawnType()); t.from = r - missing; S.grid[r][c] = t; }
    }
  }
  function reshuffle() {
    const pos = []; const normals = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!S.grid[r][c].s) { pos.push([r, c]); normals.push(S.grid[r][c]); }
    for (let i = 0; i < 80; i++) {
      const sh = shuffle(normals);
      pos.forEach(([r, c], j) => { S.grid[r][c] = sh[j]; });
      if (!findRuns().length && findMove()) return;
    }
    // Không xáo được → làm bảng mới
    tiles.forEach(d => d.remove()); tiles.clear(); fillBoard();
  }

  /* ---------------- Kết thúc màn ---------------- */
  function finish(win) {
    const me = S; S.busy = true; clearTimeout(S.hintTimer);
    let bonus = 0;
    if (win) { bonus = S.moves * 100; S.score += bonus; }
    const best = loadBest(); let newRec = false;
    if (win && S.L + 1 > best.level) best.level = S.L + 1;
    if (S.score > (best.score || 0)) { best.score = S.score; newRec = true; }
    saveBest(best);
    call('trackStudyActivity');
    (win ? sndWinFx : sndLoseFx)();

    $('xc-r-emoji').textContent = win ? '🏆' : '🍬';
    $('xc-r-title').textContent = win ? `Qua màn ${S.L}! 过关了！` : `Hết lượt rồi — màn ${S.L}`;
    $('xc-r-sub').innerHTML = win
      ? `Đạt mục tiêu với <b>${me.moves}</b> lượt còn dư (+${fmt(bonus)} điểm thưởng).`
      : `Đã thu thập <b>${doneCount()}/${S.words.length}</b> từ — còn <b>${S.words.length - doneCount()}</b> từ chưa đủ ${S.quota} ô. Thử lại nhé!`;
    $('xc-r-score').textContent = fmt(S.score);
    $('xc-r-best').textContent = fmt(best.score) + (newRec ? ' 🎉' : '');
    $('xc-r-words').innerHTML = S.words.map((w, i) => S.cleared[i] || S.slot.includes(i) ? `
      <div class="xc-rw xc-k${S.wcolor[i]}">
        <button type="button" class="xc-rw-say" data-xc-rsay="${i}" title="Nghe đọc">🔊</button>
        <span class="xc-rw-h font-hanzi">${esc(w.hanzi)}</span>
        <span class="xc-rw-t"><b>${esc(w.pinyin || '')}</b> · ${esc(w.mean)}</span>
        <span class="xc-rw-n">${S.cleared[i] >= S.quota ? '✓' : `${S.cleared[i]}/${S.quota}`}</span>
        <button type="button" class="xc-rw-nb" data-xc-nb="${i}" title="Thêm vào sổ tay từ vựng">+ Sổ tay</button>
      </div>` : '').join('');
    const next = $('xc-next');
    next.textContent = win ? `Màn ${S.L + 1} →` : 'Chơi lại màn này';
    next.dataset.level = win ? S.L + 1 : S.L;
    setTimeout(() => { if (S === me) show('result'); }, 700);
  }
  $('xc-r-words').addEventListener('click', e => {
    if (!S) return;
    const say = e.target.closest('[data-xc-rsay]');
    if (say && window.tnVoice) window.tnVoice.speak(S.words[+say.dataset.xcRsay].hanzi, { rate: 0.85 });
    const nb = e.target.closest('[data-xc-nb]');
    if (nb && !nb.disabled) { call('addToNotebook', S.words[+nb.dataset.xcNb]); nb.textContent = '✓ Đã thêm'; nb.disabled = true; }
  });
  $('xc-next').addEventListener('click', e => startLevel(+e.currentTarget.dataset.level || 1));
  $('xc-back').addEventListener('click', stop);

  /* ---------------- Âm thanh (dùng chung của trang nếu có) ---------------- */
  function sndOk(combo) { call('sndCorrect'); }
  function sndBad() { call('sndWrong'); }
  function sndWinFx() { call(typeof window.sndWin === 'function' ? 'sndWin' : 'sndCorrect'); }
  function sndLoseFx() { call(typeof window.sndLose === 'function' ? 'sndLose' : 'sndWrong'); }
}

/* ===================================================================== */
const CLOUD = '<svg class="jn-cloud" fill="#fff" style="{S}" viewBox="0 0 100 60"><ellipse cx="30" cy="35" rx="28" ry="20"></ellipse><ellipse cx="55" cy="25" rx="22" ry="18"></ellipse><ellipse cx="72" cy="38" rx="20" ry="15"></ellipse></svg>';
const TEMPLATE = `
<div class="jn-sky xc-sky">
  ${CLOUD.replace('{S}', 'top:10px; left:6%; width:64px;')}
  ${CLOUD.replace('{S}', 'top:4px; right:8%; width:50px;')}
  ${CLOUD.replace('{S}', 'bottom:14px; left:42%; width:58px;')}

  <div id="xc-setup">
    <div class="flex items-center gap-3 mb-4">
      <span class="jn-sun">🍬</span>
      <div>
        <h3 class="font-sans font-semibold text-lg text-ink">Xếp chữ 消消乐 <span class="xc-py">xiāoxiāolè</span></h3>
        <p class="text-xs text-ink/70">Luật như Candy Crush: đổi chỗ 2 ô cạnh nhau để có <strong>3 chữ Hán giống nhau</strong> thẳng hàng — chúng sẽ biến mất. Mỗi màn có <strong>10–20 từ</strong> lần lượt xuất hiện: từ nào xếp đủ số lượng sẽ nhường chỗ cho từ mới. Thu thập đủ mọi từ trước khi hết lượt để qua màn!</p>
      </div>
    </div>
    <div class="jn-setup-card">
      <div class="xc-rules">
        <div><span class="xc-mini xc-k0">3</span><b>3 chữ giống nhau</b><small>biến mất, hiện nghĩa từ</small></div>
        <div><span class="xc-mini xc-k2 xc-s-h">4</span><b>4 chữ thẳng hàng</b><small>tạo chữ sọc — nổ cả hàng/cột</small></div>
        <div><span class="xc-mini xc-k4 xc-s-w">L</span><b>Hình chữ L / T</b><small>tạo chữ bọc — nổ vùng 3×3</small></div>
        <div><span class="xc-mini xc-bomb">✦</span><b>5 chữ thẳng hàng</b><small>tạo ngôi sao — đổi với ô nào, xoá hết chữ đó</small></div>
      </div>
      <p class="text-xs text-ink/70 mt-3">Bộ từ đang chơi: <b class="text-mint" id="xc-deck"></b> (đổi ở ô chọn cấp độ phía trên).</p>
      <div class="flex flex-wrap items-center gap-3 mt-3">
        <button class="px-5 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold hover:opacity-90 focus-ring" id="xc-start" type="button">🍬 Chơi màn <span id="xc-start-level">1</span></button>
        <button class="hidden text-xs font-semibold text-ink/70 hover:text-ink underline" id="xc-restart1" type="button">Chơi lại từ màn 1</button>
        <span class="jn-progress-pill">Màn cao nhất: <span class="text-mint" id="xc-best-level">1</span></span>
        <span class="jn-progress-pill">Điểm cao nhất: <span class="text-mint" id="xc-best-score">0</span></span>
      </div>
      <label class="xc-voice-tg mt-3"><input type="checkbox" id="xc-voice" checked> 🔊 Đọc to từ vừa xếp được</label>
      <p class="text-xs text-seal mt-3 hidden" id="xc-warn">Bộ từ hiện tại chưa đủ dữ liệu (cần ít nhất 5 từ khác nhau có nghĩa). Hãy chọn cấp độ khác.</p>
    </div>
  </div>

  <div class="hidden" id="xc-play">
    <div class="jn-topbar">
      <span class="jn-progress-pill">Màn <span class="text-mint" id="xc-lv">1</span></span>
      <span class="jn-progress-pill">Lượt còn: <span id="xc-moves">20</span></span>
      <span class="jn-progress-pill">Từ: <span class="text-mint" id="xc-target">0</span></span>
      <span class="jn-progress-pill">Điểm: <span class="text-mint" id="xc-score">0</span></span>
      <span class="flex items-center gap-2">
        <button class="text-xs font-semibold text-ink/70 hover:text-ink bg-white/70 rounded-full px-3 py-1.5" id="xc-hint" type="button">💡 Gợi ý</button>
        <button class="text-xs font-semibold text-ink/70 hover:text-ink underline bg-white/70 rounded-full px-3 py-1.5" id="xc-quit" type="button">Dừng lại</button>
      </span>
    </div>
    <div class="jn-timebar-track"><div class="jn-timebar-fill xc-bar" id="xc-bar" style="width:0%"></div></div>
    <div class="xc-stage">
      <div class="xc-board-wrap">
        <div class="xc-board" id="xc-board"></div>
        <div class="xc-fx" id="xc-fx"></div>
      </div>
      <div class="xc-side">
        <div class="xc-word" id="xc-word"></div>
        <p class="xc-side-h">Các từ trên bảng <small>(bấm để nghe)</small></p>
        <div class="xc-legend" id="xc-legend"></div>
        <div class="xc-queue" id="xc-queue"></div>
      </div>
    </div>
  </div>

  <div class="hidden jn-celebrate" id="xc-result">
    <p class="text-5xl mb-2" id="xc-r-emoji">🏆</p>
    <h3 class="font-sans font-semibold text-xl text-ink mb-1" id="xc-r-title"></h3>
    <p class="text-sm text-ink/80 mb-4" id="xc-r-sub"></p>
    <div class="flex flex-wrap items-center justify-center gap-3 mb-4">
      <div class="jn-stat-card"><p class="text-xs text-slate mb-0.5">Điểm màn này</p><p class="font-black text-2xl text-ink" id="xc-r-score">0</p></div>
      <div class="jn-stat-card"><p class="text-xs text-slate mb-0.5">Điểm cao nhất</p><p class="font-black text-2xl text-ink" id="xc-r-best">0</p></div>
    </div>
    <div class="xc-rwords text-left mb-5">
      <p class="text-sm font-semibold text-ink mb-2">Từ vựng trong màn này</p>
      <div id="xc-r-words"></div>
    </div>
    <div class="flex flex-wrap justify-center gap-3">
      <button class="px-5 py-2.5 rounded-xl bg-mint text-white text-sm font-semibold hover:opacity-90 focus-ring" id="xc-next" type="button">Màn tiếp theo →</button>
      <button class="px-5 py-2.5 rounded-xl bg-white text-ink text-sm font-semibold hover:opacity-90 focus-ring" id="xc-back" type="button">Về màn hình chính</button>
    </div>
  </div>
</div>`;

function injectCss() {
  if (document.getElementById('xc-style')) return;
  const st = document.createElement('style'); st.id = 'xc-style';
  st.textContent = `
  .xc-py { font-size: 12px; font-weight: 600; color: #5B6472; margin-left: 4px; }
  /* 8 màu pastel cho các từ (mỗi lúc trên bảng tối đa 6) */
  .xc-k0 { --bg:#FFD8C2; --bd:#F4A97F; --fg:#9A3F0E; }
  .xc-k1 { --bg:#CDEFD9; --bd:#8FD3AC; --fg:#1F6B43; }
  .xc-k2 { --bg:#CFE2FF; --bd:#93B7F0; --fg:#1E3F8F; }
  .xc-k3 { --bg:#FFF0A8; --bd:#EBCD55; --fg:#7A5A00; }
  .xc-k4 { --bg:#E3D9FF; --bd:#B7A3F0; --fg:#4E3497; }
  .xc-k5 { --bg:#FFD6E4; --bd:#F2A2BE; --fg:#9A2E58; }
  .xc-k6 { --bg:#C8F0EE; --bd:#82D2CC; --fg:#16625D; }
  .xc-k7 { --bg:#F2E2CE; --bd:#D8B48A; --fg:#6E4A1E; }
  .xc-bomb { --bg:#000080; --bd:#FF7D00; --fg:#FFD35C; }

  .xc-rules { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  @media (max-width:560px){ .xc-rules { grid-template-columns:1fr; } }
  .xc-rules > div { display:grid; grid-template-columns:34px 1fr; column-gap:10px; align-items:center; background:#fff; border-radius:14px; padding:8px 10px; }
  .xc-rules b { font-size:13px; color:#2E3440; } .xc-rules small { grid-column:2; font-size:11.5px; color:#5B6472; }
  .xc-mini { grid-row:span 2; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; background:var(--bg); color:var(--fg); box-shadow: inset 0 -3px 0 var(--bd); position:relative; overflow:hidden; }
  .xc-voice-tg { display:inline-flex; align-items:center; gap:8px; font-size:13px; color:#2E3440; cursor:pointer; }
  .xc-voice-tg input { width:16px; height:16px; accent-color:#000080; }

  .xc-stage { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr); gap:16px; align-items:start; position:relative; z-index:2; }
  @media (max-width:820px){ .xc-stage { grid-template-columns:1fr; } }
  .xc-board-wrap { position:relative; width:100%; max-width:480px; margin:0 auto; }
  .xc-board { position:relative; width:100%; aspect-ratio:1/1; background:rgba(255,255,255,.55); border:4px solid #fff; border-radius:20px; box-shadow:0 10px 24px rgba(0,60,120,.18); overflow:hidden; touch-action:none; user-select:none; -webkit-user-select:none; container-type:inline-size; }
  .xc-tile { position:absolute; left:0; top:0; width:12.5%; height:12.5%; padding:3px; transition:transform .24s cubic-bezier(.3,.7,.4,1); cursor:pointer; will-change:transform; }
  .xc-face { position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%; border-radius:11px; background:var(--bg); color:var(--fg); box-shadow: inset 0 -4px 0 var(--bd), 0 2px 4px rgba(0,0,0,.08); overflow:hidden; transition:transform .15s ease, opacity .22s ease; }
  .xc-han { line-height:1; white-space:nowrap; }
  .xc-len1 { font-size:min(7cqw, 34px); } .xc-len2 { font-size:min(4.6cqw, 22px); } .xc-len3 { font-size:min(3.2cqw, 16px); }
  .xc-star { font-size:min(7cqw,32px); line-height:1; color:#FFD35C; text-shadow:0 0 6px rgba(255,211,92,.8); }
  .xc-bomb .xc-face { background: conic-gradient(from 0deg, #FFB4B4, #FFE58A, #B9F0C9, #B4D4FF, #E1C9FF, #FFB4B4); box-shadow: inset 0 0 0 3px #000080, 0 2px 6px rgba(0,0,128,.3); }
  .xc-bomb .xc-star { color:#000080; text-shadow:0 0 4px #fff; }
  /* chữ sọc / chữ bọc */
  .xc-s-h .xc-face::after, .xc-s-v .xc-face::after, .xc-mini.xc-s-h::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.55;
    background: repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,.95) 5px 8px); }
  .xc-s-v .xc-face::after { background: repeating-linear-gradient(90deg, transparent 0 5px, rgba(255,255,255,.95) 5px 8px); }
  .xc-s-w .xc-face, .xc-mini.xc-s-w { box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 5px var(--bd), 0 0 10px var(--bd); }
  .xc-s-h .xc-han, .xc-s-v .xc-han, .xc-s-w .xc-han { position:relative; z-index:1; text-shadow:0 0 3px #fff, 0 0 6px #fff; }
  .xc-sel .xc-face { transform:scale(.9); box-shadow: inset 0 0 0 3px #000080, 0 0 0 2px #fff; }
  .xc-pop .xc-face { transform:scale(0) rotate(25deg); opacity:0; }
  .xc-born .xc-face { animation: xcBorn .35s ease; }
  .xc-hint .xc-face { animation: xcHint .9s ease 2; }
  .xc-nope .xc-face { animation: shakeTile .35s ease; }
  @keyframes xcBorn { 0%{transform:scale(.4)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes xcHint { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12); box-shadow: inset 0 -4px 0 var(--bd), 0 0 0 3px #FF7D00;} }
  .xc-beam { position:absolute; pointer-events:none; z-index:5; background:rgba(255,255,255,.85); box-shadow:0 0 12px #fff; animation: xcBeam .45s ease forwards; }
  .xc-beam-h { left:0; right:0; top:calc(var(--r) * 12.5% + 4%); height:4.5%; }
  .xc-beam-v { top:0; bottom:0; left:calc(var(--c) * 12.5% + 4%); width:4.5%; }
  .xc-beam-w { left:calc((var(--c) - 1) * 12.5%); top:calc((var(--r) - 1) * 12.5%); width:37.5%; height:37.5%; border-radius:16px; }
  .xc-beam-b { inset:0; background:radial-gradient(circle, rgba(255,255,255,.9), rgba(255,255,255,0) 70%); }
  @keyframes xcBeam { from{opacity:1} to{opacity:0} }
  .xc-fx { position:absolute; inset:0; pointer-events:none; display:flex; align-items:center; justify-content:center; z-index:6; }
  .xc-fx-pop { position:absolute; display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,.92); color:#000080; border-radius:18px; padding:8px 18px; box-shadow:0 8px 20px rgba(0,0,128,.2); animation: xcFx 1.1s ease forwards; }
  .xc-fx-pop b { font-size:30px; font-weight:400; line-height:1.2; } .xc-fx-pop small { font-size:12px; font-weight:700; color:#B35900; }
  @keyframes xcFx { 0%{opacity:0; transform:scale(.6)} 18%{opacity:1; transform:scale(1.08)} 30%{transform:scale(1)} 80%{opacity:1} 100%{opacity:0; transform:translateY(-24px)} }

  .xc-side { display:flex; flex-direction:column; gap:10px; }
  .xc-word { min-height:118px; background:rgba(255,255,255,.72); border-radius:18px; padding:12px; display:flex; align-items:center; justify-content:center; }
  .xc-word-tip { font-size:13px; color:#2E3440; text-align:center; line-height:1.55; }
  .xc-word-card { width:100%; display:flex; flex-direction:column; align-items:center; gap:2px; background:var(--bg); border-radius:14px; padding:10px; box-shadow: inset 0 -4px 0 var(--bd); animation: xcBorn .35s ease; }
  .xc-word-h { font-size:42px; line-height:1.15; color:var(--fg); }
  .xc-word-p { font-size:15px; font-weight:700; color:#2E3440; }
  .xc-word-m { font-size:14px; color:#2E3440; text-align:center; }
  .xc-side-h { font-size:13px; font-weight:700; color:#2E3440; } .xc-side-h small { font-weight:500; color:#5B6472; }
  .xc-legend { display:grid; grid-template-columns:1fr; gap:6px; }
  @media (max-width:820px) and (min-width:480px){ .xc-legend { grid-template-columns:1fr 1fr; } }
  .xc-leg { display:flex; align-items:center; gap:10px; text-align:left; background:#fff; border-radius:12px; padding:6px 10px 6px 6px; border-left:6px solid var(--bd); transition: transform .1s ease; }
  .xc-leg:hover { transform: translateX(2px); }
  .xc-leg-h { min-width:40px; height:36px; padding:0 4px; border-radius:9px; background:var(--bg); color:var(--fg); display:flex; align-items:center; justify-content:center; font-size:20px; }
  .xc-leg-t { flex:1; min-width:0; display:flex; flex-direction:column; line-height:1.25; }
  .xc-leg-t b { font-size:12.5px; color:#2E3440; } .xc-leg-t small { font-size:12px; color:#5B6472; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .xc-leg-n { font-size:12px; font-weight:800; color:var(--fg); white-space:nowrap; }
  .xc-leg-bar { display:block; height:4px; margin-top:3px; border-radius:9999px; background:#EEF0F3; overflow:hidden; }
  .xc-leg-bar i { display:block; height:100%; background:var(--bd); border-radius:9999px; transition:width .3s ease; }
  .xc-leg-done { opacity:.6; }
  .xc-queue { background:rgba(255,255,255,.72); border-radius:14px; padding:8px 10px; }
  .xc-chips { display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }
  .xc-chip { font-size:14px; line-height:1; padding:5px 8px; border-radius:9999px; background:var(--bg); color:var(--fg); box-shadow: inset 0 -2px 0 var(--bd); }
  .xc-chip-q { background:#fff; color:#9AA3AF; border:1px dashed #C9CED6; box-shadow:none; font-family:inherit; }
  .xc-word-new { font-size:11.5px; font-weight:800; color:#B35900; background:#FFF3E6; border-radius:9999px; padding:2px 10px; margin-bottom:2px; }
  #xc-moves { color:#000080; } .xc-low #xc-moves { color:#D6524F; }
  .xc-bar { background:#FF7D00; }

  .xc-rwords { max-width:560px; margin-left:auto; margin-right:auto; background:rgba(255,255,255,.72); border-radius:18px; padding:14px 16px; }
  .xc-rw { display:flex; align-items:center; gap:10px; background:#fff; border-radius:12px; padding:6px 8px; margin-top:6px; border-left:6px solid var(--bd); }
  .xc-rw-h { font-size:22px; color:var(--fg); min-width:44px; text-align:center; }
  .xc-rw-t { flex:1; min-width:0; font-size:13px; color:#2E3440; }
  .xc-rw-n { font-size:12px; font-weight:800; color:var(--fg); }
  .xc-rw-say { font-size:15px; } .xc-rw-nb { font-size:11.5px; font-weight:700; color:#000080; background:#EEF2FC; border-radius:9999px; padding:4px 9px; white-space:nowrap; }
  .xc-rw-nb:disabled { color:#1F6B43; background:#DCFCE7; }
  @media (prefers-reduced-motion: reduce) { .xc-tile { transition:none; } .xc-hint .xc-face, .xc-born .xc-face { animation:none; } }
  `;
  document.head.appendChild(st);
}

if (panel) init();
