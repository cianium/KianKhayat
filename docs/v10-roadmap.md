# V10 — Studio & multilingual blog

Baseline main c6cff286 (2026-11-10). Main build and Browser E2E green in GitHub history, not rerun locally. 20 branches; 20 PRs (9 open: #21 + 8 dependency updates); three open issues #10, #11, #14; no releases or rulesets. Main is unprotected. Do not blindly merge #21: it targets Pages CMS and overlaps work already merged in #22. Review its shared translation metadata changes and incorporate only applicable pieces.

## Architecture decision

VPS self-contained Node 24 + SQLite for single-owner content. Keep Astro portfolio design and three current language origins unchanged until migration. Manage: manage.kiankhayat.me, blog: blog.kiankhayat.me. Only Google OAuth and explicit owner allowlist with stable Google subject pin. Private draft data must not be stored in public git. Public access only to published data. New blog URLs /{language}/{slug}/.

## Milestones

1. Foundation: owner login, private session, dashboard, article lifecycle, host separation, deployment skeleton.
2. Secure content model and migration: preserve three projects, eight certificates, four articles, translations, featured order, original portraits and actual media. Keep existing project URLs. Add profile, media and revisions; validate content and maintain backups.
3. UI: responsive RTL/LTR dashboard, profile photo crop/replace, project CRUD/featured/order, certificate CRUD, safe uploads.
4. Blog: rich text, language picker with BCP47, previews and private drafts, categories/search, SEO, canonical/301 redirects, RSS/sitemap, translation associations, article migration.
5. Portfolio integration: shared published content via server-side read model, no GitHub build on edits; preserve SEO and visual design. No production switch until tested.
6. Security and release: OAuth review, auth/CSRF/host/draft isolation, storage policy, dependency audit, backup restore, E2E, mobile/accessibility, deployment and rollback. Review open issues and branch protection with owner.

No production changes or DNS changes authorized in this branch.
