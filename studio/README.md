# Kian Studio — V10 foundation (not production-ready)

Independent Node 24 service; the existing Astro portfolio stays unchanged. First vertical slice: Google-only owner login, private dashboard, multilingual plaintext article creation/editing, draft/publish/unpublish, public blog. No demo bypass or public signup. Profile/project/certificate management, rich text, media, legacy article migration, links from the portfolio, backups and browser QA remain open.

## Local / VPS preview

- Node 24: `node --test studio/core.test.mjs` from repository root.
- Google Cloud Console: create a Web application OAuth client. Authorized redirect URI: `https://manage.kiankhayat.me/auth/callback`. Configure the consent screen and permitted test user if applicable. The owner account must be explicitly allowed. Prefer specifying the stable Google account subject; first successful verified Gmail login pins the subject to SQLite. Never commit credentials.
- Copy `studio/.env.example` to `studio/.env` on the server, populate it securely, chmod 600.
- In studio, run `docker compose up -d --build`. It binds only 127.0.0.1:8085; mount /data persistently. Configure the existing reverse proxy with exact Host preservation for the two domains and valid HTTPS certificates. Caddy example is provided, do not overwrite an existing proxy or bind ports already in use.
- Configure Cloudflare DNS for manage and blog only after staging checks. Do not change existing DNS for the three portfolio domains. Use TLS Full (strict) when proxied. Keep staging private until authorization is tested.
- No articles are imported yet; the blog initially shows an empty state. Article text is escaped and rendered as plaintext paragraphs, not legacy HTML. Old article URLs and data remain untouched.

## Required before launch

Real Google OAuth integration (allowed and rejected accounts), verify cookie/TLS behavior, restart persistence, database backup and tested restore, rate limit at reverse proxy, review OAuth implementation, test supported languages and mobile accessibility, migrate original articles with sanitizer and preserve dates/URLs, add canonical/redirect/RSS/sitemap, integrate portfolio data, establish release gates. SQLite backups must use the SQLite backup mechanism or coordinated service stop; do not copy just a live WAL database file. Keep DB and backups private and persistent.
