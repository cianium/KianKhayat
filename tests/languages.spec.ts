import {test, expect} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
test.use({locale:'fa-IR'});

const languages = [{lang:'en',port:4322,home:'Home'},{lang:'de',port:4323,home:'Startseite'},{lang:'fa',port:4324,home:'خانه'}];
test('all language sites render content without JavaScript', async ({browser}) => {
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  for(const {lang,port} of languages) {
    for(const path of ['/','/work/','/articles/','/contact/','/privacy/','/missing-page/']) {
      const response=await page.goto(`http://127.0.0.1:${port}${path}`);
      expect(response?.status()).toBe(path==='/missing-page/'?404:200);
      await expect(page.locator('html')).toHaveAttribute('lang',lang);
      await expect(page.locator('html')).toHaveAttribute('dir',lang==='fa'?'rtl':'ltr');
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('#page-loader')).not.toBeVisible();
      if(path==='/work/')await expect(page.locator('.project-card')).toHaveCount(7);
      if(path==='/articles/')await expect(page.locator('.article-card')).toHaveCount(4);
    }
  }
  await context.close();
});

test('language choice navigates between sites, retains page and ignores stored/browser language', async ({page}) => {
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.addInitScript(()=>localStorage.setItem('lang','fa'));
  await page.goto('/contact/');
  await expect(page.locator('#page-loader')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  for(const {lang,port} of [languages[2],languages[1],languages[0]]) {
    await page.locator('#lang-btn').click();
    await page.locator(`[data-lang="${lang}"]`).click();
    await expect(page).toHaveURL(`http://127.0.0.1:${port}/contact/`);
    await expect(page.locator('#page-loader')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await expect(page.locator('#page-loader')).toHaveCount(0);
  }
});

test('Persian preview and language menu remain accessible on mobile', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.abort());
  await page.goto('http://127.0.0.1:4324/');
  await expect(page.locator('#page-loader')).toHaveCount(0);
  await page.locator('#lang-btn').click();
  await expect(page.locator('[data-lang="fa"]')).toBeFocused();
  const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('Home');await expect(page.locator('[data-lang="en"]')).toBeFocused();
  await page.keyboard.press('End');await expect(page.locator('[data-lang="fa"]')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#lang-btn')).toBeFocused();
  await page.screenshot({path:'docs/phase4/persian-mobile.png',fullPage:true});
});
