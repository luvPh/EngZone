// Builders for the command string sent to Claude (via /api/chat). They keep the
// skill's `/command` semantics but append constraints so the UI gets exactly
// what it needs (JSON for quiz/flashcard, trimmed essay, no trailing tips).

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

export function essayCommand(topic: string, level: number): string {
  const schema =
    '{"essay":"toàn bộ bài essay (có thể nhiều đoạn, ngăn cách bằng \\n\\n)","vocab":[{"word":"từ/cụm từ","meaning":"nghĩa tiếng Việt"}]}';
  return [
    `/essay ${topic} ${level}`,
    "",
    `CHỈ trả về một JSON object hợp lệ — KHÔNG markdown, KHÔNG văn bản ngoài JSON:`,
    schema,
    `"essay": bài hoàn chỉnh. "vocab": 8-12 từ/cụm quan trọng kèm nghĩa tiếng Việt.`,
    `KHÔNG kèm structure, comprehension questions, hay writing prompt.`,
  ].join("\n");
}

// Đề thi tốt nghiệp THPT môn Tiếng Anh — cấu trúc 2025 (Chương trình GDPT 2018):
// 40 câu trắc nghiệm A/B/C/D, 4 dạng bài. "mini" giữ đủ 4 dạng nhưng ít câu hơn.
export function examCommand(size: 20 | 40): string {
  const full = size === 40;
  const c1 = full ? 12 : 6; // điền vào thông báo/quảng cáo/đoạn văn
  const c2 = full ? 5 : 4; //  sắp xếp câu thành đoạn/hội thoại
  const c3 = full ? 5 : 4; //  điền câu/đoạn còn thiếu vào đoạn văn
  const rc = full ? [8, 10] : [3, 3]; // đọc hiểu: 2 bài
  const total = c1 + c2 + c3 + rc.reduce((a, b) => a + b, 0);
  const schema =
    '{"title":"Đề thi thử Tiếng Anh THPT","sections":[{"instruction":"hướng dẫn dạng bài","passage":"văn bản/đoạn đề bài nếu có (markdown), bỏ trống nếu không cần","questions":[{"q":"câu hỏi","options":["A","B","C","D"],"correct":0,"explain":"giải thích tiếng Việt ngắn"}]}]}';
  return [
    `Tạo một đề thi thử môn Tiếng Anh theo ĐÚNG cấu trúc đề tốt nghiệp THPT Quốc gia Việt Nam 2025 (Chương trình GDPT 2018). Toàn bộ là câu hỏi trắc nghiệm 4 đáp án A/B/C/D.`,
    `Gồm ${total} câu, chia thành các "sections" theo 4 dạng bài:`,
    `1) Hoàn thành nội dung (quảng cáo/thông báo/tờ rơi hoặc đoạn văn có chỗ trống) — ${c1} câu.`,
    `2) Sắp xếp thứ tự các câu thành đoạn văn/lá thư/hội thoại hoàn chỉnh — ${c2} câu. Đặt các mệnh đề a), b), c), d)… vào "passage" dưới dạng DANH SÁCH MARKDOWN, MỖI mệnh đề một dòng bắt đầu bằng "- " (ví dụ: "- a) ...\\n- b) ..."). "options" là các thứ tự ví dụ "b-a-d-c".`,
    `3) Hoàn thành đoạn văn bằng các câu/đoạn còn thiếu — ${c3} câu (đoạn văn có chỗ trống đánh số trong "passage", option là các câu ứng viên).`,
    `4) Đọc hiểu — 2 bài đọc (mỗi bài đặt văn bản vào "passage"): bài 1 có ${rc[0]} câu, bài 2 có ${rc[1]} câu.`,
    `Mức độ tư duy: ~40% nhận biết, 30% thông hiểu, 30% vận dụng.`,
    `CHỈ trả về một JSON object hợp lệ theo schema sau — KHÔNG markdown, KHÔNG văn bản ngoài JSON:`,
    schema,
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

// Hỏi đáp ngữ pháp nhiều lượt: trả lời ngắn gọn đủ ý, không format icon dài.
export function grammarChatTurn(question: string): string {
  return [
    `/grammar ${question}`,
    ``,
    `Trả lời NGẮN GỌN, đủ ý, bằng tiếng Việt; dùng ví dụ ngắn khi cần. Không dùng bộ icon trang trí dài.`,
    NO_SUGGEST,
  ].join("\n");
}
