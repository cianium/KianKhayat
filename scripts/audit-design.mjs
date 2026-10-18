import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

const server = spawn(process.execPath, ['scripts/test-server.mjs']);
await new Promise((resolve, reject) => {
  server.stdout.once('data', resolve);
  server.once('error', reject);
  server.once('exit', code => reject(new Error(`Preview server exited: ${code}`)));
});
const browser = await chromium.launch({ headless: true });
const report = { scans: [], layouts: [], errors: [], requests: 'External fonts blocked; GitHub activity mocked; no email sent.' };
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('**/github-contributions-api.jogruber.de/**', route => route.fulfill({json:{contributions:[{date:'2026-10-01',count:2,level:1}]}}));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const scan = async (theme, path, state) => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const violations = result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
    report.scans.push({ theme, path, state, language: await page.locator('html').getAttribute('lang'), violations, manualReviewItems: result.incomplete.map(item => item.id) });
    console.log(theme, path, state, `${violations.length} violations`);
  };
  for (const theme of ['light', 'dark']) {
    for (const path of ['/', '/work/', '/articles/', '/contact/', '/privacy/', '/404.html']) {
      await page.goto(`http://127.0.0.1:${theme === 'dark' ? 4324 : 4322}` + path);
      await page.locator('#page-loader').waitFor({ state: 'detached' });
      await page.evaluate(t => { document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); }, theme);
      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const details = await page.evaluate(() => {
          const targets = [...document.querySelectorAll('.nav-logo,.nav-link,.lang-btn,.ham-btn,.theme-switch,.social-btn,.skill-card,.work-tab,.cert-filter-btn,.project-link,.submit-btn,.footer-link')].filter(el => el.getClientRects().length);
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            smallTargets: targets.filter(el => { const b = el.getBoundingClientRect(); return b.width < 44 || b.height < 44; }).map(el => ({ selector: el.className, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
            animatedStoryHint: getComputedStyle(document.querySelector('.skills-scroll-hint svg') || document.body).animationName !== 'none'
          };
        });
        report.layouts.push({ theme, path, width, ...details });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await scan(theme, path, 'page');
      if (path === '/') {
        await page.locator('[data-skill="0"]').click();
        await scan(theme, path, 'skill-dialog');
        await page.keyboard.press('Escape');
        await page.locator('#lang-btn').click();
        await page.locator('[data-lang="de"]').click();
        await page.locator('#page-loader').waitFor({ state: 'detached' });
        await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
        await scan(theme, path, 'German home');
        await page.locator('#ham-btn').click();
        await scan(theme, path, 'mobile-menu');
      }
      if (path === '/work/') {
        await page.locator('[data-tab="certificates"]').click();
        await scan(theme, path, 'certificates');
        await page.locator('.cert-card').first().click();
        await scan(theme, path, 'certificate-lightbox');
      }
      if (path === '/articles/') {
        await page.locator('.article-card').first().click();
        await scan(theme, path, 'reader');
      }
    }
  }
  report.passed = !report.errors.length && report.scans.every(s => !s.violations.length) && report.layouts.every(l => !l.overflow && !l.smallTargets.length && !l.animatedStoryHint);
  await fs.mkdir('docs/phase4', { recursive: true });
  await fs.writeFile('docs/phase4/accessibility.json', JSON.stringify(report, null, 2));
  console.log(`Design audit: ${report.passed ? 'PASS' : 'FAIL'} (${report.scans.length} accessibility states, ${report.layouts.length} layouts)`);
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
}
