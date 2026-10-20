import {test,expect} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
import {parseHTML} from 'linkedom';
import {testPDF} from './fixtures/certificate.mjs';

test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.abort());
});
async function ready(page:any,url:string) {
  await page.goto(url);
  // The preserved loader has an 8-second fallback plus its exit transition.
  await expect(page.locator('#page-loader')).toHaveCount(0,{timeout:10000});
}

test('project detail links, optional actions and language navigation',async({page})=>{
  await ready(page,'/work/');
  await expect(page.locator('.project-card')).toHaveCount(7);
  await expect(page.locator('.project-card .project-actions a.primary')).toHaveCount(2);
  await page.locator('.detail-link').first().click();
  await expect(page).toHaveURL(/\/work\/nightwalker-hub\/$/);
  await expect(page.locator('h1')).toHaveText('Nightwalker Hub');
  await expect(page.locator('.project-detail>.project-actions a')).toHaveCount(2);
  await expect(page.locator('.project-detail>.project-actions a[href="https://github.com/cianium/Nightwalker-"]')).toHaveCount(1);
  await expect(page.locator('#page-loader')).toHaveCount(0);
  for(const [lang,port] of [['fa',4324],['de',4323],['en',4322]]) {
    await page.locator('#lang-btn').click();await page.locator(`[data-lang="${lang}"]`).click();
    await expect(page).toHaveURL(`http://127.0.0.1:${port}/work/nightwalker-hub/`);
    await expect(page.locator('#page-loader')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang',String(lang));
    await expect(page.locator('.project-intro')).not.toBeEmpty();
  }
  await ready(page,'/work/pymind-cli/');
  await expect(page.locator('.project-detail>.project-actions a.primary')).toHaveCount(0);
  await expect(page.locator('.project-detail>.project-actions a')).toHaveCount(0);
  await expect(page.locator('.project-original-links a')).toHaveCount(0);
});

test('featured selection, thumbnails, detail layouts and accessibility',async({page})=>{
  test.setTimeout(90000);
  for(const [lang,port] of [['en',4322],['fa',4324],['de',4323]]) {
    await ready(page,`http://127.0.0.1:${port}/`);
    await expect(page.locator('.featured-card')).toHaveCount(2);
    await page.locator('.featured-target[href="/work/personal-hq/"]').click();
    await expect(page.locator('#page-loader')).toHaveCount(0);
    await expect(page.locator('.project-detail>.project-cover img')).toHaveJSProperty('naturalWidth',1440);
    for(const width of [360,1280]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const theme of ['light','dark']) {
        await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
        if(width===360)expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
      }
    }
    if(lang==='fa') {
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:'docs/phase5/project-fa-dark.png',fullPage:true});
      await ready(page,'http://127.0.0.1:4324/');
      await page.locator('.featured-section').screenshot({path:'docs/phase5/featured-fa.png'});
    }
  }
});

async function certificateFixture(page:any,media:object) {
  await page.route('**/work/',async(route:any)=>{
    const response=await route.fetch();const {document}=parseHTML(await response.text());
    const script=document.getElementById('cert-data')!;const data=JSON.parse(script.textContent!);
    Object.assign(data[0],media);script.textContent=JSON.stringify(data).replace(/</g,'\\u003c');
    await route.fulfill({response,body:document.toString()});
  });
  await ready(page,'/work/');await page.locator('[data-tab="certificates"]').click();
  await page.locator('.cert-card').first().click();
}
test('certificate image, PDF download, credential link and focus return',async({page})=>{
  await certificateFixture(page,{image:'/photo.jpg',pdf:'/test-certificate.pdf',credentialUrl:'https://example.com/credential'});
  await expect(page.locator('#cert-modal-img img')).toHaveJSProperty('naturalWidth',800);
  await expect(page.locator('#cert-file-actions a')).toHaveCount(3);
  await expect(page.locator('#cert-file-actions a').first()).toHaveAttribute('href','/test-certificate.pdf');
  const downloading=page.waitForEvent('download');await page.locator('.cert-lb-btn.primary').click();
  const download=await downloading;expect(download.suggestedFilename()).toBe('test-certificate.pdf');
  expect(await download.failure()).toBeNull();
  const stream=await download.createReadStream();let received='';
  for await(const chunk of stream!)received+=chunk.toString();
  expect(received).toBe(testPDF());
  await page.keyboard.press('Escape');await expect(page.locator('.cert-card').first()).toBeFocused();
});
test('PDF-only preview and failed-image fallback keep the file reachable',async({page})=>{
  await certificateFixture(page,{pdf:'/test-certificate.pdf'});
  await expect(page.locator('#cert-modal-img object')).toHaveAttribute('data','/test-certificate.pdf');
  await expect(page.locator('#cert-file-actions a')).toHaveAttribute('href','/test-certificate.pdf');
  await page.keyboard.press('Escape');await expect(page.locator('#cert-modal-img object')).toHaveCount(0);
  await page.unroute('**/work/');
  await certificateFixture(page,{image:'/missing-test-image.png'});
  await expect(page.locator('#cert-modal-img')).toContainText('Preview unavailable');
  await expect(page.locator('#cert-file-actions a')).toHaveAttribute('href','/missing-test-image.png');
});

test('repository links resolve to actual project repositories, not a generic profile',async({page})=>{
  await ready(page,'/work/personal-hq/');
  await expect(page.locator('.project-detail>.project-actions a[href="https://github.com/cianium/KianKhayat"]')).toHaveCount(1);
  await expect(page.locator('.project-original-links a[href="https://github.com/cianium/KianKhayat"]')).toHaveCount(1);
  await ready(page,'/work/nightwalker-hub/');
  await expect(page.locator('.project-detail>.project-actions a[href="https://github.com/cianium/Nightwalker-"]')).toHaveCount(1);

  for(const slug of ['pymind-cli','deutsch-tracker','learning-dashboard','mini-llm-experiments','linux-config-vault']){
    await ready(page,`/work/${slug}/`);
    await expect(page.locator('.project-detail>.project-actions a')).toHaveCount(0);
    await expect(page.locator('.project-original-links a')).toHaveCount(0);
  }
  await expect(page.locator('h1')).toHaveText('Linux Config Vault');
  await expect(page.locator('.project-detail-heading .tag-primary')).toHaveText('Planned');
  await ready(page,'http://127.0.0.1:4324/work/linux-config-vault/');
  await expect(page.locator('.project-detail-heading .tag-primary')).toHaveText('برنامه‌ریزی‌شده');
});
