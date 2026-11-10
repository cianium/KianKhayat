import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {previewHeaders} from './preview-headers.mjs';
const locales=['en','de','fa'];let pages=0,links=0;
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const secret=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}/;
for(const directory of ['src','scripts','public','.github'])for(const file of files(directory)) {
  assert(!/^\.env(?:\.|$)/.test(path.basename(file)),'Environment file must not be packaged');
  if(/\.(?:m?js|ts|astro|json|ya?ml|html|md|txt)$/.test(file))assert(!secret.test(fs.readFileSync(file,'utf8')),`Recognizable secret pattern: ${file}`);
}
for(const lang of locales) {
  const root=path.resolve('dist',lang);
  const headers=previewHeaders(root,'/');
  assert.equal(headers['X-Content-Type-Options'],'nosniff');assert.equal(headers['X-Frame-Options'],'SAMEORIGIN');
  assert.match(headers['Content-Security-Policy'],/frame-ancestors 'self'/);
  for(const file of files(root)) {
    assert(!/\.(env|pem|key|map)$/.test(file)&&!file.includes('test-certificate'),'No private or test files in the output');
    if(!file.endsWith('.html'))continue;
    pages++;const html=fs.readFileSync(file,'utf8'),{document}=parseHTML(html);
    const policy=document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content');
    assert(policy,`${file}: missing CSP`);
    const scripts=policy.split(';').find(d=>d.trim().startsWith('script-src '));
    assert(!scripts.includes('unsafe-inline')&&!scripts.includes('unsafe-eval'));
    for(const script of document.querySelectorAll('script')) {
      if(script.hasAttribute('src'))assert(script.getAttribute('src').startsWith('/_astro/'));
      else if(!['application/json','application/ld+json'].includes(script.getAttribute('type')))assert(policy.includes(createHash('sha256').update(script.textContent).digest('base64')),`${file}: script hash mismatch`);
    }
    for(const el of document.querySelectorAll('*'))for(const attr of el.attributes)assert(!/^on/i.test(attr.name),`${file}: inline event handler`);
    for(const el of document.querySelectorAll('[href],[src]'))for(const name of ['href','src']) {
      const value=el.getAttribute(name);if(!value||!value.startsWith('/')||value.startsWith('//'))continue;
      const url=new URL(value,'https://local.test'), target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
      assert(target===root||target.startsWith(root+path.sep));
      let actual=target;if(fs.existsSync(actual)&&fs.statSync(actual).isDirectory())actual=path.join(actual,'index.html');
      assert(fs.existsSync(actual),`${file}: missing local target ${value}`);links++;
    }
    assert(!secret.test(html),'Recognizable secret pattern in output');
  }
}
// Every project detail page must also be discoverable from Work.
// Featured projects must reuse the same cover as Work and their detail page.
const projectRecords=fs.readdirSync('src/content/projects').filter(file=>file.endsWith('.json')).map(file=>JSON.parse(fs.readFileSync(path.join('src/content/projects',file),'utf8')));
for(const lang of locales) {
  const home=fs.readFileSync(path.join('dist',lang,'index.html'),'utf8');
  const listing=fs.readFileSync(path.join('dist',lang,'work/index.html'),'utf8');
  for(const project of projectRecords) {
    const route=`/work/${project.slug}/`;
    assert(listing.includes(route),`${lang}: project ${project.slug} missing from Work listing`);
    const detail=fs.readFileSync(path.join('dist',lang,'work',project.slug,'index.html'),'utf8');
    if(project.thumbnail) {
      assert(listing.includes(project.thumbnail),`${lang}: Work cover mismatch for ${project.slug}`);
      assert(detail.includes(project.thumbnail),`${lang}: detail cover mismatch for ${project.slug}`);
      if(project.featured)assert(home.includes(project.thumbnail),`${lang}: featured cover mismatch for ${project.slug}`);
    }
  }
}
const report={passed:true,pages,localReferences:links,checks:['script hash CSP','no inline event handlers','local link and asset existence','security headers','no packaged source maps, private keys or test files'],liveDeploymentVerified:false};
fs.mkdirSync('docs/phase9',{recursive:true});fs.writeFileSync('docs/phase9/release.json',JSON.stringify(report,null,2)+'\n');console.log(report);
