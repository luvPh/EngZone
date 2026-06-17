# EngZone

Web app học tiếng Anh chạy local, dùng **Claude API** làm AI engine. Giao diện hiện đại, mobile-first, streaming response realtime.

> Roadmap & spec đầy đủ: xem [CLAUDE.md](./CLAUDE.md).

## Stack

- **Next.js 14** (App Router, full-stack) + **React 18** + **TypeScript**
- **Tailwind CSS 3** + **lucide-react** icons — responsive (sidebar desktop / bottom tabs mobile)
- **Claude** — 2 chế độ tự chọn: **Claude CLI** (subscription, mặc định, không cần key) hoặc **API key** (`@anthropic-ai/sdk`). Model mặc định `claude-sonnet-4-6`.
- Progress tracking bằng `localStorage` (streak, lượt luyện tập)

App là **một Next.js app** trong `client/`. Việc gọi Claude (CLI hoặc SDK) chạy server-side trong Route Handler `app/api/chat/route.ts` — key/CLI không lộ ra browser.

## Tính năng

| Route | Mô tả |
|---|---|
| `/` | Home: streak + lịch 7 ngày + lối tắt tính năng |
| `/quiz` | **Luyện tập**: nhập chủ đề + số câu + dạng + độ khó → tự trả lời → chấm điểm. **Đề thi THPT**: tạo đề thi thử đúng cấu trúc tốt nghiệp THPT 2025 (4 dạng, 20/40 câu) → chấm /10 |
| `/essay` | Sinh **essay + từ vựng** (vocab hiển thị từng dòng), không kèm structure/comprehension |
| `/grammar` | Giải thích ngữ pháp (logic-first) |
| `/flashcard` | Bộ 6 thẻ theo **chủ đề + độ khó** — carousel 1 thẻ to, nút Tiếp, phát âm, lật xem nghĩa |
| `/check` | Sửa lỗi tiếng Anh theo mức độ |
| `/library` | **Thư viện**: quiz/essay/flashcard đã tạo — xem lại, tái dùng (tránh gen trùng), xoá |

Mỗi `skills/<name>/SKILL.md` là một system prompt. App load `english-master` (đã gộp logic cả 5 skill) làm system prompt duy nhất.

**Bong bóng tra cứu nhanh** (góc dưới phải, mọi trang trừ Quiz): hỏi nhanh nghĩa từ/ngữ pháp, trả lời ngắn gọn để tiết kiệm token. **Đề thi THPT** có nút "Bắt đầu làm bài" → đếm ngược (25p mini / 50p full), hết giờ tự nộp, và khoá chuyển tab khi đang làm.

**State** giữ trong RAM (`lib/store.tsx`) → chuyển tab không mất dữ liệu, chỉ reset khi tải lại trang. Quiz & flashcard gen ngầm dưới dạng JSON rồi render UI tương tác; quiz/essay/flashcard được lưu vào thư viện (`localStorage`).

## Chạy local

**Mặc định dùng Claude CLI (subscription) — không cần API key.** Chỉ cần đã đăng nhập 1 lần: `claude login`.

```bash
# 1. Cài dependencies (root + client)
npm run install:all

# 2. Chạy dev (tự dùng Claude CLI)
npm run dev          # http://localhost:3000

# Kiểm tra mode đang chạy:
curl http://localhost:3000/api/health   # → {"mode":"cli",...}

# Build production
npm run build
```

**Tuỳ chọn — dùng API key thay vì subscription:**
```bash
cp client/.env.local.example client/.env.local   # điền ANTHROPIC_API_KEY=sk-ant-...
```
Có key → app tự chuyển sang API mode. Lấy key tại https://console.anthropic.com

## Cấu trúc

```
EngZone/
├── CLAUDE.md          # roadmap (living)
├── package.json       # scripts uỷ quyền sang client/
├── skills/            # 5 SKILL.md (system prompts)
└── client/            # Next.js app
    ├── app/           # pages (quiz/essay/grammar/flashcard/check/library) + api/chat + api/health
    ├── components/    # Nav, ui, Markdown, OutputPanel, QuizPlayer, CardCarousel
    └── lib/           # claude/claudeCli (CLI+SDK), store, stream, prompts, extractJson, library, storage, types
```
