/* =====================================================================
   TRÒ CHƠI THÀNH NGỮ · TỤC NGỮ · ĐIỂN CỐ (VIP) — tab "📜 Thành ngữ" trong khu Trò chơi
   ---------------------------------------------------------------------
   Dữ liệu: cùng kho "idioms" như mục Bài đọc → Thành ngữ tục ngữ (Firestore, chỉ người có quyền can_access_idioms đọc).
   7 trò: Đoán nghĩa · Nối cặp · Điền chữ thiếu · Đoán qua câu chuyện · Ai nói đây (xuất xứ) · Xếp chữ · Đấu trường 60 giây
   + Thành ngữ của ngày + Sổ "chưa thuộc" (tự động nhập khi trả lời sai, đồng bộ theo tài khoản).
   Điểm cộng vào bảng xếp hạng tuần/tháng qua window.tnSubmitScore('idiom', điểm, phầnTửThôngBáo).
   File tự chèn giao diện + CSS vào <div id="game-idiom">.
   ===================================================================== */
(function () {
  const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* ---- Khối "câu chuyện" dùng chung (game + mục Bài đọc): 3 tab 汉字 / 拼音 / Tiếng Việt + nghe đọc, giống bài đọc HSK ---- */
  window.tnStoryHtml = function (it, reveal) {
    const zh = it.story_zh || ''; if (!zh) return '';
    const syl = String(it.story_py || '').split(' ');
    const isH = c => c >= '\u4e00' && c <= '\u9fff';
    const sents = zh.match(/[^。！？]+[。！？]?/g) || [zh];
    let k = 0;
    const hz = sents.map(x => `<span style="display:block">${escH(x)}</span>`).join('');
    const py = sents.map(x => `<span class="py-sentence">${(() => { const t = []; [...x].forEach(c => { if (isH(c)) t.push(syl[k++] || ''); else if (t.length) t[t.length - 1] += c; }); return t.join(' '); })()}</span>`).join('');
    const vi = reveal ? (String(it.insight_vi || '').match(/[^.!?]+[.!?]*/g) || []).map(x => `<span class="vi-sentence">${escH(x.trim())}</span>`).join('') : '';
    return `<div class="gt-story" data-zh="${escH(zh)}">
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px"><button type="button" class="baidoc-tab-btn active" data-st-tab="hz">汉字</button><button type="button" class="baidoc-tab-btn" data-st-tab="py">拼音</button>${reveal ? '<button type="button" class="baidoc-tab-btn" data-st-tab="vi">Tiếng Việt</button>' : ''}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px"><button type="button" class="baidoc-audio-btn" data-st-say>🔊 Nghe câu chuyện</button>
        <select class="baidoc-audio-rate" data-st-rate title="Tốc độ đọc"><option value="0.7">Chậm</option><option value="0.85" selected>Vừa</option><option value="1.1">Nhanh</option></select></div>
      <div data-st-pane="hz" class="baidoc-hz-block">${hz}</div>
      <div data-st-pane="py" class="baidoc-py-block" style="display:none">${py}</div>
      ${reveal ? `<div data-st-pane="vi" class="baidoc-vi-block" style="display:none">${vi}</div>` : ''}</div>`;
  };
  if (!window.__tnStoryBound) {
    window.__tnStoryBound = true;
    document.addEventListener('click', e => {
      const tab = e.target.closest('[data-st-tab]');
      if (tab) {
        const box = tab.closest('.gt-story'); if (!box) return;
        box.querySelectorAll('[data-st-tab]').forEach(b => b.classList.toggle('active', b === tab));
        box.querySelectorAll('[data-st-pane]').forEach(p => { p.style.display = p.dataset.stPane === tab.dataset.stTab ? '' : 'none'; });
        return;
      }
      const sayBtn = e.target.closest('[data-st-say]');
      if (sayBtn) {
        const box = sayBtn.closest('.gt-story'); if (!box) return;
        const rate = parseFloat((box.querySelector('[data-st-rate]') || {}).value || '0.85');
        try { if (window.tnVoice) window.tnVoice.speak(box.dataset.zh, { rate }); } catch (err) {}
      }
    });
  }
  const panel = document.getElementById('game-idiom');
  if (!panel) return;
  const LS_WEAK = 'tn_idiom_weak_v1', LS_BEST = 'tn_gt_best_v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const strip = t => String(t).replace(/[^一-鿿]/g, '');
  const bookOf = it => { const m = String(it.origin || '').match(/《([^》·]+)/); return m ? m[1] : null; };
  const trunc = (s, n) => { s = String(s || '').trim(); if (s.length <= n) return s; const cut = s.slice(0, n); const k = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf(';'), cut.lastIndexOf(',')); return (k > n * 0.6 ? cut.slice(0, k) : cut).replace(/[;,\s]+$/, '') + '…'; };
  const say = t => { try { window.tnVoice ? window.tnVoice.speak(strip(t) || t, { rate: 0.8 }) : null; } catch (e) {} };
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ---------------- CSS ---------------- */
  const st = document.createElement('style');
  st.textContent = `
  #game-idiom .gt-wrap{max-width:860px;margin:0 auto}
  #game-idiom .gt-h{font-weight:700;font-size:18px;color:#2E3440}
  #game-idiom .gt-sub{font-size:13px;color:#5B6472;line-height:1.6}
  #game-idiom .gt-zh{font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif;color:#2E3440}
  #game-idiom .gt-daily{background:linear-gradient(135deg,var(--t0,#F5F0FF),var(--t1,#E6DAFD));border:1.5px solid var(--t2,#CDB8FA);border-radius:22px;padding:18px 20px;margin-bottom:16px}
  #game-idiom .gt-daily .gt-zh{font-size:34px;font-weight:700;line-height:1.3}
  #game-idiom .gt-py{color:var(--t4,#7C5CD6);font-size:15px;margin-top:2px}
  #game-idiom .gt-btn{border:none;background:var(--t5,#52329E);color:#fff;font-weight:700;border-radius:9999px;padding:9px 18px;font-size:14px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
  #game-idiom .gt-btn:hover{transform:translateY(-1px);box-shadow:0 8px 16px -10px color-mix(in srgb,var(--t5,#52329E) 60%,transparent)}
  #game-idiom .gt-btn.ghost{background:var(--t1,#E6DAFD);color:var(--t6,#2E1760)}
  #game-idiom .gt-btn[disabled]{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
  #game-idiom .gt-chip{padding:6px 12px;border-radius:9999px;border:1.5px solid var(--t2,#CDB8FA);background:#fff;font-size:13px;font-weight:600;color:#2E3440;cursor:pointer}
  #game-idiom .gt-chip.active{background:var(--t5,#52329E);color:#fff;border-color:var(--t5,#52329E)}
  #game-idiom .gt-chip[disabled]{opacity:.45;cursor:not-allowed}
  #game-idiom .gt-group{margin:18px 0 8px;font-weight:700;font-size:13px;letter-spacing:.3px;color:var(--t6,#2E1760)}
  #game-idiom .gt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
  #game-idiom .gt-game{text-align:left;border-radius:18px;padding:14px 16px;border:1.5px solid var(--bd,var(--t2,#CDB8FA));background:var(--bg,var(--t0,#F5F0FF));cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;opacity:0;animation:fadeUp .35s ease both}
  #game-idiom .gt-game:hover{transform:translateY(-2px);box-shadow:0 10px 22px -14px rgba(46,52,64,.35)}
  #game-idiom .gt-game b{display:block;font-size:15px;color:#2E3440}
  #game-idiom .gt-game small{display:block;font-size:12.5px;color:#5B6472;margin-top:3px;line-height:1.5}
  #game-idiom .gt-game .ic{font-size:22px}
  #game-idiom .gt-g1{--bg:var(--t0,#F5F0FF);--bd:var(--t2,#CDB8FA)}#game-idiom .gt-g2{--bg:var(--t1,#E6DAFD);--bd:var(--t3,#A98BF0)}#game-idiom .gt-g3{--bg:var(--t2,#CDB8FA);--bd:var(--t4,#7C5CD6)}
  #game-idiom .gt-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  #game-idiom .gt-bar{height:8px;border-radius:9999px;background:var(--t1,#E6DAFD);overflow:hidden;margin-bottom:14px}
  #game-idiom .gt-bar i{display:block;height:100%;background:var(--t5,#52329E);border-radius:9999px;transition:width .15s linear}
  #game-idiom .gt-bar.low i{background:#D6524F}
  #game-idiom .gt-q{background:#fff;border:1px solid rgba(46,52,64,.1);border-radius:20px;padding:20px;margin-bottom:12px}
  #game-idiom .gt-q .gt-zh.big{font-size:40px;font-weight:700;line-height:1.3}
  #game-idiom .gt-q .ask{font-size:13px;color:#5B6472;margin-top:6px}
  #game-idiom .gt-q .story{font-size:15.5px;line-height:1.85;color:#2E3440}
  #game-idiom .gt-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:600px){#game-idiom .gt-opts{grid-template-columns:1fr}}
  #game-idiom .gt-opt{text-align:left;padding:13px 15px;border-radius:16px;border:1.5px solid var(--t2,#CDB8FA);background:#fff;font-size:14.5px;line-height:1.55;color:#2E3440;cursor:pointer;transition:transform .12s ease,background .12s ease}
  #game-idiom .gt-opt.zh{font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif;font-size:22px;font-weight:700;text-align:center}
  #game-idiom .gt-opt:hover:not([disabled]){background:var(--t0,#F5F0FF);transform:translateY(-1px)}
  #game-idiom .gt-opt.ok{background:#DDF3E4;border-color:#6CC58C;color:#17603A}
  #game-idiom .gt-opt.bad{background:#FBE0DE;border-color:#E58F8A;color:#8F2A25;animation:gtShake .35s}
  @keyframes gtShake{20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}
  #game-idiom .gt-fb{background:var(--t0,#F5F0FF);border:1px dashed var(--t2,#CDB8FA);border-radius:18px;padding:14px 16px;font-size:14px;line-height:1.75;margin-bottom:12px}
  #game-idiom .gt-fb .gt-zh{font-size:26px;font-weight:700}
  #game-idiom .gt-res{text-align:center;background:#fff;border:1px solid rgba(46,52,64,.1);border-radius:24px;padding:26px 20px}
  #game-idiom .gt-score{font-size:44px;font-weight:800;color:var(--t5,#52329E);line-height:1.1}
  #game-idiom .lb-note{font-size:13px;margin-top:10px;color:#5B6472}
  #game-idiom .lb-note.is-ok{color:#17603A}#game-idiom .lb-note.is-err{color:#8F2A25}
  #game-idiom .gt-mt{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #game-idiom .gt-mc{padding:12px;border-radius:16px;border:1.5px solid var(--t2,#CDB8FA);background:#fff;cursor:pointer;font-size:13.5px;line-height:1.5;text-align:center;min-height:62px;display:flex;align-items:center;justify-content:center;transition:transform .12s ease,opacity .25s ease}
  #game-idiom .gt-mc.zh{font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif;font-size:22px;font-weight:700}
  #game-idiom .gt-mc.sel{background:var(--t1,#E6DAFD);border-color:var(--t5,#52329E)}
  #game-idiom .gt-mc.done{opacity:.18;pointer-events:none;transform:scale(.96)}
  #game-idiom .gt-mc.bad{animation:gtShake .35s;background:#FBE0DE}
  #game-idiom .gt-slots,#game-idiom .gt-tiles{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0}
  #game-idiom .gt-slot,#game-idiom .gt-tile{width:54px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif}
  #game-idiom .gt-slot{border:2px dashed var(--t3,#A98BF0);background:var(--t0,#F5F0FF);cursor:pointer}
  #game-idiom .gt-slot.fill{border-style:solid;background:var(--t1,#E6DAFD)}
  #game-idiom .gt-slot.ok{background:#DDF3E4;border-color:#6CC58C}
  #game-idiom .gt-slot.bad{background:#FBE0DE;border-color:#E58F8A;animation:gtShake .35s}
  #game-idiom .gt-tile{border:1.5px solid var(--t2,#CDB8FA);background:#fff;cursor:pointer}
  #game-idiom .gt-tile.used{opacity:.2;pointer-events:none}
  @media(prefers-reduced-motion:reduce){#game-idiom .gt-game{animation:none;opacity:1}}`;
  document.head.appendChild(st);

  /* ---------------- Dữ liệu (dùng chung bộ nhớ đệm với mục Bài đọc) ---------------- */
  let ALL = [], DS = { status: 'idle', err: '', uid: null };
  const CACHE_KEY = 'idioms';
  function idb(mode, fn) {
    return new Promise(res => {
      try {
        const r = indexedDB.open('tndihoc-cache', 1);
        r.onupgradeneeded = () => { try { r.result.createObjectStore('kv'); } catch (e) {} };
        r.onerror = () => res(null);
        r.onsuccess = () => { try { const q = fn(r.result.transaction('kv', mode).objectStore('kv')); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } };
      } catch (e) { res(null); }
    });
  }
  const uidNow = () => (window.tnAuth && window.tnAuth.user && window.tnAuth.user.uid) || null;
  const canPlay = () => !!(window.tnCan && window.tnCan('idioms'));
  async function loadData() {
    const uid = uidNow(); DS.status = 'loading'; DS.uid = uid;
    try {
      const fb = window.tnEnsureFb ? await window.tnEnsureFb() : null;
      if (!fb) throw new Error('Không kết nối được máy chủ.');
      const { db, D } = fb;
      const metaSnap = await D.getDoc(D.doc(db, 'idioms', '_meta'));
      if (!metaSnap.exists()) throw new Error('Thành ngữ chưa được nạp lên máy chủ (admin: Lớp học & phân quyền → 📜 Dữ liệu thành ngữ).');
      const meta = metaSnap.data();
      const cached = await idb('readonly', s => s.get(CACHE_KEY));
      let arr;
      if (cached && cached.version === meta.version && cached.uid === uid && Array.isArray(cached.items)) arr = cached.items;
      else {
        const parts = await Promise.all((meta.parts || []).map(id => D.getDoc(D.doc(db, 'idioms', id))));
        arr = []; parts.forEach(p => { if (p.exists()) arr.push(...JSON.parse(p.data().json || '[]')); });
        idb('readwrite', s => s.put({ version: meta.version, uid, items: arr }, CACHE_KEY));
      }
      ALL = arr; DS.status = 'ready';
    } catch (e) {
      DS.status = 'error';
      const c = (e && e.code) || '';
      DS.err = c.includes('permission') ? 'Tài khoản chưa có quyền đọc thành ngữ, hoặc luật Firestore cho “idioms” chưa được cập nhật.' : (e && e.message) || 'Không tải được thành ngữ.';
    }
    render();
  }

  /* ---------------- Sổ "chưa thuộc": {id: số lần cần trả lời đúng nữa} ---------------- */
  const weakMap = () => jget(LS_WEAK, {});
  function markWrong(it) { const w = weakMap(); w[it.id] = 2; jset(LS_WEAK, w); }
  function markRight(it) { const w = weakMap(); if (w[it.id] != null) { w[it.id]--; if (w[it.id] <= 0) delete w[it.id]; jset(LS_WEAK, w); } }
  const weakItems = () => { const w = weakMap(); return ALL.filter(i => w[i.id] != null); };

  /* ---------------- Trạng thái ---------------- */
  const S = { type: 'all', weakOnly: false, game: null, timer: null, playing: false };
  const poolOf = () => {
    let p = ALL.filter(i => S.type === 'all' || i.type === S.type);
    if (S.weakOnly) { const w = weakMap(); p = p.filter(i => w[i.id] != null); }
    return p;
  };
  function stopAll() { clearInterval(S.timer); S.timer = null; S.playing = false; S.game = null; render(); }
  (window.gameStopHandlers = window.gameStopHandlers || []).push(() => { if (S.game) stopAll(); });

  /* ---------------- Màn lock / loading ---------------- */
  function gate() {
    if (!window.tnAuth || !window.tnAuth.user) return `<div class="tt-lock"><div class="ico">📜</div><b>Trò chơi thành ngữ · tục ngữ · điển cố</b><p>Mục VIP: 7 trò chơi từ 1000 thành ngữ, tục ngữ, điển cố. Đăng nhập để chơi.</p><button class="tt-btn" data-tt-login>Đăng nhập / Đăng ký</button></div>`;
    if (!window.tnCan) return `<div class="tt-empty"><span class="tt-spin"></span> Đang kiểm tra quyền truy cập…</div>`;
    if (!canPlay()) { const api = window.tnApi; return api && api.lockedHtml ? api.lockedHtml('idioms') : '<div class="tt-lock"><div class="ico">🔒</div><b>Mục VIP</b><p>Liên hệ cô Thúy để được mở quyền.</p></div>'; }
    if (DS.status === 'error') return `<div class="tt-note warn">${esc(DS.err)} <button class="tt-link" id="gt-retry">Thử lại</button></div>`;
    if (DS.status !== 'ready') { if (DS.status === 'idle') loadData(); return `<div class="tt-empty"><span class="tt-spin"></span> Đang tải thành ngữ…</div>`; }
    return null;
  }

  /* ---------------- Menu ---------------- */
  const GAMES = [
    { id: 'mean', g: 1, ic: '🎯', t: 'Đoán nghĩa', d: 'Hán → nghĩa tiếng Việt và ngược lại. 10 câu.', gens: ['mean', 'hanzi'], n: 10 },
    { id: 'match', g: 1, ic: '🔗', t: 'Nối cặp', d: 'Nối thành ngữ với nghĩa: 3 bảng × 6 cặp.' },
    { id: 'fill', g: 1, ic: '✏️', t: 'Điền chữ còn thiếu', d: 'Chọn chữ đúng điền vào chỗ trống. 10 câu.', gens: ['fill'], n: 10 },
    { id: 'story', g: 2, ic: '📖', t: 'Đoán qua câu chuyện', d: 'Đọc truyện tiếng Trung (có pinyin), đoán thành ngữ. 8 câu.', gens: ['story'], n: 8 },
    { id: 'source', g: 2, ic: '📚', t: 'Ai nói đây? (xuất xứ)', d: 'Thành ngữ này dẫn từ sách nào? 10 câu.', gens: ['source'], n: 10 },
    { id: 'order', g: 3, ic: '🧩', t: 'Xếp chữ', d: 'Sắp lại các chữ bị xáo trộn. 8 câu.' },
    { id: 'arena', g: 3, ic: '⚡', t: 'Đấu trường 60 giây', d: 'Trả lời nhanh, càng nhiều càng tốt. Có xếp hạng.', gens: ['mean', 'hanzi', 'fill'], arena: true },
  ];
  const GROUPS = { 1: '① Ôn nhanh · 3–5 phút', 2: '② Học qua câu chuyện & xuất xứ', 3: '③ Vui · thi đua' };
  const TYPES = [['all', 'Tất cả'], ['成语', '成语'], ['谚语', '谚语'], ['俗语', '俗语'], ['典故', '典故']];
  function dayItem() {
    const d = new Date(), key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    let h = key; h = ((h >>> 16) ^ h) * 0x45d9f3b; h = ((h >>> 16) ^ h) * 0x45d9f3b; h = (h >>> 16) ^ h;
    return ALL[Math.abs(h) % ALL.length];
  }
  function render() {
    if (S.game) return;
    const g = gate();
    if (g) { panel.innerHTML = `<div class="gt-wrap">${g}</div>`; const r = $('gt-retry'); r && r.addEventListener('click', () => { DS.status = 'idle'; render(); }); return; }
    const di = dayItem(), weak = weakItems().length, pool = poolOf();
    const best = jget(LS_BEST, {});
    panel.innerHTML = `<div class="gt-wrap">
      <div class="gt-daily"><div class="gt-sub" style="font-weight:700;color:var(--t6,#2E1760)">🌅 Thành ngữ của ngày</div>
        <div class="gt-zh" style="margin-top:6px">${esc(di.text)}</div><div class="gt-py">${esc(di.pinyin)} · <span class="gt-sub">${esc(di.type)}</span></div>
        <div style="margin-top:8px;font-size:14.5px;line-height:1.7">${esc(di.meaning_vi)}</div>
        <div id="gt-dmore" style="display:none;margin-top:8px;font-size:13.5px;line-height:1.75;color:#3a4150"><b>Xuất xứ:</b> ${esc(di.origin || '—')}<br>${esc(di.insight_vi || '')}</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="gt-btn" id="gt-dsay">🔊 Nghe đọc</button><button class="gt-btn ghost" id="gt-dtog">Xem câu chuyện</button></div></div>
      <div class="gt-top"><div><div class="gt-h">🎮 Chọn trò chơi</div><div class="gt-sub">Chơi với <b>${pool.length}</b> mục${S.weakOnly ? ' trong sổ chưa thuộc' : ''}.</div></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px" id="gt-types">${TYPES.map(t => `<button class="gt-chip${S.type === t[0] ? ' active' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('')}
        <button class="gt-chip${S.weakOnly ? ' active' : ''}" id="gt-weak" ${weak < 4 ? 'disabled title="Cần ít nhất 4 mục chưa thuộc"' : ''}>📕 Sổ chưa thuộc (${weak})</button></div>
      ${[1, 2, 3].map(k => `<div class="gt-group">${GROUPS[k]}</div><div class="gt-grid">${GAMES.filter(x => x.g === k).map((x, i) => `<button class="gt-game gt-g${k}" data-g="${x.id}" style="animation-delay:${i * 0.06}s"><span class="ic">${x.ic}</span><b>${x.t}</b><small>${x.d}${best[x.id] ? ` · Kỷ lục: <b>${best[x.id]}</b>` : ''}</small></button>`).join('')}</div>`).join('')}
    </div>`;
    $('gt-dsay').addEventListener('click', () => say(di.text));
    $('gt-dtog').addEventListener('click', e => { const m = $('gt-dmore'); const open = m.style.display === 'none'; m.style.display = open ? 'block' : 'none'; e.target.textContent = open ? 'Ẩn bớt' : 'Xem câu chuyện'; });
    panel.querySelectorAll('#gt-types [data-t]').forEach(b => b.addEventListener('click', () => { S.type = b.dataset.t; render(); }));
    $('gt-weak').addEventListener('click', () => { S.weakOnly = !S.weakOnly; render(); });
    panel.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => start(GAMES.find(x => x.id === b.dataset.g))));
  }

  /* ---------------- Bộ sinh câu hỏi ---------------- */
  const sameType = (it, full) => { const s = full.filter(x => x.type === it.type && x.id !== it.id); return s.length >= 3 ? s : full.filter(x => x.id !== it.id); };
  const distinctPick = (list, key, n, not) => { const seen = new Set([not]); const out = []; for (const x of shuffle(list)) { const k = key(x); if (!k || seen.has(k)) continue; seen.add(k); out.push(x); if (out.length >= n) break; } return out; };
  const GEN = {
    mean(it) {
      const ds = distinctPick(sameType(it, ALL), x => trunc(x.meaning_vi, 90), 3, trunc(it.meaning_vi, 90)); if (ds.length < 3) return null;
      return { prompt: `<div class="gt-zh big">${esc(it.text)}</div><div class="gt-py">${esc(it.pinyin)}</div><div class="ask">Nghĩa của ${esc(it.type)} này là gì?</div>`, opts: shuffle([{ t: trunc(it.meaning_vi, 90), ok: true }, ...ds.map(x => ({ t: trunc(x.meaning_vi, 90) }))]), it };
    },
    hanzi(it) {
      const ds = distinctPick(sameType(it, ALL), x => x.text, 3, it.text); if (ds.length < 3) return null;
      return { prompt: `<div class="story">${esc(trunc(it.meaning_vi, 160))}</div><div class="ask">Đây là ${esc(it.type)} nào?</div>`, zh: true, opts: shuffle([{ t: it.text, ok: true }, ...ds.map(x => ({ t: x.text }))]), it };
    },
    fill(it) {
      const s = strip(it.text); if (s.length < 4 || s.length > 8 || s.length !== String(it.text).replace(/[，。、；：！？\s]/g, '').length) return null;
      const k = Math.floor(Math.random() * s.length), ans = s[k];
      const chars = new Set(); shuffle(ALL).forEach(x => { if (chars.size < 12) { const c = rnd([...strip(x.text)]); if (c && c !== ans) chars.add(c); } });
      const ds = [...chars].slice(0, 3); if (ds.length < 3) return null;
      const shown = [...s].map((c, i) => i === k ? '＿' : c).join('');
      return { prompt: `<div class="gt-zh big">${esc(shown)}</div><div class="gt-py">${esc(it.pinyin)}</div><div class="ask">Gợi ý: ${esc(trunc(it.meaning_vi, 110))}</div>`, zh: true, opts: shuffle([{ t: ans, ok: true }, ...ds.map(t => ({ t }))]), it };
    },
    story(it) {
      if (!it.story_zh) return null;
      const ds = distinctPick(sameType(it, ALL), x => x.text, 3, it.text); if (ds.length < 3) return null;
      return { prompt: `${window.tnStoryHtml(it, false)}<div class="ask" style="margin-top:10px">Câu chuyện / ý nghĩa trên nói về ${esc(it.type)} nào?</div>`, zh: true, opts: shuffle([{ t: it.text, ok: true }, ...ds.map(x => ({ t: x.text }))]), it };
    },
    source(it) {
      const b = bookOf(it); if (!b) return null;
      const books = [...new Set(ALL.map(bookOf).filter(x => x && x !== b))];
      const ds = shuffle(books).slice(0, 3); if (ds.length < 3) return null;
      return { prompt: `<div class="gt-zh big">${esc(it.text)}</div><div class="gt-py">${esc(it.pinyin)}</div><div class="ask">${esc(trunc(it.meaning_vi, 100))}<br>→ Thường được dẫn từ sách nào?</div>`, zh: true, opts: shuffle([{ t: '《' + b + '》', ok: true }, ...ds.map(t => ({ t: '《' + t + '》' }))]), it };
    },
  };
  function nextQuestion(gens, pool, used) {
    for (let tries = 0; tries < 60; tries++) {
      const base = gens.length === 1 && gens[0] === 'story' ? pool.filter(i => i.story_zh) : pool;
      const cand = base.filter(i => !used.has(i.id)); const it = rnd(cand.length ? cand : base);
      const q = GEN[rnd(gens)](it); if (q) { used.add(it.id); return q; }
    }
    return null;
  }

  /* ---------------- Khung chơi: trắc nghiệm (mean/fill/story/source/arena) ---------------- */
  let FIN = null; // hàm kết thúc dùng chung
  function start(G) {
    const pool = poolOf();
    if (pool.length < 8) { alert('Cần ít nhất 8 mục để chơi. Hãy chọn "Tất cả" hoặc loại có nhiều mục hơn.'); return; }
    S.game = G; S.playing = true; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (G.id === 'story' && pool.filter(i => i.story_zh).length < 8) { alert('Loại này có quá ít câu chuyện (hiện có truyện cho 313 mục). Hãy chọn "Tất cả" hoặc 成语.'); S.game = null; S.playing = false; return render(); }
    if (G.id === 'match') return playMatch(pool);
    if (G.id === 'order') return playOrder(pool);
    playMcq(G, pool);
  }
  const header = (title, extra) => `<div class="gt-top"><button class="gt-btn ghost" id="gt-exit">‹ Thoát</button><div class="gt-h">${title}</div><div class="gt-sub" id="gt-stat">${extra || ''}</div></div>`;
  function finish(G, score, right, total, weakAdded) {
    clearInterval(S.timer); S.playing = false;
    const best = jget(LS_BEST, {}); const isBest = score > (best[G.id] || 0); if (isBest) { best[G.id] = score; jset(LS_BEST, best); }
    panel.innerHTML = `<div class="gt-wrap"><div class="gt-res"><div style="font-size:42px">${right / Math.max(1, total) >= 0.8 ? '🎉' : right / Math.max(1, total) >= 0.5 ? '👍' : '💪'}</div>
      <div class="gt-score">${score}</div><div class="gt-sub">điểm · đúng ${right}/${total}${isBest && score > 0 ? ' · 🏅 Kỷ lục mới!' : ''}</div>
      ${weakAdded ? `<div class="gt-sub" style="margin-top:6px">📕 ${weakAdded} mục mới vào sổ chưa thuộc để ôn lại.</div>` : ''}
      <div class="lb-note" id="gt-lb"></div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap"><button class="gt-btn" id="gt-again">Chơi lại</button><button class="gt-btn ghost" id="gt-menu">Về menu</button></div></div></div>`;
    $('gt-again').addEventListener('click', () => start(G));
    $('gt-menu').addEventListener('click', stopAll);
    if (window.tnSubmitScore && score > 0) window.tnSubmitScore('idiom', score, $('gt-lb'));
  }
  function playMcq(G, pool) {
    const used = new Set(); let idx = 0, score = 0, right = 0, streak = 0, weakAdded = 0, locked = false, t0 = 60, q = null;
    const total = G.arena ? Infinity : G.n;
    panel.innerHTML = `<div class="gt-wrap">${header(G.ic + ' ' + G.t, '')}<div class="gt-bar" id="gt-bar"><i style="width:100%"></i></div><div id="gt-body"></div></div>`;
    $('gt-exit').addEventListener('click', stopAll);
    const stat = () => { $('gt-stat').innerHTML = (G.arena ? `⏱ <b>${t0}s</b> · ` : `Câu <b>${Math.min(idx + 1, total)}/${total}</b> · `) + `Điểm <b>${score}</b>${streak >= 2 ? ` · 🔥${streak}` : ''}`; };
    const end = () => finish(G, score, right, G.arena ? idx : total, weakAdded);
    function ask() {
      if (!G.arena && idx >= total) return end();
      q = nextQuestion(G.gens, pool, used); if (!q) return end();
      locked = false;
      if (!G.arena) $('gt-bar').firstChild.style.width = (idx / total * 100) + '%';
      $('gt-body').innerHTML = `<div class="gt-q">${q.prompt}</div><div class="gt-opts">${q.opts.map((o, i) => `<button class="gt-opt${q.zh ? ' zh' : ''}" data-i="${i}">${esc(o.t)}</button>`).join('')}</div><div id="gt-fb"></div>`;
      $('gt-body').querySelectorAll('.gt-opt').forEach(b => b.addEventListener('click', () => pick(b)));
      stat();
    }
    function pick(btn) {
      if (locked) return; locked = true;
      const o = q.opts[btn.dataset.i], good = !!o.ok, it = q.it;
      $('gt-body').querySelectorAll('.gt-opt').forEach((b, i) => { b.disabled = true; if (q.opts[i].ok) b.classList.add('ok'); });
      if (!good) btn.classList.add('bad');
      if (good) { right++; streak++; score += 100 + 20 * Math.min(streak, 5); markRight(it); } else { streak = 0; if (weakMap()[it.id] == null) weakAdded++; markWrong(it); }
      idx++; stat();
      if (G.id === 'story' && it.story_zh) { const qs = $('gt-body').querySelector('.gt-q .gt-story'); if (qs) qs.style.display = 'none'; }
      const card = `<div class="gt-fb"><div class="gt-zh">${esc(it.text)}</div><div class="gt-py">${esc(it.pinyin)} · ${esc(it.type)}</div><div style="margin-top:6px">${esc(it.meaning_vi)}</div>
        <div class="gt-sub" style="margin-top:6px"><b>Xuất xứ:</b> ${esc(it.origin || '—')}</div>${it.story_zh ? `<div style="margin-top:10px">${window.tnStoryHtml(it, true)}</div>` : it.insight_vi ? `<div class="gt-sub" style="margin-top:4px">${esc(trunc(it.insight_vi, 260))}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:10px"><button class="gt-btn ghost" id="gt-say">🔊 Nghe</button><button class="gt-btn" id="gt-next">${!G.arena && idx >= total ? 'Xem kết quả' : 'Tiếp ›'}</button></div></div>`;
      if (G.arena) { setTimeout(() => { if (S.game === G && S.playing) ask(); }, good ? 450 : 1100); return; }
      $('gt-fb').innerHTML = card; $('gt-say').addEventListener('click', () => say(it.text)); $('gt-next').addEventListener('click', ask);
    }
    if (G.arena) {
      S.timer = setInterval(() => {
        t0--; const bar = $('gt-bar'); if (bar) { bar.firstChild.style.width = (t0 / 60 * 100) + '%'; bar.classList.toggle('low', t0 <= 10); }
        if (t0 <= 0) { clearInterval(S.timer); end(); } else stat();
      }, 1000);
    }
    ask();
  }

  /* ---------------- Nối cặp ---------------- */
  function playMatch(pool) {
    const G = GAMES.find(x => x.id === 'match'); const used = new Set(); let board = 0, score = 0, right = 0, weakAdded = 0;
    panel.innerHTML = `<div class="gt-wrap">${header(G.ic + ' ' + G.t, '')}<div class="gt-bar"><i style="width:0"></i></div><div id="gt-body"></div></div>`;
    $('gt-exit').addEventListener('click', stopAll);
    function nextBoard() {
      if (board >= 3) return finish(G, score, right, 18, weakAdded);
      const avail = pool.filter(i => !used.has(i.id) && i.meaning_vi); const items = shuffle(avail.length >= 6 ? avail : pool).slice(0, 6);
      items.forEach(i => used.add(i.id));
      let sel = null, left = 6, miss = 0;
      const cols = [shuffle(items.map(i => ({ id: i.id, t: i.text, zh: 1 }))), shuffle(items.map(i => ({ id: i.id, t: trunc(i.meaning_vi, 70) })))];
      $('gt-stat').innerHTML = `Bảng <b>${board + 1}/3</b> · Điểm <b>${score}</b>`; document.querySelector('#game-idiom .gt-bar i').style.width = (board / 3 * 100) + '%';
      $('gt-body').innerHTML = `<div class="gt-mt">${cols.map((c, ci) => `<div style="display:grid;gap:10px">${c.map(x => `<button class="gt-mc${x.zh ? ' zh' : ''}" data-id="${x.id}" data-c="${ci}">${esc(x.t)}</button>`).join('')}</div>`).join('')}</div>`;
      $('gt-body').querySelectorAll('.gt-mc').forEach(b => b.addEventListener('click', () => {
        if (b.classList.contains('done')) return;
        if (!sel) { sel = b; b.classList.add('sel'); return; }
        if (sel === b) { b.classList.remove('sel'); sel = null; return; }
        if (sel.dataset.c === b.dataset.c) { sel.classList.remove('sel'); sel = b; b.classList.add('sel'); return; }
        const it = items.find(i => String(i.id) === sel.dataset.id);
        if (sel.dataset.id === b.dataset.id) {
          [sel, b].forEach(x => { x.classList.remove('sel'); x.classList.add('done'); }); sel = null; left--; right++; score += 60; markRight(it); $('gt-stat').innerHTML = `Bảng <b>${board + 1}/3</b> · Điểm <b>${score}</b>`;
          say(it.text);
          if (!left) { score += Math.max(0, 60 - miss * 20); board++; setTimeout(nextBoard, 650); }
        } else {
          miss++; const wrongItem = items.find(i => String(i.id) === (sel.dataset.c === '0' ? sel.dataset.id : b.dataset.id));
          if (wrongItem) { if (weakMap()[wrongItem.id] == null) weakAdded++; markWrong(wrongItem); }
          [sel, b].forEach(x => { x.classList.remove('sel'); x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 400); }); sel = null;
        }
      }));
    }
    nextBoard();
  }

  /* ---------------- Xếp chữ ---------------- */
  function playOrder(pool) {
    const G = GAMES.find(x => x.id === 'order'); const cand = pool.filter(i => { const s = strip(i.text); return s.length >= 4 && s.length <= 8; });
    if (cand.length < 5) { alert('Loại này có quá ít mục phù hợp để xếp chữ. Hãy chọn "Tất cả" hoặc 成语.'); S.game = null; S.playing = false; return render(); }
    const items = shuffle(cand).slice(0, 8); let n = 0, score = 0, right = 0, weakAdded = 0;
    panel.innerHTML = `<div class="gt-wrap">${header(G.ic + ' ' + G.t, '')}<div class="gt-bar"><i style="width:0"></i></div><div id="gt-body"></div></div>`;
    $('gt-exit').addEventListener('click', stopAll);
    function next() {
      if (n >= items.length) return finish(G, score, right, items.length, weakAdded);
      const it = items[n], ans = [...strip(it.text)]; let tiles = shuffle(ans.map((c, i) => ({ c, i }))); let guard = 0; while (tiles.map(x => x.c).join('') === ans.join('') && guard++ < 10) tiles = shuffle(tiles);
      const placed = []; let tries = 0;
      $('gt-stat').innerHTML = `Câu <b>${n + 1}/${items.length}</b> · Điểm <b>${score}</b>`; document.querySelector('#game-idiom .gt-bar i').style.width = (n / items.length * 100) + '%';
      $('gt-body').innerHTML = `<div class="gt-q"><div class="story">${esc(trunc(it.meaning_vi, 150))}</div><div class="ask">Sắp xếp các chữ thành ${esc(it.type)} đúng. <button class="gt-chip" id="gt-hint">💡 Xem pinyin</button> <span id="gt-hinttxt" class="gt-py"></span></div></div>
        <div class="gt-slots" id="gt-slots">${ans.map((_, i) => `<div class="gt-slot" data-s="${i}"></div>`).join('')}</div><div class="gt-tiles" id="gt-tiles">${tiles.map((x, k) => `<button class="gt-tile" data-k="${k}">${esc(x.c)}</button>`).join('')}</div><div id="gt-fb"></div>`;
      const slots = () => [...document.querySelectorAll('#gt-slots .gt-slot')];
      const draw = () => { slots().forEach((s, i) => { s.textContent = placed[i] != null ? tiles[placed[i]].c : ''; s.classList.toggle('fill', placed[i] != null); }); document.querySelectorAll('#gt-tiles .gt-tile').forEach((t, k) => t.classList.toggle('used', placed.includes(k))); };
      $('gt-hint').addEventListener('click', () => { $('gt-hinttxt').textContent = it.pinyin; });
      document.querySelectorAll('#gt-tiles .gt-tile').forEach(t => t.addEventListener('click', () => {
        if (placed.length >= ans.length) return; placed.push(Number(t.dataset.k)); draw();
        if (placed.length === ans.length) check();
      }));
      slots().forEach((s, i) => s.addEventListener('click', () => { if (i < placed.length && !s.classList.contains('ok')) { placed.splice(i, 1); draw(); } }));
      function check() {
        const got = placed.map(k => tiles[k].c).join(''), good = got === ans.join('');
        if (good) {
          slots().forEach(s => s.classList.add('ok')); right++; score += tries === 0 ? 100 : 50; markRight(it); reveal(true);
        } else {
          tries++; slots().forEach(s => s.classList.add('bad'));
          if (tries >= 2) { if (weakMap()[it.id] == null) weakAdded++; markWrong(it); placed.length = 0; slots().forEach((s, i) => { s.classList.remove('bad'); s.textContent = ans[i]; s.classList.add('ok'); }); document.querySelectorAll('#gt-tiles .gt-tile').forEach(t => t.classList.add('used')); reveal(false); }
          else setTimeout(() => { placed.length = 0; slots().forEach(s => s.classList.remove('bad')); draw(); }, 600);
        }
        $('gt-stat').innerHTML = `Câu <b>${n + 1}/${items.length}</b> · Điểm <b>${score}</b>`;
      }
      function reveal(good) {
        $('gt-fb').innerHTML = `<div class="gt-fb"><div class="gt-zh">${esc(it.text)}</div><div class="gt-py">${esc(it.pinyin)} · ${esc(it.type)}</div><div style="margin-top:6px">${good ? '' : '<b>Đáp án như trên. </b>'}${esc(it.meaning_vi)}</div><div class="gt-sub" style="margin-top:6px"><b>Xuất xứ:</b> ${esc(it.origin || '—')}</div>
          <div style="display:flex;gap:8px;margin-top:10px"><button class="gt-btn ghost" id="gt-say">🔊 Nghe</button><button class="gt-btn" id="gt-next">${n + 1 >= items.length ? 'Xem kết quả' : 'Tiếp ›'}</button></div></div>`;
        $('gt-say').addEventListener('click', () => say(it.text)); $('gt-next').addEventListener('click', () => { n++; next(); });
      }
    }
    next();
  }

  /* ---------------- Làm mới theo đăng nhập / quyền ---------------- */
  const refresh = () => { if (S.playing) { if (!canPlay()) stopAll(); return; } render(); };
  document.addEventListener('tn-auth', () => { if (uidNow() !== DS.uid) { ALL = []; DS.status = 'idle'; } refresh(); });
  document.addEventListener('tt-state', () => { if (!canPlay() && ALL.length) { ALL = []; DS.status = 'idle'; } refresh(); });
  render();
})();
