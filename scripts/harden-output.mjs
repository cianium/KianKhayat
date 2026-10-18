import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import assert from 'node:assert/strict';
const locales=process.argv.slice(2);
if(!locales.length||locales.some(l=>!['en','de','fa'].includes(l)))throw new Error('Specify en, de or fa.');
function files(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)])}
for(const locale of locales) {
  const root=path.resolve('dist',locale), pages=files(root).filter(f=>f.endsWith('.html'));
  const hashes=new Set();
  for(const file of pages) {
    const {document}=parseHTML(fs.readFileSync(file,'utf8'));
    for(const script of document.querySelectorAll('script:not([src])')) {
      if(['application/json','application/ld+json'].includes(script.getAttribute('type')))continue;
      hashes.add(`'sha256-${createHash('sha256').update(script.textContent).digest('base64')}'`);
    }
  }
  const policy=["default-src 'none'","base-uri 'none'",`script-src 'self' ${[...hashes].join(' ')}`,"script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data:","connect-src 'self' https://api.emailjs.com https://github-contributions-api.jogruber.de",
    "object-src 'self'","frame-src 'self'","manifest-src 'self'","form-action 'none'"].join('; ');
  for(const file of pages) {
    const {document}=parseHTML(fs.readFileSync(file,'utf8'));
    document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.remove();
    const meta=document.createElement('meta');meta.setAttribute('http-equiv','Content-Security-Policy');meta.setAttribute('content',policy);
    const charset=document.querySelector('meta[charset]');
    if(charset)charset.after(meta);else document.head.prepend(meta);
    fs.writeFileSync(file,document.toString());
    const saved=parseHTML(fs.readFileSync(file,'utf8')).document;
    assert.equal(saved.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content'),policy,`${file}: CSP was not saved`);
  }
  const headers={'Content-Security-Policy':policy+"; frame-ancestors 'self'",'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN',
    'Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security':'max-age=31536000','Cache-Control':'public, max-age=0, must-revalidate'};
  const text='/*\n'+Object.entries(headers).map(([key,value])=>`  ${key}: ${value}`).join('\n')+
    '\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n/admin/*\n  X-Robots-Tag: noindex, follow\n/media/*\n  X-Robots-Tag: noindex\n';
  if(text.split('\n').some(line=>line.length>2000))throw new Error('A hosting header exceeds the supported line length.');
  fs.writeFileSync(path.join(root,'_headers'),text);
  fs.mkdirSync('docs/phase9',{recursive:true});
  fs.writeFileSync(`docs/phase9/headers-${locale}.json`,JSON.stringify({pages:pages.length,headers,inlineScriptHashes:hashes.size},null,2)+'\n');
  console.log(`Hardened ${pages.length} ${locale} pages; script CSP uses hashes, without unsafe-inline or unsafe-eval.`);
}
