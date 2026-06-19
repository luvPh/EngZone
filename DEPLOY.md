# Deploy EngZone lên Vercel (Gemini free)

App là Next.js 14 nằm trong `client/`. Bản deploy dùng **Gemini free tier** làm
backend AI (serverless không chạy được Claude CLI). Toàn bộ dữ liệu học là
`localStorage` trên trình duyệt — không cần database.

> Local dev **không đổi gì**: vẫn mặc định Claude CLI (subscription). Các thay
> đổi deploy chỉ kích hoạt qua biến môi trường trên Vercel.

---

## 1. Lấy Gemini API key (free)

1. Vào https://aistudio.google.com/apikey → **Create API key**.
2. Copy key dạng `AIza...`.

## 2. Tạo project trên Vercel

1. Vào https://vercel.com → **Add New… → Project**.
2. Chọn repo GitHub **`hikari8126/EngZone`** → **Import**.
3. **QUAN TRỌNG — Root Directory**: bấm **Edit** ở mục Root Directory, chọn
   **`client`** (vì app nằm trong `client/`, không phải gốc repo).
   - Framework Preset tự nhận **Next.js**. Build Command / Output để mặc định.

## 3. Khai báo Environment Variables

Ở bước import (hoặc sau đó: **Settings → Environment Variables**), thêm:

| Name | Value | Bắt buộc |
|------|-------|----------|
| `GEMINI_API_KEY` | `AIza...` (key bước 1) | ✅ |
| `NEXT_PUBLIC_DEFAULT_PROVIDER` | `gemini-flash` | ✅ (để app mặc định chọn Gemini) |
| `GEMINI_MODEL` | `gemini-3.5-flash` | ⬜ tuỳ chọn |

> Không cần `ANTHROPIC_API_KEY`. Vercel tự set `VERCEL=1` nên app tự biết
> không có Claude CLI và sẽ dùng Gemini.

## 4. Deploy

Bấm **Deploy**. Vài phút sau có URL dạng `https://eng-zone-xxx.vercel.app`.
Mỗi lần `git push` lên `main` sau này Vercel **tự build lại**.

## 5. Kiểm tra sau deploy

- Mở `https://<url>/api/health` → phải thấy `"gemini": true`, `"claude": false`.
- Vào app → thanh chọn model mỗi tab: **Claude bị mờ (disabled)**, **Flash/Lite**
  (Gemini) bật và được chọn sẵn.
- Thử Grammar → Hỏi AI, hoặc tạo 1 essay/đề ngắn để xác nhận stream chạy.

---

## Giới hạn cần biết (bản cá nhân)

- **Gemini free** có rate limit (~vài chục lần/ngày với Flash). Đủ cho 1 người
  dùng; nếu gặp `429` thì chờ hoặc đổi sang tab **Lite** (rate limit lớn hơn).
- **Timeout 60s/request** (gói Hobby): đề 40 câu / essay rất dài có thể chạm
  trần. Nếu bị cắt, giảm độ dài hoặc nâng gói Vercel Pro (300s).
- **Dữ liệu theo trình duyệt**: tiến độ học, kho từ… nằm trong `localStorage`
  của đúng trình duyệt đó — không đồng bộ đa thiết bị, xoá cache là mất.

## Cập nhật system prompt

System prompt là `skills/english-master/SKILL.md` (gốc repo), được **nhúng** vào
`client/lib/masterSkill.ts` để bundle được lên serverless. Nếu sửa SKILL.md:

```bash
cd client && node scripts/embed-skill.js   # nhúng lại
```

rồi commit + push (Vercel tự deploy).
