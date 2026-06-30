// Builders for the command string sent to Claude (via /api/chat). They keep the
// skill's `/command` semantics but append constraints so the UI gets exactly
// what it needs (JSON for quiz/flashcard, trimmed essay, no trailing tips).

import { TOPIC_POOL } from "./topicPool";

const NO_SUGGEST =
  "Không thêm phần gợi ý lệnh khác (ví dụ /quiz, /check, /flash) ở cuối câu trả lời.";

// Bộ icon CỐ ĐỊNH cho Grammar — chỉ dùng đúng 6 icon này, cấm emoji khác.
const GRAMMAR_FORMAT = [
  `QUY TẮC TRÌNH BÀY — CHỈ được dùng ĐÚNG 7 icon sau, TUYỆT ĐỐI không dùng emoji/icon nào khác:`,
  `• ✨ đặt ngay đầu TIÊU ĐỀ BÀI (heading lớn nhất, tên thì/cấu trúc).`,
  `• 🔹 đặt đầu MỖI tiêu đề mục: Định nghĩa, Cách dùng phổ biến, Công thức/Cấu trúc, Dấu hiệu nhận biết, Ví dụ.`,
  `• ⚠️ đặt đầu tiêu đề mục "Lỗi thường gặp".`,
  `• 💡 đặt đầu dòng ghi chú MẸO / điểm mấu chốt.`,
  `• 📍 đặt đầu dòng ghi chú LƯU Ý / ngoại lệ.`,
  `• ✓ đặt ngay trước nhãn "Đúng:" trong mục Lỗi (chỉ dùng ở đây).`,
  `• ⋆ nhỏ hơn đặt ngay trước mỗi ý lớn của phần "ví dụ" và "lỗi thường gặp"`,
  `các mục "Định nghĩa" "Công thức/cấu trúc","Cách dùng phổ biến","Dấu hiệu nhận biết" "ví dụ" và "lỗi thường gặp" là subtitle cần có text nổi bật hơn`,
  `Thêm gạch ngang phân cách giữa các session`,
  `line-height = 1.25`,
  `Cách một dòng giữa các mục với dấu gạch ngang phân cách`,
  `Các keyword nên được bold lên`,
  `Vẫn dùng bảng,luôn phải có **in đậm**, \`code\` để minh hoạ tăng tính sinh động (đừng thay chúng bằng emoji). KHÔNG gắn icon vào các ô bảng hay vào từng câu ví dụ.`,
  `Mục Ví dụ: tiêu đề ghi "## 🔹 Ví dụ" (KHÔNG ghi "có dịch tiếng Việt"). Mỗi ví dụ gồm 2 DÒNG: dòng 1 câu tiếng Anh **in đậm**, dòng 2 bản dịch tiếng Việt *in nghiêng*; các ví dụ cách nhau một dòng trống.`,
  `Mục Lỗi: tiêu đề "## ⚠️ Lỗi thường gặp". Mỗi lỗi: "**Lỗi N: ...**" rồi 3 DÒNG riêng — "Sai: " + câu sai **in đậm**; "✓ Đúng: " + câu đúng **in đậm**; "Vì sao: " + giải thích *in nghiêng*.`,
].join("\n");

export type QuizType = "mcq" | "fill" | "mixed";

export function quizCommand(opts: {
  topic: string;
  level: number;
  count: number;
  type: QuizType;
  fresh?: boolean;
}): string {
  const typeLabel =
    opts.type === "mcq"
      ? "tất cả là trắc nghiệm (mcq)"
      : opts.type === "fill"
        ? "tất cả là điền từ (fill)"
        : "trộn cả mcq lẫn fill";
  const schema =
    '{"questions":[{"type":"mcq","q":"câu hỏi","options":["A","B","C","D"],"correct":0,"explain":"giải thích tiếng Việt"},{"type":"fill","q":"câu có ___ cho chỗ trống","correct":"đáp án","explain":"giải thích tiếng Việt"}]}';
  const lines = [
    `/quiz ${opts.topic} ${opts.level}`,
    "",
    `Yêu cầu: tạo ĐÚNG ${opts.count} câu hỏi, ${typeLabel}.`,
    `CHỈ trả về một JSON object hợp lệ theo schema sau — KHÔNG markdown, KHÔNG văn bản ngoài JSON:`,
    schema,
    `Quy tắc: mcq có đúng 4 "options" và "correct" là index 0-3; mỗi option CHỈ chứa nội dung đáp án, KHÔNG thêm tiền tố "A.", "B.", "1." hay gạch đầu dòng. fill dùng "___" cho chỗ trống và "correct" là 1-3 từ. "explain" ngắn gọn bằng tiếng Việt.`,
  ];
  if (opts.fresh) {
    lines.push(
      `Đây là lần tạo mới: tạo bộ câu hỏi KHÁC các lần trước — đổi ví dụ, ngữ cảnh, từ vựng và thứ tự.`
    );
  }
  return lines.join("\n");
}

const LEVEL_HINT = [
  "",
  "level 1/5 — rất cơ bản, từ thông dụng A1-A2.",
  "level 2/5 — cơ bản, A2-B1.",
  "level 3/5 — trung cấp, B1-B2.",
  "level 4/5 — nâng cao, B2-C1, ít phổ biến hơn.",
  "level 5/5 — học thuật/C1-C2, từ khó, collocation tinh tế.",
];

export function flashCommand(
  topic: string,
  level = 3,
  count = 10,
  avoid: string[] = []
): string {
  const schema =
    '{"cards":[{"word":"từ/cụm từ","ipa":"phiên âm (tuỳ chọn)","meaning":"nghĩa tiếng Việt tự nhiên","example":"câu ví dụ tiếng Anh","note":"vì sao hợp level, tiếng Việt"}]}';
  const lines = [
    `/flash ${topic}`,
    "",
    `Độ khó: ${LEVEL_HINT[level] ?? LEVEL_HINT[3]} Chọn từ vựng đúng độ khó này.`,
    `CHỈ trả về một JSON object hợp lệ — KHÔNG markdown, KHÔNG văn bản ngoài JSON:`,
    schema,
    `Tạo ĐÚNG ${count} thẻ.`,
  ];
  if (avoid.length) {
    lines.push(
      `QUAN TRỌNG: đây là lần tạo mới — phải ra bộ từ KHÁC hoàn toàn. TUYỆT ĐỐI không dùng lại các từ sau: ${avoid.join(", ")}. Ưu tiên từ/cụm ít phổ biến hơn, đa dạng hơn.`
    );
  }
  return lines.join("\n");
}

// Số từ tối thiểu cho essay theo độ khó 1→5.
const ESSAY_MIN_WORDS: Record<number, number> = { 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 };

export function essayCommand(topic: string, level: number): string {
  const minWords = ESSAY_MIN_WORDS[level] ?? 300;
  const schema =
    '{"essay":"toàn bộ bài essay (có thể nhiều đoạn, ngăn cách bằng \\n\\n)","vocab":[{"word":"MỘT từ đơn tiếng Anh","pos":"loại từ: noun/verb/adjective/adverb…","ipa":"phiên âm /.../","meaning":"nghĩa tiếng Việt tự nhiên","example":"câu ví dụ tiếng Anh dùng từ này"}],"families":[{"root":"từ gốc","members":[{"word":"dạng từ","pos":"noun/verb/adjective/adverb","meaning":"nghĩa tiếng Việt"}]}]}';
  return [
    `/essay ${topic} ${level}`,
    "",
    `Viết essay TỐI THIỂU ${minWords} từ. Văn phong TỰ NHIÊN như người thật viết: có giọng cá nhân, ví dụ/chi tiết cụ thể, chuyển ý mượt mà; TRÁNH lối viết máy móc, sáo rỗng, lặp khuôn mẫu hay liệt kê cứng nhắc kiểu AI.`,
    `CHỈ trả về một JSON object hợp lệ — KHÔNG markdown, KHÔNG văn bản ngoài JSON:`,
    schema,
    `"vocab": 8-12 TỪ ĐƠN quan trọng XUẤT HIỆN trong bài — mỗi mục PHẢI là MỘT từ duy nhất (TUYỆT ĐỐI không cụm từ, từ ghép nhiều chữ, hay phrasal verb), KHÔNG trùng lặp; kèm "pos" (loại từ), "ipa", "meaning" (tiếng Việt), "example".`,
    `"families": với những từ trong "vocab" CÓ họ từ rõ ràng (≥2 dạng khác loại từ: danh/động/tính/trạng), thêm 1 family gồm "root" + "members" (mỗi member: từ đơn + "pos" + "meaning"). Mỗi member cũng là TỪ ĐƠN. Chỉ thêm họ từ CÓ THẬT; từ nào không có họ thì bỏ qua. Nếu không có family nào thì để "families": [].`,
    `KHÔNG kèm structure, comprehension questions, hay writing prompt.`,
  ].join("\n");
}

const EXAM_SCHEMA =
  '{"title":"Tên đề","sections":[{"instruction":"hướng dẫn dạng bài","passage":"văn bản/đoạn đề bài nếu có (markdown), bỏ trống nếu không cần","questions":[{"q":"câu hỏi","options":["A","B","C","D"],"correct":0,"explain":"giải thích tiếng Việt ngắn"}]}]}';

// Vài chủ đề ngẫu nhiên để đa dạng hoá ngữ cảnh các đề (tránh lặp nội dung).
function sampleTopics(n: number): string {
  const a = [...TOPIC_POOL];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n).join(", ");
}

export type ExamDifficulty = 1 | 2 | 3;

const EXAM_DIFFICULTY: Record<ExamDifficulty, { label: string; hint: string }> = {
  1: { label: "Dễ", hint: "từ vựng & cấu trúc cơ bản (A2–B1); ~55% nhận biết, 30% thông hiểu, 15% vận dụng" },
  2: { label: "Trung bình", hint: "trình độ B1–B2; ~40% nhận biết, 30% thông hiểu, 30% vận dụng" },
  3: { label: "Khó", hint: "trình độ B2–C1, từ vựng học thuật, nhiều câu suy luận; ~20% nhận biết, 35% thông hiểu, 45% vận dụng" },
};

// Đề thi thử: GIỮ cấu trúc đề tốt nghiệp THPT 2025 nhưng nội dung/chủ đề được random
// hoá mỗi lần + chọn được độ khó (một loại đề duy nhất, không tách THPT vs tổng hợp).
export function examCommand(size: 20 | 40, difficulty: ExamDifficulty = 2): string {
  const full = size === 40;
  const cloze = full ? 8 : 4; // 1) hoàn thành thông báo/quảng cáo (có passage)
  const grammar = full ? 10 : 5; // 2) ngữ pháp & từ vựng ĐỘC LẬP (không passage)
  const arrange = full ? 4 : 2; // 3) sắp xếp câu — mỗi câu tự chứa mệnh đề
  const missing = full ? 6 : 3; // 4) điền câu thiếu (có passage)
  const reading = full ? 12 : 6; // 5) đọc hiểu (có passage)
  const total = cloze + grammar + arrange + missing + reading;
  const diff = EXAM_DIFFICULTY[difficulty] ?? EXAM_DIFFICULTY[2];
  return [
    `Tạo một đề thi thử môn Tiếng Anh dựa trên cấu trúc đề tốt nghiệp THPT 2025 (GDPT 2018). Toàn bộ là câu hỏi trắc nghiệm 4 đáp án A/B/C/D.`,
    `BẮT BUỘC: tổng số câu hỏi (đếm tất cả "questions" trong mọi "sections") phải CHÍNH XÁC bằng ${total} — không thiếu, không thừa.`,
    `Gồm ${total} câu, chia thành ĐÚNG 5 "sections" theo thứ tự:`,
    `1) Hoàn thành nội dung (quảng cáo/thông báo/tờ rơi hoặc đoạn văn có chỗ trống đánh số) — đặt văn bản vào "passage", ${cloze} câu, mỗi câu ứng một chỗ trống.`,
    `2) ${grammar} câu NGỮ PHÁP & TỪ VỰNG ĐỘC LẬP — mỗi câu là MỘT câu/mệnh đề hoàn chỉnh có 1 chỗ trống, KHÔNG liên quan nhau, KHÔNG dùng "passage"; đa dạng điểm ngữ pháp (thì, mệnh đề, giới từ, liên từ, collocation, từ đồng/trái nghĩa…).`,
    `3) Sắp xếp câu thành đoạn hội thoại/đoạn văn — ${arrange} câu, MỖI CÂU LÀ MỘT BÀI ĐỘC LẬP & TỰ CHỨA: đặt 4-5 mệnh đề a) b) c)… NGAY TRONG "q" (mỗi mệnh đề một dòng, ngăn bằng \\n), KHÔNG dùng "passage" chung; "options" là các thứ tự, ví dụ "b-a-c-e-d". TUYỆT ĐỐI không tách một bộ mệnh đề ra thành nhiều câu hỏi.`,
    `4) Hoàn thành đoạn văn bằng các câu/đoạn còn thiếu — đặt đoạn (có chỗ trống đánh số) vào "passage", ${missing} câu.`,
    `5) Đọc hiểu — 1-2 bài đọc (đặt văn bản vào "passage"), tổng ${reading} câu (ý chính, chi tiết, suy luận, từ vựng trong ngữ cảnh).`,
    `Độ khó: ${diff.label} — ${diff.hint}.`,
    `RANDOM HOÁ mỗi đề: đa dạng chủ đề/ngữ cảnh (tránh trùng lặp giữa các lần) — xoay quanh những chủ đề như: ${sampleTopics(6)}.`,
    `MỖI câu hỏi PHẢI có nghĩa và tự đứng được; không tạo câu rỗng/vô nghĩa để cho đủ số.`,
    `CHỈ trả về một JSON object hợp lệ theo schema sau — KHÔNG markdown, KHÔNG văn bản ngoài JSON:`,
    EXAM_SCHEMA,
    `Mỗi câu hỏi đúng 4 "options" (chỉ nội dung, không tiền tố "A."/"B."), "correct" là index 0-3, "explain" tiếng Việt ngắn gọn.`,
  ].join("\n");
}

// Bài học grammar tĩnh — bọc aiKeywords + level vào prompt cho grammar-explainer.
export function grammarLessonCommand(l: {
  titleEn: string;
  level: string;
  aiKeywords: string[];
}): string {
  return [
    `/grammar ${l.titleEn}`,
    ``,
    `Trình độ ${l.level}. Tập trung vào: ${l.aiKeywords.join(", ")}.`,
    `Trình bày 4 mục: (1) định nghĩa ngắn, (2) công thức/cấu trúc, (3) "## Ví dụ" (3-5 ví dụ), (4) "## Lỗi thường gặp".`,
    GRAMMAR_FORMAT,
    NO_SUGGEST,
  ].join("\n");
}

// Bong bóng tra cứu nhanh — bắt buộc trả lời cực ngắn để tiết kiệm token.
export function chatCommand(question: string): string {
  return [
    question,
    "",
    `(Câu hỏi tra cứu nhanh. Trả lời thật NGẮN GỌN, đúng trọng tâm, tối đa 2-3 câu.`,
    `Nếu hỏi nghĩa từ: cho nghĩa tiếng Việt + 1 ví dụ ngắn. Không dài dòng, không thêm gợi ý lệnh.)`,
  ].join("\n");
}

export function checkCommand(text: string): string {
  return `/check ${text}\n\n${NO_SUGGEST}`;
}

// Tra nghĩa 1 từ trong essay theo ĐÚNG ngữ cảnh câu. Trả JSON thuần để app parse.
export function wordLookupCommand(word: string, sentence: string): string {
  return [
    `Tra nghĩa của từ tiếng Anh "${word}" khi nó xuất hiện trong câu sau:`,
    `"${sentence}"`,
    ``,
    `CHỈ trả về DUY NHẤT một JSON object (không kèm bất kỳ chữ nào khác, không bọc \`\`\`), đúng dạng:`,
    `{"word":"<dạng nguyên mẫu của từ>","pos":"<n/v/adj/adv/prep...>","ipa":"<phiên âm IPA>","meaning":"<nghĩa tiếng Việt HỢP với ngữ cảnh câu trên>","example":"<1 câu ví dụ tiếng Anh ngắn, khác câu trên>"}`,
  ].join("\n");
}

// Hỏi đáp ngữ pháp nhiều lượt: trả lời ngắn gọn đủ ý, không format icon dài.
export function grammarChatTurn(question: string): string {
  return [
    `/grammar ${question}`,
    ``,
    `Trả lời NGẮN GỌN, đủ ý, bằng tiếng Việt; dùng ví dụ ngắn khi cần. Không dùng bộ icon trang trí dài.`,
    NO_SUGGEST,
  ].join("\n");
}
