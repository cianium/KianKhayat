# Kian Studio — V10 foundation (not production-ready)

Independent Node 24 service; the existing Astro portfolio stays unchanged. First vertical slice: Google-only owner login, private dashboard, multilingual plaintext article creation/editing, draft/publish/unpublish, public blog. No demo bypass or public signup. Profile/project/certificate management, rich text, media, legacy article migration, links from the portfolio, backups and browser QA remain open.

## Local / VPS preview

- Node 24: `node --test studio/core.test.mjs` from repository root.
- Google Cloud Console: create a Web application OAuth client. Authorized redirect URI: `https://manage.kiankhayat.me/auth/callback`. Configure the consent screen and permitted test user if applicable. The owner account must be explicitly allowed. Prefer specifying the stable Google account subject; first successful verified Gmail login pins the subject to SQLite. Never commit credentials.
- Copy `studio/.env.example` to `studio/.env` on the server, populate it securely, chmod 600.
- In studio, run `docker compose up -d --build`. It binds only 127.0.0.1:8085; mount /data persistently. Configure the existing reverse proxy with exact Host preservation for the two domains and valid HTTPS certificates. Caddy example is provided, do not overwrite an existing proxy or bind ports already in use.
- Configure Cloudflare DNS for manage and blog only after staging checks. Do not change existing DNS for the three portfolio domains. Use TLS Full (strict) when proxied. Keep staging private until authorization is tested.
- Legacy records can now be imported into the private catalog (see below); no old articles are automatically published. The blog initially shows an empty state. Article text is escaped and rendered as plaintext paragraphs, not legacy HTML. Old article URLs and data remain untouched.

## Required before launch

Real Google OAuth integration (allowed and rejected accounts), verify cookie/TLS behavior, restart persistence, database backup and tested restore, rate limit at reverse proxy, review OAuth implementation, test supported languages and mobile accessibility, migrate original articles with sanitizer and preserve dates/URLs, add canonical/redirect/RSS/sitemap, integrate portfolio data, establish release gates. SQLite backups must use the SQLite backup mechanism or coordinated service stop; do not copy just a live WAL database file. Keep DB and backups private and persistent.

## V10.2 private legacy import

Run from the repository root after taking a database backup. On a VPS with the Studio container configured, use:
```sh
cd studio
docker compose run --rm --no-deps -v "$(cd .. && pwd):/legacy:ro" studio node /app/import-legacy.mjs /legacy
```
For a disposable local database: `STUDIO_DB=/tmp/studio-preview.sqlite node studio/import-legacy.mjs .`.
The importer is transactional and idempotent. It stages original JSON (including old HTML, translations and dates), derived hero profile, skills, translation dictionary and original media in the private SQLite catalog. It never overwrites edited catalog entries or silently accepts changed source data. It does not publish or modify Astro files. Visit /inventory on manage after owner login. Media BLOBs are private; signature/size checks are not full decoding or malware scanning. No public media/upload endpoint is enabled yet. Backups include the media and revisions; use a consistent SQLite backup or a coordinated service stop.
