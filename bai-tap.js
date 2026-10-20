/* =====================================================================
   BÀI TẬP CỦA LỚP — tndihoc
   ---------------------------------------------------------------------
   • Giáo viên (trang “Lớp học & phân quyền” → mở 1 lớp): giao bài tập (tiêu đề, nội dung, link, deadline,
     có thể gắn với 1 bài Hội thoại 贯通), xem ai đã nộp / chưa nộp, chữa bài và nhận xét.
   • Học viên (mục “Lớp của tôi”): danh sách bài tập + đồng hồ đếm ngược tới deadline, nộp bài bằng chữ,
     ảnh, ghi âm (ghi trực tiếp hoặc tải file lên) hoặc đính kèm bài ghi âm đã nộp ở phần Hội thoại / Khẩu ngữ.
     Nộp xong có lời khen động viên; vào web mà còn bài chưa nộp thì được nhắc nhở.
   Dữ liệu (Firestore):
     classes/{classId}/assignments/{id}            — bài tập
     classes/{classId}/assignments/{id}/subs/{uid} — bài nộp của từng học viên
   Luật Firestore cần thêm: xem file firestore-rules-bai-tap.txt.
   ===================================================================== */

const PRAISES = [
  "Bạn làm tốt lắm, hãy kiên nhẫn đợi cô giáo chữa bài nhé! 🌸",
  "Bạn chăm chỉ quá, chắc chắn sẽ sớm giỏi tiếng Trung thôi! 💪",
  "Nộp bài đúng hạn — thái độ học tập tuyệt vời! Cô sẽ chữa bài sớm cho bạn nhé. ✨",
  "加油！Mỗi bài tập là một bước tiến, bạn đang đi rất đúng hướng! 🚀",
  "Tuyệt vời! Sự chăm chỉ hôm nay là trình độ của bạn ngày mai. 🌟",
  "Hoàn thành rồi! Thưởng cho mình một tách trà rồi đợi nhận xét của cô nhé. 🍵",
  "Bạn thật kiên trì — cô giáo chắc chắn sẽ rất vui khi chấm bài này! 😊",
  "太棒了！Bài đã đến tay cô giáo, giữ vững phong độ này nhé! 🎉",
  "Từng chút một, bạn đang tiến bộ mỗi ngày. Cảm ơn bạn đã nỗ lực! 💛",
  "Nộp bài xong rồi, nhẹ cả người đúng không? Cô sẽ sớm phản hồi cho bạn! 📬",
];
const REMINDERS = [
  "Bạn còn {n} bài tập chưa nộp, làm ngay thôi! ✍️",
  "Có {n} bài tập đang chờ bạn đó — bắt đầu thôi nào! 📚",
  "Đừng để deadline đuổi kịp nhé: còn {n} bài tập chưa nộp! ⏰",
  "{n} bài tập đang đợi bạn. Làm xong là thảnh thơi ngay! 🌿",
  "Cô giáo đang chờ bài của bạn đó — còn {n} bài chưa nộp nhé! 👩‍🏫",
  "Chỉ cần 15 phút mỗi ngày — hôm nay giải quyết {n} bài tập còn lại nhé! 💪",
  "加油！Bạn còn {n} bài tập, hoàn thành để giữ phong độ nào! 🔥",
  "Nhắc nhẹ: {n} bài tập chưa nộp. Làm sớm để cô chữa sớm nhé! 😊",
  "Học đều tay mới giỏi nhanh — còn {n} bài tập đang chờ bạn! 🚀",
  "Bạn ơi, còn {n} bài tập chưa xong. Bắt tay vào làm thôi! ✨",
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const AUDIO_MAX = 700000;   // ~2 phút ghi âm (Firestore giới hạn 1 MB / tài liệu)
const DOC_MAX = 950000;

function start(api) {
  const { T, isStaff, myName, fbReady, db, D, REC, toast, errText, esc, modal, fmtClock, fmtTime, blobToDataURL,
    onState, showSubAudio, subAudioTag, mountAudios, compressImage, safeMedia } = api;
  const $ = (id) => document.getElementById(id);
  const HW = { list: null, loading: null, mine: {}, nudged: false };

  /* ---------- Thời gian / đếm ngược ---------- */
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtDue = (ms) => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())} · ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; };
  function countdown(ms) {
    const left = ms - Date.now();
    if (left <= 0) return { text: "Đã quá hạn", cls: "over" };
    const m = Math.floor(left / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return { text: `Còn ${d ? d + " ngày " : ""}${d || h ? h + " giờ " : ""}${mm} phút`, cls: left < 3600000 ? "urgent" : left < 86400000 ? "soon" : "" };
  }
  function tickCountdowns() {
    document.querySelectorAll("[data-due]").forEach(el => {
      const c = countdown(Number(el.dataset.due));
      el.textContent = "⏳ " + c.text; el.className = "hw-cd " + c.cls;
    });
  }
  setInterval(tickCountdowns, 30000);
  const dueChip = (ms) => `<span data-due="${ms}"></span>`;
  const subsCol = (cid, aid) => D().collection(db(), "classes", cid, "assignments", aid, "subs");
  const subRef = (cid, aid, uid) => D().doc(db(), "classes", cid, "assignments", aid, "subs", uid);

  /* =====================================================================
     HỌC VIÊN
     ===================================================================== */
  function loadMine(force) {
    if (!T.user || !T.myClasses.length) { HW.list = []; HW.mine = {}; return Promise.resolve(); }
    if (HW.list && !force) return Promise.resolve();
    if (!HW.loading) HW.loading = fetchMine().finally(() => { HW.loading = null; });
    return HW.loading;   // gọi cùng lúc (danh sách + lời nhắc) thì dùng chung 1 lần tải
  }
  async function fetchMine() {
    try {
      const all = [];
      for (const c of T.myClasses) {
        const snap = await D().getDocs(D().query(D().collection(db(), "classes", c.id, "assignments"), D().orderBy("dueAt", "desc"), D().limit(30)));
        snap.docs.forEach(d => all.push({ id: d.id, classId: c.id, className: c.name, ...d.data() }));
      }
      const mine = {};
      await Promise.all(all.map(async a => {
        try { const s = await D().getDoc(subRef(a.classId, a.id, T.user.uid)); if (s.exists()) mine[a.id] = s.data(); } catch (e) {}
      }));
      HW.list = all; HW.mine = mine;
    } catch (e) { console.warn("tndihoc: chưa đọc được bài tập", e); HW.list = []; HW.err = errText(e); }
  }
  const pendingOf = () => (HW.list || []).filter(a => !HW.mine[a.id] && a.dueAt > Date.now());

  async function renderStudent() {
    const box = $("mc-hw"); if (!box) return;
    if (!T.user || !T.myClasses.length) { box.innerHTML = ""; return; }
    if (!HW.list) { box.innerHTML = `<div class="tt-card hw-wrap"><h5 class="hw-title">📝 Bài tập của lớp</h5><div class="tt-empty"><span class="tt-spin"></span></div></div>`; await loadMine(); }
    const box2 = $("mc-hw"); if (!box2) return;
    const list = [...HW.list].sort((a, b) => {
      const da = !!HW.mine[a.id] || a.dueAt < Date.now(), dbb = !!HW.mine[b.id] || b.dueAt < Date.now();
      return da !== dbb ? (da ? 1 : -1) : da ? b.dueAt - a.dueAt : a.dueAt - b.dueAt;
    });
    const n = pendingOf().length;
    box2.innerHTML = `<div class="tt-card hw-wrap">
      <div class="tt-row between"><h5 class="hw-title">📝 Bài tập của lớp</h5>${n ? `<span class="tt-badge peach">${n} bài chưa nộp</span>` : list.length ? `<span class="tt-badge green">✓ Đã nộp hết</span>` : ""}</div>
      ${n ? `<div class="tt-note warn" style="margin:.5rem 0 .2rem">${esc(pick(REMINDERS).replace("{n}", n))}</div>` : ""}
      ${list.length ? `<div class="hw-list">${list.map(a => studentItem(a)).join("")}</div>` : `<div class="tt-empty">${HW.err ? esc(HW.err) : "Chưa có bài tập nào. Khi cô giao bài, bài tập sẽ hiện ở đây."}</div>`}
    </div>`;
    box2.querySelectorAll("[data-hw-open]").forEach(b => b.addEventListener("click", () => openStudent(HW.list.find(x => x.id === b.dataset.hwOpen))));
    tickCountdowns();
  }
  function studentItem(a) {
    const s = HW.mine[a.id];
    const st = s ? (s.status === "reviewed" ? `<span class="tt-badge green">✓ Cô đã chữa</span>` : `<span class="tt-badge">✓ Đã nộp · chờ chữa</span>`)
      : a.dueAt < Date.now() ? `<span class="tt-badge seal">Quá hạn · chưa nộp</span>` : `<span class="tt-badge peach">Chưa nộp</span>`;
    return `<div class="hw-item ${s ? "done" : ""}">
      <div class="tt-row between"><div><b>${esc(a.title)}</b> <span class="tt-small">· ${esc(a.className || "")}</span></div>${st}</div>
      <div class="tt-row" style="margin-top:.35rem"><span class="tt-small">Hạn nộp: <b>${fmtDue(a.dueAt)}</b></span>${s ? "" : dueChip(a.dueAt)}</div>
      ${a.vipLesson ? `<div class="tt-small" style="margin-top:.25rem">⭐ Bài hội thoại 贯通 Bài ${a.vipLesson} — nộp ở phần Hội thoại cũng được tính.</div>` : ""}
      <div class="tt-row" style="margin-top:.5rem"><button class="tt-btn ${s ? "ghost" : "peach"} sm" data-hw-open="${a.id}">${s ? "Xem bài đã nộp" : "📤 Làm & nộp bài"}</button></div></div>`;
  }

  async function myRecordings() {
    try {
      const snap = await D().getDocs(D().query(D().collection(db(), "submissions"), D().where("uid", "==", T.user.uid), D().limit(100)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => ((y.createdAt && y.createdAt.seconds) || 0) - ((x.createdAt && x.createdAt.seconds) || 0)).slice(0, 20);
    } catch (e) { return []; }
  }

  function subView(s) {
    return `${s.text ? `<div class="hw-text">${esc(s.text)}</div>` : ""}
      ${(s.images || []).length ? `<div class="hw-imgs">${s.images.map(u => `<a href="${safeMedia(u)}" target="_blank" rel="noopener"><img src="${safeMedia(u)}" alt="Ảnh bài làm"></a>`).join("")}</div>` : ""}
      ${s.audio ? subAudioTag(s.audio, "width:100%;margin-top:.4rem") : ""}
      ${(s.linked || []).map(l => `<div class="tt-sub" style="margin-top:.4rem"><div class="tt-row between"><span>🎙️ ${esc(l.title)}</span><button class="tt-link" data-listen-linked="${esc(l.id)}">▶ Nghe</button></div><div data-linked-of="${esc(l.id)}"></div></div>`).join("")}`;
  }
  function bindLinked(root) {
    mountAudios(root);
    root.querySelectorAll("[data-listen-linked]").forEach(b => b.addEventListener("click", async () => {
      const id = b.dataset.listenLinked; const target = root.querySelector(`[data-linked-of="${id}"]`);
      try { const s = await D().getDoc(D().doc(db(), "submissions", id)); showSubAudio(s.exists() ? { id, ...s.data() } : { id }, target); }
      catch (e) { target.innerHTML = `<p class="tt-small">${esc(errText(e))}</p>`; }
    }));
  }

  async function openStudent(a) {
    if (!a) return;
    const s = HW.mine[a.id];
    const info = `<div class="hw-info"><div class="tt-row between"><span class="tt-small">${esc(a.className || "")} · giao bởi ${esc(a.teacherName || "giáo viên")}</span>${s ? "" : dueChip(a.dueAt)}</div>
      ${a.desc ? `<div class="hw-text" style="margin-top:.5rem">${esc(a.desc)}</div>` : ""}
      ${a.link ? `<p style="margin-top:.4rem"><a class="tt-link" href="${safeMedia(a.link)}" target="_blank" rel="noopener">🔗 Tài liệu kèm theo</a></p>` : ""}
      <p class="tt-small" style="margin-top:.4rem">Hạn nộp: <b>${fmtDue(a.dueAt)}</b></p></div>`;
    if (s && (s.status === "reviewed" || a.dueAt < Date.now())) {
      const m = modal(info + `<h5 class="hw-sub-h">Bài đã nộp <span class="tt-small">· ${fmtTime(s.submittedAt)}${s.late ? " · nộp muộn" : ""}</span></h5>${subView(s)}
        ${s.feedback ? `<div class="tt-fb" style="margin-top:.6rem">👩‍🏫 <b>${esc(s.reviewerName || "Cô giáo")}:</b> ${esc(s.feedback)}</div>` : `<p class="tt-small" style="margin-top:.6rem">Cô giáo chưa chữa bài này — kiên nhẫn đợi nhé!</p>`}`, { title: "📝 " + esc(a.title), wide: true });
      bindLinked(m.el); tickCountdowns(); return;
    }
    const st = { text: (s && s.text) || "", images: [...((s && s.images) || [])], audio: (s && s.audio) || "", linked: [...((s && s.linked) || [])], rec: null };
    const m = modal(info + `
      ${s ? `<div class="tt-note ok" style="margin:.6rem 0">✓ Bạn đã nộp bài này lúc ${fmtTime(s.submittedAt)}. Có thể sửa và nộp lại trước hạn.</div>` : ""}
      <h5 class="hw-sub-h">✍️ Bài làm</h5>
      <textarea class="tt-textarea" id="hw-text" maxlength="5000" placeholder="Viết câu trả lời / bài làm của bạn ở đây…">${esc(st.text)}</textarea>
      <h5 class="hw-sub-h">🖼️ Ảnh (tối đa 3)</h5>
      <div class="hw-imgs" id="hw-imgs"></div>
      <label class="tt-btn ghost sm"><input type="file" id="hw-img" accept="image/*" multiple hidden> ＋ Thêm ảnh</label>
      <h5 class="hw-sub-h">🎙️ Ghi âm (tối đa ~2 phút)</h5>
      <div id="hw-aud"></div>
      <div class="tt-row"><button class="tt-btn rec sm" id="hw-rec">● Ghi âm</button><span class="tt-timer" id="hw-rec-t"></span>
        <label class="tt-btn ghost sm"><input type="file" id="hw-afile" accept="audio/*" hidden> ⬆ Tải file ghi âm từ máy</label></div>
      <h5 class="hw-sub-h">📎 Đính kèm bài ghi âm đã nộp (Hội thoại / Khẩu ngữ)</h5>
      <div id="hw-linked"><span class="tt-spin"></span></div>
      <div class="tt-row between" style="margin-top:1rem"><span class="tt-small" id="hw-size"></span><button class="tt-btn peach" id="hw-send">📤 ${s ? "Nộp lại" : "Nộp bài"}</button></div>`, { title: "📝 " + esc(a.title), wide: true, onClose: () => { if (st.rec) st.rec.cancel(); } });
    const el = m.el;
    const size = () => (st.text.length + st.images.reduce((x, u) => x + u.length, 0) + st.audio.length);
    const drawImgs = () => {
      $("hw-imgs").innerHTML = st.images.map((u, i) => `<span class="hw-img"><img src="${safeMedia(u)}" alt=""><button class="tt-x" data-rm-img="${i}" aria-label="Xoá ảnh">×</button></span>`).join("");
      $("hw-imgs").querySelectorAll("[data-rm-img]").forEach(b => b.onclick = () => { st.images.splice(Number(b.dataset.rmImg), 1); drawImgs(); });
      drawSize();
    };
    const drawAud = () => {
      $("hw-aud").innerHTML = st.audio ? `<div class="tt-row" style="margin-bottom:.4rem;flex-wrap:nowrap">${subAudioTag(st.audio, "width:100%", "flex:1;min-width:0")}<button class="tt-x" id="hw-aud-rm" aria-label="Xoá ghi âm">×</button></div>` : "";
      mountAudios($("hw-aud"));
      $("hw-aud-rm")?.addEventListener("click", () => { st.audio = ""; drawAud(); });
      drawSize();
    };
    const drawSize = () => { const k = size(); $("hw-size").textContent = k > DOC_MAX * 0.8 ? `Dung lượng ${Math.round(k / 1000)}/${DOC_MAX / 1000} KB` : ""; };
    drawImgs(); drawAud();
    $("hw-text").addEventListener("input", e => { st.text = e.target.value; });
    $("hw-img").addEventListener("change", async e => {
      for (const f of [...e.target.files].slice(0, 3 - st.images.length)) {
        try { st.images.push(await compressImage(f, 1400, 200000)); } catch (err) { toast(err.message); }
      }
      e.target.value = ""; drawImgs();
    });
    $("hw-afile").addEventListener("change", async e => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      if (!/^audio\//.test(f.type)) return toast("File này không phải file âm thanh.");
      if (f.size * 1.37 > AUDIO_MAX) return toast("File ghi âm quá dài (tối đa ~2 phút / 500 KB). Hãy ghi ngắn lại hoặc dùng nút Ghi âm.");
      st.audio = await blobToDataURL(f); drawAud();
    });
    $("hw-rec").addEventListener("click", async () => {
      const b = $("hw-rec");
      if (st.rec) { const r = await st.rec.stop(); st.rec = null; b.classList.remove("live"); b.textContent = "● Ghi lại"; $("hw-rec-t").textContent = ""; st.audio = r.dataUrl; drawAud(); return; }
      try {
        st.rec = await REC.start({ maxSec: 120, onTick: x => { const t = $("hw-rec-t"); if (t) t.textContent = "● " + fmtClock(x); },
          onAutoStop: r => { st.rec = null; const bb = $("hw-rec"); if (bb) { bb.classList.remove("live"); bb.textContent = "● Ghi lại"; } st.audio = r.dataUrl; if ($("hw-aud")) drawAud(); } });
        b.classList.add("live"); b.textContent = "■ Dừng";
      } catch (err) { toast(err.message); }
    });
    myRecordings().then(recs => {
      const box = $("hw-linked"); if (!box) return;
      box.innerHTML = recs.length ? `<div class="hw-linked">${recs.map(r => `<label class="tt-radio"><input type="checkbox" data-link="${esc(r.id)}" ${st.linked.some(l => l.id === r.id) ? "checked" : ""}> ${esc(r.taskTitle || "Bài ghi âm")} <span class="tt-small">· ${fmtTime(r.createdAt)}</span></label>`).join("")}</div>`
        : `<p class="tt-small">Bạn chưa có bài ghi âm nào ở phần Hội thoại / Khẩu ngữ.</p>`;
      box.querySelectorAll("[data-link]").forEach(c => c.addEventListener("change", () => {
        const r = recs.find(x => x.id === c.dataset.link);
        st.linked = c.checked ? [...st.linked.filter(l => l.id !== r.id), { id: r.id, title: r.taskTitle || "Bài ghi âm" }].slice(0, 5) : st.linked.filter(l => l.id !== r.id);
      }));
    });
    $("hw-send").addEventListener("click", async () => {
      st.text = $("hw-text").value.trim();
      if (st.rec) return toast("Bấm “■ Dừng” để kết thúc ghi âm trước khi nộp.");
      if (!st.text && !st.images.length && !st.audio && !st.linked.length) return toast("Bài làm đang trống — hãy viết, thêm ảnh, ghi âm hoặc đính kèm bài ghi âm nhé.");
      if (size() > DOC_MAX) return toast("Bài nộp quá lớn. Hãy bớt ảnh hoặc ghi âm ngắn hơn.");
      const b = $("hw-send"); b.disabled = true; b.innerHTML = '<span class="tt-spin"></span> Đang nộp…';
      try {
        if (!(await fbReady())) throw new Error("Không kết nối được máy chủ.");
        await saveSub(a, { text: st.text, images: st.images, audio: st.audio, linked: st.linked });
        m.close(); celebrate();
      } catch (err) { toast(errText(err)); b.disabled = false; b.textContent = "📤 Nộp bài"; }
    });
    tickCountdowns();
  }
  async function saveSub(a, data) {
    const doc = { uid: T.user.uid, name: myName(), email: T.user.email || "", text: "", images: [], audio: "", linked: [], ...data,
      late: Date.now() > a.dueAt, status: "submitted", submittedAt: D().serverTimestamp() };
    await D().setDoc(subRef(a.classId, a.id, T.user.uid), doc);
    HW.mine[a.id] = { ...doc, submittedAt: null };
    if (window.trackExerciseCompleted) window.trackExerciseCompleted();
    renderStudent();
  }
  function celebrate() {
    const m = modal(`<div class="hw-cheer"><div class="hw-cheer-emoji">${pick(["🎉", "🌟", "🏅", "💐", "🥳"])}</div><p class="hw-cheer-t">${esc(pick(PRAISES))}</p>
      <button class="tt-btn peach" data-close>Cảm ơn cô!</button></div>`, { title: "Đã nộp bài!" });
    return m;
  }

  /** Nộp ở phần Hội thoại 贯通 → tự tính là đã nộp cho bài tập gắn với bài đó */
  async function onVip(lessonNo, subId, title) {
    if (!T.user) return;
    await loadMine();
    const open = (HW.list || []).filter(a => Number(a.vipLesson) === Number(lessonNo) && (!HW.mine[a.id] || HW.mine[a.id].status !== "reviewed"));
    for (const a of open) {
      const old = HW.mine[a.id];
      const linked = [...((old && old.linked) || []).filter(l => l.id !== subId), { id: subId, title }].slice(-5);
      try { await saveSub(a, { ...(old ? { text: old.text || "", images: old.images || [], audio: old.audio || "" } : {}), linked }); } catch (e) { console.warn(e); }
    }
    if (open.length) setTimeout(() => toast("📝 Đã tính là nộp bài tập: " + open.map(a => a.title).join(", ")), 2800);
  }

  /** Vào web mà còn bài chưa nộp → nhắc 1 lần mỗi phiên */
  async function nudge() {
    if (HW.nudged || !T.user || isStaff() || !T.myClasses.length) return;
    try { if (sessionStorage.getItem("tn_hw_nudged")) { HW.nudged = true; return; } } catch (e) {}
    await loadMine();
    const n = pendingOf().length; if (!n || HW.nudged) return;
    HW.nudged = true;
    try { sessionStorage.setItem("tn_hw_nudged", "1"); } catch (e) {}
    const el = document.createElement("div");
    el.className = "hw-nudge";
    el.innerHTML = `<span class="hw-nudge-ico">📝</span><div><b>${esc(pick(REMINDERS).replace("{n}", n))}</b><div class="tt-row" style="margin-top:.45rem"><button class="tt-btn peach sm" data-go-myclass>Xem bài tập</button><button class="tt-btn ghost sm" data-nudge-x>Để sau</button></div></div>`;
    document.body.appendChild(el);
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 250); };
    el.addEventListener("click", e => { if (e.target.closest("[data-nudge-x], [data-go-myclass]")) close(); });
    setTimeout(close, 15000);
  }

  /* =====================================================================
     GIÁO VIÊN
     ===================================================================== */
  async function renderTeacher(c) {
    const box = $("cd-hw"); if (!box || !c) return;
    box.innerHTML = `<div class="tt-row between" style="margin:1.2rem 0 .5rem"><h5 style="font-weight:700">📝 Bài tập của lớp</h5><button class="tt-btn peach sm" id="hw-new">＋ Giao bài tập</button></div><div id="hw-tlist"><div class="tt-empty"><span class="tt-spin"></span></div></div>`;
    $("hw-new").onclick = () => editAssignment(c, null);
    let list = [];
    try {
      const snap = await D().getDocs(D().query(D().collection(db(), "classes", c.id, "assignments"), D().orderBy("dueAt", "desc"), D().limit(50)));
      list = snap.docs.map(d => ({ id: d.id, classId: c.id, ...d.data() }));
      await Promise.all(list.map(async a => { try { a.subCount = (await D().getDocs(subsCol(c.id, a.id))).size; } catch (e) { a.subCount = "?"; } }));
    } catch (e) { const t = $("hw-tlist"); if (t) t.innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
    const t = $("hw-tlist"); if (!t) return;
    const total = (c.studentIds || []).length;
    t.innerHTML = list.length ? `<div class="hw-list">${list.map(a => `<div class="hw-item">
        <div class="tt-row between"><div><b>${esc(a.title)}</b>${a.vipLesson ? ` <span class="tt-badge vip">贯通 Bài ${a.vipLesson}</span>` : ""}</div><span class="tt-badge ${a.subCount >= total && total ? "green" : "peach"}">${a.subCount}/${total} đã nộp</span></div>
        <div class="tt-row" style="margin-top:.35rem"><span class="tt-small">Hạn: <b>${fmtDue(a.dueAt)}</b></span>${dueChip(a.dueAt)}</div>
        <div class="tt-row" style="margin-top:.5rem"><button class="tt-btn sm" data-hw-subs="${a.id}">📥 Xem bài nộp & chữa</button><button class="tt-btn ghost sm" data-hw-edit="${a.id}">Sửa</button><button class="tt-btn danger sm" data-hw-del="${a.id}">Xoá</button></div></div>`).join("")}</div>`
      : `<div class="tt-empty">Lớp chưa có bài tập nào. Bấm “＋ Giao bài tập” để giao bài đầu tiên.</div>`;
    const find = (id) => list.find(x => x.id === id);
    t.querySelectorAll("[data-hw-subs]").forEach(b => b.onclick = () => teacherSubs(c, find(b.dataset.hwSubs)));
    t.querySelectorAll("[data-hw-edit]").forEach(b => b.onclick = () => editAssignment(c, find(b.dataset.hwEdit)));
    t.querySelectorAll("[data-hw-del]").forEach(b => b.onclick = async () => {
      const a = find(b.dataset.hwDel);
      if (!confirm(`Xoá bài tập “${a.title}” cùng toàn bộ bài nộp?`)) return;
      try {
        const subs = await D().getDocs(subsCol(c.id, a.id));
        await Promise.all(subs.docs.map(d => D().deleteDoc(d.ref)));
        await D().deleteDoc(D().doc(db(), "classes", c.id, "assignments", a.id));
        toast("Đã xoá bài tập"); renderTeacher(c);
      } catch (e) { toast(errText(e)); }
    });
    tickCountdowns();
  }

  function toLocalInput(ms) { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
  function editAssignment(c, a) {
    const def = new Date(); def.setDate(def.getDate() + 7); def.setHours(21, 0, 0, 0);
    const m = modal(`
      <label class="hw-lbl">Tiêu đề bài tập *</label><input class="tt-input" id="ha-title" maxlength="120" style="width:100%" value="${esc(a ? a.title : "")}" placeholder="VD: Bài tập Bài 3 — viết 5 câu với 几">
      <label class="hw-lbl">Nội dung / yêu cầu</label><textarea class="tt-textarea" id="ha-desc" maxlength="3000" placeholder="Mô tả yêu cầu bài tập…">${esc(a ? a.desc || "" : "")}</textarea>
      <label class="hw-lbl">Link tài liệu (không bắt buộc)</label><input class="tt-input" id="ha-link" type="url" style="width:100%" value="${esc(a ? a.link || "" : "")}" placeholder="https://…">
      <div class="tt-row" style="margin-top:.2rem">
        <div><label class="hw-lbl">Deadline *</label><input class="tt-input" id="ha-due" type="datetime-local" value="${toLocalInput(a ? a.dueAt : def.getTime())}"></div>
        <div><label class="hw-lbl">Gắn với Hội thoại 贯通 (tuỳ chọn)</label><select class="tt-select" id="ha-vip"><option value="">— Không —</option>${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}" ${a && Number(a.vipLesson) === i + 1 ? "selected" : ""}>Bài ${i + 1}</option>`).join("")}</select></div>
      </div>
      <p class="tt-small" style="margin-top:.4rem">Nếu gắn với Hội thoại 贯通, học viên ghi âm & nộp ở phần Hội thoại của bài đó sẽ tự được tính là đã nộp.</p>
      <div class="tt-row" style="justify-content:flex-end;margin-top:1rem"><button class="tt-btn peach" id="ha-save">${a ? "Lưu thay đổi" : "📌 Giao bài"}</button></div>`, { title: a ? "Sửa bài tập" : `Giao bài tập cho lớp “${esc(c.name)}”` });
    $("ha-save").onclick = async () => {
      const title = $("ha-title").value.trim(), due = new Date($("ha-due").value).getTime();
      const link = $("ha-link").value.trim();
      if (!title) return toast("Hãy nhập tiêu đề bài tập.");
      if (!due) return toast("Hãy chọn deadline.");
      if (link && !/^https?:\/\//i.test(link)) return toast("Link phải bắt đầu bằng http:// hoặc https://");
      const data = { title, desc: $("ha-desc").value.trim(), link, dueAt: due, vipLesson: Number($("ha-vip").value) || null, className: c.name };
      const b = $("ha-save"); b.disabled = true;
      try {
        if (a) await D().updateDoc(D().doc(db(), "classes", c.id, "assignments", a.id), { ...data, updatedAt: D().serverTimestamp() });
        else await D().addDoc(D().collection(db(), "classes", c.id, "assignments"), { ...data, teacherName: myName(), createdBy: T.user.uid, createdAt: D().serverTimestamp() });
        m.close(); toast(a ? "Đã lưu bài tập" : "✅ Đã giao bài tập cho lớp"); renderTeacher(c);
      } catch (e) { toast(errText(e)); b.disabled = false; }
    };
  }

  async function teacherSubs(c, a) {
    const m = modal(`<div id="hs-body"><div class="tt-empty"><span class="tt-spin"></span></div></div>`, { title: "📥 " + esc(a.title), wide: true });
    let subs = {};
    try { (await D().getDocs(subsCol(c.id, a.id))).docs.forEach(d => { subs[d.id] = d.data(); }); }
    catch (e) { $("hs-body").innerHTML = `<div class="tt-note err">${esc(errText(e))}</div>`; return; }
    const students = c.students || {};
    const ids = [...new Set([...(c.studentIds || []), ...Object.keys(subs)])];
    const draw = () => {
      const done = ids.filter(u => subs[u]).length;
      $("hs-body").innerHTML = `<p class="tt-small" style="margin-bottom:.6rem">Hạn nộp ${fmtDue(a.dueAt)} · <b>${done}/${ids.length}</b> học viên đã nộp</p>
        <div class="tt-table-wrap"><table class="tt-table"><thead><tr><th>#</th><th>Học viên</th><th>Trạng thái</th><th></th></tr></thead><tbody>
        ${ids.map((u, i) => { const s = subs[u]; const who = (students[u] || {}).name || (s && s.name) || "—";
          return `<tr><td>${i + 1}</td><td>${esc(who)}<div class="tt-small">${esc((students[u] || {}).email || (s && s.email) || "")}</div></td>
            <td>${s ? `${s.status === "reviewed" ? '<span class="tt-badge green">đã chữa</span>' : '<span class="tt-badge peach">chờ chữa</span>'} <span class="tt-small">${fmtTime(s.submittedAt)}${s.late ? " · muộn" : ""}</span>` : '<span class="tt-badge seal">chưa nộp</span>'}</td>
            <td style="text-align:right">${s ? `<button class="tt-btn ghost sm" data-hs="${u}">Xem & chữa</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>
        <div id="hs-one"></div>`;
      $("hs-body").querySelectorAll("[data-hs]").forEach(b => b.onclick = () => one(b.dataset.hs));
    };
    const one = (u) => {
      const s = subs[u]; const box = $("hs-one");
      box.innerHTML = `<div class="tt-card" style="margin-top:1rem"><h5 style="font-weight:700;margin-bottom:.5rem">${esc((students[u] || {}).name || s.name || "")} <span class="tt-small">· ${fmtTime(s.submittedAt)}${s.late ? " · nộp muộn" : ""}</span></h5>
        ${subView(s)}
        <label class="hw-lbl">Nhận xét / chữa bài</label><textarea class="tt-textarea" id="hs-fb" maxlength="3000" placeholder="VD: Câu 2 dùng 几 rất đúng! Câu 4 nên đổi 多少 thành 几 vì số nhỏ hơn 10…">${esc(s.feedback || "")}</textarea>
        <div class="tt-row" style="justify-content:flex-end;margin-top:.5rem"><button class="tt-btn peach" id="hs-save">💾 Lưu nhận xét</button></div></div>`;
      bindLinked(box);
      box.scrollIntoView({ behavior: "smooth", block: "start" });
      $("hs-save").onclick = async () => {
        const patch = { feedback: $("hs-fb").value.trim(), status: "reviewed", reviewerName: myName(), reviewedAt: D().serverTimestamp() };
        try { await D().updateDoc(subRef(c.id, a.id, u), patch); subs[u] = { ...s, ...patch }; toast("✅ Đã lưu nhận xét"); draw(); } catch (e) { toast(errText(e)); }
      };
    };
    draw();
  }

  /* ---------- Kết nối với tinh-nang-moi.js ---------- */
  window.tnHomework = { student: renderStudent, teacher: renderTeacher, onVip };
  onState(() => { HW.list = null; HW.err = ""; renderStudent(); nudge(); });
  renderStudent(); nudge();
}

if (window.tnApi) start(window.tnApi);
else document.addEventListener("tn-api-ready", () => start(window.tnApi), { once: true });
