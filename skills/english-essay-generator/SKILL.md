---
name: english-essay-generator
description: >
  Generate English essays at difficulty levels 1–5 for writing and argument analysis practice.
  Use this skill whenever the user wants to practice English writing, read a sample essay to analyze,
  get writing prompts, study essay structure, or build up reading/writing skills progressively.
  Trigger on phrases like: "tạo essay", "gen essay", "cho tôi một bài essay", "essay level",
  "bài viết tiếng Anh để luyện", "give me an essay to practice", "essay difficulty", "writing practice",
  "essay mẫu", "essay theo chủ đề", "luyện viết essay", or any request to produce an English essay
  for study or practice purposes — even if they don't say "skill" or "generate" explicitly.
---

# English Essay Generator

Generates English essays at 5 difficulty levels, designed for **Writing** and **Argument Analysis** practice. Each essay comes with a full learning package.

---

## Difficulty Scale

AI determines all difficulty parameters automatically based on the level requested.

| Level | Label | Description |
|---|---|---|
| 1 | Beginner | Simple sentences, everyday vocabulary, 1–2 clear arguments, ~150 words |
| 2 | Elementary | Short paragraphs, common idioms, basic transitions, ~200 words |
| 3 | Intermediate | Multi-paragraph, varied sentence structure, some academic vocab, ~250 words |
| 4 | Upper-Intermediate | Complex sentences, nuanced arguments, formal register, ~320 words |
| 5 | Advanced | Sophisticated syntax, abstract ideas, counter-arguments, advanced vocab, ~400 words |

Difficulty is determined holistically across:
- **Vocabulary complexity** (everyday → academic → specialized)
- **Sentence structure** (simple → compound → complex/embedded clauses)
- **Argument depth** (1 claim → thesis + body + rebuttal)
- **Topic abstraction** (concrete → conceptual)

---

## Output Format

Always produce the full learning package in this order:

### 1. 📄 The Essay
- Label clearly: `**[Level X — Topic Title]**`
- Write in natural, authentic English
- Match the difficulty parameters above precisely

### 2. 🏗️ Essay Structure Breakdown
Explain the structure used:
- Type of essay (opinion / argumentative / descriptive / expository)
- How many paragraphs and what each does (intro / body / conclusion)
- Key argument moves used (claim, evidence, counter-argument, concession, etc.)
- Why this structure fits the topic

### 3. 📚 Vocabulary Spotlight
List **5–10 key words/phrases** from the essay:
- Word / phrase
- Meaning in context (plain English, not dictionary)
- Example sentence (different from the essay)
- Level note: why this word fits this difficulty level

### 4. ❓ Comprehension Questions
Write **3–5 questions** that test understanding and argument analysis:
- At least 1 factual question (What does the author say about X?)
- At least 1 inference question (Why does the author believe Y?)
- At least 1 critical question (Do you agree with the argument? Why or why not?)

### 5. ✍️ Writing Prompt
Give the user a **writing task** based on the essay:
- Same topic, same difficulty level
- Clear task type: agree/disagree, compare/contrast, personal response, etc.
- Word count target appropriate to level
- 1–2 hints or structural suggestions to help them get started

---

## How to Handle Requests

### User specifies level + topic
→ Generate directly. Example: *"Gen essay level 3 về môi trường"*

### User specifies level only
→ Pick an engaging, universal topic appropriate to that level. Mention the topic chosen before starting.

### User specifies topic only
→ Ask for level, OR default to Level 3 with a note: *"I'll generate this at Level 3 (Intermediate) — let me know if you'd like a different level."*

### User asks for "easy" / "hard" / "medium" without a number
→ Map to levels: easy → 1–2, medium → 3, hard → 4–5. Confirm before generating.

### User wants to level up from a previous essay
→ Regenerate the same topic at the next level, noting what changed in difficulty.

---

## Topic Suggestions by Level

**Level 1–2:** Family, school, hobbies, food, daily routines, seasons, pets
**Level 3:** Social media, environment, travel, education systems, city vs. countryside
**Level 4:** Technology and privacy, remote work, gender equality, cultural identity
**Level 5:** AI ethics, economic inequality, philosophy of education, geopolitics, free will vs. determinism

---

## Quality Checks

Before outputting, verify:
- [ ] Vocabulary and syntax genuinely match the stated level (don't under- or over-shoot)
- [ ] Essay has a clear argument, not just a description
- [ ] Comprehension questions range from surface to critical
- [ ] Writing prompt is actionable and level-appropriate
- [ ] Output is in English throughout (except the Writing Prompt hints, which can be bilingual if helpful)
