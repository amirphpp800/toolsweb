# راهنمای نصب و راه‌اندازی خودکار - GlassBlack

## ✅ تنظیمات انجام شده

شما تنظیمات زیر را در داشبورد Cloudflare Pages انجام داده‌اید:

### متغیرهای محیطی (Environment Variables):
- `ADMIN_PASS`: amir0012A_amir0012A# (Plaintext)
- `ADMIN_PASSWORD`: Value encrypted (Secret)
- `ADMIN_USER`: amir0012A_amir0012A# (Plaintext)  
- `ADMIN_USERNAME`: Value encrypted (Secret)

### اتصالات KV (KV Bindings):
- `USERS_KV`: main

## 🚀 راه‌اندازی خودکار

### گام 1: بررسی تنظیمات
```bash
npm run verify
```

### گام 2: راه‌اندازی و دیپلوی خودکار
```bash
npm run setup
```

### گام 3: توسعه محلی (اختیاری)
```bash
npm run dev
```

## 📋 چک‌لیست تکمیل تنظیمات

### در داشبورد Cloudflare Pages:

#### ✅ Environment Variables (تکمیل شده):
- [x] `ADMIN_PASS` (Plaintext)
- [x] `ADMIN_PASSWORD` (Secret)
- [x] `ADMIN_USER` (Plaintext)
- [x] `ADMIN_USERNAME` (Secret)
- [ ] `JWT_SECRET` (Secret) - **نیاز به تنظیم**

#### ✅ KV Bindings (تکمیل شده):
- [x] `USERS_KV` → `main`

#### ⚙️ تنظیمات Functions:
- [ ] Functions directory: `functions/`
- [ ] Build command: (خالی بگذارید)
- [ ] Output directory: `.` (root)

## 🔧 تنظیمات باقی‌مانده

### 1. تنظیم JWT_SECRET
در داشبورد Cloudflare Pages:
1. برو به Settings > Environment variables
2. یک متغیر جدید اضافه کن:
   - Name: `JWT_SECRET`
   - Type: Secret
   - Value: یک رشته تصادفی 32 کاراکتری

### 2. تأیید تنظیمات Functions
در Settings > Functions:
- Compatibility date: `2024-09-02`
- Functions directory: `functions/`

## 🎯 API Endpoints

پس از دیپلوی، این endpoint ها در دسترس خواهند بود:

### احراز هویت کاربران:
- `POST /api/auth/register` - ثبت‌نام
- `POST /api/auth/login` - ورود
- `POST /api/auth/logout` - خروج
- `GET /api/auth/me` - اطلاعات کاربر
- `GET /api/auth/captcha` - دریافت کپچا

### پنل ادمین:
- `POST /api/admin/login` - ورود ادمین
- `POST /api/admin/logout` - خروج ادمین
- `GET /api/admin/status` - وضعیت سیستم
- `GET /api/admin/users` - لیست کاربران

## 🔐 امنیت

### رمزهای پیش‌فرض:
- **نام کاربری ادمین**: `amir0012A_amir0012A#`
- **رمز عبور ادمین**: `amir0012A_amir0012A#`

⚠️ **هشدار امنیتی**: حتماً پس از اولین ورود، رمزهای ادمین را تغییر دهید.

## 🧪 تست سیستم

### 1. تست صفحه اصلی:
- برو به URL پروژه‌ات
- صفحه با تم شیشه‌ای مشکی باید نمایش داده شود

### 2. تست ثبت‌نام:
- یک حساب کاربری جدید بساز
- ورود و خروج را تست کن

### 3. تست پنل ادمین:
- برو به `/admin.html`
- با اطلاعات ادمین وارد شو
- داشبورد وضعیت را بررسی کن

## 🐛 عیب‌یابی

### مشکلات رایج:

#### خطای KV Namespace:
- مطمئن شو `USERS_KV` به `main` متصل است
- در wrangler.toml بررسی کن که binding درست است

#### خطای Authentication:
- `JWT_SECRET` را در environment variables تنظیم کن
- مطمئن شو رمزهای ادمین درست وارد شده‌اند

#### خطای Functions:
- Functions directory باید `functions/` باشد
- Build command باید خالی باشد

## 📞 پشتیبانی

اگر مشکلی داشتی:
1. ابتدا `npm run verify` را اجرا کن
2. خطاها را بررسی کن
3. تنظیمات داشبورد Cloudflare را دوباره چک کن

## 🎉 تبریک!

اگر همه مراحل با موفقیت انجام شد، سایت شما آماده استفاده است!

- **صفحه اصلی**: `https://your-project.pages.dev`
- **پنل ادمین**: `https://your-project.pages.dev/admin.html`
