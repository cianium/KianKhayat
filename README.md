<div align="center">

# Kian Khayat — Developer Portfolio

**A multilingual developer portfolio built with Astro, TypeScript, and Git-based content management.**

[![Validate and build content](https://github.com/cianium/KianKhayat/actions/workflows/content-build.yml/badge.svg)](https://github.com/cianium/KianKhayat/actions/workflows/content-build.yml)
[![Browser E2E](https://github.com/cianium/KianKhayat/actions/workflows/browser-e2e.yml/badge.svg)](https://github.com/cianium/KianKhayat/actions/workflows/browser-e2e.yml)
![Astro](https://img.shields.io/badge/Astro-7.3.8-BC52EE?logo=astro&logoColor=white)
![Project](https://img.shields.io/badge/Status-Active%20development-2188FF)

**English · Deutsch · فارسی**

[English website](https://kiankhayat.me/) · [German website](https://de.kiankhayat.me/) · [Persian website](https://fa.kiankhayat.me/)

</div>

> **Deployment note:** These are the *configured domains*. Passing GitHub build checks does not establish that all three domains serve the latest source or implement the required HTTP security headers. See [Deployment and verification](docs/release-steps-fa.md).

## Overview

This repository contains my personal developer portfolio: project showcases, articles, selected work, certificates, and a contact interface. It is a **static Astro website**, with separate production build outputs for three languages and a Git-backed content workflow.

The project demonstrates an approach to accessible frontend engineering, content modeling, static site generation, internationalization, SEO, automated quality checks, and safe publication of rich-text content.

## Highlights

| Area | Implemented in the repository |
| --- | --- |
| Multilingual experience | Independently built EN, DE and FA sites; right-to-left Persian layout |
| Portfolio content | Project pages, featured work, certificates, and articles stored as validated JSON collections |
| Article publishing | Original-language articles, reading time, table of contents, SEO metadata and RSS |
| Git-based content management | Pages CMS configuration and workflows for editing JSON content |
| Accessibility and theming | Keyboard-accessible UI patterns, responsive layouts and light/dark themes |
| Safety | Build-time HTML sanitization, media validation and CSP checks |
| Quality | Astro type checks, content/schema checks, SEO/release checks, security unit tests and Playwright browser tests |

**Content snapshot:** The checked-in catalog contains two source-linked project entries, eight certificate records, and four articles. A record in the portfolio is not by itself verification of an external project deployment, certificate, or credential. Some images, PDFs, repository-specific links, and documentation still need owner-provided verification.

## Technology

- **Frontend:** Astro 7, TypeScript, JavaScript, HTML and CSS.
- **Content:** Astro Content Collections, JSON schemas and Pages CMS integration.
- **Testing:** Node.js tests, Playwright and axe-core accessibility checks.
- **Build and CI:** Node.js 24, GitHub Actions and npm.
- **Contact:** EmailJS browser integration. Delivery depends on external account and domain configuration.

## Getting started

**Requirements:** Node.js 22.12+ (Node 24 recommended) and npm.

```bash
git clone https://github.com/cianium/KianKhayat.git
cd KianKhayat
npm ci
npm run build
npm run preview
```

The local preview serves:

| Language | Built folder | Local URL | Configured domain |
| --- | --- | --- | --- |
| English | `dist/en` | `http://127.0.0.1:4322` | `https://kiankhayat.me` |
| German | `dist/de` | `http://127.0.0.1:4323` | `https://de.kiankhayat.me` |
| Persian | `dist/fa` | `http://127.0.0.1:4324` | `https://fa.kiankhayat.me` |

Use `PORT=8080 npm run preview` to serve the language previews on 8080–8082. The local preview rewrites navigation links to the matching local port but retains production canonical metadata. Do not open built HTML directly with `file://`.

For development, run `npm run dev`, `npm run dev:de`, or `npm run dev:fa` for the corresponding locale.

## Validation

Project cards and links are checked against known repository sources. Unverified concepts are omitted from the public project grid, and each listed project has two distinct Source Code / Live Demo buttons; and `Live` is not treated as proof of a current deployment.


```bash
npm run check:cms
npm run check:projects
npm run test:security
npm run test:editorial
npm run build
npm run check:seo
npm run check:articles
npm run check:release
```

To run browser integration and accessibility checks:

```bash
npx playwright install chromium
npm run test:e2e
```

The repository has two separate GitHub Actions quality gates:

- **Validate and build content:** dependency audit, schema/content checks, unit security and editorial checks, all three site builds, and SEO/release validation.
- **Browser E2E:** Chromium tests of navigation, language behavior, content, security, accessibility, and responsive UI on the generated local previews. Network-backed actions such as email are mocked.

These checks verify the **repository and local build**, not the login of a hosted CMS, actual email delivery, live DNS, or the configuration of public web servers.

**Note:** `npm run check:content` compares source data to a frozen historical migration snapshot, so it may fail after intentional editorial changes and is not automatically part of content-authoring CI. The standalone `node tests/cms-lifecycle.mjs` test uses temporary test content; it is not a hosted authentication test.

## Repository layout

```text
src/
  components/         Astro components and UI
  content/            Articles, projects, certificates, featured content
  data/               Localization, site configuration, SEO and content helpers
  pages/              Static routes, feeds and sitemap
  security/           Article HTML safety utilities
  styles/             Component and global styles
public/               Public static media, icons and resume file
scripts/              Build, content, media, SEO, security and release checks
tests/                Playwright E2E and Node test suites
docs/                 Historical QA reports and owner/deployment guides
.github/workflows/     Source validation and browser quality gates
```

## Content editing

Content is stored in version-controlled JSON. The optional hosted editing workflow is based on **Pages CMS**, not a custom CMS with proprietary authentication.

1. Review [CMS setup instructions (FA)](docs/admin-setup-fa.md).
2. Connect the appropriate GitHub repository/branch through Pages CMS with an authorized GitHub account.
3. Edit articles, projects, certificates or featured cards.
4. Review the resulting commit and GitHub Actions reports.

Draft content committed to a **public repository is not private**. Do not upload private manuscripts, unapproved certificates, tokens, or other secrets.

## Deployment and known limitations

- The current build creates separate `dist/en`, `dist/de` and `dist/fa` trees. Hosting must serve each tree at the root of its intended domain.
- The included GitHub Actions workflows **test and package**, but do not publish the website automatically.
- Security headers included in build output require a host that actually honors them; GitHub Pages does not apply `_headers`. Verify live CSP, HTTPS and caching independently.
- CMS login, EmailJS delivery, and final live-domain checks require the site owner's external account setup and review.
- The existing privacy page is **awaiting owner approval and accuracy review**; see [proposed policy](docs/privacy-proposed-en-de-fa.md). Do not consider this repo a legal-compliance certification.
- Project-specific proofs, licenses, actual credential links and media should be verified before being presented as completed or professionally certified work.

See [release steps (FA)](docs/release-steps-fa.md), [phase 9 QA report (FA)](docs/phase-9-report.md), and [deployment/domain setup](docs/domain-setup-fa.md).

## Contributing

Bug reports with reproducible steps, accessibility issues, and suggestions are welcome via [GitHub Issues](https://github.com/cianium/KianKhayat/issues). For changes to personal information, project claims, certificates or legal policies, please open an issue before editing public data.

**© Kian Khayat. All rights reserved.** No open-source reuse license is implied by public repository visibility.

## Repository maintenance status

See [repository health — 2026-10-25](docs/REPOSITORY_HEALTH_2026-10-25.md) for pending dependency PRs, deployment checks and release criteria.
