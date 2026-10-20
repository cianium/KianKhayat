# انتشار امن سه‌زبانه روی Vercel — بررسی اکتبر ۲۰۲۶

> این سند بر اساس اطلاعات واقعی اتصال GitHub و Vercel تهیه شده است. تأیید دامنه در پنل به‌تنهایی تأیید عملکرد HTTPS، هدرهای واقعی یا انتشار جدیدترین Commit نیست. **هیچ رکورد DNS یا نسخه Production با تهیه این سند تغییر نکرده است.**

## پروژه‌ها و دامنه‌های فعلی

| زبان | نام پروژه Vercel | دامنه سفارشی |
| --- | --- | --- |
| انگلیسی | `kiankhayat-portfolio-en` | `kiankhayat.me` (+ `www.kiankhayat.me`) |
| آلمانی | `kiankhayat-portfolio-de` | `de.kiankhayat.me` |
| فارسی | `kiankhayat-portfolio-fa` | `fa.kiankhayat.me` |

نام‌های `alpha9` فقط نام‌های قدیمی پروژه‌ها هستند. شناسه پروژه‌ها تغییر نکرده و دامنه‌ها بعد از Rename در Vercel دوباره تأیید شده‌اند.

## تنظیمات لازم برای هر پروژه

- **Repository**: `cianium/KianKhayat`.
- **Production Branch**: `main`.
- **Framework**: Astro؛ **Node.js**: 24.
- **Build Command**: `npm run build` (سه نسخه را می‌سازد).
- **Output Directory**: انگلیسی `dist/en`، آلمانی `dist/de`، فارسی `dist/fa`. مقدار *واقعی* این فیلد را در تنظیمات هر پروژه Vercel بررسی کن؛ صحت آن از پاسخ خلاصه‌شدهٔ API قابل‌استخراج نبود.
- **Deployment Protection**: در هر سه پروژه Vercel Authentication برای Preview/آدرس‌های غیرسفارشی برقرار بوده است (`all_except_custom_domains`). این تنظیم نباید برای دیدن Preview عمومی خاموش شود.

## Cloudflare و دامنه

DNS این دامنه‌ها در Cloudflare مدیریت می‌شود. ابزار Vercel دامنه‌ها را `verified: true` و `misconfigured: false` گزارش می‌کند، هرچند در اطلاعات DNS پیشنهاد بررسی آدرس IP وجود دارد. **از راهنمای قدیمی GitHub Pages برای ساخت CNAMEهای جدید استفاده نکن.** پیش از هر ویرایش رکورد، پروکسی Cloudflare، وضعیت TLS، رکوردهای موجود و ایمیل MX/TXT بررسی شوند. هیچ‌کدام از آن‌ها در این ممیزی تغییر نکرده‌اند.

## انتشار و تطبیق نسخه

1. در GitHub موفقیت **Validate and build content** و **Browser E2E** را برای Commit موردنظر بررسی کن.
2. در هر سه پروژه Vercel، آخرین Deployment با `target: production` و `state: READY` را پیدا کن.
3. `githubCommitSha` همان Deployment را با Commit فعلی شاخه `main` مقایسه کن. اگر متفاوت‌اند، خروجی سایت هنوز آخرین نسخه را اثبات نمی‌کند.
4. بدون تغییر DNS، از آدرس دامنه هر زبان مسیرهای `/`، `/work/`، `/articles/`، `/privacy/` و یک مسیر ناموجود را بررسی کن. زبان HTML باید متناسب با دامنه باشد و مسیر ناموجود باید 404 واقعی برگرداند.
5. بعد از تأیید پایداربودن نسخه جدید و درصورت نیاز، انتشار Production را از Vercel انجام بده؛ تغییر Production خارج از مرحله صرفاً ممیزی است.
6. در صورت استفاده از `www`، مطمئن شو Canonical به `https://kiankhayat.me` اشاره می‌کند و برای جلوگیری از صفحات تکراری دربارهٔ Redirect مناسب تصمیم بگیر.

## بررسی امنیت

`scripts/harden-output.mjs` یک CSP با Hash اسکریپت و فایل `_headers` تولید می‌کند. فایل `_headers` برای همهٔ میزبان‌ها معتبر نیست و روی Vercel **به‌تنهایی کافی نیست**. به همین دلیل `vercel.json` برای هر سه پروژه هدرهای زیر را در پاسخ HTTP تعریف می‌کند:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Robots-Tag` برای مسیرهای Admin و فایل‌های Media

**CSP** را به‌صورت ثابت در `vercel.json` ننوشته‌ایم، زیرا سیاست فعلی با Hashهای تولیدشده در زمان Build سازگار است. سیاست **HSTS** هم بدون تأیید TLS و پیکربندی واقعی Cloudflare تشدید نشده است.

پس از انتشار، با درخواست‌هایی فقط خواندنی، هدرهای زنده را کنترل کن:

```bash
curl -I https://kiankhayat.me/
curl -I https://de.kiankhayat.me/
curl -I https://fa.kiankhayat.me/
curl -I https://kiankhayat.me/admin/
```

موفقیت تست محلی به معنی تأیید اعمال هدر در CDN، WAF یا Cloudflare نیست. باید پاسخ HTTP نهایی هر دامنه بررسی شود.

## حریم خصوصی و اطلاعات محرمانه

- شناسه‌های عمومی مرورگر EmailJS با توکن محرمانهٔ سرور فرق دارند و به‌خودی‌خود رمز خصوصی محسوب نمی‌شوند.
- متن Privacy قدیمی دربارهٔ سرویس ارسال پیام و درخواست‌های بیرونی نیازمند بررسی و تأیید مالک سایت است؛ Issue #11.
- اطلاعات تماس و فایل رزومه که به‌صورت عمومی در سورس/سایت دیده می‌شوند باید از منظر حریم خصوصی توسط مالک بررسی شوند؛ این سند آن اطلاعات را بازنشر نمی‌کند.
- هیچ توکن، کلید خصوصی، دامنهٔ DNS یا اطلاعات فرم واقعی در GitHub Actions ثبت نکن.

پیگیری کارهای مانده: [Security issue #14](https://github.com/cianium/KianKhayat/issues/14).

## یادداشت درباره نسخه‌ها

در زمان ممیزی، آخرین Production Deploy تأییدشده برای سه پروژه از Commit `3876c28` بود؛ Commitهای جدیدتر در GitHub الزاماً بدون مشاهدهٔ Deployment Production جدید روی دامنه‌ها منتشر نشده‌اند. این عدد تاریخی است و باید در هر بررسی جدید از نو خوانده شود.
