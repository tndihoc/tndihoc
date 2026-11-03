/* =====================================================================
   NHẬP MÔN › PHÁT ÂM (拼音) — dựng từ 2 bài PPT 《HSK标准教程1》 bài 1 & bài 2 của cô Thúy Ngô
   - Vẽ vào khối #tt-pinyin (hoc-tieng-trung.js tạo sẵn khối này).
   - Dữ liệu nằm ngay trong file này; âm thanh & hình khẩu hình nằm ở thư mục gốc (xem BASE).
   - Không cần đăng nhập. Tiến độ luyện nghe lưu trên máy người học (localStorage).
   Các tab: Làm quen · Thanh mẫu (21) · Vận mẫu (36) · Thanh điệu · Quy tắc viết · Luyện nghe
   ===================================================================== */
(function () {
  const root = document.getElementById("tt-pinyin");
  if (!root) return;
  const BASE = ""; // file nghe (.mp3) và hình khẩu hình (.webp) nằm ngay thư mục gốc
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PKEY = "tn_phatam_v1";
  const prog = () => { try { return JSON.parse(localStorage.getItem(PKEY) || "{}") || {}; } catch (e) { return {}; } };
  const saveProg = (fn) => { const p = prog(); fn(p); try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} };

  /* ---------------- Âm thanh ---------------- */
  let cur = null;
  function playFile(name, btn) {
    stopAll();
    const a = new Audio(BASE + name + ".mp3"); cur = a;
    if (btn) btn.classList.add("pa-on");
    const done = () => { if (btn) btn.classList.remove("pa-on"); };
    a.addEventListener("ended", done); a.addEventListener("error", () => { done(); toast("Chưa tải được file nghe. Kiểm tra mạng rồi thử lại."); });
    a.play().catch(() => { done(); });
  }
  function stopAll() {
    if (cur) { try { cur.pause(); } catch (e) {} cur = null; }
    document.querySelectorAll("#tt-pinyin .pa-on").forEach(b => b.classList.remove("pa-on"));
    if (window.tnVoice) window.tnVoice.stop();
  }
  function say(text, btn) {
    if (!window.tnVoice || !window.tnVoice.ok) return toast("Trình duyệt này chưa có giọng đọc tiếng Trung. Hãy dùng Chrome hoặc Edge.");
    stopAll(); if (btn) btn.classList.add("pa-on");
    window.tnVoice.speak(text, { rate: 0.8, onend: () => btn && btn.classList.remove("pa-on") }).then(() => btn && btn.classList.remove("pa-on"));
  }
  function toast(t) { const el = document.getElementById("pa-toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 3500); }

  /* ---------------- Dữ liệu ---------------- */
  // Thanh mẫu: l = chữ cái, say = chữ Hán để máy đọc âm mẫu (bo po mo fo…), syl = âm tiết mẫu, w = từ ví dụ
  const INI = [
    { g: "Âm hai môi · răng môi", k: "lab", items: [
      { l: "b", syl: "bō", say: "波", d: "Âm hai môi, đọc giống chữ “p” trong tiếng Việt (không bật hơi).", w: ["爸爸", "bàba", "bố"] },
      { l: "p", syl: "pō", say: "坡", d: "Âm hai môi, bật hơi.", w: ["苹果", "píngguǒ", "quả táo"] },
      { l: "m", syl: "mō", say: "摸", d: "Âm hai môi, đọc giống chữ “m” trong tiếng Việt.", w: ["妈妈", "māma", "mẹ"] },
      { l: "f", syl: "fō", say: "佛", d: "Âm răng môi, đọc giống “ph” trong tiếng Việt.", w: ["飞机", "fēijī", "máy bay"] } ] },
    { g: "Âm đầu lưỡi", k: "tip", items: [
      { l: "d", syl: "dē", say: "得", d: "Đọc giống chữ “t” trong tiếng Việt (không bật hơi).", w: ["大", "dà", "to, lớn"] },
      { l: "t", syl: "tē", say: "特", d: "Bật hơi, đọc gần giống chữ “th” trong tiếng Việt.", w: ["他", "tā", "anh ấy"] },
      { l: "n", syl: "nē", say: "讷", d: "Đọc giống chữ “n” trong tiếng Việt.", w: ["你", "nǐ", "bạn"] },
      { l: "l", syl: "lē", say: "乐", d: "Đọc giống chữ “l” trong tiếng Việt.", w: ["六", "liù", "sáu"] } ] },
    { g: "Âm cuống lưỡi", k: "back", items: [
      { l: "g", syl: "gē", say: "哥", d: "Âm cuống lưỡi. Đọc giống chữ “c” trong tiếng Việt (không bật hơi).", w: ["个", "gè", "(lượng từ)"] },
      { l: "k", syl: "kē", say: "科", d: "Âm cuống lưỡi, bật hơi.", w: ["咖啡", "kāfēi", "cà phê"] },
      { l: "h", syl: "hē", say: "喝", d: "Đọc gần giống chữ “h” hoặc “kh” trong tiếng Việt.", w: ["好", "hǎo", "tốt"] } ] },
    { g: "Âm mặt lưỡi", k: "face", items: [
      { l: "j", syl: "jī", say: "机", d: "Đọc gần giống chữ “ch” trong tiếng Việt (không bật hơi).", w: ["九", "jiǔ", "chín"] },
      { l: "q", syl: "qī", say: "七", d: "Cách phát âm tương tự j, nhưng bật hơi.", w: ["七", "qī", "bảy"] },
      { l: "x", syl: "xī", say: "西", d: "Âm mặt lưỡi, không bật hơi; lưỡi áp sát hàm trên, miệng bẹt như đang cười nhẹ (gần giống “x” trong tiếng Việt).", w: ["谢谢", "xièxie", "cảm ơn"], extra: true } ] },
    { g: "Âm uốn lưỡi", k: "curl", lesson: 2, items: [
      { l: "zh", syl: "zhī", say: "知", d: "Âm uốn lưỡi, không bật hơi.", w: ["中国", "Zhōngguó", "Trung Quốc"] },
      { l: "ch", syl: "chī", say: "吃", d: "Âm uốn lưỡi, bật hơi.", w: ["吃", "chī", "ăn"] },
      { l: "sh", syl: "shī", say: "诗", d: "Uốn lưỡi, đọc giống “s” trong tiếng Việt.", w: ["是", "shì", "là"] },
      { l: "r", syl: "rì", say: "日", d: "Uốn lưỡi, đọc giống “r” trong tiếng Việt.", w: ["人", "rén", "người"] } ] },
    { g: "Âm đầu lưỡi thẳng", k: "flat", lesson: 2, items: [
      { l: "z", syl: "zī", say: "资", d: "Âm đầu lưỡi, lưỡi thẳng (không bật hơi).", w: ["字", "zì", "chữ"] },
      { l: "c", syl: "cī", say: "疵", d: "Đầu lưỡi, lưỡi thẳng, bật hơi.", w: ["菜", "cài", "món ăn"] },
      { l: "s", syl: "sī", say: "思", d: "Đầu lưỡi, lưỡi thẳng.", w: ["三", "sān", "ba"] } ] },
  ];
  const INI_ALL = INI.flatMap(g => g.items.map(x => ({ ...x, grp: g })));
  const PAIRS = [["b", "p"], ["d", "t"], ["g", "k"], ["j", "q"], ["zh", "ch"], ["z", "c"]];

  // Vận mẫu: say = từ ví dụ để máy đọc; ex = [chữ Hán, pinyin]; L = bài 1 / bài 2
  const FIN = [
    { g: "Vận mẫu đơn", items: [["a", "啊", "ā", 1], ["o", "哦", "ō", 1], ["e", "鹅", "é", 1], ["i", "衣", "yī", 1], ["u", "乌", "wū", 1], ["ü", "鱼", "yú", 1], ["er", "二", "èr", 1]] },
    { g: "Vận mẫu kép", items: [["ai", "爱", "ài", 1], ["ei", "黑", "hēi", 1], ["ao", "好", "hǎo", 1], ["ou", "手", "shǒu", 2], ["ia", "家", "jiā", 1], ["ie", "写", "xiě", 1], ["iao", "小", "xiǎo", 1], ["iou (iu)", "六", "liù", 2], ["ua", "花", "huā", 1], ["uo", "我", "wǒ", 1], ["uai", "坏", "huài", 1], ["uei (ui)", "水", "shuǐ", 1], ["üe", "月", "yuè", 1]] },
    { g: "Vận mẫu mũi", items: [["an", "山", "shān", 2], ["en", "人", "rén", 2], ["ang", "上", "shàng", 2], ["eng", "风", "fēng", 2], ["ong", "中", "zhōng", 2], ["ian", "天", "tiān", 2], ["in", "亲", "qīn", 2], ["iang", "羊", "yáng", 2], ["ing", "星", "xīng", 2], ["iong", "穷", "qióng", 2], ["uan", "弯", "wān", 2], ["uen (un)", "春", "chūn", 2], ["uang", "王", "wáng", 2], ["ueng", "翁", "wēng", 2], ["üan", "远", "yuǎn", 2], ["ün", "云", "yún", 2]] },
  ];
  const FIN_ALL = FIN.flatMap(g => g.items.map(([f, hz, py, L]) => ({ f, hz, py, L, grp: g.g })));

  const TONES = [
    { n: 1, mark: "ā", name: "Thanh 1", d: "Cao và đều (như giữ nguyên một nốt cao).", say: "妈", ex: "mā", hz: "妈", vn: "mẹ" },
    { n: 2, mark: "á", name: "Thanh 2", d: "Đi lên từ giữa lên cao (gần giống dấu sắc).", say: "麻", ex: "má", hz: "麻", vn: "cây gai" },
    { n: 3, mark: "ǎ", name: "Thanh 3", d: "Xuống thấp rồi hơi lên (gần giống dấu hỏi, kéo dài).", say: "马", ex: "mǎ", hz: "马", vn: "ngựa" },
    { n: 4, mark: "à", name: "Thanh 4", d: "Rơi nhanh từ cao xuống thấp, dứt khoát (gần giống dấu huyền mạnh).", say: "骂", ex: "mà", hz: "骂", vn: "mắng" },
  ];
  const TONE_DRILL = [["bū", "bú", "bǔ", "bù"], ["qī", "qí", "qǐ", "qì"], ["nū", "nú", "nǔ", "nù"], ["ēr", "ér", "ěr", "èr"],
    ["kē", "ké", "kě", "kè"], ["dī", "dí", "dǐ", "dì"], ["gē", "gé", "gě", "gè"], ["nā", "ná", "nǎ", "nà"]];
  const NEUTRAL = [["靴子", "xuē zi", "giày ủng"], ["裙子", "qún zi", "váy"], ["耳朵", "ěr duo", "tai"], ["袜子", "wà zi", "tất"], ["妈妈", "mā ma", "mẹ"], ["奶奶", "nǎi nai", "bà nội"], ["爷爷", "yé ye", "ông nội"], ["爸爸", "bà ba", "bố"]];

  // Luyện nghe: file âm thanh cắt từ PPT. a = đáp án, o = 3 đáp án gây nhầm, full = âm tiết đầy đủ
  const Q = {
    ini1: { title: "Thanh mẫu · Bài 1", desc: "Nghe, chọn thanh mẫu đúng cho chỗ trống.", kind: "ini", items: [
      ["huài", "h", "uài", ["j", "b", "t"]], ["bāi", "b", "āi", ["h", "j", "t"]], ["jiào", "j", "iào", ["q", "x", "zh"]], ["tí", "t", "í", ["d", "k", "p"]],
      ["mǎn", "m", "ǎn", ["n", "f", "b"]], ["qù", "q", "ù", ["j", "ch", "x"]], ["xiǎo", "x", "iǎo", ["j", "q", "sh"]], ["dāo", "d", "āo", ["t", "g", "b"]],
      ["nǎi", "n", "ǎi", ["l", "m", "d"]], ["gē", "g", "ē", ["k", "h", "j"]], ["kǎo", "k", "ǎo", ["g", "h", "q"]], ["lái", "l", "ái", ["n", "r", "d"]], ["fēi", "f", "ēi", ["h", "p", "b"]] ] },
    ini2: { title: "Thanh mẫu · Bài 2", desc: "Nhóm uốn lưỡi (zh ch sh r) và lưỡi thẳng (z c s).", kind: "ini", items: [
      ["shén", "sh", "én", ["s", "c", "ch"]], ["rén", "r", "én", ["s", "c", "sh"]], ["sàng", "s", "àng", ["z", "zh", "c"]], ["cāng", "c", "āng", ["s", "ch", "sh"]],
      ["chǒu", "ch", "ǒu", ["r", "sh", "c"]], ["zàn", "z", "àn", ["r", "zh", "c"]], ["zhēn", "zh", "ēn", ["z", "c", "ch"]] ] },
    fin1: { title: "Vận mẫu · Bài 1", desc: "Nghe, chọn vận mẫu đúng cho phần còn thiếu.", kind: "fin", items: [
      ["huā", "ua", "h", ["uo", "ui"]], ["nǔ", "ü", "n", ["u", "i"]], ["wāi", "ai", "w", ["ei", "o"]], ["yuē", "üe", "y", ["ao", "e"]], ["jiào", "iao", "j", ["ie", "üe"]], ["bǎo", "ao", "b", ["ei", "ie"]] ] },
    fin2: { title: "Vận mẫu · Bài 2", desc: "Vận mẫu mũi: an, ang, eng, ong, ing…", kind: "fin", items: [
      ["zǎn", "an", "z", ["eng", "ang"]], ["chóng", "ong", "ch", ["ing", "ang"]], ["céng", "eng", "c", ["en", "un"]] ] },
  };
  const WORDS = ["zhong", "mian", "shui", "huang", "shou", "suan"];

  /* ---------------- Trạng thái & khung ---------------- */
  const TABS = [["intro", "🧩 Làm quen"], ["ini", "🅱️ Thanh mẫu"], ["fin", "🔤 Vận mẫu"], ["tone", "🎼 Thanh điệu"], ["rule", "📏 Quy tắc viết"], ["quiz", "🎧 Luyện nghe"]];
  const ST = { tab: "intro", ini: "b", fin: "a", quiz: null, qi: 0, qscore: 0, qdone: false, qpick: null, qopts: null };
  const btnSay = (txt, label, cls) => `<button type="button" class="pa-play ${cls || ""}" data-say="${esc(txt)}" title="Nghe">🔊${label ? " " + esc(label) : ""}</button>`;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function frame(body) {
    root.innerHTML = `<div class="tt-head"><span class="tt-stamp">音</span><h3>Phát âm · 拼音</h3></div>
      <p class="tt-desc">Học phát âm tiếng Trung từ đầu: <b>thanh mẫu</b>, <b>vận mẫu</b>, <b>thanh điệu</b> và quy tắc viết pinyin — có hình khẩu hình, giọng đọc và bài luyện nghe.</p>
      <div class="pa-tabs">${TABS.map(([k, t]) => `<button type="button" class="tt-tab pa-tab ${ST.tab === k ? "active" : ""}" data-pa-tab="${k}">${t}</button>`).join("")}</div>
      <div class="pa-body">${body}</div><div class="pa-toast" id="pa-toast" hidden></div>`;
  }

  /* ---------------- Từng tab ---------------- */
  function tabIntro() {
    return `<div class="tt-card pa-card">
        <h4 class="pa-h">Một âm tiết tiếng Trung gồm 3 phần</h4>
        <div class="pa-eq">
          <div class="pa-box"><b>声母</b><span>shēngmǔ</span><em>Thanh mẫu</em><i class="pa-x">h</i></div><span class="pa-plus">+</span>
          <div class="pa-box"><b>韵母</b><span>yùnmǔ</span><em>Vận mẫu</em><i class="pa-x">ao</i></div><span class="pa-plus">+</span>
          <div class="pa-box"><b>声调</b><span>shēngdiào</span><em>Thanh điệu</em><i class="pa-x">ˇ</i></div><span class="pa-plus">=</span>
          <div class="pa-box pa-res"><b>好</b><span>hǎo</span><em>tốt, đẹp</em>${btnSay("好", "Nghe")}</div>
        </div>
        <ul class="pa-list">
          <li><b>汉字 hànzì (chữ Hán)</b> là chữ viết; <b>拼音 pīnyīn (pinyin)</b> là cách ghi âm đọc bằng chữ cái Latinh. Ví dụ: 你好 — <i>nǐ hǎo</i> — “xin chào”.</li>
          <li>Tiếng Trung có <b>21 thanh mẫu</b>, <b>36 vận mẫu</b> và <b>4 thanh điệu</b> (cộng thêm thanh nhẹ).</li>
          <li>Có âm tiết không có thanh mẫu (零声母 — thanh mẫu zero), ví dụ <i>yī</i> (一), <i>yú</i> (鱼), <i>ěr</i> (耳).</li>
        </ul></div>
      <div class="pa-grid3">
        <button type="button" class="tt-pick" data-pa-tab="ini"><span class="tt-small">Bước 1</span><span class="cn tt-hz">声母</span><span class="t">21 thanh mẫu · có hình khẩu hình</span></button>
        <button type="button" class="tt-pick" data-pa-tab="fin"><span class="tt-small">Bước 2</span><span class="cn tt-hz">韵母</span><span class="t">36 vận mẫu · nghe băng gốc</span></button>
        <button type="button" class="tt-pick" data-pa-tab="tone"><span class="tt-small">Bước 3</span><span class="cn tt-hz">声调</span><span class="t">4 thanh điệu + thanh nhẹ + biến điệu</span></button>
        <button type="button" class="tt-pick" data-pa-tab="rule"><span class="tt-small">Bước 4</span><span class="cn tt-hz">规则</span><span class="t">Cách đánh dấu · viết tắt · y/w</span></button>
        <button type="button" class="tt-pick" data-pa-tab="quiz"><span class="tt-small">Luyện tập</span><span class="cn tt-hz">练一练</span><span class="t">Nghe và chọn đáp án</span></button>
      </div>`;
  }

  function tabIni() {
    const it = INI_ALL.find(x => x.l === ST.ini) || INI_ALL[0];
    const grid = INI.map(g => `<div class="pa-grp"><div class="pa-grp-t">${esc(g.g)}${g.lesson === 2 ? ' <span class="tt-badge peach">Bài 2</span>' : ""}</div>
        <div class="pa-letters">${g.items.map(x => `<button type="button" class="pa-letter ${x.l === it.l ? "active" : ""}" data-ini="${x.l}">${x.l}</button>`).join("")}</div></div>`).join("");
    const pair = PAIRS.find(p => p.includes(it.l));
    return `<div class="pa-split"><div class="pa-side">${grid}</div>
      <div class="tt-card pa-detail">
        <div class="pa-dhead"><span class="pa-big">${it.l}</span><div><div class="tt-small">${esc(it.grp.g)}</div><div class="pa-syl">${esc(it.syl)}</div></div>${btnSay(it.say, "Nghe âm", "big")}</div>
        <div class="pa-mouth"><img src="${BASE}${it.l}.webp" alt="Khẩu hình khi đọc ${it.l}" loading="lazy" onerror="this.parentNode.classList.add('pa-nomedia')"><span class="tt-small">Hình mặt cắt khi phát âm “${it.l}” (động)</span></div>
        <p class="pa-desc">${esc(it.d)}</p>
        <div class="pa-ex"><span class="tt-hz pa-hz">${esc(it.w[0])}</span><span><b>${esc(it.w[1])}</b><br><span class="tt-small">${esc(it.w[2])}</span></span>${btnSay(it.w[0], "")}</div>
        ${pair ? `<div class="tt-note">💨 <b>Cặp bật hơi:</b> <b>${pair[0]}</b> (không bật hơi) – <b>${pair[1]}</b> (bật hơi). Đặt tờ giấy mỏng trước miệng: đọc <b>${pair[1]}</b> giấy bay, đọc <b>${pair[0]}</b> giấy gần như đứng yên.</div>` : ""}
        ${["zh", "ch", "sh", "r", "z", "c", "s"].includes(it.l) ? `<div class="tt-note">ℹ️ Khi <b>${it.l}</b> đứng một mình với <b>i</b> (<i>${it.l}i</i>), chữ <b>i</b> không đọc như “i” thường mà là âm “ư” (lưỡi giữ nguyên vị trí).</div>` : ""}
        ${it.extra ? '<div class="tt-small" style="margin-top:.4rem">* Mô tả riêng của “x” do web bổ sung; cô có thể sửa lại cho đúng cách giảng của cô.</div>' : ""}
      </div></div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">🎧 Nghe băng gốc — 14 thanh mẫu (Bài 1)</h4>
        <p class="tt-small">Nghe lần lượt: b p m f · d t n l · g k h · j q x. Bài 2 (zh ch sh r z c s) chưa có băng, web dùng giọng đọc máy.</p>
        <audio controls preload="none" src="${BASE}track-initials.mp3" class="pa-audio"></audio></div>`;
  }

  function tabFin() {
    const it = FIN_ALL.find(x => x.f === ST.fin) || FIN_ALL[0];
    const grid = FIN.map(g => `<div class="pa-grp"><div class="pa-grp-t">${esc(g.g)}</div><div class="pa-letters">${g.items.map(([f, , , L]) => `<button type="button" class="pa-letter pa-fin ${f === it.f ? "active" : ""} ${L === 2 ? "l2" : ""}" data-fin="${esc(f)}">${esc(f)}</button>`).join("")}</div></div>`).join("");
    return `<p class="tt-small" style="margin-bottom:.6rem">Ô viền cam là vận mẫu của <b>bài 2</b>; ô còn lại học ở <b>bài 1</b> (18 vận mẫu).</p>
      <div class="pa-split"><div class="pa-side">${grid}</div>
      <div class="tt-card pa-detail"><div class="pa-dhead"><span class="pa-big pa-bigf">${esc(it.f)}</span><div><div class="tt-small">${esc(it.grp)} · Bài ${it.L}</div></div>${btnSay(it.hz, "Nghe âm", "big")}</div>
        <div class="pa-ex"><span class="tt-hz pa-hz">${esc(it.hz)}</span><span><b>${esc(it.py)}</b></span>${btnSay(it.hz, "")}</div>
        ${/^(iou|uei|uen)/.test(it.f) ? '<div class="tt-note">✍️ Khi ghép với thanh mẫu, <b>iou / uei / uen</b> viết tắt thành <b>iu / ui / un</b> (xem tab “Quy tắc viết”).</div>' : ""}
        ${/ü/.test(it.f) ? '<div class="tt-note">ℹ️ <b>ü</b>: tròn môi như đọc “u” nhưng đặt lưỡi như đọc “i”. Sau j, q, x, y thì viết <b>u</b> (bỏ hai chấm).</div>' : ""}
        ${/^(an|en|ang|eng|ong|in|ing|ian|iang|iong|uan|uen|uang|ueng|üan|ün)/.test(it.f) ? '<div class="tt-note">👃 Vận mẫu mũi: kết thúc bằng <b>-n</b> (đầu lưỡi chạm lợi trên) hoặc <b>-ng</b> (cuống lưỡi, không chạm lưỡi vào răng).</div>' : ""}
      </div></div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">🎧 Nghe băng gốc — 18 vận mẫu (Bài 1)</h4>
        <p class="tt-small">Thứ tự trên slide: a o e i u ü ai ei ao ia ie iao ua uo uai uei üe er.</p>
        <audio controls preload="none" src="${BASE}track-finals.mp3" class="pa-audio"></audio></div>`;
  }

  const toneSvg = n => {
    const p = { 1: "M6 8 L54 8", 2: "M6 36 L54 8", 3: "M6 14 L22 42 L54 10", 4: "M6 6 L54 42" }[n];
    return `<svg viewBox="0 0 60 48" class="pa-tsvg" aria-hidden="true"><line x1="3" y1="4" x2="57" y2="4" class="pa-g"/><line x1="3" y1="24" x2="57" y2="24" class="pa-g"/><line x1="3" y1="44" x2="57" y2="44" class="pa-g"/><path d="${p}" fill="none" class="pa-tl"/></svg>`;
  };
  function tabTone() {
    return `<div class="pa-grid4">${TONES.map(t => `<div class="tt-card pa-tcard">${toneSvg(t.n)}<div class="pa-tmark">${t.mark}</div><b>${t.name}</b><p class="tt-small">${esc(t.d)}</p>
        <div class="pa-ex" style="margin:.4rem 0 0"><span class="tt-hz pa-hz">${t.hz}</span><span><b>${t.ex}</b><br><span class="tt-small">${esc(t.vn)}</span></span>${btnSay(t.say, "")}</div></div>`).join("")}</div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">🎙️ Luyện 4 thanh với giọng cô giáo</h4>
        <p class="tt-small">Bấm nghe từng nhóm (thanh 1 – 2 – 3 – 4), rồi đọc theo.</p>
        <div class="pa-drill">${TONE_DRILL.map((g, i) => `<button type="button" class="pa-drill-b" data-file="tone-${String(i + 1).padStart(2, "0")}">🔊 <span>${g.join(" ")}</span></button>`).join("")}</div></div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">轻声 Thanh nhẹ</h4>
        <p class="tt-desc" style="margin:.2rem 0 .6rem">Âm tiết thứ hai đọc <b>nhẹ và ngắn</b>, không đánh dấu thanh.</p>
        <div class="pa-chips">${NEUTRAL.map(n => `<button type="button" class="pa-chip" data-say="${esc(n[0])}"><span class="tt-hz">${n[0]}</span><b>${esc(n[1])}</b><small>${esc(n[2])}</small></button>`).join("")}</div></div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">变调 Biến điệu thường gặp</h4>
        <div class="pa-rules">
          <div class="pa-rule"><b>Thanh 3 + thanh 3</b> → âm tiết đầu đọc thành <b>thanh 2</b> (vẫn viết dấu thanh 3).
            <div class="pa-chips">${[["你好", "nǐ hǎo → ní hǎo"], ["可以", "kě yǐ → ké yǐ"], ["雨伞", "yǔ sǎn → yú sǎn"], ["美好", "měi hǎo → méi hǎo"]].map(x => `<button type="button" class="pa-chip" data-say="${x[0]}"><span class="tt-hz">${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></div>
          <div class="pa-rule"><b>一 (yī)</b> đứng trước thanh 1, 2, 3 → đọc <b>yì</b>; trước thanh 4 → đọc <b>yí</b>.
            <div class="pa-chips">${[["一本书", "yì běn shū"], ["一张桌子", "yì zhāng zhuōzi"], ["一条狗", "yì tiáo gǒu"], ["一个人", "yí gè rén"], ["一下", "yí xià"], ["一定", "yí dìng"]].map(x => `<button type="button" class="pa-chip" data-say="${x[0]}"><span class="tt-hz">${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></div>
          <div class="pa-rule"><b>不 (bù)</b> đứng trước thanh 4 → đọc <b>bú</b>.
            <div class="pa-chips">${[["不错", "bú cuò"], ["不会", "bú huì"]].map(x => `<button type="button" class="pa-chip" data-say="${x[0]}"><span class="tt-hz">${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></div>
        </div></div>`;
  }

  function tabRule() {
    const yw = [
      ["Bắt đầu bằng i", [["i", "yi"], ["in", "yin"], ["ing", "ying"], ["ia", "ya"], ["ie", "ye"], ["iao", "yao"], ["ian", "yan"], ["iang", "yang"], ["iong", "yong"], ["iu", "you"]]],
      ["Bắt đầu bằng u", [["u", "wu"], ["ua", "wa"], ["uo", "wo"], ["uai", "wai"], ["uan", "wan"], ["uang", "wang"], ["ueng", "weng"], ["ui", "wei"], ["un", "wen"]]],
      ["Bắt đầu bằng ü", [["ü", "yu"], ["üe", "yue"], ["üan", "yuan"], ["ün", "yun"]]],
    ];
    return `<div class="tt-card pa-card"><h4 class="pa-h">① Cách đánh dấu thanh điệu</h4>
        <div class="pa-rules">
          <div class="pa-rule"><b>1. a &gt; o &gt; e</b> — “Có a thì đừng bỏ qua, không có a thì tìm o, e.”<div class="pa-chips">${["māo", "xióng"].map(w => `<span class="pa-chip"><b>${w}</b></span>`).join("")}</div></div>
          <div class="pa-rule"><b>2. i, u đứng cạnh nhau</b> — đánh dấu vào chữ <b>phía sau</b>.<div class="pa-chips">${["jiǔ", "shuì"].map(w => `<span class="pa-chip"><b>${w}</b></span>`).join("")}</div></div>
          <div class="pa-rule"><b>3. Đánh dấu lên chữ i</b> — bỏ dấu chấm trên đầu chữ i.<div class="pa-chips">${["qì", "yī"].map(w => `<span class="pa-chip"><b>${w}</b></span>`).join("")}</div></div>
          <div class="pa-rule"><b>4. j / q / x / y + ü</b> — bỏ hai chấm, viết thành <b>u</b>.<div class="pa-chips">${["yú", "jú"].map(w => `<span class="pa-chip"><b>${w}</b></span>`).join("")}</div></div>
        </div></div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">② Viết tắt (省写)</h4>
        <p class="tt-desc" style="margin:.2rem 0 .6rem">Khi <b>iou / uei / uen</b> ghép với thanh mẫu, viết gọn thành <b>iu / ui / un</b>.</p>
        <div class="pa-chips">${[["牛", "niú", "n + iou"], ["轮", "lún", "l + uen"], ["水", "shuǐ", "sh + uei"]].map(x => `<button type="button" class="pa-chip" data-say="${x[0]}"><span class="tt-hz">${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></button>`).join("")}</div></div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">③ Cách dùng y, w (khi không có thanh mẫu)</h4>
        <div class="tt-table-wrap"><table class="tt-table pa-yw"><thead><tr><th>Vận mẫu bắt đầu bằng…</th><th>Cách viết</th></tr></thead><tbody>
        ${yw.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1].map(p => `<span class="pa-pair">${p[0]} → <b>${p[1]}</b></span>`).join("")}</td></tr>`).join("")}</tbody></table></div>
        <p class="tt-small" style="margin-top:.6rem">Ví dụ nhóm 零声母: <b>yī</b> (一) · <b>yú</b> (鱼) · <b>ěr</b> (耳).</p>
        <div class="pa-chips">${[["一", "yī"], ["鱼", "yú"], ["耳", "ěr"]].map(x => `<button type="button" class="pa-chip" data-say="${x[0]}"><span class="tt-hz">${x[0]}</span><b>${x[1]}</b></button>`).join("")}</div></div>`;
  }

  /* ---------------- Luyện nghe ---------------- */
  const qfile = (key, i) => key + "-" + String(i + 1).padStart(2, "0");
  function tabQuiz() {
    if (ST.quiz && Q[ST.quiz]) return quizRun();
    const p = prog().best || {};
    return `<div class="pa-grid2">${Object.entries(Q).map(([k, q]) => `<button type="button" class="tt-pick" data-qstart="${k}"><span class="tt-small">${q.items.length} câu</span><span class="t" style="font-size:1.05rem;font-weight:800">${esc(q.title)}</span><span class="tt-small">${esc(q.desc)}</span>
        <span class="tt-row"><span class="tt-badge ${p[k] != null ? "green" : ""}">${p[k] != null ? "Tốt nhất: " + p[k] + "/" + q.items.length : "Chưa làm"}</span></span></button>`).join("")}</div>
      <div class="tt-card pa-card" style="margin-top:1rem"><h4 class="pa-h">🔊 Nghe & đọc theo</h4>
        <p class="tt-small">6 âm tiết trong bài luyện của cô giáo — bấm nghe rồi đọc theo, chú ý thanh điệu.</p>
        <div class="pa-chips">${WORDS.map((w, i) => `<button type="button" class="pa-chip pa-drill-b" data-file="wd-${String(i + 1).padStart(2, "0")}">🔊 <b>${w}</b></button>`).join("")}</div></div>`;
  }
  function quizRun() {
    const q = Q[ST.quiz], n = q.items.length;
    if (ST.qdone) {
      const best = (prog().best || {})[ST.quiz];
      return `<div class="tt-card pa-card pa-end"><div class="pa-bigscore">${ST.qscore}<small>/${n}</small></div>
        <p class="tt-desc">${ST.qscore === n ? "Tuyệt vời! Bạn nghe đúng hết 🎉" : ST.qscore >= n * 0.7 ? "Khá tốt! Nghe lại những câu sai để chắc hơn." : "Chưa vững — hãy xem lại phần học và thử lại nhé."}</p>
        <p class="tt-small">Điểm cao nhất: ${best}/${n}</p>
        <div class="tt-row" style="justify-content:center"><button class="tt-btn" data-qstart="${ST.quiz}">Làm lại</button><button class="tt-btn ghost" data-qexit>Chọn bộ khác</button></div></div>`;
    }
    const [full, ans, rest, others] = q.items[ST.qi];
    if (!ST.qopts) ST.qopts = shuffle([ans, ...others]);
    const picked = ST.qpick, ok = picked === ans;
    const blank = q.kind === "ini" ? `<span class="pa-blank">${picked ? (ok ? ans : "?") : "＿"}</span>${esc(rest)}` : `${esc(rest)}<span class="pa-blank">${picked ? (ok ? ans : "?") : "＿"}</span>`;
    const shown = picked ? `<div class="pa-ans ${ok ? "ok" : "bad"}">${ok ? "✅ Chính xác!" : "❌ Chưa đúng — đáp án là <b>" + esc(ans) + "</b>"} · <b>${esc(full)}</b></div>` : "";
    return `<div class="tt-card pa-card"><div class="pa-qtop"><b>Câu ${ST.qi + 1}/${n}</b><span class="tt-small">Đúng: ${ST.qscore}</span><button class="tt-link" data-qexit>✕ Thoát</button></div>
      <div class="tt-progress"><i style="width:${ST.qi / n * 100}%"></i></div>
      <div class="pa-qword">${blank}<button type="button" class="pa-play big" data-file="${qfile(ST.quiz, ST.qi)}">🔊 Nghe</button></div>
      <div class="pa-opts">${ST.qopts.map(o => `<button type="button" class="pa-opt ${picked ? (o === ans ? "ok" : o === picked ? "bad" : "") : ""}" data-qopt="${esc(o)}" ${picked ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
      ${shown}${picked ? `<div class="tt-row" style="margin-top:.8rem"><button class="tt-btn" data-qnext>${ST.qi + 1 < n ? "Câu tiếp ▶" : "Xem kết quả"}</button></div>` : ""}</div>`;
  }

  /* ---------------- Vẽ & sự kiện ---------------- */
  function render() {
    stopAll();
    const body = { intro: tabIntro, ini: tabIni, fin: tabFin, tone: tabTone, rule: tabRule, quiz: tabQuiz }[ST.tab]();
    frame(body);
    if (ST.tab === "quiz" && ST.quiz && !ST.qdone && ST.qpick == null) setTimeout(() => { const b = root.querySelector('.pa-qword .pa-play'); b && playFile(b.dataset.file, b); }, 150);
  }
  root.addEventListener("click", e => {
    const t = e.target;
    let b;
    if ((b = t.closest("[data-pa-tab]"))) { ST.tab = b.dataset.paTab; if (ST.tab !== "quiz") ST.quiz = null; render(); return; }
    if ((b = t.closest("[data-ini]"))) { ST.ini = b.dataset.ini; render(); return; }
    if ((b = t.closest("[data-fin]"))) { ST.fin = b.dataset.fin; render(); return; }
    if ((b = t.closest("[data-file]"))) { playFile(b.dataset.file, b); return; }
    if ((b = t.closest("[data-say]"))) { say(b.dataset.say, b.classList.contains("pa-play") ? b : null); return; }
    if ((b = t.closest("[data-qstart]"))) { Object.assign(ST, { quiz: b.dataset.qstart, qi: 0, qscore: 0, qdone: false, qpick: null, qopts: null }); render(); return; }
    if (t.closest("[data-qexit]")) { ST.quiz = null; render(); return; }
    if ((b = t.closest("[data-qopt]"))) {
      const q = Q[ST.quiz]; ST.qpick = b.dataset.qopt;
      if (ST.qpick === q.items[ST.qi][1]) ST.qscore++;
      render(); return;
    }
    if (t.closest("[data-qnext]")) {
      const q = Q[ST.quiz];
      if (ST.qi + 1 < q.items.length) { ST.qi++; ST.qpick = null; ST.qopts = null; }
      else { ST.qdone = true; saveProg(p => { p.best = p.best || {}; p.best[ST.quiz] = Math.max(p.best[ST.quiz] || 0, ST.qscore); }); }
      render();
    }
  });
  // rời tab Phát âm → dừng mọi âm thanh
  document.addEventListener("click", e => { if (e.target.closest("[data-hoc-back],[data-hoc-part],[data-nav-btn],[data-go-home]")) stopAll(); });
  render();
})();
