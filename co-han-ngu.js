/* =====================================================================
   古代汉语读本 – Cổ Hán ngữ (VIP) — nhánh thứ 4 của mục "Bài đọc"
   ---------------------------------------------------------------------
   - Dữ liệu 42 bài văn cổ (21 bài khoá 课文 + 21 bài đọc thêm 副课文) nằm trên Firestore,
     collection "guhan" (cấu trúc _meta + p1..pN giống "culture" / "idioms"),
     luật Firestore chỉ cho người có quyền can_access_guhan đọc.
   - Mỗi bài: chữ Hán + phiên âm (hover vào chữ để xem), giải thích từ vựng, và khung GHI CHÚ riêng của học viên
     (tự lưu trong máy + đồng bộ theo tài khoản qua khoá tn_guhan_notes_v1).
   - Ghi chú xuất được ra PDF (mở hộp thoại in → chọn "Lưu thành PDF") hoặc Word (.doc).
   - ĐỔI TÊN MỤC: sửa 2 hằng số TITLE_ZH và TITLE_VI ngay bên dưới.
   ===================================================================== */
(function () {
  'use strict';
  const EXT = window.tnBaidocExt;
  if (!EXT) return;

  const TITLE_ZH = '古代汉语读本';
  const TITLE_VI = 'Cổ Hán ngữ';
  const COL = 'guhan';
  const NOTE_KEY = 'tn_guhan_notes_v1';

  const S = { status: 'idle', err: '', uid: null, lessons: [], disclaimer: '', book: '', group: 'all', q: '', showNotes: false, openId: null };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- Ghi chú (localStorage) ---------------- */
  function readNotes() {
    try { const v = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
  }
  function writeNotes(o) { try { localStorage.setItem(NOTE_KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }
  function getNote(id) { const n = readNotes()[id]; return n && n.t ? n.t : ''; }
  function saveNote(id, text) {
    const o = readNotes();
    if (text && text.trim()) o[id] = { t: text, u: Date.now() }; else delete o[id];
    return writeNotes(o);
  }

  /* ---------------- Giao diện (CSS) ---------------- */
  if (!document.getElementById('gh-style')) {
    const st = document.createElement('style'); st.id = 'gh-style';
    st.textContent = `
    .gh-hero{grid-column:1/-1;border-radius:20px;padding:16px 18px;background:linear-gradient(135deg,var(--t1,#FADCEA),var(--t2,#F5BBD5));color:var(--t6,#7A1A47)}
    .gh-hero .zh{font-size:26px;font-weight:700;font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif}
    .gh-hero .vi{font-size:14px;margin-top:2px;font-weight:600}
    .gh-hero p{font-size:13px;line-height:1.65;margin-top:8px;color:#4A2336}
    .gh-bar{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .gh-search{flex:1;min-width:150px;padding:10px 14px;border-radius:9999px;border:1.5px solid var(--t2,#F5BBD5);background:#fff;font-size:15px;outline:none}
    .gh-search:focus{border-color:var(--t5,#B0306A)}
    .gh-chip{padding:6px 12px;border-radius:9999px;border:1.5px solid var(--t2,#F5BBD5);background:#fff;font-size:13px;font-weight:600;color:#2E3440;cursor:pointer}
    .gh-chip.active{background:var(--t5,#B0306A);color:#fff;border-color:var(--t5,#B0306A)}
    .gh-note-dot{margin-left:6px;font-size:13px}
    .gh-panel{grid-column:1/-1;background:#fff;border:1px solid rgba(46,52,64,.1);border-radius:18px;padding:14px 16px}
    .gh-panel h5{font-weight:700;color:var(--t6,#7A1A47);margin-bottom:6px}
    .gh-item{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;padding:8px 0;border-top:1px dashed var(--t2,#F5BBD5)}
    .gh-item:first-of-type{border-top:none}
    .gh-item .t{font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif;font-size:17px;font-weight:700}
    .gh-item .s{font-size:13px;color:#5B6472;line-height:1.5;margin-top:2px;white-space:pre-line}
    .gh-btn{border:none;border-radius:9999px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;background:var(--t1,#FADCEA);color:var(--t6,#7A1A47)}
    .gh-btn:hover{background:var(--t2,#F5BBD5)}
    .gh-btn.pri{background:var(--t5,#B0306A);color:#fff}
    .gh-btn.pri:hover{background:var(--t6,#7A1A47)}
    .gh-btn[disabled]{opacity:.45;cursor:not-allowed}
    .gh-extra{margin-top:22px;padding-top:18px;border-top:1px solid rgba(46,52,64,.12)}
    .gh-extra h5{font-weight:700;color:var(--t6,#7A1A47);font-size:16px;margin:0 0 8px}
    .gh-vocab{width:100%;border-collapse:collapse;font-size:14.5px}
    .gh-vocab td{padding:7px 8px;border-top:1px dashed var(--t2,#F5BBD5);vertical-align:top;line-height:1.55}
    .gh-vocab tr:first-child td{border-top:none}
    .gh-vocab .w{font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif;font-size:18px;font-weight:700;white-space:nowrap;color:#2E3440}
    .gh-vocab .p{color:var(--t4,#D65C95);white-space:nowrap}
    .gh-vocab .a{width:34px;text-align:right}
    .gh-add{border:1px solid var(--t2,#F5BBD5);background:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;color:var(--t5,#B0306A);font-weight:700}
    .gh-add:hover{background:var(--t1,#FADCEA)}
    .gh-note{width:100%;min-height:150px;border:1.5px solid var(--t2,#F5BBD5);border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.7;outline:none;resize:vertical;background:#fff}
    .gh-note:focus{border-color:var(--t5,#B0306A)}
    .gh-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:10px}
    .gh-opt{font-size:13px;color:#3a4150;display:inline-flex;gap:5px;align-items:center}
    .gh-st{font-size:12.5px;color:#5B6472}
    @media (max-width:520px){.gh-vocab .w,.gh-vocab .p{white-space:normal}}
    `;
    document.head.appendChild(st);
  }

  /* ---------------- Tải dữ liệu từ Firestore ---------------- */
  async function load(ctx) {
    const fb = ctx.getFb() || (window.tnEnsureFb ? await window.tnEnsureFb() : null);
    if (!fb) { S.status = 'error'; S.err = 'Không kết nối được máy chủ.'; ctx.renderList(); return; }
    S.status = 'loading'; S.uid = ctx.RS.uid;
    try {
      const { db, D } = fb;
      const metaSnap = await D.getDoc(D.doc(db, COL, '_meta'));
      if (!metaSnap.exists()) throw new Error('Mục ' + TITLE_VI + ' chưa được nạp lên máy chủ. (Admin: “Lớp học & phân quyền” → tab “🏺 Dữ liệu cổ Hán ngữ”.)');
      const meta = metaSnap.data();
      const cached = await ctx.idb('readonly', s => s.get(COL));
      let arr;
      if (cached && cached.version === meta.version && cached.uid === ctx.RS.uid && Array.isArray(cached.lessons)) arr = cached.lessons;
      else {
        const parts = await Promise.all((meta.parts || []).map(id => D.getDoc(D.doc(db, COL, id))));
        arr = [];
        parts.forEach(p => { if (p.exists()) arr.push(...JSON.parse(p.data().json || '[]')); });
        ctx.idb('readwrite', s => s.put({ version: meta.version, uid: ctx.RS.uid, lessons: arr }, COL));
      }
      arr.forEach(l => { l.extBadge = TITLE_ZH + ' · ' + (l.badge || ''); l.plain = (l.content || []).map(x => x.cn).join(''); });
      S.lessons = arr;
      S.disclaimer = meta.disclaimer || '';
      S.book = meta.book || '';
      S.status = 'ready';
    } catch (e) {
      S.status = 'error';
      const code = (e && e.code) || '';
      S.err = code.includes('permission') ? 'Tài khoản chưa có quyền đọc mục này, hoặc luật Firestore cho “guhan” chưa được cập nhật.'
        : code.includes('unavailable') ? 'Không kết nối được máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.'
        : (e && e.message) || 'Không tải được bài đọc.';
    }
    ctx.renderList();
  }
  function clearAll(ctx) {
    S.lessons = []; S.status = 'idle'; S.uid = null; S.openId = null;
    try { (ctx || EXT.ctx()).idb('readwrite', s => s.delete(COL)); } catch (e) {}
  }

  /* ---------------- Danh sách bài ---------------- */
  const GROUPS = [['all', 'Tất cả'], ['课文', '课文 Bài khoá'], ['副课文', '副课文 Bài đọc thêm']];
  function filtered() {
    const q = S.q.trim();
    return S.lessons.filter(l => (S.group === 'all' || l.group === S.group) &&
      (!q || l.title.includes(q) || (l.source || '').includes(q) || (l.summary || '').toLowerCase().includes(q.toLowerCase()) || (l.plain || '').includes(q)));
  }
  function render(ctx) {
    const { listEl, RS } = ctx;
    const msg = h => { listEl.innerHTML = h; };
    if (RS.status === 'guest') {
      msg(`<div class="tt-lock" style="grid-column:1/-1"><div class="ico">🏺</div><b>${TITLE_ZH} – ${TITLE_VI}</b>
        <p>Mục VIP gồm 42 bài văn cổ (ngụ ngôn, sử ký, luận thuyết…) kèm phiên âm, giải thích từ vựng và khung ghi chú xuất được PDF/Word. Đăng nhập để xem.</p>
        <button class="tt-btn" data-tt-login>Đăng nhập / Đăng ký</button></div>`); return;
    }
    const can = window.tnCan;
    if (!can || RS.status === 'checking') { msg(`<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> Đang kiểm tra quyền truy cập…</div>`); return; }
    if (!can('guhan')) {
      const api = window.tnApi;
      msg(`<div style="grid-column:1/-1">${api && api.lockedHtml ? api.lockedHtml('guhan') : '<div class="tt-lock"><div class="ico">🔒</div><b>Mục VIP</b><p>Liên hệ cô Thúy để được mở quyền.</p></div>'}</div>`);
      return;
    }
    if (S.status === 'error') {
      msg(`<div class="tt-note warn" style="grid-column:1/-1">${esc(S.err)} <button class="tt-link" data-gh-retry>Thử lại</button></div>`);
      listEl.querySelector('[data-gh-retry]').addEventListener('click', () => { S.status = 'idle'; ctx.renderList(); });
      return;
    }
    if (S.status !== 'ready') {
      msg(`<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> Đang tải bài đọc…</div>`);
      if (S.status === 'idle') load(ctx);
      return;
    }
    const notes = readNotes();
    const nNotes = S.lessons.filter(l => notes[l.id] && notes[l.id].t).length;
    listEl.innerHTML = `
      <div class="gh-hero"><div class="zh">${TITLE_ZH}</div><div class="vi">${TITLE_VI} · ${S.lessons.length} bài văn cổ</div>
        <p>${esc(S.book || 'Các bài văn cổ chọn từ giáo trình Hán ngữ cổ cho người nước ngoài.')} Di chuột (hoặc chạm) vào chữ Hán để xem phiên âm; phần <b>Giải thích từ vựng</b> và khung <b>Ghi chú</b> nằm ngay dưới bài.</p>
        ${S.disclaimer ? `<p style="font-size:12px;opacity:.85">ℹ️ ${esc(S.disclaimer)}</p>` : ''}</div>
      <div class="gh-bar"><input class="gh-search" id="gh-q" type="search" placeholder="Tìm: tên bài, nguồn, chữ Hán…" value="${esc(S.q)}" autocomplete="off">
        <button type="button" class="gh-btn" id="gh-mynotes">📝 Ghi chú của tôi (${nNotes})</button></div>
      <div class="gh-bar" id="gh-groups">${GROUPS.map(g => `<button type="button" class="gh-chip${S.group === g[0] ? ' active' : ''}" data-g="${g[0]}">${g[1]}</button>`).join('')}</div>
      ${S.showNotes ? notesPanelHtml() : ''}
      <div id="gh-cards" style="display:contents"></div>`;
    const qi = listEl.querySelector('#gh-q');
    qi.addEventListener('input', () => { S.q = qi.value; drawCards(ctx); });
    listEl.querySelectorAll('#gh-groups .gh-chip').forEach(b => b.addEventListener('click', () => {
      S.group = b.dataset.g;
      listEl.querySelectorAll('#gh-groups .gh-chip').forEach(x => x.classList.toggle('active', x === b));
      drawCards(ctx);
    }));
    listEl.querySelector('#gh-mynotes').addEventListener('click', () => { S.showNotes = !S.showNotes; ctx.renderList(); });
    wireNotesPanel(ctx);
    drawCards(ctx);
  }
  function drawCards(ctx) {
    const box = ctx.listEl.querySelector('#gh-cards'); if (!box) return;
    const items = filtered();
    const notes = readNotes();
    box.innerHTML = '';
    if (!items.length) { box.innerHTML = '<p class="text-sm text-slate italic" style="grid-column:1/-1">Không tìm thấy bài nào phù hợp.</p>'; return; }
    items.forEach((l, i) => {
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'baidoc-card focus-ring';
      c.style.animationDelay = (Math.min(i, 12) * 0.03) + 's';
      c.innerHTML = `<span class="baidoc-badge vh font-hanzi" style="background:var(--t1,#FADCEA);color:var(--t6,#7A1A47)">${esc(l.badge || '')}</span>${notes[l.id] && notes[l.id].t ? '<span class="gh-note-dot" title="Bạn đã có ghi chú cho bài này">📝</span>' : ''}
        <h4 class="font-hanzi font-semibold text-ink mb-1" style="font-size:20px">${esc(l.title)}</h4>
        <p class="text-xs text-slate mb-1 font-hanzi">${esc(l.source || '')}</p>
        <p class="text-sm text-slate leading-relaxed">${esc(l.summary || '')}</p>`;
      c.addEventListener('click', () => ctx.openDetail(l.id));
      box.appendChild(c);
    });
  }

  /* ---------------- Bảng "Ghi chú của tôi" + xuất tất cả ---------------- */
  function notesPanelHtml() {
    const notes = readNotes();
    const rows = S.lessons.filter(l => notes[l.id] && notes[l.id].t).sort((a, b) => (notes[b.id].u || 0) - (notes[a.id].u || 0));
    if (!rows.length) return `<div class="gh-panel"><h5>📝 Ghi chú của tôi</h5><p class="text-sm text-slate">Bạn chưa có ghi chú nào. Mở một bài, viết ghi chú ở cuối bài — web sẽ tự lưu.</p></div>`;
    return `<div class="gh-panel"><h5>📝 Ghi chú của tôi (${rows.length} bài)</h5>
      ${rows.map(l => `<div class="gh-item"><div style="min-width:0"><div class="t">${esc(l.title)}</div><div class="s">${esc(notes[l.id].t.slice(0, 140))}${notes[l.id].t.length > 140 ? '…' : ''}</div></div>
        <button type="button" class="gh-btn" data-gh-open="${esc(l.id)}">Mở bài</button></div>`).join('')}
      <div class="gh-row"><label class="gh-opt"><input type="checkbox" id="gh-all-text" checked> Kèm bài khoá + phiên âm</label>
        <label class="gh-opt"><input type="checkbox" id="gh-all-vocab"> Kèm từ vựng</label>
        <button type="button" class="gh-btn pri" data-gh-all="pdf">⬇️ Xuất tất cả PDF</button>
        <button type="button" class="gh-btn pri" data-gh-all="word">⬇️ Xuất tất cả Word</button>
        <span class="gh-st" id="gh-all-st"></span></div></div>`;
  }
  function wireNotesPanel(ctx) {
    ctx.listEl.querySelectorAll('[data-gh-open]').forEach(b => b.addEventListener('click', () => ctx.openDetail(b.dataset.ghOpen)));
    ctx.listEl.querySelectorAll('[data-gh-all]').forEach(b => b.addEventListener('click', () => {
      const notes = readNotes();
      const items = S.lessons.filter(l => notes[l.id] && notes[l.id].t).map(l => ({ l, note: notes[l.id].t }));
      const opt = { text: ctx.listEl.querySelector('#gh-all-text').checked, vocab: ctx.listEl.querySelector('#gh-all-vocab').checked };
      doExport(b.dataset.ghAll, items, opt, 'ghi-chu-co-han-ngu', ctx.listEl.querySelector('#gh-all-st'));
    }));
  }

  /* ---------------- Xuất PDF / Word ---------------- */
  function exportHtml(items, opt, word) {
    const user = (window.tnAuth && window.tnAuth.user && (window.tnAuth.user.displayName || window.tnAuth.user.email)) || '';
    const date = new Date().toLocaleDateString('vi-VN');
    const css = `
      @page{size:A4;margin:2cm}
      body{font-family:"Times New Roman","Noto Serif",serif;font-size:12pt;line-height:1.6;color:#222}
      h1{font-size:18pt;color:#7A1A47;margin:0 0 4pt}
      .meta{font-size:10pt;color:#666;margin-bottom:14pt;border-bottom:1pt solid #F5BBD5;padding-bottom:6pt}
      h2{font-family:"KaiTi","STKaiti","Kaiti SC","SimSun",serif;font-size:16pt;margin:16pt 0 2pt;color:#2E3440}
      .src{font-size:10.5pt;color:#666;margin:0 0 8pt}
      h3{font-size:12pt;color:#B0306A;margin:10pt 0 4pt}
      p.zh{font-family:"SimSun","Songti SC","Noto Serif CJK SC",serif;font-size:13pt;margin:6pt 0 0}
      p.py{font-size:10pt;color:#8a4d68;margin:0 0 2pt}
      table{border-collapse:collapse;width:100%}
      td{border:0.5pt solid #ddd;padding:3pt 5pt;vertical-align:top;font-size:11pt}
      td.w{font-family:"KaiTi","STKaiti","SimSun",serif;font-size:13pt;white-space:nowrap}
      .note{border:0.75pt solid #F5BBD5;background:#FFF8FB;padding:6pt 8pt;font-size:12pt}
      section{margin-bottom:18pt}
      section+section{page-break-before:always}
      .foot{margin-top:18pt;font-size:9pt;color:#888;border-top:0.5pt solid #ddd;padding-top:4pt}`;
    const sections = items.map(({ l, note }) => `<section>
      <h2>${esc(l.title)}</h2><p class="src">${esc(l.badge || '')} · 《${esc(l.source || '')}》</p>
      ${opt.text ? `<h3>Bài khoá và phiên âm</h3>${(l.content || []).map(ln => `<p class="zh">${esc(ln.cn)}</p><p class="py">${esc(ln.pinyin)}</p>`).join('')}` : ''}
      ${opt.vocab && l.vocab && l.vocab.length ? `<h3>Giải thích từ vựng</h3><table>${l.vocab.map(v => `<tr><td class="w">${esc(v.w)}</td><td>${esc(v.py)}</td><td>${esc(v.vi)}</td></tr>`).join('')}</table>` : ''}
      <h3>Ghi chú của tôi</h3><div class="note">${note && note.trim() ? esc(note).replace(/\n/g, '<br>') : '<i>(Chưa có ghi chú)</i>'}</div>
    </section>`).join('');
    const head = word
      ? '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      : '<html lang="vi">';
    return `<!DOCTYPE html>${head}<head><meta charset="utf-8"><title>Ghi chú ${TITLE_VI}</title>
      ${word ? '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' : ''}
      <style>${css}</style></head><body>
      <h1>${TITLE_ZH} – Ghi chú ${TITLE_VI}</h1>
      <div class="meta">${user ? 'Học viên: ' + esc(user) + ' · ' : ''}Ngày xuất: ${date} · tndihoc</div>
      ${sections}
      <div class="foot">Ghi chú do người học tự viết; văn bản gốc là các bài văn cổ thuộc phạm vi công cộng.</div>
      </body></html>`;
  }
  function printHtml(html, st) {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const d = f.contentWindow.document; d.open(); d.write(html); d.close();
    setTimeout(() => {
      try { f.contentWindow.focus(); f.contentWindow.print(); if (st) st.textContent = 'Trong hộp thoại in, chọn “Lưu thành PDF”.'; }
      catch (e) { if (st) st.textContent = 'Trình duyệt không mở được hộp thoại in. Hãy thử “Xuất Word”.'; }
      setTimeout(() => f.remove(), 120000);
    }, 500);
  }
  function downloadDoc(html, name) {
    const blob = new Blob(['﻿', html], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name + '.doc';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function doExport(kind, items, opt, baseName, st) {
    if (!items.length) { if (st) st.textContent = 'Chưa có gì để xuất.'; return; }
    if (kind === 'pdf') printHtml(exportHtml(items, opt, false), st);
    else { downloadDoc(exportHtml(items, opt, true), baseName); if (st) st.textContent = '✓ Đã tạo file Word.'; }
  }
  // cho kiểm thử
  window.tnGuhanExport = { exportHtml };

  /* ---------------- Phần dưới bài: từ vựng + ghi chú ---------------- */
  function extraBox() {
    let box = document.getElementById('baidoc-detail-extra');
    if (!box) {
      const body = document.getElementById('baidoc-detail-body');
      if (!body) return null;
      box = document.createElement('div'); box.id = 'baidoc-detail-extra';
      body.insertAdjacentElement('afterend', box);
    }
    return box;
  }
  const viTab = () => document.querySelector('#baidoc-detail-tabs [data-tab="vi"]');
  const card = () => document.getElementById('baidoc-detail-card');
  function clearExtra() {
    const box = document.getElementById('baidoc-detail-extra');
    if (box) box.innerHTML = '';
    const v = viTab(); if (v) v.classList.remove('hidden');
    const c = card(); if (c) c.classList.remove('gh-ext');
    S.openId = null;
  }
  function renderExtra(l) {
    const box = extraBox(); if (!box) return;
    S.openId = l.id;
    const v = viTab(); if (v) v.classList.add('hidden');
    const c = card(); if (c) c.classList.add('gh-ext');
    const vocab = l.vocab || [];
    box.innerHTML = `<div class="gh-extra">
      <h5>📚 Giải thích từ vựng (${vocab.length})</h5>
      <table class="gh-vocab">${vocab.map((v, i) => `<tr><td class="w">${esc(v.w)}</td><td class="p">${esc(v.py)}</td><td>${esc(v.vi)}</td>
        <td class="a"><button type="button" class="gh-add" data-i="${i}" title="Thêm vào ghi chú">＋</button></td></tr>`).join('')}</table>
      <h5 style="margin-top:22px">📝 Ghi chú của tôi</h5>
      <textarea class="gh-note" id="gh-note" maxlength="20000" placeholder="Viết ghi chú của bạn về bài này: cách hiểu, ngữ pháp cổ, câu khó… Web tự lưu khi bạn gõ. Bấm ＋ ở bảng từ vựng để chép nhanh một từ vào đây."></textarea>
      <div class="gh-row"><span class="gh-st" id="gh-save-st"></span></div>
      <div class="gh-row"><label class="gh-opt"><input type="checkbox" id="gh-o-text" checked> Kèm bài khoá + phiên âm</label>
        <label class="gh-opt"><input type="checkbox" id="gh-o-vocab" checked> Kèm từ vựng</label>
        <button type="button" class="gh-btn pri" data-ex="pdf">⬇️ Xuất PDF</button>
        <button type="button" class="gh-btn pri" data-ex="word">⬇️ Xuất Word</button></div>
      <div class="gh-row"><span class="gh-st" id="gh-ex-st"></span></div></div>`;
    const ta = box.querySelector('#gh-note');
    const st = box.querySelector('#gh-save-st');
    ta.value = getNote(l.id);
    if (ta.value) st.textContent = 'Đã có ghi chú đã lưu.';
    let timer = null;
    const save = () => {
      const ok = saveNote(l.id, ta.value);
      st.textContent = ok ? '✓ Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '⚠️ Không lưu được (bộ nhớ trình duyệt bị chặn).';
    };
    ta.addEventListener('input', () => { st.textContent = 'Đang lưu…'; clearTimeout(timer); timer = setTimeout(save, 500); });
    ta.addEventListener('blur', () => { clearTimeout(timer); if (ta.value !== getNote(l.id)) save(); });
    box.querySelectorAll('.gh-add').forEach(b => b.addEventListener('click', () => {
      const v = vocab[Number(b.dataset.i)];
      ta.value += (ta.value && !ta.value.endsWith('\n') ? '\n' : '') + `• ${v.w} (${v.py}): ${v.vi}\n`;
      save(); ta.focus();
    }));
    box.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => {
      clearTimeout(timer); save();
      const opt = { text: box.querySelector('#gh-o-text').checked, vocab: box.querySelector('#gh-o-vocab').checked };
      doExport(b.dataset.ex, [{ l, note: ta.value }], opt, 'ghi-chu-' + l.id, box.querySelector('#gh-ex-st'));
    }));
  }

  document.addEventListener('tn-reading-open', e => {
    const l = S.lessons.find(x => x.id === e.detail.id);
    if (l) renderExtra(l); else clearExtra();
  });
  document.addEventListener('tn-reading-close', () => {
    const was = S.openId; clearExtra();
    if (was && EXT.isActive('gh')) setTimeout(() => EXT.rerender(), 0);
  });

  /* ---------------- Đăng nhập / quyền thay đổi ---------------- */
  document.addEventListener('tn-auth', e => {
    const uid = e.detail && e.detail.user ? e.detail.user.uid : null;
    if (S.lessons.length && (!uid || (S.uid && S.uid !== uid))) clearAll();
  });
  document.addEventListener('tt-state', () => {
    if (S.lessons.length && !(window.tnCan && window.tnCan('guhan'))) clearAll();
  });

  EXT.register('gh', {
    render,
    find: id => S.lessons.find(l => l.id === id),
  });
})();
