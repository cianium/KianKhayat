import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.route('**/github-contributions-api.jogruber.de/**',route=>route.abort());
});
test('CSP blocks an injected script and unauthorized connections while theme still works',async({page})=>{
  await page.goto('/contact/');await expect(page.locator('#page-loader')).toHaveCount(0,{timeout:10000});
  await page.evaluate(()=>{
    (window as any).violations=[];
    document.addEventListener('securitypolicyviolation',e=>(window as any).violations.push(e.violatedDirective));
    const script=document.createElement('script');script.textContent='window.injected=true';document.body.append(script);
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).violations)).toContain('script-src-elem');
  expect(await page.evaluate(()=>(window as any).injected)).toBeUndefined();
  const before=await page.locator('html').getAttribute('data-theme');
  await page.locator('.theme-switch').click();await expect(page.locator('html')).not.toHaveAttribute('data-theme',before!);
  expect(await page.evaluate(async()=>{try{await fetch('https://example.org/disallowed');return false}catch{return true}})).toBe(true);
});
test('security headers, correct 404 status and admin noindex are served',async({request})=>{
  for(const port of [4322,4323,4324]) {
    const base=`http://127.0.0.1:${port}`;
    const home=await request.get(base+'/');expect(home.headers()['x-content-type-options']).toBe('nosniff');
    expect(home.headers()['content-security-policy']).toContain("frame-ancestors 'self'");
    const missing=await request.get(base+'/not-a-real-page/');expect(missing.status()).toBe(404);expect(missing.headers()['x-robots-tag']).toBe('noindex');
    expect((await request.get(base+'/admin/')).headers()['x-robots-tag']).toBe('noindex, follow');
    expect((await request.get(base+'/.env')).status()).toBe(404);
  }
});
test('oversized contact input and bot trap never call EmailJS',async({page})=>{
  let calls=0;await page.route('https://api.emailjs.com/**',async route=>{calls++;await route.fulfill({status:200,body:'OK'})});
  await page.goto('/contact/');await expect(page.locator('#page-loader')).toHaveCount(0,{timeout:10000});
  await page.locator('#cf-name').fill('Test');await page.locator('#cf-email').fill('test@example.com');await page.locator('#cf-subject').fill('Test');await page.locator('#cf-msg').fill('This is a validation test.');
  await page.locator('#cf-msg').evaluate((el:any)=>el.value='x'.repeat(5001));
  await page.locator('#submit-btn').click();await expect(page.locator('#cf-msg')).toHaveAttribute('aria-invalid','true');expect(calls).toBe(0);
  await page.locator('#cf-msg').fill('This is a validation test.');
  await page.locator('input[name="website"]').evaluate((el:any)=>el.value='bot');
  await page.locator('#submit-btn').click();expect(calls).toBe(0);await expect(page.locator('#contact-form-wrap')).toBeVisible();
});
