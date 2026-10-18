import {test,expect} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
const slug='why-discipline-is-the-ultimate-ai-advantage';
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
});
async function ready(page:any,url:string) {await page.goto(url);await expect(page.locator('#page-loader')).toHaveCount(0)}
test('article links navigate, reader stays available and language keeps the article URL',async({page})=>{
  test.setTimeout(60000);
  await ready(page,'/articles/');
  const first=page.locator('.article-card').first();
  await first.locator('.quick-read').click();await expect(page.locator('#article-modal')).toHaveClass(/open/);
  await page.keyboard.press('Escape');await expect(first.locator('.quick-read')).toBeFocused();
  await first.locator('.article-title a').click();await expect(page).toHaveURL(new RegExp(`/articles/${slug}/$`));
  await expect(page.locator('#article-modal')).not.toHaveClass(/open/);
  await expect(page.locator('#page-loader')).toHaveCount(0);
  for(const [lang,port] of [['fa',4324],['de',4323],['en',4322]]) {
    await page.locator('#lang-btn').click();await page.locator(`[data-lang="${lang}"]`).click();
    await expect(page).toHaveURL(`http://127.0.0.1:${port}/articles/${slug}/`);
    await expect(page.locator('#page-loader')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang',String(lang));
    await expect(page.locator('.article-content p').first()).not.toBeEmpty();
    await page.reload();await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#page-loader')).toHaveCount(0);
  }
});
test('article pages are readable without JavaScript and missing slugs are 404',async({browser,request})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  for(const port of [4322,4323,4324]) {
    await page.goto(`http://127.0.0.1:${port}/articles/${slug}/`);
    await expect(page.locator('.article-content p').first()).toBeVisible();
    await expect(page.locator('.more-articles li a')).toHaveCount(3);
    expect((await request.get(`http://127.0.0.1:${port}/articles/not-a-real-article/`)).status()).toBe(404);
    const feed=await request.get(`http://127.0.0.1:${port}/rss.xml`);
    expect(feed.status()).toBe(200);expect(feed.headers()['content-type']).toContain('xml');
  }
  await context.close();
});
test('article layout and accessibility in both themes and all three languages',async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [lang,port] of [['en',4322],['de',4323],['fa',4324]]) {
    await ready(page,`http://127.0.0.1:${port}/articles/${slug}/`);
    for(const width of [360,1280]) {
      await page.setViewportSize({width,height:900});
      for(const theme of ['light','dark']) {
        await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        if(width===360)expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
        if(lang==='fa'&&width===360)await page.screenshot({path:`docs/phase6/article-fa-${theme}.png`,fullPage:true});
      }
    }
  }
  expect(errors).toEqual([]);
});

test('original article language, canonical and table of contents stay stable across interfaces',async({page})=>{
  test.setTimeout(60000);
  for(const port of [4322,4323,4324]) {
    await ready(page,`http://127.0.0.1:${port}/articles/${slug}/`);
    await expect(page.locator('.article-detail')).toHaveAttribute('lang','en');
    await expect(page.locator('.article-detail')).toHaveAttribute('dir','ltr');
    await expect(page.locator('h1')).toHaveText('Why Discipline Is the Ultimate AI Advantage');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://kiankhayat.me/articles/${slug}/`);
    await expect(page.locator('link[hreflang]')).toHaveCount(0);
    const link=page.locator('.article-toc a').first();const target=await link.getAttribute('href');
    await link.click();await expect(page).toHaveURL(new RegExp(target!+'$'));
    await expect(page.locator(target!)).toBeVisible();
    await ready(page,`http://127.0.0.1:${port}/articles/`);
    await page.locator('.article-card').first().locator('.quick-read').click();
    await expect(page.locator('#article-modal-title')).toHaveText('Why Discipline Is the Ultimate AI Advantage');
    await expect(page.locator('#article-modal')).toHaveAttribute('lang','en');
  }
});
