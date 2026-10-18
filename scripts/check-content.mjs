import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const json=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const baseline=json('tests/fixtures/source-content.json');
const staticBaseline=json('tests/fixtures/static-text.json');
const dictionaries=json('src/data/translations.json');
const normalize=s=>String(s).replace(/\s+/g,' ').trim();
const dom=html=>parseHTML('<html><body>'+html+'</body></html>').document;
const rename={cat:'category',desc:'description',content:'body'};
const failures=[];
const check=(name,fn)=>{try{fn()}catch(error){failures.push({name,error:error.message})}};
const translate=(v,lang)=>typeof v==='string'?(dictionaries[lang][normalize(v)]??v):Array.isArray(v)?v.map(x=>translate(x,lang)):v && typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[rename[k]||k,translate(x,lang)])):v;
check('entire original German and Persian dictionaries',()=>assert.deepEqual(dictionaries,baseline.translations));
check('all skills and their details',()=>assert.deepEqual(json('src/data/skills.json'),baseline.data.SKILLS));
const counts={};
for(const [collection,key] of [['projects','PROJECTS'],['certificates','CERTS'],['articles','ARTICLES']]) {
  const entries=fs.readdirSync('src/content/'+collection).filter(f=>f.endsWith('.json')).map(f=>json(`src/content/${collection}/${f}`)).sort((a,b)=>a.order-b.order);
  counts[collection]=entries.length;
  check(collection+' count',()=>assert.equal(entries.length,baseline.data[key].length));
  baseline.data[key].forEach((original,index)=>{
    const entry=entries[index];
    for(const [key,value] of Object.entries(original))check(`${collection}[${index}].${key}`,()=>assert.deepEqual(entry[rename[key]||key],value));
    for(const lang of ['de','fa']) {
      const expected=translate(original,lang),actual=entry.translations[lang];
      if(collection==='articles') {
        const document=dom(original.content);
        const walk=node=>{for(const child of node.childNodes){if(child.nodeType===3)child.textContent=dictionaries[lang][child.textContent]??child.textContent;else walk(child)}};
        walk(document.body);expected.body=normalize(document.body.textContent);
        check(`${collection}[${index}].${lang}.body`,()=>assert.equal(normalize(dom(actual.body).body.textContent),expected.body));
        delete expected.body;
      }
      for(const [key,value] of Object.entries(expected))check(`${collection}[${index}].${lang}.${key}`,()=>assert.deepEqual(actual[key],value));
    }
  });
}
const paths=['index.html','work/index.html','articles/index.html','contact/index.html','privacy/index.html','404.html'];
const documents=paths.map(path=>parseHTML(fs.readFileSync('dist/en/'+path,'utf8')).document);
const texts=new Set(),attrs=new Map();
for(const document of documents) {
  document.querySelectorAll('script,style').forEach(node=>node.remove());
  document.body.normalize();
  const visit=node=>{for(const child of node.childNodes){if(child.nodeType===3 && normalize(child.textContent))texts.add(normalize(child.textContent));else visit(child)}};
  visit(document.body);
  for(const element of document.querySelectorAll('*'))for(const key of ['alt','title','aria-label','placeholder']){
    if(element.hasAttribute(key)){const set=attrs.get(key)??new Set();set.add(element.getAttribute(key));attrs.set(key,set)}
  }
}
for(const text of staticBaseline.texts)check('static text: '+text,()=>assert(texts.has(text),'Original static text is absent from the generated HTML.'));
for(const attr of staticBaseline.attributes)check('attribute: '+attr.value,()=>assert(attrs.get(attr.attribute)?.has(attr.value),'Original accessible text is absent.'));
const report={
  source:'KianKhayat-main.zip, supplied 2026-10-09',
  normalization:'HTML formatting whitespace only; punctuation, wording and field values are compared exactly.',
  counts:{skills:baseline.data.SKILLS.length,...counts,staticTextNodes:staticBaseline.texts.length,accessibleAttributes:staticBaseline.attributes.length,translationEntries:Object.fromEntries(Object.entries(dictionaries).map(([lang,v])=>[lang,Object.keys(v).length]))},
  unapprovedDifferences:failures,
  approvedDisplayExceptions:['In Persian UI only: کیان خیاط → Kian Khayat; کیان → Kian. The original translation dictionary is retained verbatim.'],
  functionalAdditions:['Localized delivery-failure message in EN/DE/FA; shown only when EmailJS fails.'],
  unchangedReadingTimes:true,
  translationSearchSites:'Phase 4: prerendered EN/DE/FA builds with domain links; original dictionaries and content preserved.'
};
fs.writeFileSync('docs/content-comparison.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
