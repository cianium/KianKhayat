# اتصال دامنه‌ها هنگام انتشار

این فاز فقط خروجی آماده کرده؛ هیچ تنظیمی در گیت‌هاب، DNS یا سایت زنده تغییر نکرده است. برای بازبینی محلی نیازی به انجام این مراحل نیست.

## مسیر فعلی: گیت‌هاب پیجز

هر زبان باید سایت پیجز مستقل داشته باشد. کد منبع همچنان یک پروژه است؛ خروجی‌های انتشار جدا هستند.

| خروجی | دامنه |
| --- | --- |
| `dist/en/` | `kiankhayat.me` |
| `dist/fa/` | `fa.kiankhayat.me` |
| `dist/de/` | `de.kiankhayat.me` |

۱. هنگام انتشار، دو مخزن انتشار عمومی برای فارسی و آلمانی بساز. محتوای داخل خروجی هر زبان باید در ریشهٔ شاخهٔ انتشار همان مخزن قرار بگیرد، نه خود پوشهٔ `dist`.

۲. در هر مخزن: `Settings → Pages`؛ منبع انتشار را همان شاخه و مسیر ریشه انتخاب کن. `Custom domain` را مطابق جدول وارد کن. برای انگلیسی از سایت پیجز فعلی استفاده می‌شود؛ تنظیم فعلی دامنهٔ اصلی را بی‌دلیل عوض نکن.

۳. بعد از ثبت دامنه در پیجز، در پنل DNS این دو رکورد را اضافه کن:

| نوع | نام | مقصد |
| --- | --- | --- |
| CNAME | fa | cianium.github.io |
| CNAME | de | cianium.github.io |

۴. پس از تأیید DNS و صدور گواهی، برای هر سایت `Enforce HTTPS` را فعال کن. آدرس مستقیم `/work/` و یک آدرس ناموجود را هم بررسی کن؛ دومی باید پاسخ ۴۰۴ واقعی بدهد.

۵. در سرچ کنسول، نقشه‌های `https://kiankhayat.me/sitemap.xml`، `https://fa.kiankhayat.me/sitemap.xml` و `https://de.kiankhayat.me/sitemap.xml` را ثبت کن. عنوان فارسی پیشنهادی است؛ گوگل می‌تواند آن را بازنویسی کند.

انتشار خودکار از یک مخزن منبع به این سه سایت، هنگام مرحلهٔ انتشار تنظیم می‌شود. هیچ توکن شخصی داخل پروژه قرار نگرفته است. فایل‌های `CNAME` و `.nojekyll` هر خروجی آماده‌اند؛ در انتشار از شاخه، `.nojekyll` را هم منتقل کن تا پوشهٔ `_astro` قابل سرو بماند.

## فرم تماس

ایمیل روی سایت `cian@kiankhayat.me` می‌ماند. دریافت فرم از سرویس EmailJS فعلی انجام می‌شود. قالب باید چهار متغیر `name`، `email`، `subject` و `message` داشته باشد. برای پاسخ مستقیم، `Reply To` همان `{{email}}` باشد.

اگر محدودیت دامنه در EmailJS فعال است، هر سه مبدأ HTTPS را مجاز کن. بعد از انتشار یک پیام آزمایشی از فرم بفرست و رسیدن آن را بررسی کن. وجود یا فوروارد شدن صندوق `cian@kiankhayat.me` مستقل از EmailJS است.

منابع رسمی:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages
- https://developers.google.com/search/docs/specialty/international/localized-versions
