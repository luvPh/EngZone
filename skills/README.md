# English Learning Skills Bundle

5 skills cho hệ thống học tiếng Anh:

| Skill | Chức năng | Command |
|---|---|---|
| `english-master` | Master skill tổng hợp tất cả | `/quiz`, `/essay`, `/grammar`, `/flash`, `/check` |
| `quiz-generator` | Tạo quiz MCQ + fill-in-blank + error correction | standalone |
| `grammar-explainer` | Giải thích ngữ pháp logic-first, so sánh tiếng Việt | standalone |
| `english-essay-generator` | Tạo essay level 1-5 + vocab + structure + prompt | standalone |
| `error-corrector` | Sửa lỗi 3 cấp độ (🔴🟡🟢) + mini quiz | standalone |

## Cách dùng trong web app

Mỗi SKILL.md là một **system prompt** cho Claude API.
Load SKILL.md → đưa vào `system` field của API call → user chat bình thường.

## API Integration

\`\`\`js
const skill = fs.readFileSync('./english-master/SKILL.md', 'utf8');

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2000,
  system: skill,           // <-- skill làm system prompt
  messages: [
    { role: 'user', content: '/quiz articles 2' }
  ]
});
\`\`\`

## Recommended: english-master

Dùng `english-master` làm system prompt duy nhất — nó đã include logic của cả 4 skill còn lại.
Các skill riêng lẻ chỉ cần nếu muốn tách thành nhiều endpoint.
