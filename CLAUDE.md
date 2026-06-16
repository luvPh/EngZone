# English Learning Web App — Claude Code Briefing

## Tổng quan dự án

Build một web app học tiếng Anh chạy trên localhost, sử dụng Claude API làm AI engine.
App thay thế việc dùng Claude.ai chat trực tiếp bằng một giao diện có UI rõ ràng, progress tracking, và UX tốt hơn trên mobile.

---

## Stack

- **Frontend**: React + Vite (hoặc Next.js nếu muốn SSR)
- **Backend**: Node.js + Express (hoặc Next.js API routes)
- **Database**: SQLite (đơn giản, không cần setup server)
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`)
- **Port**: `3000` (frontend) + `3001` (API) hoặc monorepo Next.js port `3000`

---

## Cấu trúc thư mục đề xuất

```
english-app/
├── CLAUDE.md                  # file này
├── skills/                    # system prompts cho từng feature
│   ├── english-master/
│   │   └── SKILL.md           # master skill — dùng làm system prompt chính
│   ├── quiz-generator/
│   │   └── SKILL.md
│   ├── grammar-explainer/
│   │   └── SKILL.md
│   ├── english-essay-generator/
│   │   └── SKILL.md
│   └── error-corrector/
│       └── SKILL.md
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── page.tsx           # redirect → /quiz
│   │   ├── layout.tsx
│   │   ├── quiz/page.tsx
│   │   ├── essay/page.tsx
│   │   ├── grammar/page.tsx
│   │   ├── flashcard/page.tsx
│   │   ├── check/page.tsx
│   │   └── api/
│   │       └── chat/route.ts  # proxy → Claude API
│   ├── components/
│   │   ├── Layout.tsx         # sidebar nav + tab switcher
│   │   ├── ChatStream.tsx     # streaming response display
│   │   ├── QuizPlayer.tsx     # quiz UI với progress bar
│   │   ├── FlashCard.tsx      # flip card animation
│   │   └── StatsBar.tsx       # streak + accuracy display
│   └── lib/
│       ├── claude.ts          # Claude API wrapper
│       ├── skills.ts          # load SKILL.md files
│       └── db.ts              # SQLite progress tracking
├── .env.local                 # ANTHROPIC_API_KEY=...
└── package.json
```

---

## Core: Cách Skills hoạt động

Mỗi `SKILL.md` trong `/skills/` là một **system prompt** cho Claude API.

```typescript
// src/lib/skills.ts
import fs from 'fs';
import path from 'path';

export function loadSkill(name: string): string {
  const skillPath = path.join(process.cwd(), 'skills', name, 'SKILL.md');
  return fs.readFileSync(skillPath, 'utf-8');
}

// Dùng english-master cho tất cả features
export const MASTER_SKILL = loadSkill('english-master');
```

```typescript
// src/app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { MASTER_SKILL } from '@/lib/skills';

const client = new Anthropic(); // đọc ANTHROPIC_API_KEY từ env

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Stream response về client
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: MASTER_SKILL,    // <-- skill làm system prompt
    messages,
  });

  return new Response(stream.toReadableStream());
}
```

---

## 5 Features cần build

### 1. Quiz (`/quiz`)
- Người dùng chọn topic (Articles / Present Perfect / Modal verbs / Prepositions / Conditionals / Passive voice)
- Chọn level 1–5 (slider)
- Bấm "Tạo quiz" → gửi `/quiz [topic] [level]` lên API
- Hiển thị response dạng text stream
- Parse câu hỏi từ response → render interactive MCQ (optional, có thể bắt đầu với plain text trước)
- Lưu kết quả vào DB: topic, level, score, timestamp

**Command gửi lên AI:**
```
/quiz articles 2
```

### 2. Essay (`/essay`)
- Chọn topic + level → gửi `/essay [topic] [level]`
- Hiển thị essay + vocab + structure + comprehension questions + writing prompt
- Nút "Tạo essay mới" để gen lại
- Lưu vào DB: topic, level, timestamp

**Command:**
```
/essay social media 3
```

### 3. Grammar (`/grammar`)
- Text input để nhập câu hỏi ngữ pháp
- Có quick buttons cho các topic phổ biến: "Present Perfect", "Articles a/an/the", "Gerund vs Infinitive", "Conditionals"
- Stream response với format: One-line → Logic → Vietnamese contrast → Examples → Common traps

**Command:**
```
/grammar present perfect
```

### 4. Flashcard (`/flash`)
- Chọn topic
- Gửi `/flash [topic]` → parse 6 flashcards từ response
- Render flip card animation (CSS transform rotateY)
- Nút "Biết rồi" / "Chưa biết" → track progress trong session
- Lưu vào DB: topic, cards seen, timestamp

**Command:**
```
/flash emotions
```

### 5. Error Checker (`/check`)
- Textarea để nhập text cần sửa
- Gửi `/check [text]`
- Hiển thị response với color coding: 🔴 Critical / 🟡 Moderate / 🟢 Minor
- Lưu vào DB: timestamp (không lưu content vì privacy)

**Command:**
```
/check I am very happy because yesterday I go to the concert
```

---

## Database Schema (SQLite)

```sql
-- Progress tracking
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature TEXT NOT NULL,        -- 'quiz' | 'essay' | 'grammar' | 'flash' | 'check'
  topic TEXT,
  level INTEGER,
  score INTEGER,                -- quiz only: số câu đúng
  total INTEGER,                -- quiz only: tổng số câu
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Streak tracking
CREATE TABLE daily_activity (
  date TEXT PRIMARY KEY,        -- 'YYYY-MM-DD'
  activity_count INTEGER DEFAULT 0
);
```

---

## UI/UX Notes

- **Mobile-first** — app chủ yếu dùng trên iPhone
- **Navigation**: bottom tab bar trên mobile (5 tabs: Quiz / Essay / Grammar / Flashcard / Check)
- **Streaming**: dùng `fetch` với `ReadableStream` để hiển thị response realtime, không phải chờ toàn bộ
- **Loading states**: skeleton UI khi đang generate, không để màn hình trống
- **Error handling**: nếu API fail → hiện retry button, không crash app
- **Home/Stats screen**: streak calendar (7 ngày), tổng quiz đã làm, % chính xác

---

## Env Setup

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
# Install
npm install @anthropic-ai/sdk better-sqlite3
npm install -D @types/better-sqlite3

# Run
npm run dev   # localhost:3000
```

---

## Important: Không cần build lại AI logic

Toàn bộ logic dạy học (format quiz, essay structure, grammar explanation, error severity...) đã được encode trong các SKILL.md files. Claude Code **không cần** implement lại bất kỳ logic nào — chỉ cần:

1. Load đúng SKILL.md làm system prompt
2. Gửi đúng command string lên API  
3. Stream response về UI
4. Lưu kết quả vào SQLite

Đừng cố parse hay transform response của Claude — render trực tiếp dưới dạng markdown là đủ tốt cho MVP.

---

## MVP Scope (build trước)

Thứ tự ưu tiên:

1. `/quiz` — core feature, dễ test nhất
2. `/grammar` — đơn giản nhất (chỉ cần text input + stream output)
3. `/check` — tương tự grammar
4. `/essay` — output dài, cần layout tốt
5. `/flash` — cần animation flip card

Progress tracking (SQLite) có thể add sau khi 5 features chạy ổn.

---

## Files đính kèm

Trong `english-skills-bundle.zip` có đầy đủ 5 SKILL.md files. Giải nén vào thư mục `skills/` của project.
