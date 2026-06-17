# EngZone — Đại tu UI (Frosted Glass) + Redesign UX Grammar

> Spec thiết kế. Ngày 2026-06-17. Mục tiêu: nâng cấp giao diện toàn app theo hướng "kính mờ" (Frosted Glass) giữ tông dark tím, và thiết kế lại trải nghiệm phần Grammar cho thân thiện hơn.

## 1. Bối cảnh & phạm vi

EngZone (Next.js 14 App Router, trong `client/`) hiện có 7 tab: Home · Quiz · Essay · Grammar · Cards · Check · Library. Visual language hiện tại: dark tím phẳng, `Card` rounded-2xl + shadow, `Button` gradient accent, input bo xl, nền gradient radial nhạt.

**Phạm vi đợt này (đã chốt với user):**
- **Đại tu vừa** toàn app: thiết kế lại *visual language* qua tokens + primitives, **giữ nguyên luồng/điều hướng** các tab.
- **Giữ palette dark tím** hiện tại; hướng thẩm mỹ = **Frosted Glass**.
- **Redesign UX riêng cho Grammar** (có đổi cấu trúc điều hướng — xem mục 5).

**Ngoài phạm vi (YAGNI):** light mode; tự hạ Flash→Lite khi 429; UI thêm/sửa/xoá bài grammar; đổi logic AI/provider/storage của các tab khác.

**Bất biến:** mọi logic nghiệp vụ, luồng dữ liệu, routing các tab khác, prompts (trừ tinh chỉnh brevity cho Grammar chat), cơ chế lưu trữ — **giữ nguyên**. Đây chủ yếu là thay đổi trình bày + một số hành vi UX của Grammar.

## 2. Hệ thống bề mặt (2 loại)

Đây là xương sống của bản đại tu:

- **Glass** (kính mờ) — dùng cho *chrome & điều khiển*: thẻ nhập liệu, nút, segmented, nav, bubble, model selector, thẻ catalog.
  - `background: rgba(30,34,46,.5)` + `backdrop-filter: blur(12px)` + viền `1px rgba(255,255,255,.12)` + highlight sáng mép trên (`inset 0 1px 0 rgba(255,255,255,.12)`).
- **Reading (đặc)** — dùng cho *vùng chữ dài*: bài Grammar, Essay, giải thích Quiz/Exam, mọi `.prose-claude`.
  - `background: #161922` đặc + viền sáng kiểu glass `1px rgba(255,255,255,.1)` + inset highlight. Tương phản tốt, không mỏi mắt.

Lý do tách: app nhiều chữ; glass đẹp cho điều khiển nhưng đọc đoạn dài trên nền mờ-nhiều-lớp gây mỏi mắt. (User đã chọn phương án này.)

## 3. Tokens & global styles

**`tailwind.config.js`** — giữ palette (`bg #0b0d12`, `surface`, `accent #7c5cff/#a78bfa`, `ok #34d399`, `bad #f87171`). Bổ sung:
- shadow mới: `glow-accent` (quầng sáng accent cho nút primary & thẻ coverflow focus), `card-deep` (bóng sâu hơn).

**`app/globals.css`** — thêm các utility class tái dùng:
- `.glass`, `.glass-input`, `.glass-nav` (blur mạnh hơn cho nav), `.reading-surface` — theo định nghĩa mục 2.
- Tăng độ rõ `body` background-image (gradient mesh tím góc trên + cyan góc dưới, đậm hơn hiện tại) để glass "ăn" được lớp mờ.
- **Slider có knob tròn**: style `input[type=range]::-webkit-slider-thumb` (+ `::-moz-range-thumb`) → núm tròn trắng viền accent, có bóng; track gradient. (Yêu cầu rõ của user.)

## 4. Primitives — `components/ui.tsx`

Thay đổi chảy qua primitives để áp toàn app mà không sửa từng trang:
- **Card**: mặc định `.glass`; thêm prop `variant?: "glass" | "reading"` (reading = `.reading-surface`).
- **TextInput / TextArea**: nền `.glass-input` bán trong suốt, focus ring accent (giữ).
- **Button**: `primary` giữ gradient + thêm `glow-accent` + viền sáng nhẹ; `ghost` → glass (`rgba white/8` + viền `white/12`).
- **Segmented**: hộp `.glass`; pill active vẫn accent đặc.
- **LevelSlider**: track gradient + knob tròn (qua CSS ở globals).
- **PageHeader**: ô icon nền glass tint.
- **Mới — `ProgressBar`**: thanh tiến độ gradient tím→cyan (dùng ở Grammar & có thể Home). Props: `value`, `max`, optional label.

Các vùng đọc — `OutputPanel.tsx`, `GrammarLessonView`, `EssayView`, khu giải thích trong `QuizPlayer/ExamPlayer`, wrapper `.prose-claude` — chuyển sang `Card variant="reading"` / `.reading-surface`.

## 5. Redesign UX Grammar

### 5.1 Hai phần tách bạch
Trang `/grammar` giữ 2 tab nhưng làm rõ hơn bằng segmented to có icon: **💬 Hỏi AI** | **📚 Thư viện**.

### 5.2 Thư viện — điều hướng 2 cấp (coverflow → drill-in)

**Cấp 1 — Coverflow 3 cấp độ** (theo ref user gửi):
- 3 thẻ to = **Sơ cấp (A1–A2, 13 bài)** · **Trung cấp (B1–B2, 12 bài)** · **Cao cấp (C1–C2, 10 bài)**.
- Thẻ giữa **to & nổi bật + quầng sáng**, hai thẻ bên **nhỏ hơn (scale ~0.86) + mờ + nép vào**. Vuốt/bấm/chấm điều hướng để đổi thẻ giữa.
- Mỗi thẻ: vùng ảnh trên (gradient riêng theo cấp + emoji/biểu tượng), footer = tên cấp + dòng phụ (số bài) + pill "Mở →" + chỉ số tiến độ (✓ x/y) kèm mini progress.
- Dưới coverflow: thanh **Tổng tiến độ** (x/35 bài).
- Cấu trúc cho phép **thêm cấp/nhóm mới sau này** dễ dàng.

**Cấp 2 — Màn bài trong một cấp độ** (mở khi bấm thẻ giữa):
- Lessons của cấp đó, **nhóm theo `category`** (header nhóm); mỗi bài là thẻ glass.
- **Ô tìm kiếm** (lọc theo tên Việt/Anh) + **chip lọc**: Tất cả / Chưa học / Đã học.
- **Tiến độ cấp độ** (và per-category header hiển thị x/y).
- **Icon trạng thái mỗi bài**: `○` chưa mở (chưa tải nội dung) · `◐` đã tải nội dung · `✓` đã học.
- Có nút quay lại coverflow.

Điều hướng cấp-độ giữ ở **state (useFeatureState)**, không thêm route mới (tránh xung đột với `[slug]` một-segment; giữ build 45 trang). Bài lẻ vẫn mở route hiện có `/grammar/[slug]`.

### 5.3 Trang bài `/grammar/[slug]`
- **Bỏ auto-set "đã học"**: hiện `saveLessonContent()` set `learned:true` ngay khi sinh nội dung → tách ra. Lưu nội dung KHÔNG đồng nghĩa đã học.
- Thêm **nút "Đánh dấu đã học" (toggle)** thủ công.
- **Mini mục lục**: liệt kê các mục của bài (theo heading markdown / bộ icon ✨🔹⚠️💡📍✓) và nhảy nhanh tới mục (scrollIntoView qua id gắn vào heading).
- **prev/next + "Bài tiếp theo"**: điều hướng trong cùng cấp độ (thứ tự seed: theo category rồi thứ tự bài). Nút "Bài tiếp theo" đi tới bài kế chưa học (nếu có) hoặc bài kế tiếp.
- Vùng nội dung dùng `reading-surface`.

### 5.4 Data layer — `lib/grammarLibrary.ts`
- `saveLessonContent(slug, content)`: chỉ set `content` + `updatedAt`, **KHÔNG** set `learned`.
- Thêm `setLearned(slug, value: boolean)`.
- Trạng thái suy ra: `content === ""` → ○; `content !== "" && !learned` → ◐; `learned` → ✓.
- Helper tính tiến độ: tổng & theo level & theo category (đếm `learned`).

### 5.5 Hỏi AI — chat nhiều lượt, không lưu lịch sử
- `GrammarChat` chuyển từ one-shot → **hội thoại nhiều lượt**: giữ mảng `messages: {role, content}[]` trong **useFeatureState (RAM)** → reset khi F5 (đúng yêu cầu "không lưu lịch sử").
- Gửi **toàn bộ messages** lên `/api/chat` (route đã hỗ trợ mảng messages). Thêm `runChat(key, messages, handlers, opts)` trong `lib/stream.ts` (biến thể của `runCommand` gửi nguyên mảng thay vì 1 message).
- **Câu trả lời ngắn gọn đủ ý**: tinh chỉnh prompt — thêm chỉ dẫn brevity (vd lượt user đầu được bọc directive "trả lời ngắn gọn, đủ ý, tránh lan man" + giữ `NO_SUGGEST`). Không dùng format icon dài như bài học.
- **Cảnh báo "không lưu lịch sử"**: dòng chú thích nhỏ, muted, đặt kín đáo (vd ngay dưới khung chat), **không cần nổi bật**.
- Có nút xoá hội thoại (reset) để bắt đầu lại.

## 6. Navigation & nổi (chrome)
- `Nav.tsx`: sidebar (desktop) + bottom tab bar (mobile) → `.glass-nav` (hiện đã có `backdrop-blur`, chỉ tinh chỉnh), item active tô accent. **Không đổi cấu trúc/đường dẫn.**
- `ChatBubble.tsx`: nền glass.

## 7. Các đơn vị & ranh giới (để dễ kiểm thử)
- **Tokens/CSS** (`globals.css`, `tailwind.config.js`) — độc lập, là nền cho mọi thứ.
- **Primitives** (`ui.tsx`) — tiêu thụ tokens; các trang tiêu thụ primitives.
- **Grammar/Thư viện**: tách component rõ — `GrammarCoverflow` (cấp 1), `GrammarLevelView` (cấp 2: search/filter/progress/cards), `GrammarChat` (chat), `GrammarLessonView` (bài). Mỗi component một nhiệm vụ, nhận props rõ ràng.
- **grammarLibrary.ts**: API thuần (đọc/ghi/đánh dấu/tiến độ) — UI không chạm localStorage trực tiếp.

## 8. Rủi ro & kiểm thử
- **Tương phản chữ**: đã chọn reading-surface đặc cho vùng đọc → tránh mỏi mắt.
- **Hiệu năng `backdrop-filter`**: ổn ở quy mô này; tránh lồng quá nhiều lớp glass chồng nhau.
- **Coverflow trên mobile**: hỗ trợ vuốt + nút + chấm; đảm bảo bấm được thẻ giữa.
- **Multi-turn chat**: tốn token hơn → prompt brevity + không lưu lịch sử (reset F5) giảm tích luỹ.
- **Kiểm thử**: `npm run build` phải xanh (giữ 45 trang); xem mắt các trang chính (Grammar coverflow/level/lesson/chat, Quiz, Essay) ở localhost:3000; thử luồng đánh dấu đã học + prev/next + tìm kiếm/lọc.

## 9. Việc KHÔNG làm trong đợt này
Light mode; auto Flash→Lite; CRUD bài grammar; đổi prompts các tab khác; đổi backend.
