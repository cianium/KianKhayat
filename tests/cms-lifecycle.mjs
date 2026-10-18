import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import {testPDF} from './fixtures/certificate.mjs';
const sourceRoot=process.cwd();
const isolated=fs.mkdtempSync(path.join(os.tmpdir(),'kian-cms-'));
for(const name of ['src','public','scripts','tests','.github'])fs.cpSync(path.join(sourceRoot,name),path.join(isolated,name),{recursive:true,filter:file=>!path.basename(file).startsWith('qa-')});
fs.mkdirSync(path.join(isolated,'docs'));
for(const name of ['package.json','package-lock.json','astro.config.mjs','tsconfig.json','.pages.yml'])fs.copyFileSync(path.join(sourceRoot,name),path.join(isolated,name));
fs.symlinkSync(path.join(sourceRoot,'node_modules'),path.join(isolated,'node_modules'),'dir');
process.chdir(isolated);
const paths=['src/content/articles/qa-original-fa.json','src/content/articles/qa-draft.json','src/content/projects/qa-project.json','src/content/certificates/qa-certificate.json','src/content/featured/qa-card.json','src/content/featured/nightwalker-hub.json','src/content/featured/personal-hq.json','public/media/certificates/qa-file.pdf','public/media/certificates/qa-image.png'];
const saved=new Map(paths.map(path=>[path,fs.existsSync(path)?fs.readFileSync(path):null]));
const write=(path,data)=>fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const build=label=>{
  try{const log=execFileSync('npm',['run','build'],{encoding:'utf8',maxBuffer:20_000_000});fs.writeFileSync(`docs/phase9/${label}.log`,log)}
  catch(error){fs.writeFileSync(`docs/phase9/${label}.log`,String(error.stdout||'')+String(error.stderr||''));throw error}
};
fs.mkdirSync('docs/phase9',{recursive:true});
try {
  fs.mkdirSync('public/media/certificates',{recursive:true});
  const article={slug:'qa-original-fa',order:99,language:'fa',draft:false,title:'آموزش آزمایشی پایتون',summary:'شرح آزمایشی پایتون',date:'مهر ۱۴۰۵',categories:['برنامه‌نویسی'],body:'<h2>شروع پایتون</h2><p>'+('پایتون '.repeat(401))+'</p><h3>مرحله بعد</h3><p><strong>تمرین</strong></p>',publishedAt:'2026-10-15',seoTitle:'عنوان سئوی پایتون',seoDescription:'توضیح ویژهٔ پایتون',focusKeyword:'پایتون',updatedAt:'2026-10-15'};
  write(paths[0],article);write(paths[1],{...article,slug:'qa-draft',draft:true});
  const project=read('src/content/projects/personal-hq.json');project.title='QA project';project.translations.fa.title='پروژه آزمایشی';project.translations.fa.seoTitle='پروژه آزمایشی';project.translations.de.title='Testprojekt';write(paths[2],{...project,slug:'qa-project',documentation:'First paragraph.\n\nSecond paragraph.'});
  const certificate=read('src/content/certificates/goethe-zertifikat-a2.json');write(paths[3],{...certificate,slug:'qa-certificate',image:'/media/certificates/qa-image.png',pdf:'/media/certificates/qa-file.pdf'});
  fs.writeFileSync(paths[7],testPDF());fs.copyFileSync('public/media/projects/personal-hq.png',paths[8]);
  write(paths[4],{slug:'qa-card',title:'Independent card',summary:'Custom description',url:'/articles/qa-original-fa/',order:0,published:true});
  fs.unlinkSync(paths[5]);write(paths[6],{...read(paths[6]),title:'Edited card',translations:undefined});
  execFileSync('npm',['run','check:cms'],{stdio:'pipe',encoding:'utf8'});build('fixture-build');
  execFileSync('npm',['run','check:seo'],{stdio:'pipe',encoding:'utf8'});execFileSync('npm',['run','check:articles'],{stdio:'pipe',encoding:'utf8'});
  for(const locale of ['en','fa','de']) {
    const root=`dist/${locale}/`,html=fs.readFileSync(root+'articles/qa-original-fa/index.html','utf8');
    const document=parseHTML(html).document;
    assert.equal(document.querySelector('h1').textContent,article.title);
    assert.equal(document.querySelector('.article-detail').getAttribute('lang'),'fa');
    assert.equal(document.querySelector('.article-detail').getAttribute('dir'),'rtl');
    assert.equal(document.title,article.seoTitle);
    assert.match(document.querySelector('.article-meta').textContent,/۳ دقیقه/);
    assert.equal(document.querySelectorAll('.article-toc a').length,2);
    assert.equal(document.querySelector('link[rel="canonical"]').href,'https://fa.kiankhayat.me/articles/qa-original-fa/');
    assert.equal(fs.existsSync(root+'articles/qa-draft/index.html'),false);
    const home=parseHTML(fs.readFileSync(root+'index.html','utf8')).document;
    assert(home.querySelector('.featured-target[href="/articles/qa-original-fa/"]'));
    assert(!home.querySelector('.featured-target[href="/work/nightwalker-hub/"]'));
    assert.equal(home.querySelector('.featured-target[href="/work/personal-hq/"] h3').textContent,'Edited card');
    assert(fs.readFileSync(root+'work/qa-project/index.html','utf8').includes('qa-project'));
    assert(fs.existsSync(root+'media/certificates/qa-file.pdf'));
  }
  fs.writeFileSync(path.join(sourceRoot,'docs/phase9/cms-lifecycle.json'),JSON.stringify({passed:true,checks:['create original-language Persian article without translations or reading-time input','SEO overrides, RTL, auto reading time and table of contents','draft excluded','create project and certificate with real image/PDF fixture','create standalone Featured card','edit existing Featured card','delete Featured card without deleting project'],hostedCMSLoginTested:false},null,2)+'\n');
} finally {
  for(const [path,bytes] of saved)if(bytes)fs.writeFileSync(path,bytes);else fs.rmSync(path,{force:true});
  build('production-build');
}
for(const locale of ['en','fa','de'])assert(!fs.existsSync(`dist/${locale}/articles/qa-original-fa/index.html`));
process.chdir(sourceRoot);
fs.rmSync(isolated,{recursive:true,force:true,maxRetries:5,retryDelay:100});
console.log('Isolated CMS lifecycle passed; original source untouched.');
