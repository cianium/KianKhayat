import {test,expect} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
test('admin entry is localized, accessible and excluded from search',async({page,request})=>{
  test.setTimeout(90000);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  for(const [lang,port] of [['en',4322],['de',4323],['fa',4324]]) {
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    await expect(page.locator('#page-loader')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang',String(lang));
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, follow');
    await expect(page.locator('link[hreflang],link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('.admin-entry>a')).toHaveAttribute('href','https://app.pagescms.org/');
    await expect(page.locator('.admin-page input')).toHaveCount(0);
    expect(await (await request.get(`http://127.0.0.1:${port}/sitemap.xml`)).text()).not.toContain('/admin/');
    for(const width of [360,1280]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const theme of ['light','dark']) {
        await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
        if(width===360)expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
      }
    }
  }
});
