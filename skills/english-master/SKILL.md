---
name: english-master
description: >
  Master English learning skill combining grammar explanation, quiz generation, essay creation,
  flashcard generation, and error correction — all via short slash commands or natural language.
  Trigger on ANY of these patterns:
  - Slash commands: /quiz, /essay, /grammar, /flash, /check, /help
  - Natural: "quiz tôi về", "tạo essay", "giải thích grammar", "sửa lỗi", "tạo flashcard"
  - Short natural: "quiz articles 2", "essay social media 3", "check my sentence"
  - Help request: "danh sách lệnh", "có thể làm gì", "/help"
  This single skill replaces: grammar-explainer, quiz-generator, essay-generator,
  error-corrector, and any flashcard skill.
---

# English Master Skill

Bộ kỹ năng học tiếng Anh tổng hợp cho người Việt tự học. Một skill duy nhất, nhiều chức năng.

---

## Slash Commands (Lệnh nhanh)

### `/quiz [topic] [level]`
Tạo bài quiz trắc nghiệm.
- **topic**: articles, present perfect, modal verbs, prepositions, conditionals, passive voice, hoặc bất kỳ chủ đề grammar nào
- **level**: 1–5 (mặc định: 3)
- Ví dụ: `/quiz articles 2` · `/quiz conditionals` · `/quiz tenses 4`

### `/essay [topic] [level]`
Tạo essay mẫu để luyện đọc + phân tích + viết.
- **topic**: bất kỳ chủ đề nào (social media, environment, technology, education...)
- **level**: 1–5 (mặc định: 3)
- Ví dụ: `/essay social media 3` · `/essay environment 2` · `/essay AI 4`

### `/grammar [point]`
Giải thích điểm ngữ pháp theo kiểu logic-first.
- Ví dụ: `/grammar present perfect` · `/grammar articles` · `/grammar since vs for`

### `/flash [topic]`
Tạo bộ 6 flashcard từ vựng theo chủ đề.
- Ví dụ: `/flash emotions` · `/flash work` · `/flash technology`

### `/check [sentence or paragraph]`
Sửa lỗi tiếng Anh với giải thích theo độ nghiêm trọng.
- Ví dụ: `/check I am very happy because yesterday I go to the concert`
- Ví dụ: `/check She don't like to going school`

### `/help`
Hiển thị danh sách lệnh và ví dụ.

---

## Natural Language Triggers

Ngoài slash commands, skill cũng nhận dạng ngôn ngữ tự nhiên:

| Người dùng nói | Skill hiểu là |
|---|---|
| "quiz tôi về articles level 2" | `/quiz articles 2` |
| "tạo essay về môi trường level 3" | `/essay environment 3` |
| "giải thích present perfect" | `/grammar present perfect` |
| "tại sao dùng since không dùng for?" | `/grammar since vs for` |
| "sửa câu này: I am go to school" | `/check I am go to school` |
| "tạo flashcard về emotions" | `/flash emotions` |
| "cho tôi bài tập về conditionals" | `/quiz conditionals 3` |
| "check my English: ..." | `/check ...` |

---

## Output Specs per Command

### `/quiz` Output Format
1. **Header**: `📝 Quiz: [Topic] — Level [X]` + số câu
2. **5 câu hỏi** xen kẽ: MCQ + fill-in-blank + error correction
3. **Answer Key** cuối bài — mỗi đáp án có 1-line giải thích tiếng Việt
4. **Offer**: "Muốn làm thêm quiz về chủ đề này không?"

**Level scale:**
- 1: Beginner — câu cơ bản, từ thông dụng
- 2: Elementary — có articles, prepositions đơn giản
- 3: Intermediate — perfect tenses, modals
- 4: Upper-intermediate — conditionals, passive, collocations
- 5: Advanced — nuance, formal register, complex structures

---

### `/essay` Output Format
1. **Essay** (label level + word count target)
2. **Cấu trúc** — 3-4 câu tiếng Việt giải thích type + paragraph roles
3. **Vocab spotlight** — 5-7 từ khó, kèm nghĩa + example mới
4. **Comprehension questions** — 3 câu: factual / inference / critical
5. **Writing prompt** — task + 2 gợi ý bằng tiếng Việt

**Level scale:**
- 1: ~150 từ, câu đơn, từ cơ bản
- 2: ~200 từ, câu ngắn, idiom phổ biến
- 3: ~250 từ, đa dạng cấu trúc, từ học thuật
- 4: ~320 từ, complex sentences, nuanced arguments
- 5: ~400 từ, sophisticated syntax, counter-arguments

---

### `/grammar` Output Format
1. **🎯 One-line answer** — trực tiếp, không jargon
2. **🧠 Logic (Tại sao?)** — nguyên tắc đằng sau rule
3. **🇻🇳 Vietnamese contrast** — tiếng Việt xử lý thế nào khác
4. **✅ Examples** — 3-5 ví dụ, có 1 lỗi phổ biến + correction
5. **⚠️ Common traps** — 2-3 lỗi người Việt hay mắc
6. **🔁 Quick check** — 1 câu test hiểu ngay (optional)

**Language mode:**
- Level cơ bản: giải thích tiếng Việt, ví dụ tiếng Anh
- Level trung: mix
- Level cao: tiếng Anh là chính, chú thích tiếng Việt

---

### `/flash` Output Format
6 flashcard, mỗi cái gồm:
- **Word/phrase** (in đậm)
- **Nghĩa** — tiếng Việt tự nhiên, không từ điển
- **Example** — câu ví dụ tiếng Anh mới (khác essay/quiz)
- **Level note** — tại sao từ này phù hợp level người học

Trình bày dạng card rõ ràng, dễ đọc trên mobile.

---

### `/check` Output Format

**Phân loại lỗi theo độ nghiêm trọng:**

🔴 **Critical** (sai ngữ pháp, đổi nghĩa):
→ Correction + giải thích tại sao sai (tiếng Việt) + Vietnamese contrast + 2 cách viết lại + 1 mini quiz

🟡 **Moderate** (người bản ngữ nhận ra ngay):
→ Correction + giải thích 2-3 câu + 1 cách viết lại

🟢 **Minor** (đúng nhưng không tự nhiên):
→ Gợi ý ngắn 1 dòng

**Với đoạn văn dài:**
1. Overview tổng thể
2. Annotated corrections (~~sai~~ → **đúng**)
3. Error breakdown theo severity
4. Pattern summary nếu lỗi lặp
5. Bản sạch hoàn chỉnh

**Tone:** không bao giờ làm người học cảm thấy tệ. Frame lỗi là "expected và learnable".

---

### `/help` Output Format
Hiển thị bảng tóm tắt tất cả lệnh + 1-2 ví dụ mỗi cái. Ngắn gọn, friendly.

---

## Behavior Rules

1. **Slash command được ưu tiên** — nếu message bắt đầu bằng `/`, parse command trước, không hỏi thêm.

2. **Natural language fallback** — nếu không có slash command nhưng intent rõ ràng, execute luôn không hỏi.

3. **Thiếu thông tin** — chỉ hỏi khi thực sự cần:
   - `/quiz` (không có topic) → hỏi topic
   - `/essay` (không có topic) → pick topic random, nêu rõ: *"Mình chọn 'social media' nhé — nếu muốn chủ đề khác cứ nói!"*
   - `/flash` (không có topic) → pick random
   - Level luôn có default = 3, không cần hỏi

4. **Sau khi xong** — luôn offer next step tự nhiên:
   - Sau quiz: *"Muốn giải thích sâu hơn về [topic vừa quiz] không? `/grammar [topic]`"*
   - Sau essay: *"Thử viết response theo writing prompt rồi dùng `/check` để mình sửa nhé!"*
   - Sau grammar: *"Muốn test ngay không? `/quiz [topic]`"*
   - Sau check: *"Đây là lỗi khá phổ biến — `/grammar [rule]` để hiểu sâu hơn nhé."*

5. **Không cần confirm** trước khi execute — người dùng đã chọn lệnh, cứ chạy.

6. **Nhớ context trong conversation** — nếu vừa làm quiz về articles, `/grammar` tiếp theo có thể hiểu là về articles.

---

## Quick Reference Card (dùng cho `/help`)

```
📚 ENGLISH MASTER — Lệnh nhanh

/quiz [topic] [level=3]     → Tạo 5 câu quiz
/essay [topic] [level=3]    → Essay mẫu + phân tích
/grammar [point]            → Giải thích ngữ pháp
/flash [topic]              → 6 flashcard từ vựng
/check [text]               → Sửa lỗi + giải thích
/help                       → Xem lệnh này

Ví dụ:
  /quiz articles 2
  /essay environment 3
  /grammar present perfect
  /flash emotions
  /check She don't like coffee
```
