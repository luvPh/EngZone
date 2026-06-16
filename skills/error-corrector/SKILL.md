---
name: error-corrector
description: >
  Correct English writing errors and explain why they're wrong, with depth scaled to error severity.
  Use this skill whenever the user pastes English text, a sentence, paragraph, or essay and wants
  it corrected or improved. Trigger on phrases like: "sửa lỗi", "check giúp tôi", "có lỗi không",
  "correct this", "fix my English", "is this correct?", "grammar check", "proofread",
  "tôi viết thế này đúng không", "sửa câu này", "check bài viết", "có gì sai không",
  or whenever the user shares English text and seems to want feedback. Also trigger when
  user asks "how do I say X in English?" and their attempt contains an error.
---

# Error Corrector

Corrects English errors with explanations scaled to error severity. For Vietnamese self-learners — not just "this is wrong" but "here's why, here's the pattern, here's how to never make this mistake again."

---

## Error Severity System

Classify every error before deciding how much explanation to give:

### 🔴 Critical (Level 3 response)
Errors that make the sentence grammatically wrong or change the meaning significantly.
- Wrong tense that changes meaning
- Missing/wrong subject-verb agreement
- Incorrect word form (noun used as verb, etc.)
- Wrong preposition that causes confusion
- Sentence fragment or run-on

→ **Response:** Correction + full explanation + rewrite variants + mini quiz

### 🟡 Moderate (Level 2 response)
Errors that are noticeable to native speakers but meaning is still clear.
- Article errors (missing "the", wrong "a/an")
- Minor preposition confusion
- Awkward but grammatically defensible word choice
- Wrong but understandable tense

→ **Response:** Correction + explanation + 1 alternative rewrite

### 🟢 Minor (Level 1 response)
Stylistic issues, word choice that's technically correct but unnatural.
- Slightly formal/informal mismatch
- Redundancy
- Word choice that works but isn't idiomatic

→ **Response:** Suggestion + 1-line note. Don't over-explain.

---

## Output Format

### For a single sentence:

**Corrected:** [corrected sentence]

Then based on severity (see above):

**🔴 Critical — Full Explanation:**
1. ❌ What was wrong: [identify the specific error]
2. 🧠 Why it's wrong: [the grammar rule/logic, in Vietnamese for common errors]
3. 🇻🇳 Vietnamese note: [why Vietnamese speakers commonly make this mistake]
4. ✅ Alternative rewrites: [2–3 other ways to say the same thing correctly]
5. 🔁 Mini quiz: [1 quick question to test understanding of the rule just explained]

**🟡 Moderate — Standard Explanation:**
1. ❌ What was wrong + why (combined, 2–3 sentences)
2. ✅ One alternative rewrite

**🟢 Minor — Quick Note:**
→ [One-line suggestion, optional]

---

### For a paragraph or longer text:

**Step 1: Overview**
Give a 2–3 sentence summary of the overall quality and main error patterns before diving in.
Example: *"Đoạn văn này khá tốt — ý tưởng rõ ràng. Lỗi chính tập trung ở article và preposition, hai điểm rất phổ biến với người học tiếng Việt."*

**Step 2: Annotated corrections**
Show the corrected text with errors marked inline:
- ~~strikethrough~~ for deleted text
- **bold** for added/changed text
- [Note X] markers for errors that need explanation

**Step 3: Error breakdown**
Number each [Note X] and explain following the severity system.

**Step 4: Pattern summary**
If 3+ errors share a pattern, call it out:
*"Pattern: Bạn hay bỏ sót article 'the' trước danh từ xác định — đây là lỗi rất phổ biến vì tiếng Việt không có article."*

**Step 5: Polished version**
Always end with the full clean corrected text, no annotations, ready to use.

---

## Mini Quiz Format (for Critical errors only)

Keep it short — 1 question only, immediately after the explanation:

```
🔁 Quick check: Choose the correct sentence:
A. [incorrect version similar to original error]
B. [correct version]
C. [different type of error]
D. [correct but different structure]

→ Answer: [letter] — [1-line reason]
```

---

## Language Mode

| Error Type | Explanation Language |
|---|---|
| Critical errors, basic grammar | Tiếng Việt (higher clarity for learner) |
| Moderate errors | Mix — key terms English, explanation Vietnamese |
| Minor/stylistic | English preferred (closer to native feedback feel) |
| Pattern summaries | Always tiếng Việt for impact |

---

## Special Cases

### User asks "is this correct?" about something that IS correct
→ Confirm it's correct, then add one note about how to make it even more natural if applicable: *"Câu này đúng ngữ pháp! Nếu muốn tự nhiên hơn một chút, bạn cũng có thể nói..."*

### Text has too many errors to address all
→ Focus on the **top 3 most impactful error patterns**, note that you've prioritized: *"Bài có nhiều điểm cần cải thiện — mình sẽ tập trung vào 3 lỗi quan trọng nhất trước."*

### Error is ambiguous (could be correct depending on intent)
→ Ask for clarification or present both readings: *"Câu này có thể hiểu theo 2 cách — bạn muốn nói [meaning A] hay [meaning B]?"*

### User just wants a clean version without explanation
*"Sửa nhanh cho tôi"* → Give corrected version only, no breakdown. Offer: *"Nếu muốn giải thích chi tiết lỗi nào, cứ hỏi nhé."*

---

## Tone

- Never make the user feel bad about mistakes
- Frame every correction as *expected and learnable*: *"Đây là lỗi cực kỳ phổ biến với người Việt học tiếng Anh vì..."*
- Celebrate good writing when it's genuinely there
- Be specific — "awkward" alone is not helpful; say *what* makes it awkward and *how* to fix it
