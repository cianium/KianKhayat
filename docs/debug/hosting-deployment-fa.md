# راهنمای استقرار ایمن سه‌زبانه در Cloudflare Pages

## انتخاب میزبان

**پیشنهاد پیش‌فرض: Cloudflare Pages (پلن رایگان)** برای سایت استاتیک Astro با سه زیر دامنه. CDN، TLS، custom domain، Git deploy و خواندن فایل `_headers` را فراهم می‌کند؛ به VPS و cPanel احتیاج ندارد. طبق اسناد Cloudflare در اکتبر ۲۰۲۶: حداکثر ۵۰۰ Build در ماه در Free، یک Build همزمان، حداکثر ۲۰۰۰۰ فایل و حداکثر ۲۵ MiB برای هر فایل. حد پروژه‌های Pages متصل به یک repo برابر ۵ است، بنابراین سه پروژه کافی است.

جایگزین‌ها:

- **Netlify Free:** custom domain و CDN دارد ولی سقف اعتباریِ پلن رایگان (در زمان بررسی ۳۰۰ credit/month) باید کنترل شود.
- **GitHub Pages:** برای سایت ساده قابل قبول است ولی سیاست هدر `_headers` را اجرا نمی‌کند و سه دامنهٔ جدا روی یک Pages Site به شکل مطلوب این معماری نیستند؛ به سایت/مخزن مستقل یا تغییر طراحی نشر نیاز است.
- **cPanel static hosting:** امکان اجرا دارد، اما سه document root، تنظیم دستی cache/security headers، HTTPS و تحویل خودکار محتوای Git را باید جداگانه مدیریت کرد. Node در زمان درخواست بازدیدکننده لازم نیست.
- **VPS:** برای این سایت توجیه اقتصادی یا عملیاتی ندارد مگر واقعاً backend خصوصی/سرویس دیگری اضافه شود.

## تنظیمات ثابت Cloudflare Pages

**مهم:** Cloudflare Pages در Build image فعلی ممکن است به شکل پیش‌فرض Node 22.16.0 بدهد؛ این نسخه با `undici@8.11.2` سازگار نیست. فایل `.node-version` پروژه روی `24` اضافه شد و متغیر `NODE_VERSION=24` نیز در داشبورد تنظیم شود.

یک ریپوی GitHub حاوی *پوشهٔ ریشهٔ پروژه* (نه پوشهٔ ZIP یا دست‌نوشته‌های Handoff) بسازید. در Cloudflare حساب داشته باشید و repository را با Git integration متصل کنید.

سه پروژهٔ Pages از **همان repo** ایجاد کنید:

| Pages project | Production URL | Build command | Output directory |
|---|---|---|---|
| `kian-en` | `kiankhayat.me` | `npm run build` | `dist/en` |
| `kian-de` | `de.kiankhayat.me` | `npm run build` | `dist/de` |
| `kian-fa` | `fa.kiankhayat.me` | `npm run build` | `dist/fa` |

Root directory هر سه پروژه ریشهٔ repo و Production branch مثلاً `main` است. **متغیر `NODE_VERSION=24`** را در هر سه پروژه ست کنید. هر Build هم‌اکنون سه زبان را می‌سازد؛ فقط دایرکتوری درست انتشار داده می‌شود. این کار ساده و کم‌ریسک است ولی هر تغییر سه مرتبه کل Build را تکرار می‌کند. پس از موفقیتِ اولیه می‌توان بهینه‌اش کرد، بدون تغییر محتوا.

## دامنه و DNS

1. قبل از جابه‌جایی DNS، رکوردهای جاری دامنه به‌خصوص ایمیل `MX`, `TXT`, `SPF`, `DKIM`, `DMARC` را ثبت کنید. حذف اشتباهی آن‌ها می‌تواند ایمیل دامنه را مختل کند.
2. اگر دامنهٔ اصلی از Cloudflare Pages استفاده می‌کند، برای apex لازم است دامنه به‌عنوان یک zone در Cloudflare باشد و nameserverها به شکل صحیح تنظیم شوند. صرفاً تغییر NS بدون ثبت رکوردهای قبلی نکنید.
3. در Cloudflare: **Workers & Pages → kian-en → Custom domains → Set up a domain** و `kiankhayat.me` را ثبت کنید.
4. همین کار برای `kian-de` با `de.kiankhayat.me` و برای `kian-fa` با `fa.kiankhayat.me` انجام دهید. وقتی DNS zone در Cloudflare باشد، CNAME مناسب هنگام اتصال دامنه خودکار ساخته می‌شود.
5. وضعیت certificate/HTTPS را برای هر سه دامنه تأیید کنید. در صورت استفاده از DNS خارجی برای زیر‌دامنه‌ها، CNAME دقیق نشان‌داده‌شده در داشبورد همان پروژه را استفاده کنید.
6. تصمیم دربارهٔ `www` (معمولاً redirect به دامنهٔ اصلی)، فعال‌کردن HTTPS و حذف دامنه‌های پیش‌نمایش از ایندکس لازم است.

## انتشار محتوا با موبایل

1. وارد `https://app.pagescms.org/` شوید و با GitHub وارد شوید.
2. GitHub App رسمی Pages CMS را فقط برای ریپوی سایت مجاز کنید.
3. repo حاوی `.pages.yml` را انتخاب کنید؛ فرم‌های Projects, Certificates, Articles, Featured در سورس تعریف شده‌اند.
4. یک تغییر آزمایشی غیرحساس از موبایل ثبت کنید. Commit باید در GitHub ظاهر شود و Cloudflare باید هر سه پروژه را Build کند.
5. تغییر را روی هر سه URL کنترل کنید. برای جلوگیری از انتشار اطلاعات شخصی، تست را با محتوای عمومی و بی‌خطر انجام دهید.
6. در repo عمومی، `draft: true` فقط انتشار روی سایت را متوقف می‌کند؛ متن هنوز در GitHub در دسترس عموم است.

## چک‌لیست پذیرش قبل از production

- `npm ci`, `npm audit --audit-level=high`, `npm run verify` در CI سالم باشند (در این بسته به دلیل محدودیت محیط، دوباره تأیید نشده‌اند).
- HTTPS، `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` روی سه دامنه بررسی شوند.
- canonical هر صفحه به همان دامنه/زبان درست اشاره کند؛ `hreflang` دوطرفه و sitemap/robots مربوط به همان دامنه باشند.
- `fa` دارای `dir=rtl` و نسخه‌های موبایل و دسکتاپ با Keyboard و Lighthouse واقعی سنجیده شوند.
- EmailJS روی دامنه‌ها allowlist/anti-abuse داشته باشد؛ ارسال یک پیام آزمایشی موفق تأیید شود.
- سیاست Privacy با سرویس‌های واقعی مطابقت پیدا کند **بعد از تأیید متن توسط صاحب سایت**.
- GitHub App و permissionها محدود به ریپوی موردنیاز باشند؛ secret و API key در سورس public نباشند.
- کنترل DNS و rollback: نسخهٔ قبلی Build/Commit شناخته‌شده را قابل بازگشت نگه دارید.

## منابع رسمی، بررسی‌شده در اکتبر ۲۰۲۶

- Cloudflare Pages Limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages Build image / NODE_VERSION: https://developers.cloudflare.com/pages/configuration/build-image/
- Cloudflare Pages Monorepos (۵ پروژه/ریپو): https://developers.cloudflare.com/pages/configuration/monorepos/
- Cloudflare Pages Custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Cloudflare Pages _headers: https://developers.cloudflare.com/pages/configuration/headers/
- Pages CMS Quick start: https://pagescms.org/docs/quick-start/
- GitHub Pages Custom domain: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- Netlify Pricing: https://www.netlify.com/pricing/
