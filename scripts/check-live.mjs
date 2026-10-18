import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';

const local=process.argv.includes('--local');
const basePort=Number(process.env.PORT || 4322);
const sites={en:'https://kiankhayat.me',de:'https://de.kiankhayat.me',fa:'https://fa.kiankhayat.me'};
const results=[];
for(const [index,[lang,canonical]] of Object.entries(sites).entries()) {
  const origin=local?`http://127.0.0.1:${basePort+index}`:canonical;
  const checks=[];
  const check=async(name,fn)=>{
    try {await fn();checks.push({name,passed:true})}
    catch(error){checks.push({name,passed:false,error:error.message})}
  };
  const get=async(route)=>{
    const response=await fetch(origin+route,{signal:AbortSignal.timeout(15000)});
    return {response,text:await response.text()};
  };
  await check('Home language, canonical and security headers',async()=>{
    const {response,text}=await get('/');assert.equal(response.status,200);
    const {document}=parseHTML(text);
    assert.equal(document.documentElement.lang,lang);
    assert.equal(document.documentElement.getAttribute('dir'),lang==='fa'?'rtl':'ltr');
    assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'),canonical+'/');
    assert.match(response.headers.get('content-security-policy')||'',/frame-ancestors 'self'/);
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    assert.equal(response.headers.get('x-frame-options'),'SAMEORIGIN');
    if(!local)assert.match(response.headers.get('strict-transport-security')||'',/max-age=\d+/);
  });
  await check('Sitemap and RSS',async()=>{
    for(const [route,root] of [['/sitemap.xml','urlset'],['/rss.xml','rss']]) {
      const {response,text}=await get(route);assert.equal(response.status,200);
      assert(text.includes('<'+root),`Missing ${root}`);assert(text.includes(canonical));
    }
  });
  await check('Admin is excluded from indexing',async()=>{
    const {response,text}=await get('/admin/');assert.equal(response.status,200);
    const {document}=parseHTML(text);
    assert.match(document.querySelector('meta[name="robots"]')?.getAttribute('content')||'',/noindex/);
  });
  await check('Missing page returns 404',async()=>{
    const {response,text}=await get('/phase8-missing-route-check/');assert.equal(response.status,404);
    const {document}=parseHTML(text);
    assert.match(document.querySelector('meta[name="robots"]')?.getAttribute('content')||'',/noindex/);
  });
  results.push({lang,origin,passed:checks.every(c=>c.passed),checks});
}
const report={checkedAt:new Date().toISOString(),mode:local?'local-preview':'live-read-only',passed:results.every(r=>r.passed),results,
  limitations:['Does not test EmailJS delivery, CMS authentication, editing, or search indexing.','HTTP smoke checks do not constitute a complete security audit.']};
fs.mkdirSync('docs/phase9',{recursive:true});
fs.writeFileSync(`docs/phase9/${local?'live-local':'live-check'}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
