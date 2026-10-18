import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {prepareArticle,articleOutline,readingStats,editorialReview,articleDirection} from '../src/data/article-tools.mjs';

test('articles keep original language and auto reading time; legacy labels remain opt-in',()=>{
  const source={language:'fa',title:'عنوان اصلی',body:'<p>'+('واژه '.repeat(401))+'</p>',translations:{de:{title:'Not displayed'}}};
  const article=prepareArticle(source);
  assert.equal(article.title,source.title);assert.match(article.readTime,/۳ دقیقه/);assert.equal(articleDirection(article),'rtl');
  assert.equal(prepareArticle({...source,readingTimeMode:'manual',readTime:'۹ دقیقه'}).readTime,'۹ دقیقه');
  assert.equal(readingStats('<p> </p>').minutes,1);
  assert.match(readingStats('<p>سلام جهان</p>','fa-IR').label,/دقیقه مطالعه/);
  assert.match(readingStats('<p>Hallo Welt</p>','de-DE').label,/Min\. Lesezeit/);
  assert.equal(articleDirection({language:'ar'}),'rtl');
  assert.equal(articleDirection({language:'tr'}),'ltr');
});
test('outline adds unique anchors to repeated headings without changing words',()=>{
  const html='<h2>First</h2><p>Body</p><h3>First</h3>';
  const outline=articleOutline(html);
  assert.deepEqual(outline.headings.map(h=>h.id),['article-section-1','article-section-2']);
  assert.equal(parseHTML('<html><body>'+outline.html+'</body></html>').document.body.textContent,'FirstBodyFirst');
});
test('editorial checks evaluate target phrase and missing image descriptions without adding keywords to body',()=>{
  const data={slug:'test',language:'fa',title:'یادگیری پایتون',summary:'آموزش پایتون',focusKeyword:'پایتون',body:'<h2>پایتون</h2><p>متن</p><img src="/photo.jpg">',cover:'/photo.jpg'};
  const before=JSON.stringify(data),review=editorialReview(data);
  assert.equal(JSON.stringify(data),before);assert.equal(review.checks.filter(c=>!c.ok).length,2);
  assert.equal(review.checks.filter(c=>c.name.startsWith('عبارت هدف')).every(c=>c.ok),true);
});
