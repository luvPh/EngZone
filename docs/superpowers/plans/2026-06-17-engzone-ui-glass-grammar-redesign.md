# EngZone — Frosted Glass UI + Grammar UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin all of EngZone in a "Frosted Glass" dark-purple visual language and rebuild the Grammar tab into a coverflow → level → lesson experience with progress tracking, search/filter, manual "learned" marking, a lesson TOC, prev/next, and a multi-turn (non-persisted) Ask-AI chat.

**Architecture:** Changes flow through design tokens (`globals.css`, `tailwind.config.js`) and shared primitives (`components/ui.tsx`) so most pages update for free. Grammar gets new focused components (`GrammarCoverflow`, `GrammarLevelView`) plus changes to `GrammarChat`, `GrammarLessonView`, and the `grammarLibrary` data API. All navigation between coverflow ↔ level view is in-memory feature state (no new routes); individual lessons keep the existing `/grammar/[slug]` route.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, lucide-react, react-markdown.

---

## Testing approach (read first)

This project has **no unit-test runner** (no vitest/jest; deps confirmed). Per the repo's CLAUDE.md workflow, verification is:
- `npm run build` from `client/` — must stay **green at 45 pages** (route count must not change; we add no routes).
- `npm run lint` — must pass.
- **Visual check** at `http://localhost:3000` (dev server auto-restarts per project convention).

So instead of TDD red/green steps, each task ends with a **build + lint + visual verification** step. Pure-logic changes (`grammarLibrary.ts`) include an inline Node sanity assertion where useful. Do **not** add a test framework — that is out of scope.

All paths below are relative to `client/`. Commit after each task.

---

## File structure (what changes)

**Tokens / global:**
- Modify `tailwind.config.js` — new shadows.
- Modify `app/globals.css` — `.glass*` / `.reading-surface` utilities, richer background, slider knob.

**Primitives:**
- Modify `components/ui.tsx` — Card variant, glass inputs/buttons/segmented, PageHeader icon, LevelSlider knob, new `ProgressBar`.

**Reading surfaces:**
- Modify `components/OutputPanel.tsx`.

**Chrome:**
- Modify `components/Nav.tsx`, `components/ChatBubble.tsx`.

**Grammar data + AI:**
- Modify `lib/grammarLibrary.ts` — decouple learned, add `setLearned`, `lessonStatus`, `getLevelLessons`, `getLessonNeighbors`.
- Modify `lib/stream.ts` — add `runChat`.
- Modify `lib/prompts.ts` — add `grammarChatTurn`.
- Add `lib/slug.ts` — `slugify` + `nodeText` helpers (for TOC anchors).
- Modify `components/Markdown.tsx` — emit heading ids.

**Grammar UI:**
- Add `components/GrammarCoverflow.tsx` — 3 level cards coverflow (cấp 1).
- Add `components/GrammarLevelView.tsx` — lessons in a level: search + filter + progress + status (cấp 2).
- Modify `app/grammar/page.tsx` — segmented Hỏi AI | Thư viện; Library tab toggles coverflow ↔ level view via feature state.
- Modify `components/GrammarChat.tsx` — multi-turn, no-history notice, reset.
- Modify `components/GrammarLessonView.tsx` — reading-surface, manual mark-learned, TOC, prev/next.

---

## Phase 1 — Design tokens & global styles

### Task 1: Add shadow tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add `glow-accent` and `card-deep` shadows**

In `tailwind.config.js`, replace the `boxShadow` block with:

```js
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "card-deep":
          "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 18px 44px -18px rgba(0,0,0,0.8)",
        "glow-accent":
          "0 10px 24px -8px rgba(124,92,255,0.55), 0 0 0 1px rgba(124,92,255,0.25)",
      },
```

- [ ] **Step 2: Verify build + lint**

Run from `client/`: `npm run build && npm run lint`
Expected: build succeeds (45 pages), lint clean.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(ui): add glow-accent and card-deep shadow tokens"
```

---

### Task 2: Add glass / reading-surface utilities, richer background, slider knob

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add surface utility classes**

Append to `app/globals.css` (after the `@tailwind` lines, anywhere in the file body):

```css
/* ===== Surface system: glass chrome vs solid reading ===== */
.glass {
  background: rgba(30, 34, 46, 0.5);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.12),
    0 16px 40px -18px rgba(0, 0, 0, 0.7);
}
.glass-input {
  background: rgba(255, 255, 255, 0.06);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.glass-nav {
  background: rgba(15, 17, 24, 0.7);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
}
.reading-surface {
  background: #161922;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 2: Strengthen the body background mesh**

In `app/globals.css`, replace the existing `body { ... background-image: ... }` gradient values with stronger stops:

```css
body {
  @apply bg-bg text-slate-100 font-sans antialiased;
  background-image: radial-gradient(
      900px 520px at 100% -10%,
      rgba(124, 92, 255, 0.22),
      transparent 62%
    ),
    radial-gradient(720px 420px at -10% 110%, rgba(56, 189, 248, 0.16), transparent 60%);
  background-attachment: fixed;
}
```

- [ ] **Step 3: Add the round slider knob**

In `app/globals.css`, replace the existing `input[type="range"]` block with:

```css
/* Range slider with a visible round knob */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c5cff, #38bdf8);
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #fff;
  border: 3px solid #7c5cff;
  box-shadow: 0 2px 8px rgba(124, 92, 255, 0.6);
  cursor: pointer;
}
input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #fff;
  border: 3px solid #7c5cff;
  box-shadow: 0 2px 8px rgba(124, 92, 255, 0.6);
  cursor: pointer;
}
```

- [ ] **Step 4: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Then open `http://localhost:3000` — the page background should show a clearly visible purple/cyan glow, and any slider (Quiz/Flashcard "Độ khó") should show a white round knob with a purple ring.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): glass/reading-surface utilities, richer background, slider knob"
```

---

## Phase 2 — Primitives

### Task 3: Card glass + `reading` variant

**Files:**
- Modify: `components/ui.tsx`

- [ ] **Step 1: Replace the `Card` component**

```tsx
export function Card({
  children,
  className = "",
  variant = "glass",
}: {
  children: ReactNode;
  className?: string;
  variant?: "glass" | "reading";
}) {
  const surface = variant === "reading" ? "reading-surface" : "glass";
  return (
    <div className={`${surface} rounded-2xl p-4 ${className}`}>{children}</div>
  );
}
```

(Removes the old `bg-surface border border-border shadow-card` — those are now baked into `.glass`.)

- [ ] **Step 2: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open `http://localhost:3000/quiz` — the form card should now look frosted (translucent, blurred, light top edge).

- [ ] **Step 3: Commit**

```bash
git add components/ui.tsx
git commit -m "feat(ui): Card glass default + reading variant"
```

---

### Task 4: Glass inputs, buttons, segmented, PageHeader icon

**Files:**
- Modify: `components/ui.tsx`

- [ ] **Step 1: Update `inputBase` to glass-input**

Replace the `inputBase` constant:

```tsx
const inputBase =
  "w-full glass-input rounded-xl px-3.5 py-2.5 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition";
```

- [ ] **Step 2: Update `Button` styles**

Replace the `styles` ternary inside `Button`:

```tsx
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-accent to-accent-soft text-white hover:brightness-110 shadow-glow-accent"
      : "glass-input hover:bg-white/10 text-slate-200";
```

- [ ] **Step 3: Update `Segmented` container to glass**

Replace the outer wrapper `div` className inside `Segmented`:

```tsx
    <div className="inline-flex rounded-xl glass-input p-1 gap-1">
```

- [ ] **Step 4: Update `PageHeader` icon tile**

Replace the icon wrapper div inside `PageHeader`:

```tsx
          <div className="w-10 h-10 rounded-xl glass-input text-accent grid place-items-center shrink-0">
            {icon}
          </div>
```

- [ ] **Step 5: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open `http://localhost:3000/quiz` — inputs/segmented/buttons should look frosted; the primary button should have a soft purple glow.

- [ ] **Step 6: Commit**

```bash
git add components/ui.tsx
git commit -m "feat(ui): glass inputs, buttons, segmented, header icon"
```

---

### Task 5: Add `ProgressBar` primitive

**Files:**
- Modify: `components/ui.tsx`

- [ ] **Step 1: Add the component (append to `ui.tsx`)**

```tsx
export function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`h-[7px] rounded-full bg-white/10 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-[#38bdf8] transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`. Expected: green (component unused yet — that's fine).

- [ ] **Step 3: Commit**

```bash
git add components/ui.tsx
git commit -m "feat(ui): add ProgressBar primitive"
```

---

## Phase 3 — Reading surface for content panels

### Task 6: OutputPanel → reading-surface

**Files:**
- Modify: `components/OutputPanel.tsx`

- [ ] **Step 1: Swap the result container classes**

In `OutputPanel.tsx`, replace the populated-state wrapper div className:

```tsx
    <div className="mt-5 reading-surface rounded-2xl p-5 min-h-[80px] animate-fade-up">
```

(was `bg-surface border border-border ... shadow-card`.)

- [ ] **Step 2: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open `http://localhost:3000/grammar`, ask a question, confirm the answer panel is a solid (non-translucent) readable surface with a light border.

- [ ] **Step 3: Commit**

```bash
git add components/OutputPanel.tsx
git commit -m "feat(ui): OutputPanel uses reading-surface"
```

---

## Phase 4 — Chrome (Nav + ChatBubble)

### Task 7: Nav and ChatBubble glass

**Files:**
- Modify: `components/Nav.tsx`
- Modify: `components/ChatBubble.tsx`

- [ ] **Step 1: Sidebar → glass-nav**

In `Nav.tsx`, replace the `<aside>` className `bg-surface/60 backdrop-blur` with `glass-nav` (keep all other classes):

```tsx
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r border-white/10 glass-nav p-4 gap-1">
```

- [ ] **Step 2: Bottom bar → glass-nav**

In `Nav.tsx`, replace the mobile `<nav>` className `bg-surface/95 backdrop-blur border-t border-border` :

```tsx
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex glass-nav border-t border-white/10">
```

- [ ] **Step 3: ChatBubble panel → glass**

In `components/ChatBubble.tsx`, find the floating panel container (the element with `bg-surface`/`border-border` that wraps the bubble's chat box) and replace its `bg-surface border border-border` classes with `glass`. (Use `grep -n "bg-surface\|border-border" components/ChatBubble.tsx` to locate; swap each surface wrapper to `glass`, keep layout/rounding classes.)

- [ ] **Step 4: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open `http://localhost:3000` — sidebar (desktop) should read as frosted glass; the lookup bubble panel should be glass too.

- [ ] **Step 5: Commit**

```bash
git add components/Nav.tsx components/ChatBubble.tsx
git commit -m "feat(ui): glass navigation and lookup bubble"
```

---

## Phase 5 — Grammar data layer

### Task 8: Decouple "learned", add status / progress / neighbor helpers

**Files:**
- Modify: `lib/grammarLibrary.ts`

- [ ] **Step 1: Stop auto-marking learned on save**

Replace `saveLessonContent` so it only persists content (NOT `learned`):

```tsx
/** Persist generated content for a lesson. Does NOT mark it learned. */
export function saveLessonContent(slug: string, content: string): void {
  const list = getAllLessons();
  const next = list.map((l) =>
    l.slug === slug ? { ...l, content, updatedAt: Date.now() } : l
  );
  write(next);
}

/** User-controlled "đã học" toggle. */
export function setLearned(slug: string, value: boolean): void {
  const list = getAllLessons();
  const next = list.map((l) =>
    l.slug === slug ? { ...l, learned: value } : l
  );
  write(next);
}
```

- [ ] **Step 2: Add status + ordering + neighbor helpers (append to file)**

```tsx
export type LessonStatus = "new" | "loaded" | "learned";

/** ○ new (no content yet) · ◐ loaded (content cached) · ✓ learned (user-marked). */
export function lessonStatus(l: StoredLesson): LessonStatus {
  if (l.learned) return "learned";
  if (l.content) return "loaded";
  return "new";
}

/** Lessons of one level, in canonical seed order. */
export function getLevelLessons(level: string): StoredLesson[] {
  return getAllLessons().filter((l) => l.level === level);
}

/** Previous/next lesson within the same level (seed order). */
export function getLessonNeighbors(slug: string): {
  prev: StoredLesson | null;
  next: StoredLesson | null;
} {
  const all = getAllLessons();
  const cur = all.find((l) => l.slug === slug);
  if (!cur) return { prev: null, next: null };
  const inLevel = all.filter((l) => l.level === cur.level);
  const i = inLevel.findIndex((l) => l.slug === slug);
  return {
    prev: i > 0 ? inLevel[i - 1] : null,
    next: i >= 0 && i < inLevel.length - 1 ? inLevel[i + 1] : null,
  };
}
```

- [ ] **Step 3: Inline sanity check for ordering logic**

Run this from `client/` to confirm seed ordering + neighbor math (uses the seed array directly, no localStorage):

```bash
node -e "
const ts=require('fs').readFileSync('lib/grammar.ts','utf8');
const levels=[...ts.matchAll(/level:\s*\"(A1-A2|B1-B2|C1-C2)\"/g)].map(m=>m[1]);
const c={}; levels.forEach(l=>c[l]=(c[l]||0)+1);
console.log('per-level counts:', c);
console.log('total:', levels.length);
if(levels.length!==35){throw new Error('expected 35 lessons, got '+levels.length)}
console.log('OK');
"
```
Expected: `per-level counts: { 'A1-A2': 13, 'B1-B2': 12, 'C1-C2': 10 }`, `total: 35`, `OK`.

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`. Expected: green.

- [ ] **Step 5: Commit**

```bash
git add lib/grammarLibrary.ts
git commit -m "feat(grammar): decouple learned from save; add status/order/neighbor helpers"
```

---

## Phase 6 — Ask-AI multi-turn chat

### Task 9: `runChat` stream helper + concise turn prompt

**Files:**
- Modify: `lib/stream.ts`
- Modify: `lib/prompts.ts`

- [ ] **Step 1: Add `runChat` and route `runCommand` through it**

In `lib/stream.ts`, add `runChat` and refactor `runCommand` to delegate (DRY). Replace the body of `runCommand` and add `runChat`:

```tsx
export type ChatMessage = { role: "user" | "assistant"; content: string };

/** POST a full conversation to /api/chat and stream the assistant reply. */
export async function runChat(
  key: string,
  messages: ChatMessage[],
  h: RunHandlers,
  opts: { maxTokens?: number; provider?: string } = {}
): Promise<void> {
  controllers[key]?.abort();
  const ctrl = new AbortController();
  controllers[key] = ctrl;

  let acc = "";
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        maxTokens: opts.maxTokens,
        provider: opts.provider,
      }),
      signal: ctrl.signal,
    });

    if (!res.ok || !res.body) {
      let msg = `request failed (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {
        /* not JSON */
      }
      h.onError(msg);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      h.onText(acc);
    }
    h.onDone(acc);
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return;
    h.onError(err instanceof Error ? err.message : String(err));
  }
}

/** Single-message convenience wrapper. */
export async function runCommand(
  key: string,
  command: string,
  h: RunHandlers,
  opts: { maxTokens?: number; provider?: string } = {}
): Promise<void> {
  return runChat(key, [{ role: "user", content: command }], h, opts);
}
```

- [ ] **Step 2: Add the concise turn wrapper in `lib/prompts.ts`**

Append to `lib/prompts.ts`:

```tsx
// Hỏi đáp ngữ pháp nhiều lượt: trả lời ngắn gọn đủ ý, không format icon dài.
export function grammarChatTurn(question: string): string {
  return [
    `/grammar ${question}`,
    ``,
    `Trả lời NGẮN GỌN, đủ ý, bằng tiếng Việt; dùng ví dụ ngắn khi cần. Không dùng bộ icon trang trí dài.`,
    NO_SUGGEST,
  ].join("\n");
}
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`. Expected: green.

- [ ] **Step 4: Commit**

```bash
git add lib/stream.ts lib/prompts.ts
git commit -m "feat(grammar): runChat multi-turn helper + concise turn prompt"
```

---

### Task 10: GrammarChat → multi-turn UI

**Files:**
- Modify: `components/GrammarChat.tsx`

- [ ] **Step 1: Replace the component with a multi-turn version**

```tsx
"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { TextArea, Button, Spinner, Card } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { runChat, type ChatMessage } from "@/lib/stream";
import { grammarChatTurn } from "@/lib/prompts";
import { recordActivity } from "@/lib/storage";
import Markdown from "@/components/Markdown";

interface State {
  q: string;
  messages: ChatMessage[]; // display history (raw text); RAM only, resets on reload
  streaming: string; // current assistant reply being streamed
  loading: boolean;
}

const KEY = "grammar:chat";
const INIT: State = { q: "", messages: [], streaming: "", loading: false };

export default function GrammarChat({ provider }: { provider?: string }) {
  const [s, set] = useFeatureState<State>(KEY, INIT);

  const ask = () => {
    const q = s.q.trim();
    if (!q || s.loading) return;
    const history: ChatMessage[] = [...s.messages, { role: "user", content: q }];
    set((p) => ({ ...p, q: "", messages: history, streaming: "", loading: true }));
    recordActivity({ feature: "grammar", topic: q });

    // Wire messages: wrap each user turn with the concise directive.
    const wire: ChatMessage[] = history.map((m) =>
      m.role === "user" ? { role: "user", content: grammarChatTurn(m.content) } : m
    );

    runChat(
      KEY,
      wire,
      {
        onText: (full) => set((p) => ({ ...p, streaming: full })),
        onDone: (full) =>
          set((p) => ({
            ...p,
            messages: [...p.messages, { role: "assistant", content: full }],
            streaming: "",
            loading: false,
          })),
        onError: (msg) =>
          set((p) => ({
            ...p,
            messages: [...p.messages, { role: "assistant", content: `[lỗi] ${msg}` }],
            streaming: "",
            loading: false,
          })),
      },
      { provider }
    );
  };

  const reset = () => set(() => INIT);

  return (
    <div>
      <Card>
        <TextArea
          rows={2}
          value={s.q}
          onChange={(e) => set((p) => ({ ...p, q: e.target.value }))}
          placeholder="vd: phân biệt since và for; khi nào dùng present perfect…"
        />
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={ask} disabled={s.loading || !s.q.trim()}>
            {s.loading ? <Spinner /> : <Sparkles size={18} />}
            {s.loading ? "Đang trả lời…" : "Gửi"}
          </Button>
          {s.messages.length > 0 && (
            <Button variant="ghost" onClick={reset} disabled={s.loading}>
              <Trash2 size={16} /> Xoá hội thoại
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {s.messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "glass-input rounded-2xl px-4 py-3 text-sm text-slate-200"
                : "reading-surface rounded-2xl px-4 py-3"
            }
          >
            {m.role === "user" ? m.content : <Markdown>{m.content}</Markdown>}
          </div>
        ))}
        {s.loading && (
          <div className="reading-surface rounded-2xl px-4 py-3">
            {s.streaming ? (
              <Markdown>{s.streaming}</Markdown>
            ) : (
              <div className="flex items-center gap-2 text-muted text-sm">
                <Spinner /> Đang trả lời…
              </div>
            )}
          </div>
        )}
        {s.messages.length === 0 && !s.loading && (
          <p className="text-muted text-sm text-center py-8">
            Đặt câu hỏi ngữ pháp để bắt đầu hội thoại.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-muted/70">
        Hội thoại không được lưu — tải lại trang sẽ xoá lịch sử.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open `http://localhost:3000/grammar` (Hỏi AI tab): ask two follow-up questions and confirm the second reply uses context from the first (multi-turn), the answers are short, the "không được lưu" note is subtle at the bottom, and "Xoá hội thoại" clears it.

- [ ] **Step 3: Commit**

```bash
git add components/GrammarChat.tsx
git commit -m "feat(grammar): multi-turn Ask-AI chat (RAM-only, concise)"
```

---

## Phase 7 — Grammar Library: coverflow + level view

### Task 11: GrammarCoverflow (cấp 1)

**Files:**
- Create: `components/GrammarCoverflow.tsx`

- [ ] **Step 1: Create the component**

3 level cards in a coverflow; center is enlarged + glowing; clicking the center card calls `onOpen(level)`. Side cards rotate to center on click. Uses `getAllLessons` for progress counts.

```tsx
"use client";

import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/grammar";
import { getAllLessons } from "@/lib/grammarLibrary";
import { ProgressBar } from "@/components/ui";

const META: Record<string, { name: string; emoji: string; grad: string }> = {
  "A1-A2": { name: "Sơ cấp", emoji: "🌱", grad: "from-[#7c5cff] to-[#f0abfc]" },
  "B1-B2": { name: "Trung cấp", emoji: "🚀", grad: "from-[#4f46e5] via-[#7c5cff] to-[#22d3ee]" },
  "C1-C2": { name: "Cao cấp", emoji: "🏛️", grad: "from-[#0ea5e9] via-[#6366f1] to-[#a855f7]" },
};

export default function GrammarCoverflow({
  onOpen,
}: {
  onOpen: (level: string) => void;
}) {
  const [counts, setCounts] = useState<Record<string, { total: number; learned: number }>>({});
  const [center, setCenter] = useState(1); // default focus = Trung cấp

  useEffect(() => {
    const all = getAllLessons();
    const c: Record<string, { total: number; learned: number }> = {};
    for (const lvl of LEVELS) {
      const items = all.filter((l) => l.level === lvl);
      c[lvl] = { total: items.length, learned: items.filter((l) => l.learned).length };
    }
    setCounts(c);
  }, []);

  const totalAll = Object.values(counts).reduce((a, b) => a + b.total, 0);
  const learnedAll = Object.values(counts).reduce((a, b) => a + b.learned, 0);

  return (
    <div>
      <p className="text-center text-sm text-muted mb-4">Chọn cấp độ để bắt đầu</p>

      <div className="flex items-center justify-center gap-0 py-2">
        {LEVELS.map((lvl, i) => {
          const m = META[lvl];
          const c = counts[lvl] ?? { total: 0, learned: 0 };
          const isCenter = i === center;
          const base =
            "flex-none rounded-3xl overflow-hidden glass transition-all duration-300 cursor-pointer";
          const size = isCenter
            ? "w-52 z-10 scale-100 shadow-glow-accent"
            : "w-36 scale-90 opacity-60";
          const overlap = i < center ? "mr-[-22px]" : i > center ? "ml-[-22px]" : "";
          return (
            <div
              key={lvl}
              className={`${base} ${size} ${overlap}`}
              onClick={() => (isCenter ? onOpen(lvl) : setCenter(i))}
            >
              <div
                className={`bg-gradient-to-br ${m.grad} grid place-items-center ${
                  isCenter ? "h-44 text-6xl" : "h-32 text-4xl"
                }`}
              >
                <span style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.4))" }}>
                  {m.emoji}
                </span>
              </div>
              <div className="p-3.5">
                <div className={`font-extrabold text-white ${isCenter ? "text-xl" : "text-base"}`}>
                  {m.name}
                </div>
                <div className="text-xs text-muted mb-2">
                  {lvl} · {c.total} bài
                </div>
                {isCenter && (
                  <div className="flex items-center gap-2">
                    <ProgressBar value={c.learned} max={c.total} className="flex-1" />
                    <span className="text-xs text-ok font-bold">
                      ✓ {c.learned}/{c.total}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* dots */}
      <div className="flex justify-center gap-2 mt-3">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl}
            aria-label={`Cấp ${lvl}`}
            onClick={() => setCenter(i)}
            className={`h-[7px] rounded-full transition-all ${
              i === center ? "w-5 bg-accent" : "w-[7px] bg-white/25"
            }`}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-3.5 mt-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-300">Tổng tiến độ</span>
          <span className="text-accent-soft font-bold">
            {learnedAll} / {totalAll} bài
          </span>
        </div>
        <ProgressBar value={learnedAll} max={totalAll} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`. Expected: green (component not wired yet).

- [ ] **Step 3: Commit**

```bash
git add components/GrammarCoverflow.tsx
git commit -m "feat(grammar): coverflow level selector component"
```

---

### Task 12: GrammarLevelView (cấp 2)

**Files:**
- Create: `components/GrammarLevelView.tsx`

- [ ] **Step 1: Create the component**

Lessons of one level grouped by category, with search box, filter chips (Tất cả / Chưa học / Đã học), level progress, and per-lesson status icons (○ ◐ ✓).

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ProgressBar, TextInput } from "@/components/ui";
import {
  getLevelLessons,
  lessonStatus,
  type StoredLesson,
  type LessonStatus,
} from "@/lib/grammarLibrary";

const STATUS_ICON: Record<LessonStatus, { icon: string; cls: string }> = {
  new: { icon: "○", cls: "text-muted" },
  loaded: { icon: "◐", cls: "text-[#fbbf24]" },
  learned: { icon: "✓", cls: "text-ok" },
};

const LEVEL_NAME: Record<string, string> = {
  "A1-A2": "Sơ cấp",
  "B1-B2": "Trung cấp",
  "C1-C2": "Cao cấp",
};

type Filter = "all" | "todo" | "done";

export default function GrammarLevelView({
  level,
  onBack,
}: {
  level: string;
  onBack: () => void;
}) {
  const [lessons, setLessons] = useState<StoredLesson[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setLessons(getLevelLessons(level)), [level]);

  const learned = lessons.filter((l) => l.learned).length;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lessons.filter((l) => {
      if (filter === "done" && !l.learned) return false;
      if (filter === "todo" && l.learned) return false;
      if (!needle) return true;
      return (
        l.titleVi.toLowerCase().includes(needle) ||
        l.titleEn.toLowerCase().includes(needle)
      );
    });
  }, [lessons, q, filter]);

  // Categories in first-appearance order within the (filtered) set.
  const cats: string[] = [];
  for (const l of visible) if (!cats.includes(l.category)) cats.push(l.category);

  const chip = (key: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
        filter === key ? "bg-accent text-white" : "glass-input text-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-fade-up">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-white mb-3"
      >
        <ArrowLeft size={16} /> Tất cả cấp độ
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent-soft">
          {level}
        </span>
        <h2 className="text-lg font-bold text-white">{LEVEL_NAME[level] ?? level}</h2>
      </div>

      <div className="glass rounded-2xl p-3.5 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-300">Tiến độ cấp độ</span>
          <span className="text-accent-soft font-bold">
            {learned} / {lessons.length} bài
          </span>
        </div>
        <ProgressBar value={learned} max={lessons.length} />
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài học…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 mb-5">
        {chip("all", "Tất cả")}
        {chip("todo", "Chưa học")}
        {chip("done", "Đã học")}
      </div>

      {cats.length === 0 && (
        <p className="text-muted text-sm text-center py-8">Không có bài nào khớp bộ lọc.</p>
      )}

      <div className="space-y-5">
        {cats.map((cat) => (
          <div key={cat}>
            <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2">
              {cat}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {visible
                .filter((l) => l.category === cat)
                .map((l) => {
                  const st = STATUS_ICON[lessonStatus(l)];
                  return (
                    <Link key={l.id} href={`/grammar/${l.slug}`}>
                      <div className="glass rounded-2xl p-3 hover:border-accent/70 transition h-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${st.cls} text-sm`}>{st.icon}</span>
                          <span className="font-semibold text-white text-sm">{l.titleVi}</span>
                        </div>
                        <div className="text-xs text-accent-soft mb-1">{l.titleEn}</div>
                        <p className="text-xs text-muted leading-snug">{l.description}</p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted text-center">
        ○ chưa mở · <span className="text-[#fbbf24]">◐</span> đã tải nội dung ·{" "}
        <span className="text-ok">✓</span> đã học
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`. Expected: green (not wired yet).

- [ ] **Step 3: Commit**

```bash
git add components/GrammarLevelView.tsx
git commit -m "feat(grammar): level view with search/filter/progress/status"
```

---

### Task 13: Wire grammar page (segmented + coverflow ↔ level)

**Files:**
- Modify: `app/grammar/page.tsx`

- [ ] **Step 1: Replace the Library section with coverflow ↔ level state**

Replace the whole file with:

```tsx
"use client";

import { BookOpen } from "lucide-react";
import { PageHeader, Segmented } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { useModel } from "@/lib/modelConfig";
import ModelSelector from "@/components/ModelSelector";
import GrammarChat from "@/components/GrammarChat";
import GrammarCoverflow from "@/components/GrammarCoverflow";
import GrammarLevelView from "@/components/GrammarLevelView";

export default function GrammarPage() {
  const [tab, setTab] = useFeatureState<"ask" | "library">("grammar:tab", "ask");
  const [openLevel, setOpenLevel] = useFeatureState<string | null>(
    "grammar:openLevel",
    null
  );
  const [model, setModel] = useModel("grammar");

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Grammar"
        subtitle="Hỏi AI ngữ pháp tự do, hoặc học theo thư viện bài có sẵn."
        icon={<BookOpen size={20} />}
        right={<ModelSelector value={model} onChange={setModel} />}
      />

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "ask", label: "💬 Hỏi AI" },
            { value: "library", label: "📚 Thư viện" },
          ]}
        />
      </div>

      {tab === "ask" ? (
        <GrammarChat provider={model} />
      ) : openLevel ? (
        <GrammarLevelView level={openLevel} onBack={() => setOpenLevel(null)} />
      ) : (
        <GrammarCoverflow onOpen={(lvl) => setOpenLevel(lvl)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Confirm build still reports **45 pages** (no new routes). Open `http://localhost:3000/grammar`:
- Segmented shows "💬 Hỏi AI" / "📚 Thư viện".
- Thư viện shows the 3-level coverflow; clicking a side card centers it; clicking the centered card opens its level view; "Tất cả cấp độ" returns to coverflow.
- Search + filter chips work; status icons render.

- [ ] **Step 3: Commit**

```bash
git add app/grammar/page.tsx
git commit -m "feat(grammar): coverflow library navigation (2 levels) + clearer tabs"
```

---

## Phase 8 — Grammar lesson page

### Task 14: slug helper + Markdown heading ids

**Files:**
- Create: `lib/slug.ts`
- Modify: `components/Markdown.tsx`

- [ ] **Step 1: Create `lib/slug.ts`**

```tsx
import { Children, isValidElement, type ReactNode } from "react";

/** Flatten React children to plain text (for deriving heading ids). */
export function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children);
  return Children.toArray(node).map(nodeText).join("");
}

/** URL-safe slug from heading text (keeps Vietnamese letters readable enough). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 2: Make `Markdown` emit heading ids**

Replace `components/Markdown.tsx`:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { nodeText, slugify } from "@/lib/slug";

export default function Markdown({ children }: { children: string }) {
  const headingId = (node: React.ReactNode) => slugify(nodeText(node));
  return (
    <div className="prose-claude">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 id={headingId(children)}>{children}</h1>,
          h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open a grammar lesson; in devtools confirm `##` headings render with `id` attributes (e.g. `<h2 id="🔹-ví-dụ" ...>` → id like `ví-dụ`).

- [ ] **Step 4: Commit**

```bash
git add lib/slug.ts components/Markdown.tsx
git commit -m "feat(grammar): heading ids for lesson TOC anchors"
```

---

### Task 15: Lesson page — mark-learned, TOC, prev/next, reading-surface

**Files:**
- Modify: `components/GrammarLessonView.tsx`

- [ ] **Step 1: Add a TOC built from the content's `##`/`###` headings**

Add this helper near the top of `GrammarLessonView.tsx` (after imports):

```tsx
import { slugify } from "@/lib/slug";

function tocFromMarkdown(md: string): { level: number; text: string; id: string }[] {
  const out: { level: number; text: string; id: string }[] = [];
  for (const line of md.split("\n")) {
    const m = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (m) out.push({ level: m[1].length, text: m[2].trim(), id: slugify(m[2].trim()) });
  }
  return out;
}
```

- [ ] **Step 2: Import the new data helpers and neighbors**

Update the import from `grammarLibrary` to include the new functions:

```tsx
import {
  getLesson,
  saveLessonContent,
  setLearned,
  getLessonNeighbors,
  type StoredLesson,
} from "@/lib/grammarLibrary";
```

- [ ] **Step 3: Track `learned` + neighbors in component state**

Inside the component, after the existing `const [fromCache, setFromCache] = useState(false);`, add:

```tsx
  const [learned, setLearnedState] = useState(false);
  const [neighbors, setNeighbors] = useState<{
    prev: StoredLesson | null;
    next: StoredLesson | null;
  }>({ prev: null, next: null });
```

In the `useEffect` that reads the lesson, after `setLesson(l ?? null);`, add:

```tsx
    if (l) {
      setLearnedState(l.learned);
      setNeighbors(getLessonNeighbors(slug));
    }
```

- [ ] **Step 4: Add the mark-learned toggle handler**

Add inside the component (near `goQuiz`/`goFlash`):

```tsx
  const toggleLearned = () => {
    const next = !learned;
    setLearnedState(next);
    setLearned(slug, next);
  };
```

- [ ] **Step 5: Render TOC + mark-learned button + prev/next**

In the returned JSX, change the action button row to add a mark-learned toggle. Replace the `<div className="flex flex-wrap gap-2 mb-1">…</div>` block with:

```tsx
      <div className="flex flex-wrap gap-2 mb-1">
        <Button variant={learned ? "primary" : "ghost"} onClick={toggleLearned}>
          <Check size={16} /> {learned ? "Đã học ✓" : "Đánh dấu đã học"}
        </Button>
        <Button variant="ghost" onClick={() => runGen(lesson, true)} disabled={loading}>
          <RefreshCw size={16} /> Tạo lại
        </Button>
        <Button variant="ghost" onClick={goQuiz}>
          <ListChecks size={16} /> Làm quiz chủ đề này
        </Button>
        <Button variant="ghost" onClick={goFlash}>
          <Layers size={16} /> Flashcard
        </Button>
      </div>
```

Add `Check` and `ChevronLeft`/`ChevronRight` to the lucide import line:

```tsx
import {
  ArrowLeft,
  RefreshCw,
  ListChecks,
  Layers,
  Database,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
```

Immediately **before** `<OutputPanel .../>`, insert the TOC (only when content exists):

```tsx
      {content && !loading && tocFromMarkdown(content).length > 0 && (
        <nav className="glass rounded-2xl p-3 mt-4 mb-1">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Mục lục
          </div>
          <ul className="space-y-1">
            {tocFromMarkdown(content).map((h, i) => (
              <li key={i} className={h.level === 3 ? "pl-3" : ""}>
                <button
                  onClick={() =>
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="text-sm text-slate-300 hover:text-accent text-left"
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
```

Immediately **after** `<OutputPanel .../>`, insert prev/next:

```tsx
      {(neighbors.prev || neighbors.next) && (
        <div className="flex items-center justify-between gap-3 mt-5">
          {neighbors.prev ? (
            <Link
              href={`/grammar/${neighbors.prev.slug}`}
              className="glass rounded-xl px-3 py-2 text-sm text-slate-200 hover:text-white inline-flex items-center gap-1.5 max-w-[48%]"
            >
              <ChevronLeft size={16} className="shrink-0" />
              <span className="truncate">{neighbors.prev.titleVi}</span>
            </Link>
          ) : (
            <span />
          )}
          {neighbors.next ? (
            <Link
              href={`/grammar/${neighbors.next.slug}`}
              className="glass rounded-xl px-3 py-2 text-sm text-slate-200 hover:text-white inline-flex items-center gap-1.5 max-w-[48%] ml-auto"
            >
              <span className="truncate">Bài tiếp: {neighbors.next.titleVi}</span>
              <ChevronRight size={16} className="shrink-0" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
```

- [ ] **Step 6: Make the lesson content use a reading surface**

`OutputPanel` already uses `reading-surface` (Task 6), so the lesson body is covered. No extra change needed here.

- [ ] **Step 7: Verify build + lint + visual**

Run: `npm run build && npm run lint`. Open a lesson at `http://localhost:3000/grammar/present-perfect` (or any slug from the level view):
- A "Mục lục" box lists the section headings; clicking one smooth-scrolls to it.
- "Đánh dấu đã học" toggles state and persists (reload page → still marked; the level view shows ✓).
- Opening a fresh lesson no longer auto-marks it learned (status stays ◐ until you click).
- Prev/next links appear and navigate within the level.

- [ ] **Step 8: Commit**

```bash
git add components/GrammarLessonView.tsx
git commit -m "feat(grammar): lesson TOC, manual mark-learned, prev/next"
```

---

## Phase 9 — Final sweep

### Task 16: Apply reading-surface to remaining content panels + full verification

**Files:**
- Modify (as needed): `components/EssayView.tsx`, `components/QuizPlayer.tsx`, `components/ExamPlayer.tsx`

- [ ] **Step 1: Find hardcoded surfaces in result components**

Run from `client/`:

```bash
grep -rn "bg-surface\b\|border-border\|shadow-card" components/EssayView.tsx components/QuizPlayer.tsx components/ExamPlayer.tsx
```

For each match that is a **content/result container** (the box that displays the essay text, an explanation block, or a finished-quiz review panel), replace its `bg-surface border border-border ... shadow-card` classes with `reading-surface`. Leave interactive controls (buttons, option chips) using the glass primitives. If a file has no such container, skip it.

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`. Expected: green, **45 pages**.

- [ ] **Step 3: Visual sweep at `http://localhost:3000`**

Walk each tab and confirm the frosted look is consistent and text panels stay readable:
- Home, Quiz (form + a generated quiz + explanation), Essay (essay + vocab), Grammar (chat, coverflow, level, lesson), Flashcard, Check, Library.
- Confirm sidebar/bottom-nav glass, slider knob, primary-button glow.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): reading-surface for essay/quiz/exam result panels"
```

---

## Self-review notes (coverage map)

- Spec §2 (2 surfaces) → Tasks 2,3,6,16 (glass + reading-surface).
- Spec §3 (tokens/bg/slider) → Tasks 1,2.
- Spec §4 (primitives) → Tasks 3,4,5.
- Spec §5.1 (two clear parts) → Task 13 segmented.
- Spec §5.2 (coverflow → level) → Tasks 11,12,13.
- Spec §5.3 (lesson TOC/prev-next/mark-learned) → Tasks 14,15.
- Spec §5.4 (data layer) → Task 8.
- Spec §5.5 (multi-turn chat, no history, concise, subtle notice) → Tasks 9,10.
- Spec §6 (nav/bubble glass) → Task 7.
- Spec §8 (build green 45 pages, visual) → verification steps throughout + Task 16.

Type consistency check: `lessonStatus`, `setLearned`, `getLevelLessons`, `getLessonNeighbors`, `LessonStatus`, `runChat`, `ChatMessage`, `grammarChatTurn`, `slugify`, `nodeText`, `ProgressBar` — all defined in their introducing task and referenced with matching signatures downstream.
