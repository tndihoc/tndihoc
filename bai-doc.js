/* =====================================================================
   BÀI ĐỌC — giao diện + cách tải dữ liệu
   ---------------------------------------------------------------------
   Từ 13/10/2026: nội dung 130 bài đọc KHÔNG còn nằm trong file này (để người ngoài
   không tải được từ GitHub). Dữ liệu lưu trên Firestore (collection "readings"),
   luật Firestore chỉ cho tài khoản ĐÃ ĐĂNG NHẬP đọc.
   - readings/_meta : { version, parts: ["p1","p2",...], count }
   - readings/p1..pN: { json: "<mảng bài đọc dạng JSON>" } (chia nhỏ vì mỗi tài liệu tối đa 1 MB)
   Trình duyệt nhớ bản đã tải (IndexedDB) theo "version" → mỗi lần mở web chỉ tốn 1 lượt đọc.
   Đăng xuất → xoá bản nhớ trên máy.
   Admin nạp / cập nhật dữ liệu: "Lớp học & phân quyền" → tab "📖 Dữ liệu bài đọc".
   Mỗi bài: { id, title, hsk, summary, content: [{ cn, pinyin, vi, note?, chars, words }] }

   Mục VIP "中国文化补习 – Bổ túc văn hoá Trung Quốc" (nút lọc data-baidoc-filter="vh"):
   - Dữ liệu riêng ở collection "culture" (cùng cấu trúc _meta + p1..pN, _meta có thêm groups),
     luật Firestore chỉ cho người có quyền can_access_culture đọc.
   - Không trộn vào readingLessons (để chép chính tả / góp ý bản dịch / xuất kho không đụng tới).
   ===================================================================== */
(function () {
  const readingLessons = []; // được nạp sau khi đăng nhập (giữ nguyên mảng này để các file khác dùng chung)
  // Cho các tính năng mới (chép chính tả, góp ý bản dịch…) dùng chung dữ liệu bài đọc
  window.tnReadingLessons = readingLessons;

  const listEl = document.getElementById('baidoc-list');
  const emptyEl = document.getElementById('baidoc-empty');
  const detailEl = document.getElementById('baidoc-detail');
  const pillsWrap = document.getElementById('baidoc-filter-pills');
  if (!listEl) return; // mục "bài đọc" chưa có trên trang này

  let currentFilter = 'all';
  const cultureLessons = [];                 // bài đọc văn hoá VIP
  const CS = { status: 'idle', groups: [], err: '', uid: null, openGroup: null, openProv: null };   // idle | loading | ready | error

  // Nhánh mở rộng (viết ở file riêng, ví dụ co-han-ngu.js): đăng ký bằng window.tnBaidocExt.register('gh', { render(ctx), find(id), badge(lesson) })
  const EXT = {};
  const extCtx = () => ({ listEl, emptyEl, pillsWrap, escapeHtml, openDetail, renderList, RS, idb, getFb: () => lastFb, active: () => currentFilter });
  window.tnBaidocExt = {
    register(key, impl) { EXT[key] = impl; },
    ctx: extCtx,
    rerender() { renderList(); },
    isActive(key) { return currentFilter === key; },
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function lessonCard(lesson, i, badgeHtml) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'baidoc-card focus-ring';
    card.style.animationDelay = (i * 0.05) + 's';
    card.dataset.baidocId = lesson.id;
    card.innerHTML = `
      ${badgeHtml}
      <h4 class="font-sans font-semibold text-ink mb-1">${escapeHtml(lesson.title)}</h4>
      <p class="text-sm text-slate leading-relaxed">${escapeHtml(lesson.summary || '')}</p>
    `;
    card.addEventListener('click', () => openDetail(lesson.id));
    return card;
  }

  function renderCulture() {
    pillsWrap.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    const msg = html => { listEl.innerHTML = html; };
    if (RS.status === 'guest') {
      msg(`<div class="tt-lock" style="grid-column:1/-1"><div class="ico">🏮</div><b>中国文化补习 – Bổ túc văn hoá Trung Quốc</b>
        <p>Mục bài đọc VIP về văn hoá Trung Quốc: tiết khí, danh nhân, tư tưởng, tứ đại danh tác, lễ tết, danh thắng, văn hoá đặc sắc từng tỉnh. Đăng nhập để xem.</p>
        <button class="tt-btn" data-tt-login>Đăng nhập / Đăng ký</button></div>`); return;
    }
    const can = window.tnCan;
    if (!can || RS.status === 'checking') { msg(`<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> Đang kiểm tra quyền truy cập…</div>`); return; }
    if (!can('culture')) {
      const api = window.tnApi;
      msg(`<div style="grid-column:1/-1">${api && api.lockedHtml ? api.lockedHtml('culture') : '<div class="tt-lock"><div class="ico">🔒</div><b>Mục VIP</b><p>Liên hệ cô Thúy để được mở quyền.</p></div>'}</div>`);
      return;
    }
    if (CS.status === 'error') {
      msg(`<div class="tt-note warn" style="grid-column:1/-1">${escapeHtml(CS.err)} <button class="tt-link" data-vh-retry>Thử lại</button></div>`);
      listEl.querySelector('[data-vh-retry]').addEventListener('click', () => { CS.status = 'idle'; renderList(); });
      return;
    }
    if (CS.status !== 'ready') {
      msg(`<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> Đang tải bài đọc văn hoá…</div>`);
      if (CS.status === 'idle') loadCulture();
      return;
    }
    listEl.innerHTML = '';
    if (!cultureLessons.length) { msg(`<p class="text-sm text-slate italic" style="grid-column:1/-1">Chưa có bài đọc văn hoá nào.</p>`); return; }
    const groups = (CS.groups.length ? CS.groups : [...new Set(cultureLessons.map(l => l.group))].map(id => ({ id, zh: id, vi: '' })))
      .filter(g => cultureLessons.some(l => l.group === g.id));
    const shade = i => vhShade(i, groups.length);
    const open = groups.findIndex(g => g.id === CS.openGroup);
    if (open < 0) {
      // Màn 1: các thẻ chủ đề, tím nhạt → tím đậm
      groups.forEach((g, i) => {
        const items = cultureLessons.filter(l => l.group === g.id);
        const c = shade(i);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'vh-topic focus-ring' + (c.dark ? ' dark' : '');
        card.style.cssText = `background:linear-gradient(135deg, ${c.from}, ${c.to});color:${c.ink};animation-delay:${i * 0.06}s`;
        card.innerHTML = `<span class="ico">${VH_ICON[g.id] || '📖'}</span>
          <span class="zh font-hanzi">${escapeHtml(g.zh)}</span>
          <span class="vi">${escapeHtml(g.vi || '')} · ${items.length} bài</span>
          <span class="items font-hanzi">${items.slice(0, 8).map(l => `<span>${escapeHtml(shortTitle(l.title))}</span>`).join('')}</span>
          <span class="go">Xem bài đọc →</span>`;
        card.addEventListener('click', () => { CS.openGroup = g.id; CS.openProv = null; renderList(); document.getElementById('baidoc-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        listEl.appendChild(card);
      });
      return;
    }
    // Màn 2: các bài đọc trong chủ đề đã chọn
    const g = groups[open]; const c = shade(open);
    const head = document.createElement('div');
    head.className = 'vh-head';
    head.style.cssText = `background:linear-gradient(90deg, ${c.from}, ${c.to});color:${c.ink}`;
    head.innerHTML = `<button type="button" class="vh-back focus-ring">← Các chủ đề</button>
      <span class="zh font-hanzi">${VH_ICON[g.id] || ''} ${escapeHtml(g.zh)}</span><span class="vi">${escapeHtml(g.vi || '')}</span>`;
    head.querySelector('.vh-back').addEventListener('click', () => { if (CS.openProv) CS.openProv = null; else CS.openGroup = null; renderList(); });
    listEl.appendChild(head);
    const inGroup = cultureLessons.filter(l => l.group === g.id);
    const regionHead = (text) => {
      const rh = document.createElement('div');
      rh.className = 'vh-region font-hanzi';
      rh.style.cssText = `border-color:${c.to};color:${VH_SCALE[6]}`;
      rh.textContent = text;
      listEl.appendChild(rh);
    };
    const badge = l => `<span class="baidoc-badge vh font-hanzi" style="background:${c.from};color:${c.badgeInk}">${escapeHtml(l.badge || g.zh)}</span>`;
    // Chủ đề có trường province (地方特色文化) → thêm 1 tầng: thẻ các tỉnh (xếp theo vùng) → các bài của tỉnh đó
    if (inGroup.some(l => l.province)) {
      const provs = [...new Set(inGroup.map(l => l.province))];
      if (!CS.openProv || !provs.includes(CS.openProv)) {
        let lastRegion = null;
        provs.forEach((pv, i) => {
          const items = inGroup.filter(l => l.province === pv);
          const f = items[0];
          if (f.region && f.region !== lastRegion) { lastRegion = f.region; regionHead(f.region); }
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'baidoc-card vh-prov focus-ring';
          card.style.animationDelay = (i * 0.03) + 's';
          card.innerHTML = `<span class="baidoc-badge vh font-hanzi" style="background:${c.from};color:${c.badgeInk}">${escapeHtml(f.provinceAbbr || '')} · ${items.length} bài</span>
            <h4 class="font-hanzi font-semibold text-ink mb-1" style="font-size:20px">${escapeHtml(pv)}</h4>
            <p class="text-sm text-slate mb-1">${escapeHtml(f.provinceVi || '')}</p>
            <p class="text-sm text-slate leading-relaxed font-hanzi">${items.map(l => escapeHtml(shortTitle(l.title))).join(' · ')}</p>`;
          card.addEventListener('click', () => { CS.openProv = pv; renderList(); document.getElementById('baidoc-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
          listEl.appendChild(card);
        });
        return;
      }
      head.querySelector('.vh-back').textContent = '← Các tỉnh';
      const items = inGroup.filter(l => l.province === CS.openProv);
      head.querySelector('.zh').textContent = `${VH_ICON[g.id] || ''} ${g.zh} · ${CS.openProv}`;
      head.querySelector('.vi').textContent = items[0].provinceVi || '';
      items.forEach((l, i) => listEl.appendChild(lessonCard(l, i, badge(l))));
      return;
    }
    // Bài có trường region → chèn tiêu đề vùng trước bài đầu tiên của vùng đó
    let lastRegion = null;
    inGroup.forEach((l, i) => {
      if (l.region && l.region !== lastRegion) { lastRegion = l.region; regionHead(l.region); }
      listEl.appendChild(lessonCard(l, i, badge(l)));
    });
  }

  // Thang màu của mục Bài đọc (--t0 … --t6 do hoc-tieng-trung.js gắn, nền hồng) — chia đều cho số chủ đề,
  // mỗi thẻ chuyển từ sắc này sang sắc kế tiếp. Giá trị sau dấu phẩy là màu dự phòng.
  const VH_SCALE = ['#FDF0F6', '#FADCEA', '#F5BBD5', '#EB8DB7', '#D65C95', '#B0306A', '#7A1A47'].map((c, i) => `var(--t${i}, ${c})`);
  const VH_ICON = { jieqi: '🌾', mingren: '🧑‍🏫', sixiang: '☯️', mingzhu: '📚', jieri: '🏮', mingsheng: '🏯', difang: '🗺️' };
  function vhShade(i, n) {
    const pos = n <= 1 ? 0 : i * (VH_SCALE.length - 2) / (n - 1);
    const k = Math.min(VH_SCALE.length - 2, Math.round(pos));
    const dark = k >= 4;
    return { from: VH_SCALE[k], to: VH_SCALE[k + 1], dark, ink: dark ? '#FFFFFF' : VH_SCALE[6], badgeInk: dark ? '#FFFFFF' : VH_SCALE[6] };
  }
  const shortTitle = t => String(t).split(/[：:]/)[0].replace(/[《》]/g, '');

  function renderList() {
    if (currentFilter === 'vh') { renderCulture(); return; }
    if (currentFilter === 'tn') { renderIdioms(); return; }
    if (EXT[currentFilter]) { pillsWrap.classList.remove('hidden'); emptyEl.classList.add('hidden'); EXT[currentFilter].render(extCtx()); return; }
    if (RS.status !== 'ready' || !readingLessons.length) { renderGate(); return; }
    pillsWrap.classList.remove('hidden');
    const filtered = readingLessons.filter(l => currentFilter === 'all' || l.hsk === currentFilter);
    listEl.innerHTML = '';
    emptyEl.classList.toggle('hidden', filtered.length > 0);
    filtered.forEach((lesson, i) => listEl.appendChild(lessonCard(lesson, i, `<span class="baidoc-badge">hsk ${escapeHtml(lesson.hsk)}</span>`)));
  }

  // ===== Tab (汉字 / 拼音 / Tiếng Việt) + audio + tra cứu chữ Hán khi nhấp đúp =====
  const audioRow = document.getElementById('baidoc-audio-row');
  const audioBtn = document.getElementById('baidoc-audio-btn');
  const audioRate = document.getElementById('baidoc-audio-rate');
  const audioHint = document.getElementById('baidoc-audio-hint');
  const tabsWrap = document.getElementById('baidoc-detail-tabs');
  const hzHint = document.getElementById('baidoc-hz-hint');
  const detailCard = document.getElementById('baidoc-detail-card');
  const bodyEl = document.getElementById('baidoc-detail-body');
  const tooltipEl = document.getElementById('hz-tooltip');
  const tooltipPyEl = document.getElementById('hz-tooltip-py');
  const tooltipHvEl = document.getElementById('hz-tooltip-hv');
  const tooltipMeanEl = document.getElementById('hz-tooltip-mean');
  const tooltipWordEl = document.getElementById('hz-tooltip-word');

  let currentTab = 'hz';
  let currentTabHtml = { hz: '', py: '', vi: '' };
  let currentLessonText = '';
  let activeHzSpan = null;

  function buildTabHtml(lesson) {
    const hz = '<p class="baidoc-hz-block">' + lesson.content.map(line => {
      const chars = line.chars || [];
      const words = line.words || [];
      // map char index -> word info, for words spanning 2+ chars
      const wordAt = new Array(chars.length).fill(null);
      words.forEach(w => {
        const s = w[0], e = w[1], wText = w[2], wPy = w[3], wHv = w[4], wMean = w[5];
        for (let i = s; i <= e; i++) {
          if (i >= 0 && i < chars.length) wordAt[i] = { text: wText, py: wPy, hv: wHv, mean: wMean };
        }
      });
      return chars.map((ch, idx) => {
        const c = ch[0], py = ch[1], hv = ch[2], mean = ch[3];
        if (!py) return escapeHtml(c);
        const w = wordAt[idx];
        const wordAttrs = w
          ? ` data-word="${escapeHtml(w.text)}" data-word-py="${escapeHtml(w.py || '')}" data-word-hv="${escapeHtml(w.hv || '')}" data-word-mean="${escapeHtml(w.mean || '')}"`
          : '';
        const cls = w ? 'hz-char hz-in-word' : 'hz-char';
        return `<span class="${cls}" data-py="${escapeHtml(py)}" data-hv="${escapeHtml(hv)}" data-mean="${escapeHtml(mean || '')}"${wordAttrs}>${escapeHtml(c)}</span>`;
      }).join('');
    }).join('') + '</p>';

    const py = '<p class="baidoc-py-block">' + lesson.content.map(line =>
      `<span class="py-sentence">${escapeHtml(line.pinyin || '')}</span>`
    ).join('') + '</p>';

    const vi = '<p class="baidoc-vi-block">' + lesson.content.map((line, i) =>
      `<span class="vi-sentence" data-line="${i}">${escapeHtml(line.vi || '')}${line.note ? `<span class="tt-vi-note">💡 ${escapeHtml(line.note)}</span>` : ''}</span>`
    ).join('') + '</p>';

    return { hz, py, vi };
  }

  function renderCurrentTab() {
    bodyEl.innerHTML = currentTabHtml[currentTab] || '';
    hzHint.classList.toggle('hidden', currentTab !== 'hz');
    hideTooltip();
  }

  tabsWrap.querySelectorAll('.baidoc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsWrap.querySelectorAll('.baidoc-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      renderCurrentTab();
      if (window.trackStudyActivity) window.trackStudyActivity();
    });
  });

  // ---- Tooltip phiên âm + Hán Việt + nghĩa tiếng Việt khi di chuột (hover) vào 1 chữ Hán ----
  // Trên di động (không có hover thật), chạm vào chữ sẽ bật/tắt tooltip.
  function hideTooltip() {
    tooltipEl.classList.add('hidden');
    if (activeHzSpan) { activeHzSpan.classList.remove('hz-active'); activeHzSpan = null; }
  }

  function showTooltip(span) {
    const py = span.dataset.py;
    const hv = span.dataset.hv;
    const mean = span.dataset.mean;
    if (!py) return;
    if (activeHzSpan) activeHzSpan.classList.remove('hz-active');
    activeHzSpan = span;
    span.classList.add('hz-active');
    tooltipPyEl.textContent = py;
    tooltipHvEl.textContent = hv ? ('Hán Việt: ' + hv) : 'Hán Việt: —';
    tooltipHvEl.classList.toggle('hidden', !hv && detailCard.classList.contains('gh-ext'));

    // Nghĩa tiếng Việt của riêng chữ này (nếu có trong từ điển)
    if (mean) {
      tooltipMeanEl.textContent = 'Nghĩa: ' + mean;
      tooltipMeanEl.classList.remove('hidden');
    } else {
      tooltipMeanEl.classList.add('hidden');
      tooltipMeanEl.textContent = '';
    }

    // Nếu chữ này nằm trong 1 từ ghép/cụm cố định (2+ chữ), gợi ý thêm âm và nghĩa của cả cụm.
    // Từ 3 chữ trở lên thường là cụm cố định/thành ngữ, tục ngữ — gọi là "cụm từ" cho tự nhiên hơn.
    const wordText = span.dataset.word;
    const wordPy = span.dataset.wordPy;
    const wordHv = span.dataset.wordHv;
    const wordMean = span.dataset.wordMean;
    if (wordText) {
      const label = wordText.length >= 3 ? 'cụm từ/thành ngữ' : 'từ';
      tooltipWordEl.innerHTML = `Đây là 1 phần của ${label} <b>${escapeHtml(wordText)}</b>` +
        (wordPy ? ` (${escapeHtml(wordPy)})` : '') +
        (wordHv ? ` — Hán Việt: <b>${escapeHtml(wordHv)}</b>` : '') +
        (wordMean ? ` — Nghĩa: <b>${escapeHtml(wordMean)}</b>` : '');
      tooltipWordEl.classList.remove('hidden');
    } else {
      tooltipWordEl.classList.add('hidden');
      tooltipWordEl.innerHTML = '';
    }

    tooltipEl.classList.remove('hidden');

    const cardRect = detailCard.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    let left = spanRect.left - cardRect.left + spanRect.width / 2;
    let top = spanRect.top - cardRect.top - 8;
    const minLeft = 40, maxLeft = cardRect.width - 40;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = Math.max(top, 36) + 'px';
  }

  // Hover bằng chuột (desktop)
  bodyEl.addEventListener('mouseover', (e) => {
    const span = e.target.closest('.hz-char');
    if (span) showTooltip(span);
  });
  bodyEl.addEventListener('mouseout', (e) => {
    const span = e.target.closest('.hz-char');
    if (!span) return;
    const related = e.relatedTarget;
    if (related && related.closest && related.closest('.hz-char') === span) return;
    hideTooltip();
  });

  // Chạm trên di động: chạm 1 lần để hiện, chạm lại chữ khác để chuyển, chạm ngoài để ẩn
  bodyEl.addEventListener('click', (e) => {
    const span = e.target.closest('.hz-char');
    if (span) { showTooltip(span); e.preventDefault(); if (window.trackStudyActivity) window.trackStudyActivity(); }
    else { hideTooltip(); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hz-char') && !e.target.closest('#hz-tooltip')) hideTooltip();
  });
  window.addEventListener('scroll', hideTooltip, { passive: true });

  // ---- Đọc bài bằng giọng đọc trình duyệt (Web Speech API) ----
  const speechSupported = typeof window.speechSynthesis !== 'undefined';
  if (speechSupported) {
    audioHint.textContent = 'Chất lượng giọng đọc phụ thuộc thiết bị/trình duyệt của bạn.';
  } else {
    audioBtn.disabled = true;
    audioHint.textContent = 'Trình duyệt hiện tại không hỗ trợ tính năng đọc bài.';
  }

  function stopAudio() {
    if (speechSupported) { if (window.tnVoice) window.tnVoice.stop(); else speechSynthesis.cancel(); }
    audioBtn.textContent = '🔊 Nghe bài đọc';
  }

  if (speechSupported) {
    audioBtn.addEventListener('click', () => {
      if (audioBtn.dataset.playing) { stopAudio(); delete audioBtn.dataset.playing; return; }
      if (!currentLessonText) return;
      if (window.trackStudyActivity) window.trackStudyActivity();
      // Giọng đọc dùng chung (hoc-tieng-trung.js): chọn giọng tốt nhất, chia câu có ngắt nghỉ
      audioBtn.dataset.playing = '1';
      audioBtn.textContent = '⏸️ Đang đọc — bấm để dừng';
      window.tnVoice.speak(currentLessonText, { rate: parseFloat(audioRate.value || '0.85'), pitch: 1.0 })
        .finally(() => { delete audioBtn.dataset.playing; audioBtn.textContent = '🔊 Nghe bài đọc'; });
    });
    audioRate.addEventListener('change', () => { if (audioBtn.dataset.playing) { stopAudio(); delete audioBtn.dataset.playing; } });
  }

  function findLesson(id) {
    let l = readingLessons.find(x => x.id === id) || cultureLessons.find(x => x.id === id);
    if (!l) for (const k in EXT) { if (EXT[k].find && (l = EXT[k].find(id))) break; }
    return l;
  }
  function openDetail(id) {
    const lesson = findLesson(id);
    if (!lesson) return;
    if (window.trackStudyActivity) window.trackStudyActivity();
    stopAudio();

    const grp = lesson.group ? CS.groups.find(g => g.id === lesson.group) : null;
    document.getElementById('baidoc-detail-badge').textContent = lesson.extBadge ? lesson.extBadge : lesson.group ? '中国文化补习 · ' + (grp ? grp.zh : lesson.group) + (lesson.badge ? ' · ' + lesson.badge : '') : 'hsk ' + lesson.hsk;
    document.getElementById('baidoc-detail-title').textContent = lesson.title;
    document.getElementById('baidoc-detail-summary').textContent = lesson.summary || '';

    const refsEl = document.getElementById('baidoc-detail-refs');
    if (refsEl) {
      const refs = Array.isArray(lesson.refs) ? lesson.refs.filter(r => /^https?:\/\//.test(r.url || '')) : [];
      refsEl.classList.toggle('hidden', !refs.length);
      refsEl.innerHTML = refs.length ? '📚 Nguồn tham khảo: ' + refs.map(r => `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="text-peach hover:opacity-80">${escapeHtml(r.name || r.url)}</a>`).join(' · ') : '';
    }
    const sourceWrap = document.getElementById('baidoc-detail-sourcewrap');
    const sourceLink = document.getElementById('baidoc-detail-source');

    if (lesson.content && lesson.content.length) {
      currentTabHtml = buildTabHtml(lesson);
      currentLessonText = lesson.content.map(line => line.cn || '').join('');
      currentTab = 'hz';
      tabsWrap.querySelectorAll('.baidoc-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'hz'));
      tabsWrap.classList.remove('hidden');
      audioRow.classList.remove('hidden');
      audioRow.classList.add('flex');
      renderCurrentTab();
      sourceWrap.classList.add('hidden');
    } else {
      currentTabHtml = { hz: '', py: '', vi: '' };
      currentLessonText = '';
      tabsWrap.classList.add('hidden');
      audioRow.classList.add('hidden');
      audioRow.classList.remove('flex');
      hzHint.classList.add('hidden');
      bodyEl.innerHTML = '';
      if (lesson.sourceUrl) {
        sourceLink.href = lesson.sourceUrl;
        sourceWrap.classList.remove('hidden');
      } else {
        sourceWrap.classList.add('hidden');
      }
    }

    listEl.classList.add('hidden');
    emptyEl.classList.add('hidden');
    pillsWrap.classList.add('hidden');
    detailEl.classList.remove('hidden');
    detailEl.style.animation = 'none';
    void detailEl.offsetWidth;
    detailEl.style.animation = '';
    document.getElementById('baidoc-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    currentOpenId = id;
    document.dispatchEvent(new CustomEvent('tn-reading-open', { detail: { id } }));
  }
  let currentOpenId = null;
  // Vẽ lại bài đang mở (dùng khi bản dịch vừa được duyệt/cập nhật)
  window.tnReadingRerender = function () {
    const lesson = findLesson(currentOpenId);
    if (!lesson || detailEl.classList.contains('hidden') || !(lesson.content && lesson.content.length)) return;
    currentTabHtml = buildTabHtml(lesson);
    renderCurrentTab();
  };
  window.tnReadingOpen = openDetail;

  function backToList() {
    currentOpenId = null;
    document.dispatchEvent(new CustomEvent('tn-reading-close'));
    stopAudio();
    hideTooltip();
    detailEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    pillsWrap.classList.remove('hidden');
    emptyEl.classList.toggle('hidden', listEl.children.length > 0);
  }

  document.getElementById('baidoc-back').addEventListener('click', backToList);

  // 3 nhánh: Bài đọc theo trình độ · Bổ túc văn hoá (VIP) · Thành ngữ tục ngữ (VIP)
  const branchWrap = document.getElementById('baidoc-branches');
  function setBranch(b) {
    if (branchWrap) branchWrap.querySelectorAll('[data-baidoc-branch]').forEach(x => x.classList.toggle('active', x.dataset.baidocBranch === b));
    pillsWrap.classList.toggle('bd-hide-levels', b !== 'level');
    if (b === 'level') {
      if (currentFilter === 'vh' || currentFilter === 'tn' || EXT[currentFilter]) {
        currentFilter = 'all';
        pillsWrap.querySelectorAll('.baidoc-level').forEach(p => p.classList.toggle('active', p.dataset.baidocFilter === 'all'));
      }
    } else {
      currentFilter = b;
      if (b === 'vh') CS.openGroup = CS.openProv = null;
    }
    if (!detailEl.classList.contains('hidden')) backToList(); else renderList();
  }
  if (branchWrap) branchWrap.querySelectorAll('[data-baidoc-branch]').forEach(btn => btn.addEventListener('click', () => setBranch(btn.dataset.baidocBranch)));

  pillsWrap.querySelectorAll('.baidoc-level').forEach(pill => {
    pill.addEventListener('click', () => {
      pillsWrap.querySelectorAll('.baidoc-level').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.baidocFilter;
      if (currentFilter === 'vh') CS.openGroup = CS.openProv = null;   // vào lại mục văn hoá → về màn các chủ đề
      renderList();
    });
  });


  /* ===================== TẢI DỮ LIỆU SAU KHI ĐĂNG NHẬP ===================== */
  const RS = { status: 'checking', uid: null, err: '' }; // checking | guest | loading | ready | error
  const CACHE_KEY = 'readings';
  function idb(mode, fn) {
    return new Promise(res => {
      try {
        const r = indexedDB.open('tndihoc-cache', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onerror = () => res(null);
        r.onsuccess = () => {
          try { const tx = r.result.transaction('kv', mode); const q = fn(tx.objectStore('kv')); tx.oncomplete = () => res(q && 'result' in q ? q.result : true); tx.onerror = () => res(null); }
          catch (e) { res(null); }
        };
      } catch (e) { res(null); }
    });
  }
  const cacheGet = () => idb('readonly', s => s.get(CACHE_KEY));
  const cachePut = (v) => idb('readwrite', s => s.put(v, CACHE_KEY));
  const cacheDel = () => idb('readwrite', s => s.delete(CACHE_KEY));

  function renderGate() {
    pillsWrap.classList.add('hidden');
    emptyEl.classList.add('hidden');
    let html;
    if (RS.status === 'guest') {
      html = `<div class="tt-lock" style="grid-column:1/-1"><div class="ico">📖</div><b>Kho 130 bài đọc HSK 2–6 dành cho thành viên</b>
        <p>Đăng nhập (miễn phí) để đọc bài, tra nghĩa từng chữ Hán, nghe đọc và luyện chép chính tả.</p>
        <button class="tt-btn" data-tt-login>Đăng nhập / Đăng ký</button></div>`;
    } else if (RS.status === 'error') {
      html = `<div class="tt-note warn" style="grid-column:1/-1">${escapeHtml(RS.err)} <button class="tt-link" data-baidoc-retry>Thử lại</button></div>`;
    } else {
      html = `<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> ${RS.status === 'loading' ? 'Đang tải kho bài đọc…' : 'Đang kiểm tra đăng nhập…'}</div>`;
    }
    listEl.innerHTML = html;
    listEl.querySelector('[data-baidoc-retry]')?.addEventListener('click', () => { RS.uid = null; handleAuth(window.tnAuth); });
  }

  /* ----- Bài đọc văn hoá VIP: tải khi người có quyền bấm vào mục 中国文化补习 ----- */
  const CULTURE_KEY = 'culture';
  const cGet = () => idb('readonly', s => s.get(CULTURE_KEY));
  const cPut = (v) => idb('readwrite', s => s.put(v, CULTURE_KEY));
  const cDel = () => idb('readwrite', s => s.delete(CULTURE_KEY));
  let lastFb = null;
  async function loadCulture() {
    const fb = lastFb || (window.tnEnsureFb ? await window.tnEnsureFb() : null);
    if (!fb) { CS.status = 'error'; CS.err = 'Không kết nối được máy chủ.'; renderList(); return; }
    CS.status = 'loading'; CS.uid = RS.uid;
    try {
      const { db, D } = fb;
      const metaSnap = await D.getDoc(D.doc(db, 'culture', '_meta'));
      if (!metaSnap.exists()) throw new Error('Mục bài đọc văn hoá chưa được nạp lên máy chủ. (Admin: “Lớp học & phân quyền” → tab “🏮 Dữ liệu văn hoá”.)');
      const meta = metaSnap.data();
      const cached = await cGet();
      let arr;
      if (cached && cached.version === meta.version && cached.uid === RS.uid && Array.isArray(cached.lessons)) arr = cached.lessons;
      else {
        const parts = await Promise.all((meta.parts || []).map(id => D.getDoc(D.doc(db, 'culture', id))));
        arr = [];
        parts.forEach(p => { if (p.exists()) arr.push(...JSON.parse(p.data().json || '[]')); });
        cPut({ version: meta.version, uid: RS.uid, lessons: arr });
      }
      cultureLessons.splice(0, cultureLessons.length, ...arr);
      CS.groups = meta.groups || [];
      CS.status = 'ready';
    } catch (e) {
      CS.status = 'error';
      const code = (e && e.code) || '';
      CS.err = code.includes('permission') ? 'Tài khoản chưa có quyền đọc mục này, hoặc luật Firestore cho “culture” chưa được cập nhật.'
        : code.includes('unavailable') ? 'Không kết nối được máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.'
        : (e && e.message) || 'Không tải được bài đọc văn hoá.';
    }
    renderList();
  }
  function clearCulture() {
    cultureLessons.splice(0); CS.status = 'idle'; CS.groups = []; CS.uid = null; cDel();
    if (currentOpenId && !findLesson(currentOpenId) && !detailEl.classList.contains('hidden')) backToList();
  }
  /* ===================== THÀNH NGỮ · TỤC NGỮ · ĐIỂN CỐ (VIP) ===================== */
  const IDIOM_KEY = 'idioms';
  const iGet = () => idb('readonly', s => s.get(IDIOM_KEY));
  const iPut = (v) => idb('readwrite', s => s.put(v, IDIOM_KEY));
  const iDel = () => idb('readwrite', s => s.delete(IDIOM_KEY));
  const idiomItems = [];
  const IS = { status: 'idle', err: '', uid: null, disclaimer: '', q: '', type: 'all', page: 1, open: null, per: 24 };
  const IDIOM_TYPES = [['all', 'Tất cả'], ['成语', '成语 Thành ngữ'], ['谚语', '谚语 Tục ngữ'], ['俗语', '俗语 Khẩu ngữ'], ['典故', '典故 Điển cố']];
  const IDIOM_COLOR = { '成语': ['#FFF1E0', '#B45309'], '谚语': ['#E8F5EC', '#2F6B45'], '俗语': ['#E6F0FB', '#2F5C8F'], '典故': ['#F3E8FA', '#6B3F8F'] };
  if (!document.getElementById('idiom-style')) {
    const st = document.createElement('style'); st.id = 'idiom-style';
    st.textContent = `
    .id-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
    .id-search{flex:1;min-width:150px;padding:10px 14px;border-radius:9999px;border:1.5px solid var(--t2,#F5BBD5);background:#fff;font-size:15px;outline:none}
    .id-search:focus{border-color:var(--t5,#B0306A)}
    .id-chip{padding:6px 12px;border-radius:9999px;border:1.5px solid var(--t2,#F5BBD5);background:#fff;font-size:13px;font-weight:600;color:#2E3440;cursor:pointer}
    .id-chip.active{background:var(--t5,#B0306A);color:#fff;border-color:var(--t5,#B0306A)}
    .id-note{font-size:12.5px;color:#5B6472;line-height:1.6;background:var(--t0,#FDF0F6);border:1px dashed var(--t2,#F5BBD5);border-radius:14px;padding:10px 14px;margin-bottom:12px}
    .id-card{text-align:left;background:#fff;border:1px solid rgba(46,52,64,.1);border-radius:18px;padding:16px 18px;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease;opacity:0;animation:fadeUp .35s ease both}
    .id-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px -14px rgba(46,52,64,.25);border-color:var(--t3,#EB8DB7)}
    .id-card.open{grid-column:1/-1;border-color:var(--t5,#B0306A);cursor:default}
    .id-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
    .id-zh{font-size:26px;font-weight:700;line-height:1.3;font-family:"KaiTi","Kaiti SC","STKaiti","SimSun",serif;color:#2E3440}
    .id-py{font-size:14px;color:var(--t4,#D65C95);margin-top:2px}
    .id-badge{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:9999px;white-space:nowrap}
    .id-mean{font-size:14.5px;color:#2E3440;line-height:1.7;margin-top:8px}
    .id-more{margin-top:10px;padding-top:10px;border-top:1px dashed var(--t2,#F5BBD5);font-size:14px;line-height:1.75;color:#3a4150}
    .id-more b{color:var(--t6,#7A1A47)}
    .id-say{border:none;background:var(--t1,#FADCEA);color:var(--t6,#7A1A47);border-radius:9999px;padding:5px 12px;font-size:13px;font-weight:700;cursor:pointer}
    .id-say:hover{background:var(--t2,#F5BBD5)}
    .id-pg{display:flex;justify-content:center;align-items:center;gap:10px;margin-top:14px;grid-column:1/-1}
    .id-pg button{padding:7px 14px;border-radius:9999px;border:1.5px solid var(--t2,#F5BBD5);background:#fff;font-weight:700;font-size:13px;cursor:pointer}
    .id-pg button[disabled]{opacity:.4;cursor:not-allowed}
    @media (prefers-reduced-motion:reduce){.id-card{animation:none;opacity:1}}`;
    document.head.appendChild(st);
  }
  const noDia = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  function idiomFiltered() {
    const q = noDia(IS.q.trim());
    return idiomItems.filter(it => (IS.type === 'all' || it.type === IS.type) &&
      (!q || it.text.includes(IS.q.trim()) || noDia(it.pinyin).includes(q) || noDia(it.meaning_vi).includes(q) || noDia(it.insight_vi).includes(q)));
  }
  function sayZh(text) {
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = 0.8;
      const v = speechSynthesis.getVoices().find(x => /^zh/i.test(x.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function drawIdiomResults() {
    const box = document.getElementById('id-results'); if (!box) return;
    const all = idiomFiltered();
    const pages = Math.max(1, Math.ceil(all.length / IS.per));
    if (IS.page > pages) IS.page = pages;
    const slice = all.slice((IS.page - 1) * IS.per, IS.page * IS.per);
    const cnt = document.getElementById('id-count');
    if (cnt) cnt.textContent = all.length + ' / ' + idiomItems.length + ' mục';
    box.innerHTML = '';
    if (!slice.length) { box.innerHTML = '<p class="text-sm text-slate italic" style="grid-column:1/-1">Không tìm thấy mục nào phù hợp.</p>'; return; }
    slice.forEach((it, i) => {
      const c = IDIOM_COLOR[it.type] || ['#F1F1F1', '#555'];
      const open = IS.open === it.id;
      const card = document.createElement('div');
      card.className = 'id-card focus-ring' + (open ? ' open' : '');
      card.tabIndex = 0; card.setAttribute('role', 'button');
      card.style.animationDelay = (i * 0.025) + 's';
      card.innerHTML = `<div class="id-top"><div><div class="id-zh">${escapeHtml(it.text)}</div><div class="id-py">${escapeHtml(it.pinyin)}</div></div>
        <span class="id-badge" style="background:${c[0]};color:${c[1]}">${escapeHtml(it.type)}</span></div>
        <div class="id-mean">${escapeHtml(it.meaning_vi)}</div>
        ${open ? `<div class="id-more"><div><b>Xuất xứ:</b> ${escapeHtml(it.origin || '—')}</div><div style="margin-top:6px"><b>Tìm hiểu thêm:</b> ${escapeHtml(it.insight_vi || '—')}</div>
        ${it.story_zh && window.tnStoryHtml ? `<div style="margin-top:12px"><b>Câu chuyện (tiếng Trung):</b><div style="margin-top:8px">${window.tnStoryHtml(it, true)}</div></div>` : ''}
        <div style="margin-top:10px"><button type="button" class="id-say" data-say>🔊 Nghe đọc</button></div></div>` : ''}`;
      const toggle = () => { IS.open = open ? null : it.id; drawIdiomResults(); };
      card.addEventListener('click', e => { if (e.target.closest('[data-say]')) { sayZh(it.text); return; } if (e.target.closest('.gt-story')) return; toggle(); });
      card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); toggle(); } });
      box.appendChild(card);
    });
    if (pages > 1) {
      const pg = document.createElement('div'); pg.className = 'id-pg';
      pg.innerHTML = `<button type="button" data-p="-1" ${IS.page <= 1 ? 'disabled' : ''}>‹ Trước</button><span class="text-sm text-slate">Trang ${IS.page}/${pages}</span><button type="button" data-p="1" ${IS.page >= pages ? 'disabled' : ''}>Sau ›</button>`;
      pg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { IS.page += Number(b.dataset.p); IS.open = null; drawIdiomResults(); listEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
      box.appendChild(pg);
    }
  }
  function renderIdioms() {
    pillsWrap.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    const msg = html => { listEl.innerHTML = html; };
    if (RS.status === 'guest') {
      msg(`<div class="tt-lock" style="grid-column:1/-1"><div class="ico">📜</div><b>成语·谚语·俗语·典故 – Thành ngữ, tục ngữ, điển cố</b>
        <p>Mục VIP gồm 1000 thành ngữ, tục ngữ, khẩu ngữ và điển cố tiếng Trung kèm pinyin, nghĩa tiếng Việt, xuất xứ và giải thích. Đăng nhập để xem.</p>
        <button class="tt-btn" data-tt-login>Đăng nhập / Đăng ký</button></div>`); return;
    }
    const can = window.tnCan;
    if (!can || RS.status === 'checking') { msg(`<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> Đang kiểm tra quyền truy cập…</div>`); return; }
    if (!can('idioms')) {
      const api = window.tnApi;
      msg(`<div style="grid-column:1/-1">${api && api.lockedHtml ? api.lockedHtml('idioms') : '<div class="tt-lock"><div class="ico">🔒</div><b>Mục VIP</b><p>Liên hệ cô Thúy để được mở quyền.</p></div>'}</div>`);
      return;
    }
    if (IS.status === 'error') {
      msg(`<div class="tt-note warn" style="grid-column:1/-1">${escapeHtml(IS.err)} <button class="tt-link" data-id-retry>Thử lại</button></div>`);
      listEl.querySelector('[data-id-retry]').addEventListener('click', () => { IS.status = 'idle'; renderList(); });
      return;
    }
    if (IS.status !== 'ready') {
      msg(`<div class="tt-empty" style="grid-column:1/-1"><span class="tt-spin"></span> Đang tải thành ngữ, tục ngữ…</div>`);
      if (IS.status === 'idle') loadIdioms();
      return;
    }
    if (!idiomItems.length) { msg(`<p class="text-sm text-slate italic" style="grid-column:1/-1">Chưa có dữ liệu thành ngữ.</p>`); return; }
    listEl.innerHTML = `<div style="grid-column:1/-1">
      <div class="id-bar"><input class="id-search" id="id-q" type="search" placeholder="Tìm: chữ Hán, pinyin hoặc nghĩa tiếng Việt…" value="${escapeHtml(IS.q)}" autocomplete="off">
        <span class="text-sm text-slate" id="id-count"></span></div>
      <div class="id-bar" id="id-types">${IDIOM_TYPES.map(t => `<button type="button" class="id-chip${IS.type === t[0] ? ' active' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      ${IS.disclaimer ? `<div class="id-note">ℹ️ ${escapeHtml(IS.disclaimer)}</div>` : ''}
      </div><div id="id-results" class="grid sm:grid-cols-2 gap-3" style="grid-column:1/-1"></div>`;
    const qi = document.getElementById('id-q');
    qi.addEventListener('input', () => { IS.q = qi.value; IS.page = 1; IS.open = null; drawIdiomResults(); });
    listEl.querySelectorAll('#id-types .id-chip').forEach(b => b.addEventListener('click', () => {
      IS.type = b.dataset.t; IS.page = 1; IS.open = null;
      listEl.querySelectorAll('#id-types .id-chip').forEach(x => x.classList.toggle('active', x === b));
      drawIdiomResults();
    }));
    drawIdiomResults();
  }
  async function loadIdioms() {
    const fb = lastFb || (window.tnEnsureFb ? await window.tnEnsureFb() : null);
    if (!fb) { IS.status = 'error'; IS.err = 'Không kết nối được máy chủ.'; renderList(); return; }
    IS.status = 'loading'; IS.uid = RS.uid;
    try {
      const { db, D } = fb;
      const metaSnap = await D.getDoc(D.doc(db, 'idioms', '_meta'));
      if (!metaSnap.exists()) throw new Error('Mục thành ngữ chưa được nạp lên máy chủ. (Admin: “Lớp học & phân quyền” → tab “📜 Dữ liệu thành ngữ”.)');
      const meta = metaSnap.data();
      const cached = await iGet();
      let arr;
      if (cached && cached.version === meta.version && cached.uid === RS.uid && Array.isArray(cached.items)) arr = cached.items;
      else {
        const parts = await Promise.all((meta.parts || []).map(id => D.getDoc(D.doc(db, 'idioms', id))));
        arr = [];
        parts.forEach(p => { if (p.exists()) arr.push(...JSON.parse(p.data().json || '[]')); });
        iPut({ version: meta.version, uid: RS.uid, items: arr });
      }
      idiomItems.splice(0, idiomItems.length, ...arr);
      IS.disclaimer = meta.disclaimer || '';
      IS.status = 'ready';
    } catch (e) {
      IS.status = 'error';
      const code = (e && e.code) || '';
      IS.err = code.includes('permission') ? 'Tài khoản chưa có quyền đọc mục này, hoặc luật Firestore cho “idioms” chưa được cập nhật.'
        : code.includes('unavailable') ? 'Không kết nối được máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.'
        : (e && e.message) || 'Không tải được thành ngữ.';
    }
    renderList();
  }
  function clearIdioms() { idiomItems.splice(0); IS.status = 'idle'; IS.uid = null; IS.open = null; iDel(); }

  // Quyền thay đổi (đăng nhập xong, admin mở/khoá quyền, đổi lớp…) → vẽ lại mục văn hoá
  document.addEventListener('tt-state', () => {
    const allowed = window.tnCan && window.tnCan('culture');
    if (!allowed && cultureLessons.length) clearCulture();
    if (!(window.tnCan && window.tnCan('idioms')) && idiomItems.length) clearIdioms();
    if ((currentFilter === 'vh' || EXT[currentFilter] || (currentFilter === 'tn' && IS.status !== 'ready')) && detailEl.classList.contains('hidden')) renderList();
  });

  function setLessons(arr) {
    readingLessons.splice(0, readingLessons.length, ...arr);
    document.dispatchEvent(new CustomEvent('tn-readings-ready', { detail: { count: readingLessons.length } }));
  }

  async function loadReadings(fb) {
    RS.status = 'loading'; renderList();
    try {
      const { db, D } = fb;
      const metaSnap = await D.getDoc(D.doc(db, 'readings', '_meta'));
      if (!metaSnap.exists()) throw new Error('Kho bài đọc chưa được nạp lên máy chủ. (Admin: “Lớp học & phân quyền” → tab “📖 Dữ liệu bài đọc”.)');
      const meta = metaSnap.data();
      const cached = await cacheGet();
      let arr;
      if (cached && cached.version === meta.version && Array.isArray(cached.lessons)) arr = cached.lessons;
      else {
        const parts = await Promise.all((meta.parts || []).map(id => D.getDoc(D.doc(db, 'readings', id))));
        arr = [];
        parts.forEach(p => { if (p.exists()) arr.push(...JSON.parse(p.data().json || '[]')); });
        cachePut({ version: meta.version, lessons: arr });
      }
      setLessons(arr);
      RS.status = 'ready';
    } catch (e) {
      RS.status = 'error';
      const code = (e && e.code) || '';
      RS.err = code.includes('permission') ? 'Chưa có quyền đọc kho bài đọc (luật Firestore chưa cập nhật?).'
        : code.includes('unavailable') ? 'Không kết nối được máy chủ. Kiểm tra mạng (ở Trung Quốc cần bật VPN) rồi thử lại.'
        : (e && e.message) || 'Không tải được kho bài đọc.';
    }
    renderList();
  }

  async function handleAuth(detail) {
    const uid = detail && detail.user ? detail.user.uid : null;
    // Lần báo đầu tiên (Firebase chưa tải xong) chưa biết có đăng nhập hay không → chờ tiếp
    if (!uid && !(detail && detail.fb) && RS.status === 'checking') return;
    if (!uid) {
      if (RS.uid !== null || RS.status !== 'guest') {
        RS.uid = null; RS.status = 'guest';
        if (readingLessons.length) { cacheDel(); setLessons([]); }
        clearCulture(); clearIdioms();
        if (!detailEl.classList.contains('hidden')) backToList();
        renderList();
      }
      return;
    }
    if (RS.uid === uid && (RS.status === 'ready' || RS.status === 'loading')) return;
    if (CS.uid && CS.uid !== uid) clearCulture();
    if (IS.uid && IS.uid !== uid) clearIdioms();
    RS.uid = uid;
    const fb = detail.fb || (window.tnEnsureFb ? await window.tnEnsureFb() : null);
    lastFb = fb;
    if (!fb) { RS.status = 'error'; RS.err = 'Không kết nối được máy chủ.'; renderList(); return; }
    loadReadings(fb);
  }
  document.addEventListener('tn-auth', e => handleAuth(e.detail));
  // Nếu sau 8 giây vẫn chưa biết trạng thái đăng nhập (mạng chậm / chặn Firebase) → coi như khách
  setTimeout(() => { if (RS.status === 'checking') { RS.status = 'guest'; renderList(); } }, 8000);
  if (window.tnAuth !== undefined) handleAuth(window.tnAuth);

  renderList();
})();
