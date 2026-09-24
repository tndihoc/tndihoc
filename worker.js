// =============================================================
//  Máy chủ Trợ lý AI cho web tndihoc (chạy trên Cloudflare Workers)
//  - Giữ bí mật khoá Gemini API (khoá KHÔNG nằm trong file web).
//  - Chỉ nhận yêu cầu từ web tndihoc.github.io.
//  Cô chỉ cần copy TOÀN BỘ file này dán vào Cloudflare, không cần sửa gì.
// =============================================================

// Các trang web được phép gọi trợ lý AI
const ALLOWED_ORIGINS = [
  'https://tndihoc.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

// Thử lần lượt các model; nếu model đầu lỗi/hết lượt thì thử model sau
const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];

const SYSTEM_PROMPT = `Bạn là "Trợ lý AI" của trang web học tiếng Trung tndihoc do cô giáo Thuý Ngô xây dựng.
Người dùng là học viên người Việt đang học tiếng Trung (HSK 1–6) và quan tâm đến du học Trung Quốc.
Quy tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, thân thiện.
- Khi đưa ra chữ Hán, kèm pinyin có dấu thanh và nghĩa tiếng Việt. Đặt chữ Hán trong dấu \`backtick\`, ví dụ: \`学习\` (xuéxí) – học tập.
- Giải thích ngữ pháp theo cấu trúc: công thức → cách dùng → 2–3 câu ví dụ (chữ Hán, pinyin, nghĩa).
- Có thể dùng **in đậm** để nhấn mạnh. Không dùng bảng, không dùng tiêu đề markdown (#).
- Nếu câu hỏi không liên quan đến tiếng Trung, văn hoá Trung Quốc hoặc du học, hãy lịch sự hướng người học quay lại chủ đề học tập.
- Nếu không chắc chắn, hãy nói rõ là không chắc, không bịa thông tin (đặc biệt về học bổng, hạn nộp hồ sơ).`;

const MAX_TURNS = 24;          // tối đa số tin nhắn gửi kèm
const MAX_CHARS_PER_MSG = 2000; // tối đa độ dài mỗi tin nhắn

function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + ':'));
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method === 'GET') {
      return json({ ok: true, message: 'Máy chủ trợ lý AI tndihoc đang chạy.' }, 200, origin);
    }
    if (request.method !== 'POST') {
      return json({ error: 'phương thức không được hỗ trợ.' }, 405, origin);
    }

    const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + ':'));
    if (!allowed) {
      return json({ error: 'yêu cầu không đến từ web tndihoc.' }, 403, origin);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: 'máy chủ chưa có khoá GEMINI_API_KEY. vui lòng báo quản trị viên.' }, 500, origin);
    }

    let body;
    try { body = await request.json(); } catch (e) {
      return json({ error: 'dữ liệu gửi lên không hợp lệ.' }, 400, origin);
    }
    const history = Array.isArray(body && body.history) ? body.history : [];
    const contents = history
      .filter(m => m && typeof m.text === 'string' && m.text.trim())
      .slice(-MAX_TURNS)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text.slice(0, MAX_CHARS_PER_MSG) }],
      }));
    // Gemini yêu cầu tin nhắn đầu tiên phải là của người dùng
    while (contents.length && contents[0].role !== 'user') contents.shift();
    if (!contents.length) {
      return json({ error: 'bạn chưa nhập câu hỏi.' }, 400, origin);
    }

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
    };

    let lastError = 'trợ lý AI đang bận, vui lòng thử lại sau ít phút.';
    for (const model of MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const reply = parts.map(p => p.text || '').join('').trim();
          if (reply) return json({ reply }, 200, origin);
          lastError = 'trợ lý AI không trả lời được câu này, bạn thử hỏi cách khác nhé.';
          continue;
        }
        const msg = (data?.error?.message || '').toLowerCase();
        if (msg.includes('location')) {
          lastError = 'máy chủ AI đang đặt ở khu vực Google chưa hỗ trợ. quản trị viên cần bật "Smart Placement" cho Worker.';
        } else if (res.status === 429) {
          lastError = 'trợ lý AI đã hết lượt dùng miễn phí trong lúc này, vui lòng thử lại sau.';
        } else if (res.status === 400 && msg.includes('api key')) {
          return json({ error: 'khoá Gemini API không đúng. vui lòng báo quản trị viên.' }, 500, origin);
        }
        // lỗi khác (model không tồn tại, quá tải...) -> thử model tiếp theo
      } catch (e) {
        // lỗi mạng -> thử model tiếp theo
      }
    }
    return json({ error: lastError }, 502, origin);
  },
};
