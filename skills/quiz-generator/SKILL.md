---
name: quiz-generator
description: >
  Generate English practice quizzes with mixed question types (MCQ, fill-in-the-blank, error correction)
  on any grammar point, vocabulary set, or topic. Use this skill whenever the user wants to test
  themselves, practice English, or get exercises to reinforce what they've learned.
  Trigger on phrases like: "tạo quiz", "cho tôi bài tập", "test tôi về", "luyện tập X",
  "make a quiz", "give me exercises", "practice questions", "tạo đề", "bài tập ngữ pháp",
  "ôn tập", "quiz về", "cho tôi câu hỏi về", or any request to practice or be tested on English.
  Also trigger after grammar-explainer or essay-generator sessions when the user wants to consolidate learning.
---

# Quiz Generator

Generates mixed-format English practice quizzes for Vietnamese self-learners. Questions vary in type to keep practice engaging and test different skill dimensions.

---

## Question Types

Rotate between all three types within a single quiz — never use only one type.

### A. Multiple Choice (MCQ)
- 4 options (A/B/C/D)
- Distractors should be plausible, not obviously wrong
- Test grammar, vocabulary, usage in context

### B. Fill in the Blank
- One or more blanks per sentence
- Specify what type of answer is expected if needed (e.g. "verb form", "preposition")
- Can include a word bank for easier difficulty

### C. Error Correction
- Present a sentence with 1 error (underlined or in **bold**)
- User must identify and fix it
- Error should target a real common mistake

---

## Difficulty Levels

| Level | Description |
|---|---|
| 1 | Basic vocab, present/past simple, common phrases |
| 2 | Articles, prepositions, common tenses |
| 3 | Perfect tenses, modals, intermediate vocabulary |
| 4 | Conditionals, passive, advanced collocations |
| 5 | Complex structures, formal register, nuanced usage |

If no level specified, default to **Level 3** and note it.

---

## Output Format

### Quiz Header
```
📝 Quiz: [Topic] — Level [X]
[Number] questions | Mixed format
```

### Questions
Number each question. Label the type subtly:
- No need to say "(MCQ)" — format makes it obvious
- Error correction: mark the error clearly with **bold**

### Answer Key
Always include at the end, clearly separated:
```
---
✅ ANSWER KEY
1. B — [brief explanation why]
2. [correct word] — [1-line reason]
3. [corrected sentence] — [what was wrong]
...
```

Each answer must have a **1-line explanation** — not just the answer. This is essential for learning.

---

## Quiz Sizes

| Request | Number of Questions |
|---|---|
| "quick quiz" / "vài câu" | 5 questions |
| Default (no size specified) | 10 questions |
| "full quiz" / "bài đầy đủ" | 15–20 questions |
| Custom number requested | Honor it |

---

## Distribution Within a Quiz

For a 10-question quiz, aim for roughly:
- 4 MCQ
- 3 Fill in the blank
- 3 Error correction

Scale proportionally for other sizes. Shuffle so types aren't all grouped together.

---

## How to Handle Requests

### Topic specified
*"Quiz về present perfect"* → Generate quiz focused on that point, all questions test it from different angles.

### No topic specified
→ Generate a general mixed-topic quiz at Level 3. Mention: *"Đây là quiz tổng hợp Level 3 — nếu muốn tập trung vào chủ đề cụ thể, cứ nói nhé!"*

### After grammar-explainer session
→ Generate a targeted quiz on the grammar point just explained. Mention: *"Quiz này tập trung vào [grammar point] vừa học."*

### User requests a specific format only
*"Chỉ cho tôi fill in the blank"* → Honor the request, use only that type.

### User wants to review answers
If user submits answers, grade them:
- Mark ✅ or ❌ per question
- For wrong answers: show correct answer + explanation
- Give a score: X/Y correct
- Note any pattern in mistakes: *"Bạn hay nhầm ở [pattern] — đây là điểm cần ôn thêm."*

---

## Language Mode

- Questions: always in **English**
- Instructions within quiz (e.g. "Choose the correct answer"): English
- Answer key explanations: **tiếng Việt** for Level 1–2, mix for Level 3, English for Level 4–5
- If user submits answers for grading: respond in Vietnamese for encouragement/feedback

---

## Quality Checks

Before outputting, verify:
- [ ] At least 2 question types present in every quiz
- [ ] No two consecutive questions of the same type (shuffle if needed)
- [ ] Every answer key entry has an explanation
- [ ] Distractors in MCQ are plausible (not obviously wrong)
- [ ] Error correction sentences have exactly 1 error, clearly marked
- [ ] Difficulty is consistent throughout (don't mix Level 1 and Level 5 in same quiz)
