/* =====================================================================
   TẠO PDF LUYỆN VIẾT CHỮ HÁN (字帖) NGAY TRÊN TRÌNH DUYỆT
   ---------------------------------------------------------------------
   window.tnWritingPdf(words, opt) → Promise<Blob>
     words : mảng từ vựng [{hanzi, pinyin, mean, …}] (lấy từ dữ liệu 贯通中文 đã tải)
     opt   : { title, sub, cell (mm, mặc định 15), onProgress(done,total) }
   Mỗi chữ Hán (không lặp) = 1 khối 3 dòng ô 田字格:
     dòng 1: thứ tự các nét — mỗi ô thêm 1 nét (nét mới đậm, nét cũ xám), ô còn lại để chữ mờ tập tô
     dòng 2 và 3: để trống cho học sinh tự viết; chỗ trống còn lại cuối trang được kẻ thêm ô để luyện thêm
   Đen – trắng, chân trang có dòng chìm “tndihoc”.
   Dữ liệu nét chữ: gói mã nguồn mở hanzi-writer-data (Make Me a Hanzi), tải từng chữ từ CDN khi cần.
   File PDF được ghép trực tiếp từ ảnh các trang (không cần thư viện ngoài).
   ===================================================================== */
(function () {
  const STROKE_SRC = [
    c => "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/" + encodeURIComponent(c) + ".json",
    c => "https://fastly.jsdelivr.net/npm/hanzi-writer-data@2.0.1/" + encodeURIComponent(c) + ".json",
    c => "https://unpkg.com/hanzi-writer-data@2.0.1/" + encodeURIComponent(c) + ".json",
  ];
  const cache = new Map();   // chữ → {strokes:[path]} | null (không có dữ liệu)
  async function getChar(c) {
    if (cache.has(c)) return cache.get(c);
    let data = null;
    for (const src of STROKE_SRC) {
      try {
        const r = await fetch(src(c));
        if (r.ok) { data = await r.json(); break; }
        if (r.status === 404) break;          // CDN không có chữ này
      } catch (e) { /* thử CDN kế tiếp */ }
    }
    cache.set(c, data);
    return data;
  }

  /* ---- gom chữ Hán không lặp, nhớ từ đầu tiên chứa chữ đó ---- */
  function collectChars(words) {
    const seen = new Map();
    (words || []).forEach(w => {
      const hz = String(w.hanzi || "").split("/")[0];
      for (const ch of hz) {
        if (/[㐀-鿿]/.test(ch) && !seen.has(ch)) seen.set(ch, { ch, word: hz, pinyin: w.pinyin || "", mean: w.mean || "" });
      }
    });
    return [...seen.values()];
  }

  /* ---- vẽ ---- */
  const PX = 200 / 25.4;                 // 200 dpi
  const PW = 210, PH = 297;              // A4 (mm)
  const FONT_CN = '"KaiTi","STKaiti","Kaiti SC","楷体","SimSun","Noto Serif CJK SC","Noto Sans CJK SC",serif';
  const FONT_VN = '"Times New Roman","Noto Serif","Noto Sans",serif';

  function drawCell(ctx, x, y, s) {
    ctx.save();
    ctx.strokeStyle = "#B5B5B5"; ctx.lineWidth = 0.18 * PX; ctx.setLineDash([1.2 * PX, 1.2 * PX]);
    ctx.beginPath();
    ctx.moveTo(x + s / 2, y); ctx.lineTo(x + s / 2, y + s);
    ctx.moveTo(x, y + s / 2); ctx.lineTo(x + s, y + s / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#222"; ctx.lineWidth = 0.35 * PX;
    ctx.strokeRect(x, y, s, s);
    ctx.restore();
  }
  // vẽ các nét [from, to) vào ô, màu fill
  function drawStrokes(ctx, paths, from, to, x, y, s, fill) {
    const pad = s * 0.07, sz = s - pad * 2;
    ctx.save();
    ctx.translate(x + pad, y + pad);
    ctx.scale(sz / 1024, sz / 1024);
    ctx.transform(1, 0, 0, -1, 0, 900);   // hệ toạ độ của hanzi-writer-data
    ctx.fillStyle = fill;
    for (let i = from; i < to; i++) ctx.fill(new Path2D(paths[i]));
    ctx.restore();
  }
  function fitText(ctx, text, maxW, size, font, weight) {
    let sz = size;
    ctx.font = (weight || "") + " " + sz + "px " + font;
    while (ctx.measureText(text).width > maxW && sz > size * 0.55) { sz -= 1; ctx.font = (weight || "") + " " + sz + "px " + font; }
    return text;
  }

  function newPage(title, sub, pageNo, pageTotal) {
    const cv = document.createElement("canvas");
    cv.width = Math.round(PW * PX); cv.height = Math.round(PH * PX);
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.textBaseline = "alphabetic";
    // đầu trang
    ctx.fillStyle = "#222"; ctx.textAlign = "left";
    ctx.font = "bold " + 4.6 * PX + "px " + FONT_VN; ctx.fillText(title, 15 * PX, 14 * PX);
    ctx.fillStyle = "#666"; ctx.font = 3.3 * PX + "px " + FONT_VN; ctx.textAlign = "right"; ctx.fillText(sub, (PW - 15) * PX, 14 * PX);
    ctx.strokeStyle = "#999"; ctx.lineWidth = 0.25 * PX; ctx.beginPath(); ctx.moveTo(15 * PX, 17 * PX); ctx.lineTo((PW - 15) * PX, 17 * PX); ctx.stroke();
    // chân trang: dòng chìm “tndihoc” + số trang
    ctx.textAlign = "center"; ctx.fillStyle = "#D2D2D2"; ctx.font = "italic bold " + 6 * PX + "px " + FONT_VN;
    ctx.fillText("tndihoc", (PW / 2) * PX, 289 * PX);
    ctx.textAlign = "right"; ctx.fillStyle = "#AAA"; ctx.font = 3 * PX + "px " + FONT_VN;
    ctx.fillText(pageNo + " / " + pageTotal, (PW - 15) * PX, 289 * PX);
    return { cv, ctx };
  }

  async function drawBlock(ctx, item, data, x, y, cell, cols) {
    const s = cell * PX;
    // nhãn
    ctx.textAlign = "left"; ctx.fillStyle = "#111";
    ctx.font = "bold " + 5.2 * PX + "px " + FONT_CN; ctx.fillText(item.ch, x, y + 5 * PX);
    const label = (item.pinyin ? item.pinyin + " · " : "") + item.mean + (item.word !== item.ch ? "   (" + item.word + ")" : "");
    ctx.fillStyle = "#555"; fitText(ctx, label, (cols * cell - 9) * PX, 3.4 * PX, FONT_VN);
    ctx.fillText(label, x + 8 * PX, y + 4.7 * PX);
    const y1 = y + 6.5 * PX;
    for (let c = 0; c < cols; c++) for (let r = 0; r < 3; r++) drawCell(ctx, x + c * s, y1 + r * s, s);   // dòng 1: thứ tự nét · dòng 2–3: để trống
    const paths = data && data.strokes;
    if (!paths || !paths.length) {          // không có dữ liệu nét: chữ mờ để tập tô
      ctx.fillStyle = "#CFCFCF"; ctx.textAlign = "center"; ctx.font = s * 0.74 + "px " + FONT_CN;
      for (let c = 0; c < cols; c++) ctx.fillText(item.ch, x + c * s + s / 2, y1 + s * 0.78);
      return false;
    }
    const n = paths.length, g = n <= cols ? 1 : Math.ceil(n / cols), m = Math.ceil(n / g);
    for (let c = 0; c < cols; c++) {
      const cx = x + c * s;
      if (c < m) {
        const upto = Math.min(n, (c + 1) * g), from = c * g;
        if (from > 0) drawStrokes(ctx, paths, 0, from, cx, y1, s, "#9A9A9A");
        drawStrokes(ctx, paths, from, upto, cx, y1, s, "#111");
        ctx.fillStyle = "#777"; ctx.textAlign = "left"; ctx.font = s * 0.15 + "px " + FONT_VN;
        ctx.fillText(g === 1 ? String(upto) : (from + 1) + "–" + upto, cx + s * 0.07, y1 + s * 0.2);
      } else {
        drawStrokes(ctx, paths, 0, n, cx, y1, s, "#D6D6D6");   // chữ mờ tập tô
      }
    }
    return true;
  }

  /* ---- ghép PDF từ các ảnh JPEG ---- */
  function b64ToBytes(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function buildPdf(jpegs, wPx, hPx) {
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0;
    const push = (d) => { const u = typeof d === "string" ? enc.encode(d) : d; parts.push(u); len += u.length; };
    const obj = (id, fn) => { offs[id] = len; push(id + " 0 obj\n"); fn(); push("\nendobj\n"); };
    const N = jpegs.length, W = 595.28, H = 841.89;
    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => push("<< /Type /Pages /Count " + N + " /Kids [" + jpegs.map((_, i) => (3 + i * 3) + " 0 R").join(" ") + "] >>"));
    jpegs.forEach((jb, i) => {
      const p = 3 + i * 3;
      obj(p, () => push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /XObject << /Im0 " + (p + 2) + " 0 R >> >> /Contents " + (p + 1) + " 0 R >>"));
      const cs = "q " + W + " 0 0 " + H + " 0 0 cm /Im0 Do Q";
      obj(p + 1, () => push("<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream"));
      obj(p + 2, () => { push("<< /Type /XObject /Subtype /Image /Width " + wPx + " /Height " + hPx + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jb.length + " >>\nstream\n"); push(jb); push("\nendstream"); });
    });
    const xref = len, total = 3 + N * 3;
    let x = "xref\n0 " + total + "\n0000000000 65535 f \n";
    for (let i = 1; i < total; i++) x += String(offs[i]).padStart(10, "0") + " 00000 n \n";
    push(x + "trailer\n<< /Size " + total + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
    return new Blob(parts, { type: "application/pdf" });
  }

  /* ---- hàm chính ---- */
  window.tnWritingPdf = async function (words, opt) {
    opt = opt || {};
    const items = collectChars(words);
    if (!items.length) throw new Error("Không có chữ Hán nào để tạo bài tập.");
    const cell = opt.cell || 15, cols = Math.max(8, Math.floor(180 / cell));
    const blockH = 6.5 + cell * 3 + 4.5, top = 22, bottom = 280;
    const perPage = Math.max(1, Math.floor((bottom - top) / blockH));
    const pageTotal = Math.ceil(items.length / perPage);
    const total = items.length;
    let done = 0;
    const report = () => opt.onProgress && opt.onProgress(done, total);
    report();
    // tải dữ liệu nét (8 chữ cùng lúc)
    const datas = new Array(total);
    let next = 0;
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (next < total) { const i = next++; datas[i] = await getChar(items[i].ch); done++; report(); }
    }));
    const jpegs = []; let missing = [];
    for (let p = 0; p < pageTotal; p++) {
      const { cv, ctx } = newPage(opt.title || "Luyện viết chữ Hán", (opt.sub || "") + (opt.sub ? " · " : "") + items.length + " chữ", p + 1, pageTotal);
      for (let k = 0; k < perPage; k++) {
        const i = p * perPage + k; if (i >= total) break;
        const ok = await drawBlock(ctx, items[i], datas[i], (PW - cols * cell) / 2 * PX, (top + k * blockH) * PX, cell, cols);
        if (!ok) missing.push(items[i].ch);
      }
      // còn chỗ trống phía dưới → kẻ thêm ô trắng để học sinh luyện viết thêm
      const used = Math.min(perPage, total - p * perPage);
      let fy = top + used * blockH;
      while (fy + cell <= 283) {
        for (let c = 0; c < cols; c++) drawCell(ctx, (PW - cols * cell) / 2 * PX + c * cell * PX, fy * PX, cell * PX);
        fy += cell;
      }
      jpegs.push(b64ToBytes(cv.toDataURL("image/jpeg", 0.88).split(",")[1]));
      await new Promise(r => setTimeout(r, 0));   // nhường trình duyệt vẽ lại
    }
    const blob = buildPdf(jpegs, Math.round(PW * PX), Math.round(PH * PX));
    blob.tnMissing = missing; blob.tnPages = pageTotal; blob.tnChars = total;
    return blob;
  };

  window.tnDownloadBlob = function (blob, name) {
    const a = document.createElement("a"), url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  };
})();
