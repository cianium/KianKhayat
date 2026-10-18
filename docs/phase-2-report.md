# Phase 2 review

## Delivered

- Astro 7.3.8 static project with six real pages, modular components, scripts, styles and assets.
- Three validated JSON content collections, preserving all 7 projects, 8 certificates and 4 articles, their order and original wording.
- All 12 skills and their details; 290 German and 298 Persian translation entries preserved.
- Build-time HTML cards, real internal links, direct route reloads and browser history.
- Persistent light/dark preference and responsive AVIF/WebP portraits.
- Language menu, RTL behavior, skill story bubbles, certificate filtering/timeline/lightbox, article reader, contribution heatmap/fallback, loader, privacy page and 404 page.
- EmailJS integration using the owner's supplied browser configuration and the confirmed name/email/subject/message contract. The site's displayed and mailto email remains cian@kiankhayat.me.
- Original icons and manifest preserved byte-for-byte.

## Measured verification

- `astro check`: 0 errors, 0 warnings, 0 hints.
- Static build: successful; six pages plus sitemap.
- Automated content comparison: 0 unapproved differences; 184 original static text nodes and 52 accessible attributes checked, alongside all collection fields and dictionaries.
- Browser suite: 8 passed, 0 failed, 0 skipped. Includes widths 360, 390 and 1280 pixels with Persian RTL, real route reload/history, theme/photo persistence, dialogs and article reading in all languages.
- EmailJS success/failure and heatmap data/fallback verified with intercepted requests. No real email was sent.
- Invalid project status: build correctly rejects invalid content.
- Dependency audit at verification time: 0 reported vulnerabilities.
- Dark portrait original: 1,799,294 bytes. Generated 720 px AVIF: 20,574 bytes (about 98.9% smaller). The 720 px WebP is 30,144 bytes. Originals remain in source assets.
- All nine icon/manifest assets compared unchanged.

## Explicit content exceptions

The original translation dictionaries are unchanged. Only their visible Persian-name output uses the approved Latin spellings: full name `Kian Khayat`, short name `Kian`. Names in the original SEO metadata remain as supplied until phase 4.

The working contact form adds a localized error message when sending fails. Original success, validation, button and contact texts remain. Existing article reading-time labels remain unchanged; computed times belong to phase 6.

## Review limits

This phase is not deployed and retains the existing visual design. Soft neobrutalism is phase 3. Independent language sites, Persian-only preferred search metadata, reciprocal hreflang and per-language SEO are phase 4. Google ultimately controls the displayed search result.

CMS, Featured strip, new project documentation pages, article URLs/RSS and a mobile upload workflow have not been implemented in this phase. No certificate image/PDF files were supplied. The existing Download button is therefore disabled until a real file exists.

Lighthouse was not run. Fonts and external APIs were blocked or mocked in browser tests, so those tests do not establish live third-party availability or final visual font rendering. The included mobile screenshot illustrates the migration, not the forthcoming design.

Live EmailJS delivery, mailbox configuration, DNS, GitHub Pages settings and CMS login still require their respective later checks. Confirm that the EmailJS template body contains `{{message}}`; after deployment, submit one message and check the configured recipient inbox. The existing cian@kiankhayat.me mailbox/forwarding is independent of the EmailJS form.

## Next phase

After review and approval: apply the requested soft neobrutalist design, keeping the same content, with light/dark and RTL, touch targets, contrast and reduced-motion checks.
