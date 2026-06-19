# Đồng bộ đa thiết bị (Supabase + Google login)

Bật tính năng này thì dữ liệu học (kho từ, họ từ, tiến độ grammar, thư viện,
hoạt động, lựa chọn model) **đồng bộ lên cloud theo tài khoản Google** — đăng
nhập ở điện thoại/laptop nào cũng thấy, không sợ mất khi xoá cache.

> **Env-gated**: nếu KHÔNG set 2 biến `NEXT_PUBLIC_SUPABASE_*`, app chạy y như cũ
> (localStorage-only, không có nút đăng nhập). Bật sync hoàn toàn tùy chọn.

---

## 1. Tạo Supabase project

1. https://supabase.com → **New project** (chọn region gần, đặt mật khẩu DB bất kỳ).
2. Vào **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Tạo bảng + bảo mật (RLS)

Vào **SQL Editor → New query**, dán toàn bộ nội dung `supabase/schema.sql` (trong
repo) rồi **Run**. Tạo bảng `app_state` + policy mỗi user chỉ thấy data của mình.

## 3. Bật đăng nhập Google

**3a. Google Cloud Console** (https://console.cloud.google.com):
1. Tạo project (hoặc dùng project sẵn) → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID** → Application type **Web application**.
3. **Authorized redirect URIs** thêm đúng dòng này (lấy domain từ Supabase URL):
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
4. Tạo xong → copy **Client ID** + **Client secret**.

**3b. Supabase → Authentication → Providers → Google**:
1. Bật **Enable**, dán **Client ID** + **Client secret** ở bước trên → Save.

**3c. Supabase → Authentication → URL Configuration**:
- **Site URL**: URL Vercel của bạn (vd `https://eng-zone-xxx.vercel.app`).
- **Redirect URLs**: thêm cả 2 dòng:
  ```
  https://eng-zone-xxx.vercel.app
  http://localhost:3000
  ```
  (app gọi `signInWithOAuth({ redirectTo: window.location.origin })` nên origin
  phải nằm trong danh sách này.)

## 4. Khai báo env

**Trên Vercel** (Settings → Environment Variables) — thêm 2 biến:
| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (bước 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (bước 1) |

**Local** (muốn test ở máy) — thêm vào `client/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Redeploy (hoặc restart dev). Giờ sidebar (desktop) / góc Home (mobile) có nút
**"Đăng nhập đồng bộ"**.

---

## Cách hoạt động (tóm tắt kỹ thuật)
- Đăng nhập Google → kéo toàn bộ data từ bảng `app_state` về `localStorage`
  (cloud thắng), rồi **reload 1 lần** để app đọc lại. Lần đầu chưa có gì trên
  cloud thì đẩy data local hiện có lên.
- Mỗi khi có thay đổi (ghi vào key `engzone:*`) → tự đẩy lên cloud (debounce ~1.2s)
  qua việc bọc `localStorage.setItem`.
- **Quy tắc xung đột**: last-write-wins theo từng key. Hợp cho 1 người; nếu sửa
  offline ở 2 máy cùng lúc thì máy ghi sau cùng thắng key đó.

## Giới hạn
- Đăng xuất KHÔNG xoá localStorage (data vẫn ở máy đó) — chỉ ngừng đẩy lên cloud.
- Free tier Supabase quá đủ cho cá nhân.
