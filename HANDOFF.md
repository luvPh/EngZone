# EngZone — Bản giao trạng thái (Handoff)

> Snapshot toàn bộ app để tiếp tục ở session khác (mục tiêu kế: **chỉnh sửa giao diện**).
> Chi tiết lịch sử/định luật xem thêm `CLAUDE.md`. File này là bản gom gọn + bản đồ UI.

---

## 1. App là gì & chạy thế nào
Web app học tiếng Anh (Next.js), gọi AI để sinh nội dung. Mặc định dùng **Claude CLI** (subscription, không cần key).

```bash
cd client && npm run dev      # http://localhost:3000  (đang được tự chạy lại sau mỗi update)
npm run build                 # build production (hiện xanh: 45 trang)
curl localhost:3000/api/health # {mode, providers:{claude,gemini}}
```
Monorepo: app nằm trong **`client/`** (Next.js 14 App Router + React 18 + TS). Root `package.json` chỉ uỷ quyền script sang `client/`. `skills/english-master/SKILL.md` (ở repo root) = system prompt.

## 2. Kiến trúc & luồng dữ liệu
- **AI provider (chọn per-tab):** `claude` (CLI/SDK) · `gemini-flash` (gemini-3.5-flash) · `gemini-flash-lite` (gemini-3.1-flash-lite). Route `app/api/chat/route.ts` nhận `{messages, maxTokens, provider}` → stream text. CLI: `lib/claudeCli.ts` (stream-json, thêm 1 space tránh slash-command). Gemini: `lib/gemini.ts` (REST SSE). Key: `client/.env.local` (`GEMINI_API_KEY`, đã có; gitignored).
- **Gọi AI từ client:** `lib/stream.ts runCommand(key, command, handlers, {maxTokens, provider})` → POST /api/chat, stream vào handlers.
- **State sống qua điều hướng:** `lib/store.tsx` (`AppProvider` ở layout + `useFeatureState(key, initial)`) — RAM, reset khi F5.
- **Model config:** `lib/modelConfig.ts` (`useModel(feature)`, `getProvider(feature)`, `useProviders()` từ /api/health) — lưu localStorage.
- **Lưu trữ (localStorage):** thư viện quiz/essay/flash (`lib/library.ts`: `saveItem` dedupe / `addItem` accumulate / `listItems`); thư viện grammar (`lib/grammarLibrary.ts`: seed canonical từ `lib/grammar.ts`, giữ content/learned); hoạt động/streak (`lib/storage.ts`).
- **Output JSON** (quiz/flash/essay/exam) parse bằng `lib/extractJson.ts` (chịu code-fence + trailing comma). Prompt builders: `lib/prompts.ts`.

## 3. Cây thư mục (client/)
```
app/
  layout.tsx           # AppProvider + Nav + <main> + ChatBubble
  globals.css          # theme, markdown (.prose-claude), animation
  page.tsx             # Home: streak + 7 ngày + lối tắt feature
  quiz/page.tsx        # Luyện tập + Đề thi THPT (start gate, timer, khoá tab)
  essay/page.tsx       # essay + vocab (JSON)
  grammar/page.tsx     # 2 mục: Hỏi đáp (chat) | Thư viện (35 bài, nhóm Level→Category)
  grammar/[slug]/page.tsx  # SSG 35 bài → GrammarLessonView
  flashcard/page.tsx   # carousel, level, accumulate
  check/page.tsx       # sửa lỗi
  library/page.tsx     # xem lại quiz/essay/flash đã lưu
  api/chat/route.ts · api/health/route.ts
components/
  Nav.tsx              # sidebar desktop / bottom tabs mobile + khoá khi làm đề
  ui.tsx               # PRIMITIVES: PageHeader, Card, Field, TextInput, TextArea,
                       #            Button(primary|ghost), LevelSlider, Segmented, Spinner
  ModelSelector.tsx    # nút chọn Claude/Flash/Lite (per-tab)
  ChatBubble.tsx       # bong bóng tra cứu nhanh (kéo-thả, click ngoài đóng, ẩn ở /quiz)
  QuizPlayer.tsx · ExamPlayer.tsx · CardCarousel.tsx · EssayView.tsx
  GenProgress.tsx      # thanh tiến trình gen đề
  Markdown.tsx         # react-markdown + remark-gfm + remark-breaks
  OutputPanel.tsx      # khung markdown + loader (essay/grammar/check)
  GrammarChat.tsx · GrammarLessonView.tsx
lib/  claude, claudeCli, gemini, stream, store, modelConfig, prompts, extractJson,
      library, grammarLibrary, grammar, skills, storage, types
```

## 4. UI hiện tại — BẢN ĐỒ CHO REDESIGN
**Theme (tailwind.config.js):**
- Màu: `bg #0b0d12` · `surface #14171f` · `surface-2 #1b1f2a` · `border #262b38` · `muted #8b93a4` · `accent #7c5cff` (hover `#6b4af0`, soft `#a78bfa`) · `ok #34d399` · `bad #f87171`.
- `shadow-card`; font `sans` (system). `globals.css`: nền gradient radial tím/xanh, `.prose-claude` style markdown, `.animate-fade-up`.
- Dark theme cố định (chưa có light mode).

**Layout:** sidebar trái (desktop ≥md) / bottom tab bar (mobile) qua `Nav.tsx`; nội dung `<main class="max-w-3xl mx-auto px-4 py-6 pb-24">`. Icon: **lucide-react**.

**Primitives dùng lại (components/ui.tsx)** — redesign nên bắt đầu từ đây: `PageHeader` (title/subtitle/icon/right-slot, nơi gắn ModelSelector), `Card` (rounded-2xl + shadow), `Button` (gradient primary / ghost), `Segmented` (pill toggle), `Field`, `TextInput/TextArea`, `LevelSlider`, `Spinner`.

**Mỗi trang** dùng cùng khuôn: `<PageHeader right={<ModelSelector/>}/>` → `<Card>` form nhập → kết quả (OutputPanel / QuizPlayer / ExamPlayer / CardCarousel / EssayView).

**Tabs (Nav):** Home · Quiz · Essay · Grammar · Cards · Check · Library. Bubble tra cứu nổi góc dưới-phải (trừ /quiz).

## 5. Tính năng đã hoàn thiện
- **Quiz** tương tác (chủ đề/số câu/dạng/level → chấm điểm + giải thích) **+ Đề thi THPT 2025** (4 dạng, 20/40 câu, nút Bắt đầu → đếm ngược 25/50p + khoá chuyển tab + auto nộp, thanh tiến trình khi gen).
- **Essay**: JSON essay + vocab (vocab xuống dòng từng từ).
- **Flashcard**: carousel 1 thẻ lớn (phát âm, lật nghĩa), chọn độ khó, 10 thẻ, "Tạo mới" dùng avoid-list + accumulate (không ghi đè).
- **Grammar**: 2 mục — *Hỏi đáp* (chat tự do) & *Thư viện* 35 bài A1→C2 (field `category`, nhóm Level→Category); nội dung AI lazy + lưu localStorage; format ép **bộ 6 icon ✨🔹⚠️💡📍✓** (Ví dụ/Lỗi gọn 2 dòng, mục khác giữ bảng/đậm/code); cross-link sang Quiz/Flashcard (prefill topic).
- **Check**: sửa lỗi theo mức độ.
- **Library**: xem lại quiz/essay/flashcard đã lưu.
- **Đa model per-tab** (Claude/Flash/Lite) + **bubble tra cứu** (trả lời ngắn tiết kiệm token).
- **Home**: streak, lịch 7 ngày, lối tắt.

## 6. Quy ước & gotchas
- **Auto-restart** dev server sau mỗi update (xem CLAUDE.md / memory). Hot-reload sẵn; restart hẳn khi đổi config.
- **CLI mode**: `claude -p` nuốt input bắt đầu `/` → gửi stream-json + 1 space; không dùng `--bare`; cwd=os.tmpdir().
- **Gemini**: `gemini-3.5-flash` ~20 lần/ngày (free), dùng `gemini-3.1-flash-lite` cho rate limit lớn. KHÔNG auto-fallback sang Claude khi Gemini lỗi.
- **State-race đã fix**: nơi auto-gen lúc mount đọc provider qua `getProvider()` (không dựa state) để tránh đốt nhầm Claude.
- **localStorage là per-trình duyệt**; bài grammar đã cache giữ format cũ tới khi "Tạo lại".

## 7. Còn lại / ý tưởng cho session UI
- Đại tu giao diện (mục tiêu session sau). Gợi ý điểm chạm: `globals.css` + `tailwind.config.js` (tokens), `components/ui.tsx` (primitives), `Nav.tsx`, từng `*/page.tsx`.
- Tuỳ chọn chưa làm: light mode, tự hạ Flash→Lite khi 429, UI thêm/sửa/xoá bài grammar, thanh tiến trình cho các gen ngắn.

**Trạng thái git:** toàn bộ app trong `client/` hiện CHƯA commit (scaffold cũ `src/` còn trong commit đầu). Nên commit để chốt snapshot trước khi sang session UI.
