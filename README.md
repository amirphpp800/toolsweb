# GlassBlack - فروش DNS و WireGuard (Static + Cloudflare Pages Functions)

سایت استاتیک با تم شیشه‌ای مشکی (مشکی عمیق) + احراز هویت نام کاربری/رمز و ذخیره کاربران در Cloudflare KV. مناسب برای میزبانی روی Cloudflare Pages.

## ویژگی‌ها
- صفحه فرود شیشه‌ای مشکی
- ثبت‌نام/ورود با نام کاربری و رمز (هش با SHA-256 + Salt)
- کوکی Session مبتنی بر JWT (HttpOnly)
- ذخیره کاربران در Cloudflare KV
- پنل ادمین با ورود ادمین (کوکی جداگانه) و داشبورد وضعیت شبیه نمونه تصویر

## ساختار پروژه
- `index.html` صفحه اصلی
- `admin.html` پنل ادمین
- `assets/css/style.css` استایل
- `assets/js/app.js` منطق فرانت‌اند
- `functions/` Cloudflare Pages Functions
  - `functions/_utils.js` ابزارهای مشترک
  - `functions/api/auth/register.js`
  - `functions/api/auth/login.js`
  - `functions/api/auth/logout.js`
  - `functions/api/auth/me.js`
  - `functions/api/admin/login.js`
  - `functions/api/admin/logout.js`
  - `functions/api/admin/status.js`
  - `functions/api/admin/users.js`
- `wrangler.toml` پیکربندی Workers/Pages + KV
- `.env.example` نمونه متغیرهای محیطی

## نصب و توسعه محلی
1. Node 18+ و Wrangler را نصب کنید:
   ```bash
   npm i -g wrangler
   ```
2. یک KV Namespace بسازید یا در داشبورد Cloudflare ایجاد کنید و مقدارها را در `.env` قرار دهید (بر اساس `.env.example`).
3. Secrets را ست کنید:
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put ADMIN_API_KEY
   ```
4. اجرای local dev:
   ```bash
   wrangler pages dev .
   ```
   سپس به آدرس ارائه‌شده مراجعه کنید.

## دیپلوی روی Cloudflare Pages
- یک پروژه Pages بسازید و این مخزن را متصل کنید.
- در Settings > Functions مطمئن شوید دایرکتوری `functions/` شناخته می‌شود.
- در Settings > Environment variables موارد زیر را تنظیم کنید:
  - `JWT_SECRET`
  - `ADMIN_API_KEY`
- در Settings > KV bindings یک بایندینگ با نام `USERS_KV` متصل کنید (به Namespace ساخته‌شده).

## نکات امنیتی
- از رمزهای قوی و نگهداری امن `JWT_SECRET` و `ADMIN_API_KEY` مطمئن شوید.
- این دمو برای شروع است؛ برای تولید می‌توانید محدودیت نرخ (Rate Limit)، اعتبارسنجی ایمیل، و Captcha اضافه کنید.

## API خلاصه
- POST `/api/auth/register` { username, password }
- POST `/api/auth/login` { username, password }
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/admin/login` { username, password } (با مقادیر ادمین)
- POST `/api/admin/logout`
- GET `/api/admin/status` (وضعیت KV/ادمین/سرویس/تعداد کاربران)
- GET `/api/admin/users` (نیازمند سشن ادمین)

## فونت محلی
برای استفاده از فونت محلی و عدم وابستگی به Google Fonts:
- فایل فونت خود را با نام `Vazirmatn.woff2` در مسیر `assets/fonts/` قرار دهید.
- استایل از طریق `@font-face` در `assets/css/style.css` بارگذاری می‌شود.
