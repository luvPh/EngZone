# EngZone — English Learning App

> Ứng dụng học tiếng Anh chạy local, dùng **Claude API** làm AI engine.
> File này là **lộ trình sống** (living roadmap) — cập nhật trạng thái sau mỗi tính năng.
> 👉 **Bản gom trạng thái + bản đồ UI:** xem [HANDOFF.md](./HANDOFF.md) (đọc trước khi chỉnh giao diện).

---

## Kiến trúc

```
Browser (Next.js App Router + React + Tailwind)   ← client/
        │  fetch /api/chat  (Next Route Handler, server-side)
        ▼
   2 chế độ (tự chọn theo env):
   ├── CLI mode  (mặc định) → spawn `claude` CLI, auth subscription (claude login)
   └── API mode  (nếu có ANTHROPIC_API_KEY) → @anthropic-ai/sdk
        ▼
Claude (claude-sonnet-4-6, stream)
        system prompt = skills/english-master/SKILL.md
```

- **Full-stack Next.js 14** (App Router) + React 18 + TypeScript + Tailwind CSS 3. Mobile-first, responsive (bottom tab bar trên mobile, sidebar trên desktop).
- **Dual-mode** (xác định trong `lib/claude.ts → getMode()`):
  - **CLI mode (mặc định):** không cần API key. Server spawn `claude` CLI dùng auth subscription (`claude login`). Xem `lib/claudeCli.ts`.
  - **API mode:** nếu có `ANTHROPIC_API_KEY` trong env → dùng SDK (`lib/claude.ts`).
  - Cả hai đều chạy **server-side** trong Route Handler — key/CLI không bao giờ lộ ra browser.
- **AI logic:** đã encode trong `skills/*/SKILL.md`. App chỉ load `english-master` làm system prompt (`--system-prompt` với CLI) + gửi command (`/quiz`, `/essay`...). Không reimplement logic dạy học.
- Không dùng Express riêng — Next.js tự lo cả frontend lẫn API. Progress tracking dùng `localStorage` (bỏ SQLite vì `better-sqlite3` không build được trên Node 26).

### CLI mode — 3 điểm kỹ thuật quan trọng
1. **CLI nuốt dấu `/`:** `claude -p` coi input bắt đầu bằng `/` là slash-command của nó ("Unknown command: /quiz"). Khắc phục: gửi user turn qua `--input-format stream-json` và **thêm 1 dấu cách đầu** (`" /quiz ..."`) — CLI truyền nguyên văn, skill vẫn parse được lệnh.
2. **Không dùng `--bare`:** flag này tắt OAuth/keychain → mất auth subscription. Thay vào đó chạy subprocess với `cwd = os.tmpdir()` để CLI không tự nạp CLAUDE.md của project, và `--system-prompt` để ghi đè prompt mặc định bằng english-master.
3. **Streaming:** `--output-format stream-json --include-partial-messages`, parse event `content_block_delta / text_delta`; fallback sang `result` nếu không có delta.

## Cấu trúc thư mục

```
EngZone/
├── CLAUDE.md                 # file này — roadmap
├── README.md
├── package.json              # root: scripts uỷ quyền sang client/
├── skills/                   # 5 SKILL.md (system prompts)
│   └── english-master/SKILL.md
└── client/                   # Next.js app
    ├── next.config.mjs
    ├── tailwind.config.js · postcss.config.js · tsconfig.json
    ├── .env.local.example    # ANTHROPIC_API_KEY=...
    ├── app/
    │   ├── layout.tsx        # shell + AppProvider (store) + Nav
    │   ├── globals.css       # tailwind + markdown + theme/animations
    │   ├── page.tsx          # Home: streak + 7-ngày + link tính năng
    │   ├── quiz|essay|grammar|flashcard|check|library/page.tsx
    │   ├── api/chat/route.ts   # proxy stream → Claude (CLI/SDK)
    │   └── api/health/route.ts # báo mode hiện tại (cli / api-key)
    ├── components/           # Nav, ui, Markdown, OutputPanel,
    │                         #   QuizPlayer, CardCarousel
    └── lib/
        ├── claude.ts         # SDK client + stream helper + getMode()
        ├── claudeCli.ts      # spawn `claude` CLI, stream-json, slash bypass
        ├── skills.ts         # load english-master SKILL.md
        ├── store.tsx         # AppProvider + useFeatureState (state sống qua điều hướng)
        ├── stream.ts         # runCommand(): fetch /api/chat, stream vào store
        ├── prompts.ts        # build command (quiz/flash JSON, essay rút gọn, no-suggest)
        ├── extractJson.ts    # parse JSON từ response (tolerant)
        ├── library.ts        # localStorage thư viện quiz/essay/flash + dedupe
        ├── types.ts          # Quiz / Flashcard types
        └── storage.ts        # progress/streak localStorage
```

> **State sống qua điều hướng:** `lib/store.tsx` giữ state trong RAM ở root layout → đổi tab không mất dữ liệu, chỉ reset khi **F5/load lại trang**. Streaming ghi thẳng vào store nên rời trang giữa chừng vẫn cập nhật.

## Chạy dev

**Mặc định: CLI mode (không cần API key).** Chỉ cần đã `claude login` 1 lần.

```bash
npm run install:all     # cài root + client
npm run dev             # http://localhost:3000  → tự dùng Claude CLI

# Kiểm tra mode:
curl http://localhost:3000/api/health   # → {"mode":"cli",...}
```

**Tuỳ chọn — API key mode:** chỉ khi muốn dùng key thay vì subscription.
```bash
cp client/.env.local.example client/.env.local   # điền ANTHROPIC_API_KEY
```
Có key → tự chuyển sang API mode. Lấy key tại https://console.anthropic.com

---

## Lộ trình tính năng (To-Do / In Progress / Done)

| # | Tính năng | Trạng thái | Ghi chú |
|---|-----------|-----------|---------|
| 0 | Scaffold Next.js + Tailwind | **Done** | Build sạch, server boot OK |
| 1 | Backend `/api/chat` stream tới Claude | **Done** | Route Handler, dual-mode (CLI/SDK), english-master, stream server-side |
| 2 | Layout responsive + routing | **Done** | Sidebar desktop / bottom tabs mobile |
| 3 | **Quiz** tương tác | **Done** | Nhập topic + chọn số câu (3/5/10) + dạng (mcq/fill/mixed) + level; người dùng trả lời → chấm điểm + giải thích |
| 4 | **Grammar** (`/grammar [q]`) | **Done** | Textarea (bỏ quick chips) |
| 5 | **Check** (`/check [text]`) | **Done** | Textarea; mức độ từ output skill |
| 6 | **Essay** | **Done** | Chỉ xuất Essay + Vocabulary (bỏ structure/comprehension/prompt) |
| 7 | **Flashcard** | **Done** | Gen JSON chạy ngầm → carousel 1 thẻ to + nút Tiếp; phát âm; lật xem nghĩa |
| 8 | Markdown rendering | **Done** | react-markdown + remark-gfm, style riêng |
| 9 | Progress tracking + Stats | **Done** | localStorage: streak, 7-ngày, lượt/tính năng (Home) |
| 10 | Self-heal build pass cuối | **Done** | `next build` xanh, smoke test routes OK |
| 11 | CLI mode (subscription, không cần key) | **Done** | Test thật `/grammar` stream OK qua Claude CLI |

### v2 — Theo phản hồi người dùng
| # | Việc | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 12 | Đại tu UI + icon (lucide) thay emoji | **Done** | Theme mới, gradient accent, icon ở Nav/Home/Header |
| 13 | Bỏ phần "gợi ý" (chips + gợi ý lệnh cuối output) | **Done** | Bỏ quick chips; prompt thêm chỉ thị no-suggest |
| 14 | State sống qua điều hướng, chỉ reset khi F5 | **Done** | `store.tsx` (RAM ở layout) + `stream.ts` ghi vào store |
| 15 | Quiz tương tác (nhập topic/số câu/dạng → chấm) | **Done** | JSON ngầm, `QuizPlayer`; test thật parse OK |
| 16 | Flashcard: 1 thẻ to + nút Tiếp, gen ngầm | **Done** | `CardCarousel`; JSON ngầm; test thật 6 thẻ OK |
| 17 | Thư viện quiz/essay/vocab + tránh gen trùng | **Done** | `library.ts` localStorage; `findItem` tái dùng theo topic/level |
| 18 | "Tạo mới" thật sự ra bộ khác (không lặp) | **Done** | forceNew gọi model + truyền avoid-list từ thẻ đã hiện/đã lưu; test thật 0/6 trùng. Quiz có cờ `fresh` tương tự |
| 19 | Essay: tách vocab thành từng dòng | **Done** | Essay trả JSON `{essay, vocab[]}` → `EssayView` (mỗi từ 1 hàng: từ \| nghĩa); test thật parse OK 12 từ |
| 20 | Flashcard: thêm chỉnh độ khó | **Done** | Slider level 1-5 → `flashCommand(topic, level)`; thư viện tách theo level |
| 21 | Quiz: "Tạo đề thi" chuẩn THPT 2025 | **Done** | Mode "Đề thi THPT" (20/40 câu) đúng cấu trúc 4 dạng; `ExamPlayer` (passage + chấm /10); test thật JSON hợp lệ |
| 22 | Thanh tiến trình khi gen đề | **Done** | `GenProgress`: % theo số byte JSON nhận được (thật) + ước lượng thời gian (lúc model đang nghĩ) + đồng hồ mm:ss |
| 23 | Bong bóng tra cứu nhanh (mọi trang trừ Quiz) | **Done** | `ChatBubble` ở layout; `chatCommand` ép trả lời ngắn (test thật ~39 từ); 2 animation: ẩn/hiện theo route Quiz + bung bubble→chatbox |
| 26 | Bubble kéo-thả + bấm ngoài để đóng | **Done** | Pointer-drag (phân biệt kéo vs bấm bằng ngưỡng 5px), kẹp trong viewport; panel tự lật/kẹp để không tràn màn; overlay trong suốt bắt click ngoài → đóng |
| 27 | Bộ Grammar tĩnh (catalog + AI explainer) | **Done** | (đã nâng cấp ở #28) |
| 28 | Grammar = Hỏi đáp (chat) + Thư viện local | **Done** | Giữ chat tự do như cũ (`GrammarChat`); thư viện bài học sống trong localStorage (`grammarLibrary.ts`, seed từ `grammar.ts`, merge bài mới); AI chỉ gọi khi mở bài rồi lưu local; tab Grammar 2 mục (Hỏi đáp/Thư viện) |
| 29 | Đa model + chọn model per-tab | **Done** | Thêm provider **Gemini** free (`lib/gemini.ts`, SSE); route nhận `provider`; `lib/modelConfig.ts` (`useModel`/`useProviders`, lưu localStorage); `ModelSelector` ở header mỗi tab + bubble (disable Gemini nếu thiếu key); cần `GEMINI_API_KEY` ở client/.env.local |
| 33 | Fix grammar đốt token Claude + thêm Gemini Flash Lite | **Done** | BUG: GrammarLessonView auto-gen lúc mount đọc `model` state còn mặc định "claude" (useModel chưa kịp load localStorage) → fix bằng `getProvider("grammar")` đọc trực tiếp lúc gen. KHÔNG có auto-switch trong code. Thêm lựa chọn model thứ 3: Provider = `claude`/`gemini-flash` (gemini-3.5-flash)/`gemini-flash-lite` (gemini-3.1-flash-lite, rate limit lớn); `GEMINI_MODELS` map ở route; `streamGemini` nhận `model`; `ModelSelector` 3 nút (Claude/Flash/Lite); normalize lựa chọn cũ "gemini"→"gemini-flash". `runCommand`/`GrammarChat` provider đổi sang `string`. |
| 32 | Flashcard: tích lũy bộ (không ghi đè) + 10 thẻ | **Done** | "Tạo mới" giờ LƯU THÀNH BỘ MỚI (`addItem` append, title "bộ N"), không ghi đè bộ cũ cùng chủ đề; avoid-list gom từ TẤT CẢ bộ trước → mỗi bộ khác nhau. Nút chính tải bộ mới nhất. Nâng 6→10 thẻ; maxTokens flashcard=4000 (10 thẻ vượt 2000 → Gemini cắt cụt JSON); `extractJson` chịu dấu phẩy thừa. `library.ts` thêm `listItems`/`addItem`. |
| 31 | Bộ data grammar đầy đủ (35 bài) | **Done** | `grammar.ts`: 35 bài A1→C2, thêm field `category`; catalog nhóm Level → Category (`grammar/page.tsx`); SSG 35 slug; `grammarLibrary` coi seed là canonical (làm mới metadata + thêm bài mới, giữ content/learned theo slug, bỏ slug cũ đã rename). Test: build 45 trang, route mới 200. |
| 30 | Format Grammar: bộ 6 icon cố định | **Done** | `remark-breaks` (newline→ngắt dòng). `GRAMMAR_FORMAT` ép CHỈ 6 icon: ✨ tiêu đề bài · 🔹 tiêu đề mục (Định nghĩa/Công thức/Ví dụ) · ⚠️ mục Lỗi · 💡 mẹo · 📍 lưu ý · ✓ trước "Đúng:". Cấm emoji khác; giữ bảng/đậm/code. Ví dụ 2 dòng (Anh **đậm**/Việt *nghiêng*), Lỗi (**Lỗi N**, Sai/✓Đúng đậm, *Vì sao* nghiêng). Test thật Claude: đúng 6 icon, không lệch. Bài cache cũ cần "Tạo lại". |

### Đa model (Claude / Gemini), chọn per-tab
- **Provider:** Claude (CLI/SDK) mặc định + **Gemini Flash** (free) qua `lib/gemini.ts` (REST SSE `streamGenerateContent`, `GEMINI_API_KEY`, model **`gemini-3.5-flash`** đổi qua `GEMINI_MODEL`). ⚠️ KHÔNG dùng `gemini-2.0-flash` — bản cũ này free-tier limit=0 (429); bản hiện hành là 3.5-flash. Đã test end-to-end OK.
- Route `/api/chat` nhận `provider: "claude"|"gemini"` → Gemini nếu chọn + có key, không thì fallback Claude. `/api/health` trả `providers:{claude,gemini}`.
- **Chọn per-tab:** `lib/modelConfig.ts` lưu lựa chọn từng feature (quiz/essay/grammar/flashcard/check/bubble) vào localStorage (`useModel`). `components/ModelSelector.tsx` (controlled) đặt ở header mỗi tab + header bubble; tự disable Gemini nếu `useProviders()` báo chưa cấu hình.
- `runCommand(... , {provider})` đính provider vào body. Mỗi `generate()` truyền provider của tab.
- **Setup Gemini:** điền `GEMINI_API_KEY` (free tại aistudio.google.com/apikey) vào `client/.env.local` → restart → chọn Gemini ở tab muốn tiết kiệm Claude.

### Grammar: Hỏi đáp (chat) + Thư viện bài học (local)
- Tab Grammar (`app/grammar/page.tsx`) có **2 mục** (Segmented, lưu ở `grammar:tab`):
  - **Hỏi đáp** — `GrammarChat`: chat ngữ pháp tự do như cũ (textarea → stream `/grammar`).
  - **Thư viện** — danh mục bài học nhóm theo level, hiện ✓ đã học + đếm "đã học X/N".
- **Thư viện sống trong localStorage** (`lib/grammarLibrary.ts`): seed từ `grammar.ts` (`grammarLessons`) lần đầu; tự **merge** bài mới khi seed thay đổi (không xoá dữ liệu user). Mỗi bài lưu `content` (markdown AI) + `learned` + `updatedAt`. Hàm: `getAllLessons` / `getLesson` / `saveLessonContent` / `resetLibrary`.
- `grammar.ts` giờ là **seed data** (interface + mảng + `grammarBySlug` + `LEVELS`).
- `app/grammar/[slug]/page.tsx`: server thin + `generateStaticParams` (SSG seed slugs) + `dynamicParams=true` (bài thêm sau vẫn render client). Truyền `slug` → `GrammarLessonView` (client) đọc bài từ thư viện local.
- Nội dung AI **chỉ gọi khi mở bài** (`grammarLessonCommand` bọc aiKeywords + level vào `/grammar`): nếu thư viện đã có `content` → hiện ngay; chưa có → stream rồi `saveLessonContent` (lưu local + đánh dấu học). Nút "Tạo lại" để cập nhật.
- Cross-link: nút "Làm quiz / Flashcard chủ đề này" set `prefill:quizTopic`/`prefill:flashTopic` rồi điều hướng; Quiz/Flashcard đọc prefill lúc mount để điền sẵn topic.
| 24 | Làm đề: bắt đầu → tính giờ + khoá tab | **Done** | Nút "Bắt đầu làm bài" mới hiện đề; đếm ngược 25p (mini)/50p (full), hết giờ auto nộp; khoá Nav (`nav:locked`) + cảnh báo beforeunload |
| 25 | Sửa UI dạng "sắp xếp câu" | **Done** | Prompt yêu cầu list markdown; `normalizePassage` tách mệnh đề a)/b)/c)… xuống dòng nếu model gộp |

### Cấu trúc đề thi THPT 2025 (tham chiếu)
40 câu trắc nghiệm A/B/C/D, 50 phút, 0.25đ/câu. 4 dạng: (1) hoàn thành thông báo/quảng cáo/đoạn văn — 12 câu; (2) sắp xếp câu thành đoạn — 5 câu; (3) điền câu/đoạn còn thiếu — 5 câu; (4) đọc hiểu 2 bài (8 + 10 câu) — 18 câu. Mức tư duy 40/30/30. Nguồn: [ZIM](https://zim.vn/de-minh-hoa-tieng-anh-thpt-nam-2025), [Prep](https://prepedu.com/vi/blog/cac-dang-bai-trong-de-thi-tieng-anh-thpt-quoc-gia), [ILA](https://ila.edu.vn/cau-truc-de-thi-tieng-anh-thpt-quoc-gia-2025). Đề "Rút gọn ~20 câu" giữ đủ 4 dạng nhưng ít câu để tạo nhanh hơn.
- Đề thi gen JSON `{sections:[{instruction, passage?, questions[]}]}`; tạo ngầm (CLI gen đầy đủ, không giới hạn token; SDK dùng `maxTokens=8000`). Mini ~1-2 phút, đầy đủ ~3-5 phút (8 câu ≈ 47s đo thực tế).

**Quy ước trạng thái:** To-Do → In Progress → **Done**.

### Ghi chú
- Đã kiểm thử end-to-end CLI mode: `/api/health` → `mode:cli`; quiz trả JSON parse OK (3 câu), flashcard JSON parse OK (6 thẻ), grammar stream đúng format skill — tất cả không cần API key.
- Quiz/Flashcard yêu cầu model trả JSON (prompt trong `lib/prompts.ts`); parse bằng `lib/extractJson.ts` (chịu được code-fence). Nếu parse fail → hiện thông báo "thử tạo lại".
- Thư viện lưu `localStorage`; gen cùng topic/level/dạng sẽ tự tải lại bản cũ (nút "Tạo mới" để ép gen lại).
- Phần `🔴🟡🟢` trong output Check là nội dung do skill sinh ra (không phải icon UI) — giữ nguyên.

---

## Command gửi lên AI (giữ nguyên)

| Feature | Command |
|---|---|
| Quiz | `/quiz articles 2` |
| Essay | `/essay social media 3` |
| Grammar | `/grammar present perfect` |
| Flashcard | `/flash emotions` |
| Check | `/check I am very happy because yesterday I go to the concert` |

## Ghi chú kỹ thuật

- **CLI mode mặc định** — chỉ cần `claude login`. Không có key thì `getMode()` trả `cli`.
- API key (nếu dùng) chỉ ở `client/.env.local` — browser gọi `/api/chat`, không giữ key.
- Model đổi qua `ANTHROPIC_MODEL` (mặc định `claude-sonnet-4-6`); CLI binary đổi qua `CLAUDE_BIN`.
- `lib/skills.ts` đọc `../skills/english-master/SKILL.md` (cwd = `client/` khi chạy `next dev`/`start`).
