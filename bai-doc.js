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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderList() {
    if (RS.status !== 'ready' || !readingLessons.length) { renderGate(); return; }
    pillsWrap.classList.remove('hidden');
    const filtered = readingLessons.filter(l => currentFilter === 'all' || l.hsk === currentFilter);
    listEl.innerHTML = '';
    emptyEl.classList.toggle('hidden', filtered.length > 0);
    filtered.forEach((lesson, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'baidoc-card focus-ring';
      card.style.animationDelay = (i * 0.05) + 's';
      card.dataset.baidocId = lesson.id;
      card.innerHTML = `
        <span class="baidoc-badge">hsk ${escapeHtml(lesson.hsk)}</span>
        <h4 class="font-sans font-semibold text-ink mb-1">${escapeHtml(lesson.title)}</h4>
        <p class="text-sm text-slate leading-relaxed">${escapeHtml(lesson.summary || '')}</p>
      `;
      card.addEventListener('click', () => openDetail(lesson.id));
      listEl.appendChild(card);
    });
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

  function openDetail(id) {
    const lesson = readingLessons.find(l => l.id === id);
    if (!lesson) return;
    if (window.trackStudyActivity) window.trackStudyActivity();
    stopAudio();

    document.getElementById('baidoc-detail-badge').textContent = 'hsk ' + lesson.hsk;
    document.getElementById('baidoc-detail-title').textContent = lesson.title;
    document.getElementById('baidoc-detail-summary').textContent = lesson.summary || '';

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
    const lesson = readingLessons.find(l => l.id === currentOpenId);
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

  pillsWrap.querySelectorAll('.baidoc-level').forEach(pill => {
    pill.addEventListener('click', () => {
      pillsWrap.querySelectorAll('.baidoc-level').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.baidocFilter;
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
        if (!detailEl.classList.contains('hidden')) backToList();
        renderList();
      }
      return;
    }
    if (RS.uid === uid && (RS.status === 'ready' || RS.status === 'loading')) return;
    RS.uid = uid;
    const fb = detail.fb || (window.tnEnsureFb ? await window.tnEnsureFb() : null);
    if (!fb) { RS.status = 'error'; RS.err = 'Không kết nối được máy chủ.'; renderList(); return; }
    loadReadings(fb);
  }
  document.addEventListener('tn-auth', e => handleAuth(e.detail));
  // Nếu sau 8 giây vẫn chưa biết trạng thái đăng nhập (mạng chậm / chặn Firebase) → coi như khách
  setTimeout(() => { if (RS.status === 'checking') { RS.status = 'guest'; renderList(); } }, 8000);
  if (window.tnAuth !== undefined) handleAuth(window.tnAuth);

  renderList();
})();
