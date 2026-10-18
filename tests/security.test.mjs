import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {safeArticleHTML} from '../src/security/article-html.mjs';
import {validateMedia} from '../scripts/media-validation.mjs';

test('all original article bodies and translations remain exactly unchanged',()=>{
  for(const file of fs.readdirSync('src/content/articles')) {
    const data=JSON.parse(fs.readFileSync('src/content/articles/'+file));
    for(const article of [data,...Object.values(data.translations||{})])assert.equal(safeArticleHTML(article.body),article.body);
  }
});
test('reject executable markup, clobbering, dangerous links and CSS',()=>{
  const attacks=['<script>alert(1)</script>','<img src="/photo.jpg" onerror="alert(1)">','<a href="javascript:alert(1)">x</a>',
    '<a href="java&#x73;cript:alert(1)">x</a>','<svg onload="alert(1)"></svg>','<iframe srcdoc="x"></iframe>',
    '<form id="contact-form-wrap"></form>','<p id="page-loader">x</p>','<p style="background:url(https://example.com/x)">x</p>',
    '<img src="data:image/svg+xml;base64,PHN2Zz4=">','<a href="//example.com/x">x</a>', '<img src="http://example.com/x.png">'];
  for(const attack of attacks)assert.throws(()=>safeArticleHTML(attack),undefined,attack);
});
test('allow editor formatting, safe media and links with opener protection',()=>{
  const html='<h3>عنوان</h3><p><strong>Test</strong><br><a href="https://example.com/" target="_blank">Link</a></p><img src="/media/articles/photo.jpg" alt="Photo">';
  const output=safeArticleHTML(html);
  assert.match(output,/noopener noreferrer/);assert.match(output,/عنوان/);assert.match(output,/media\/articles\/photo.jpg/);
});
test('media checks reject disguised files, excessive size and directory escape',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-media-'));
  try {
    fs.writeFileSync(path.join(root,'fake.png'),'<script>alert(1)</script>');
    fs.writeFileSync(path.join(root,'fake.pdf'),'<html>Not a PDF</html>');
    fs.writeFileSync(path.join(root,'script.html'),'<script>alert(1)</script>');
    fs.writeFileSync(path.join(root,'huge.pdf'),'%PDF-1.4');fs.truncateSync(path.join(root,'huge.pdf'),21*1024*1024);
    fs.symlinkSync('/etc/passwd',path.join(root,'escape.jpg'));
    for(const file of ['/fake.png','/fake.pdf','/script.html','/huge.pdf','/escape.jpg','/../outside.png','/x%2e.png','//host/x.png'])await assert.rejects(validateMedia(root,file));
    fs.copyFileSync('public/photo.jpg',path.join(root,'valid.jpg'));await validateMedia(root,'/valid.jpg');
  }finally{fs.rmSync(root,{recursive:true,force:true})}
});
