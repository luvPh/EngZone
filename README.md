# EngZone

Web app học tiếng Anh chạy trên localhost, dùng **Claude API** làm AI engine. Thay thế việc chat trực tiếp với Claude.ai bằng một giao diện có UI rõ ràng, mobile-first, progress tracking.

> Briefing & spec đầy đủ: xem [CLAUDE.md](./CLAUDE.md).

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Claude API** qua `@anthropic-ai/sdk` (model mặc định `claude-sonnet-4-6`)
- **SQLite** (progress tracking) — *deferred*, sẽ thêm sau khi 5 feature chạy ổn (xem MVP scope)

## 5 features

| Route | Command gửi lên AI | Mô tả |
|---|---|---|
| `/quiz` | `/quiz [topic] [level]` | Quiz MCQ / fill-in-blank / error correction |
| `/essay` | `/essay [topic] [level]` | Essay + vocab + structure + prompt |
| `/grammar` | `/grammar [câu hỏi]` | Giải thích ngữ pháp logic-first |
| `/flashcard` | `/flash [topic]` | 6 flashcard theo chủ đề |
| `/check` | `/check [text]` | Sửa lỗi 3 cấp độ 🔴🟡🟢 |

Mỗi `skills/<name>/SKILL.md` là một **system prompt**. App load `english-master` làm system prompt duy nhất (đã gộp logic của cả 5 skill).

## Cấu trúc

```
EngZone/
├── CLAUDE.md                 # briefing đầy đủ
├── skills/                   # 5 SKILL.md (system prompts)
│   └── english-master/SKILL.md
├── src/
│   ├── app/
│   │   ├── page.tsx          # redirect → /quiz
│   │   ├── layout.tsx        # shell + bottom tab bar
│   │   ├── quiz|essay|grammar|flashcard|check/page.tsx
│   │   └── api/chat/route.ts # proxy stream → Claude API
│   ├── components/
│   │   ├── TabBar.tsx
│   │   └── useChatStream.ts  # hook stream text từ /api/chat
│   └── lib/
│       ├── claude.ts         # Anthropic client + stream helper
│       └── skills.ts         # load SKILL.md
└── .env.local.example
```

## Chạy local

```bash
# 1. Cài dependencies
npm install

# 2. Cấu hình API key
cp .env.local.example .env.local
# mở .env.local, điền ANTHROPIC_API_KEY=sk-ant-...

# 3. Chạy dev
npm run dev          # http://localhost:3000
```

Lấy API key tại https://console.anthropic.com

## Trạng thái

Đây là **scaffold** — khung dự án đã chạy được (5 tab, streaming response từ Claude). Còn lại theo MVP scope trong CLAUDE.md:

- [ ] Parse quiz response → interactive MCQ
- [ ] Flashcard flip-card animation (parse 6 cards)
- [ ] Color coding cho `/check` (🔴🟡🟢)
- [ ] Thêm SQLite progress tracking + màn hình Stats/streak
