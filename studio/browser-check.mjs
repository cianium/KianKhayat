// Test-only loopback adapter. No production auth bypass; no real Google credentials.
import http from 'node:http';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {AxeBuilder} from '@axe-core/playwright';
import {openStore} from './store.mjs';
import {createStudio} from './server.mjs';
import {migrateLegacy} from './import-legacy.mjs';
const db=openStore(':memory:');
migrateLegacy(new URL('../',import.meta.url).pathname,db);
db.pin('browser-test-owner');
const session=db.login('browser-test-owner');
db.save({language:'en',slug:'sample-draft',title:'Sample draft',summary:'Private summary',body:'Private body',status:'draft'});
const upstream=createStudio({owner:'fixture@gmail.com',subject:''},db);
const listen=s=>new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));
await listen(upstream);
const proxy=http.createServer((req,res)=>{
 const headers={...req.headers,host:'manage.kiankhayat.me'};
 if(headers['x-studio-test-session']==='fixture')headers.cookie='__Host-studio-session='+session;
 delete headers['x-studio-test-session'];
 if(headers.origin==='http://127.0.0.1:'+proxy.address().port)headers.origin='https://manage.kiankhayat.me';
 const forward=http.request({hostname:'127.0.0.1',port:upstream.address().port,path:req.url,method:req.method,headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});
 forward.on('error',()=>{res.writeHead(502);res.end()});req.pipe(forward);
});
await listen(proxy);
const origin='http://127.0.0.1:'+proxy.address().port;
const browser=await chromium.launch();
mkdirSync('studio-test-results',{recursive:true});
try{
 const guest=await browser.newPage({viewport:{width:390,height:844}});
 const login=await guest.goto(origin);
 assert.equal(login.status(),401);
 assert.equal(await guest.getByRole('link',{name:'ورود با Google'}).getAttribute('href'),'/auth/google');
 await guest.screenshot({path:'studio-test-results/login.png',fullPage:true});
 await guest.close();
 const page=await browser.newPage({viewport:{width:1440,height:900},colorScheme:'light',extraHTTPHeaders:{'x-studio-test-session':'fixture'}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);
 await page.locator('html[data-theme=light]').waitFor();
 assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 assert.equal(await page.getByRole('link',{name:'نمای کلی'}).getAttribute('aria-current'),'page');
 await page.screenshot({path:'studio-test-results/dashboard-light.png',fullPage:true});
 await page.locator('[data-theme-toggle]').click();
 await page.locator('html[data-theme=dark]').waitFor();
 await page.reload();await page.locator('html[data-theme=dark]').waitFor();
 await page.screenshot({path:'studio-test-results/dashboard-dark.png',fullPage:true});
 for(const width of [1440,820,390,320]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/profile','/projects','/certificates','/media','/inventory','/articles','/articles/new']){
   const r=await page.goto(origin+path);
   assert.equal(r.status(),200,path);
   assert.equal(await page.locator('h1').count(),1,path);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' overflow at '+width);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(origin);
 const toggle=page.locator('[data-nav-toggle]');
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 await toggle.click();
 assert.equal(await toggle.getAttribute('aria-expanded'),'true');
 await page.getByRole('link',{name:'مقاله‌ها',exact:true}).click();
 await page.getByRole('searchbox').fill('sample');
 await page.getByRole('button',{name:'فیلتر'}).click();
 assert.equal(await page.getByRole('link',{name:/Sample draft/}).count(),1);
 await page.getByRole('link',{name:'مقاله جدید'}).click();
 await page.getByLabel('عنوان',{exact:true}).fill('تست مقاله');
 await page.getByLabel('خلاصه',{exact:true}).fill('خلاصه آزمون');
 await page.getByLabel('متن مقاله',{exact:true}).fill('متن آزمایشی');
 await page.getByLabel('شناسه URL').fill('browser-test');
 await page.getByRole('button',{name:'ذخیره پیش‌نویس'}).click();
 await page.getByRole('status').waitFor();
 assert.equal(db.list().find(r=>r.slug==='browser-test').status,'draft');
 await page.screenshot({path:'studio-test-results/editor-mobile.png',fullPage:true});
 for(const mode of ['dark','light']){
  if(await page.locator('html').getAttribute('data-theme')!==mode)await page.locator('[data-theme-toggle]').click();
  for(const path of ['/','/articles/new','/projects']){
   await page.goto(origin+path);
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],mode+' '+path);
  }
 }
 assert.deepEqual(errors,[]);
 await page.close();
 console.log('Studio browser checks passed.');
}finally{
 await browser.close();
 await new Promise(r=>proxy.close(r));
 await new Promise(r=>upstream.close(r));
 db.close();
}
