import {test,expect} from '@playwright/test';
const heatmapURL='**/github-contributions-api.jogruber.de/**';
test.beforeEach(async({page})=>{
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.route(heatmapURL,route=>route.fulfill({json:{contributions:[{date:'2026-10-01',count:2,level:1},{date:'2026-10-02',count:5,level:3}]}}));
});
async function ready(page:any,path='/') {await page.goto(path);await expect(page.locator('#page-loader')).toHaveCount(0)}
async function language(page:any,lang:string){
  if(await page.locator('html').getAttribute('lang')===lang)return;
  await page.locator('#lang-btn').click();
  await page.locator(`[data-lang="${lang}"]`).click();
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  await expect(page.locator('#page-loader')).toHaveCount(0);
}

test('real routes, static content, navigation and browser history',async({page})=>{
  await ready(page,'/work/');await expect(page.locator('.project-card')).toHaveCount(7);
  await page.reload();await expect(page.locator('#page-work')).toBeVisible();
  await page.locator('#page-loader').waitFor({state:'detached'});
  await page.locator('footer a[href="/articles/"]').click();await expect(page.locator('.article-card')).toHaveCount(4);
  await page.goBack();await expect(page.locator('#page-work')).toBeVisible();
});
test('theme persists across reload and switches actual portrait',async({page})=>{
  await ready(page);await page.locator('.theme-switch').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('#hero-avatar-img')).toHaveAttribute('src',/hero-dark/);
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('#hero-avatar-img')).toHaveAttribute('src',/hero-dark/);
});
test('all languages, localized Persian hero name and changing skill modal content',async({page})=>{
  await ready(page);await language(page,'fa');await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.locator('.hero-name')).toHaveText('کیان خیاط.');
  await page.locator('[data-skill="0"]').click();await expect(page.locator('#skill-modal-title')).toHaveText('پایتون');
  await page.keyboard.press('Escape');await expect(page.locator('[data-skill="0"]')).toBeFocused();
  await page.locator('[data-skill="1"]').click();await expect(page.locator('#skill-modal-title')).toHaveText('انگلیسی');
  await page.keyboard.press('Escape');await language(page,'de');
  await page.locator('[data-skill="1"]').click();await expect(page.locator('#skill-modal-title')).toHaveText('Englisch');
  await page.keyboard.press('Escape');await language(page,'en');await expect(page.locator('.hero-name')).toHaveText('Kian Khayat.');
});
test('mobile hero keeps the portrait opposite the name and the scroll cue inside its frame',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const {port,name,rtl} of [
    {port:4322,name:'Kian Khayat.',rtl:false},
    {port:4323,name:'Kian Khayat.',rtl:false},
    {port:4324,name:'کیان خیاط.',rtl:true},
  ]) {
    await ready(page,`http://127.0.0.1:${port}/`);
    const title=page.locator('.hero-name'),portrait=page.locator('.hero-avatar'),hero=page.locator('.hero'),socials=page.locator('.hero-socials'),scroll=page.locator('.scroll-hint');
    await expect(title).toHaveText(name);
    const [titleBox,portraitBox,heroBox,socialsBox,scrollBox]=await Promise.all([title.boundingBox(),portrait.boundingBox(),hero.boundingBox(),socials.boundingBox(),scroll.boundingBox()]);
    expect(titleBox&&portraitBox&&heroBox&&socialsBox&&scrollBox).toBeTruthy();
    expect(portraitBox!.width).toBeLessThanOrEqual(180);
    expect(Math.abs((titleBox!.y+titleBox!.height/2)-(portraitBox!.y+portraitBox!.height/2))).toBeLessThan(36);
    expect(rtl?portraitBox!.x<titleBox!.x:titleBox!.x<portraitBox!.x).toBe(true);
    expect(scrollBox!.y).toBeGreaterThan(socialsBox!.y+socialsBox!.height);
    expect(scrollBox!.y+scrollBox!.height).toBeLessThanOrEqual(heroBox!.y+heroBox!.height+1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
test('localized résumé control downloads the packaged PDF',async({page,request})=>{
  for(const {port,label} of [
    {port:4322,label:'Download résumé'},
    {port:4323,label:'Lebenslauf herunterladen'},
    {port:4324,label:'دانلود رزومه'},
  ]) {
    await ready(page,`http://127.0.0.1:${port}/`);
    const link=page.locator('.hero-resume');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(label);
    await expect(link).toHaveAttribute('href','/Kian-Khayat-CV.pdf');
    await expect(link).toHaveAttribute('download','Kian-Khayat-CV.pdf');
  }
  const response=await request.get('http://127.0.0.1:4322/Kian-Khayat-CV.pdf');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
});
test('certificate timeline, category search, disabled missing download and modal focus trap',async({page})=>{
  await ready(page,'/work/');await page.locator('[data-tab="certificates"]').click();
  await expect(page.locator('.cert-card:visible')).toHaveCount(8);
  await page.locator('[data-filter="python"]').click();await expect(page.locator('.cert-card:visible')).toHaveCount(3);
  await page.locator('#cert-search').fill('Essentials 2');await expect(page.locator('.cert-card:visible')).toHaveCount(1);
  await page.locator('.cert-card:visible').click();await expect(page.locator('#cert-modal-title')).toHaveText('Python Essentials 2');
  await expect(page.locator('.cert-lb-btn.primary')).toBeDisabled();
  await page.keyboard.press('Shift+Tab');await expect(page.locator('#cert-modal [data-close]').last()).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('#cert-modal .modal-close')).toBeFocused();
});
test('reader preserves all article bodies in all languages',async({page})=>{
  await ready(page,'/articles/');
  for(const lang of ['en','de','fa']) {
    await language(page,lang);
    const cards=page.locator('.article-card');
    for(let i=0;i<4;i++){
      const title=await cards.nth(i).locator('.article-title').textContent();
      await cards.nth(i).locator('[data-article]').click();await expect(page.locator('#article-modal-title')).toHaveText(title!);
      await expect(page.locator('#article-modal-content p').first()).not.toHaveText('');
      await page.keyboard.press('Escape');
    }
  }
});
test('EmailJS success, failure, validation and duplicate submit use a mocked API',async({page})=>{
  let calls=0;let payload:any;let status=500;
  await page.route('https://api.emailjs.com/api/v1.0/email/send',async route=>{
    calls++;payload=route.request().postDataJSON();await route.fulfill({status,body:status===200?'OK':'Unavailable'});
  });
  await ready(page,'/contact/');await page.locator('#submit-btn').click();expect(calls).toBe(0);
  for(const [id,value] of Object.entries({'cf-name':'Test User','cf-email':'test@example.com','cf-subject':'Phase 2 check','cf-msg':'This request is intercepted and never sent.'}))await page.locator('#'+id).fill(value);
  await page.locator('#submit-btn').click();await expect(page.locator('#form-error')).toBeVisible();await expect(page.locator('#form-success')).not.toBeVisible();
  status=200;await page.locator('#submit-btn').click();await expect(page.locator('#form-success')).toBeVisible();
  expect(calls).toBe(2);expect(payload.service_id).toBe('service_xhm7ixn');expect(payload.template_id).toBe('template_n7azau7');
  expect(Object.keys(payload.template_params)).toEqual(['name','email','subject','message']);
  await expect(page.locator('a[href="mailto:cian@kiankhayat.me"]').first()).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('empersian693@gmail.com');
});
test('heatmap success and honest offline fallback',async({page})=>{
  await ready(page);await expect(page.locator('#heatmap-grid')).toBeVisible();
  await page.route(heatmapURL,route=>route.abort());await page.reload();await expect(page.locator('#heatmap-fallback')).toBeVisible();
});
test('mobile RTL and desktop layouts do not overflow and scripts do not throw',async({page})=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const width of [360,390,1280]) {
    await page.setViewportSize({width,height:900});
    for(const path of ['/','/work/','/articles/','/contact/','/privacy/','/404.html']) {
      await ready(page,'http://127.0.0.1:4324'+path);
      await expect(page.locator('html')).toHaveAttribute('lang','fa');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      expect(overflow,`${width}: ${path}`).toBe(false);
    }
  }
  expect(errors).toEqual([]);
  await ready(page,'/');await page.setViewportSize({width:390,height:844});
});
