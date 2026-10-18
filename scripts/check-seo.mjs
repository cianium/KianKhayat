import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';

const sites={en:'https://kiankhayat.me',de:'https://de.kiankhayat.me',fa:'https://fa.kiankhayat.me'};
const projects=fs.readdirSync('src/content/projects').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`src/content/projects/${f}`,'utf8'))).sort((a,b)=>a.order-b.order);
const articles=fs.readdirSync('src/content/articles').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`src/content/articles/${f}`,'utf8'))).filter(a=>!a.draft).sort((a,b)=>a.order-b.order);
const paths=['/','/work/','/articles/','/contact/','/privacy/',...projects.map(project=>`/work/${project.slug}/`),...articles.map(article=>`/articles/${article.slug}/`)];
const dictionaries=JSON.parse(fs.readFileSync('src/data/translations.json','utf8'));
const read=(lang,file)=>fs.readFileSync(`dist/${lang}/${file}`,'utf8');
const doc=(lang,path)=>parseHTML(read(lang,path==='/'?'index.html':path.slice(1)+'index.html')).document;
const normalize=s=>s.replace(/\s+/g,' ').trim();
const display=s=>s.replaceAll('کیان خیاط','Kian Khayat').replaceAll('کیان','Kian');
const textNodes=root=>{
  const result=[];
  const visit=node=>{for(const child of node.childNodes){
    if(child.nodeType===3 && normalize(child.textContent))result.push(normalize(child.textContent));
    else if(child.nodeType===1 && !child.matches('script,style,[data-no-translate]'))visit(child);
  }};
  visit(root);return result;
};
let pages=0,translatedNodes=0,collectionFields=0;
for(const [lang,origin] of Object.entries(sites)) {
  const titles=new Set();
  for(const path of paths) {
    const article=articles.find(a=>path===`/articles/${a.slug}/`);
    const document=doc(lang,path),canonical=(article?(sites[(article.language||'en').split('-')[0]]||sites.en):origin)+path;
    assert.equal(document.documentElement.lang,lang);
    assert.equal(document.documentElement.dir,lang==='fa'?'rtl':'ltr');
    assert.equal(document.querySelectorAll('h1').length,1);
    assert.equal(document.querySelector('link[rel="canonical"]').href,canonical);
    assert.equal(document.querySelectorAll('link[hreflang]').length,article?0:4);
    if(!article)for(const [alternate,base] of Object.entries({...sites,'x-default':sites.en}))assert.equal(document.querySelector(`link[hreflang="${alternate}"]`).href,base+path);
    for(const [alternate,base] of Object.entries(sites))assert.equal(document.querySelector(`a[data-lang="${alternate}"]`).href,base+path);
    assert.equal(document.querySelector('meta[property="og:url"]').content,canonical);
    assert.equal(document.querySelector('meta[property="og:title"]').content,document.title);
    assert.equal(document.querySelector('meta[name="twitter:description"]').content,document.querySelector('meta[name="description"]').content);
    assert(!titles.has(document.title));titles.add(document.title);
    if(lang==='fa'&&!article)for(const el of document.querySelectorAll('title,meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:site_name"],meta[name="twitter:title"],meta[name="twitter:description"]'))assert(!/[a-z]/i.test(el.content||el.textContent),'Persian metadata contains Latin text');
    const graph=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    assert.equal(graph.find(node=>node['@type']==='WebSite').inLanguage,lang);
    const page=graph.find(node=>['WebPage','ContactPage'].includes(node['@type']));
    assert.equal(page.url,canonical);assert.equal(page.inLanguage,article?.language||lang);
    if(lang!=='en') {
      const original=textNodes(doc('en',path).body), translated=textNodes(document.body);
      assert.equal(translated.length,original.length,`${lang}${path}: text-node count`);
      original.forEach((text,index)=>{
        const expected=dictionaries[lang][text]??text;
        assert.equal(translated[index],lang==='fa'?display(expected):expected,`${lang}${path}: ${text}`);
        translatedNodes++;
      });
    }
    for(const [selector,collection,field] of [['.project-title','projects','title'],['.article-title','articles','title'],['.cert-name','certificates','name']]) {
      const entries=fs.readdirSync(`src/content/${collection}`).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(`src/content/${collection}/${f}`,'utf8'))).filter(item=>collection!=='articles'||!item.draft).sort((a,b)=>a.order-b.order);
      const elements=[...document.querySelectorAll(selector)];
      if(elements.length)assert.equal(elements.length,entries.length);
      elements.forEach((element,index)=>{
        const entry=collection==='certificates'?entries.find(item=>item.slug===element.closest('[data-cert]').dataset.cert):entries[index];
        const expected=collection==='articles'?entry[field]:entry.translations?.[lang]?.[field]??entry[field];
        assert.equal(element.textContent,lang==='fa'&&collection!=='articles'?display(expected):expected);collectionFields++;
      });
    }
    pages++;
  }
  const sitemap=new DOMParser().parseFromString(read(lang,'sitemap.xml'),'text/xml');
  const sitemapPaths=paths.filter(path=>{const article=articles.find(a=>path===`/articles/${a.slug}/`);return !article||(sites[(article.language||'en').split('-')[0]]||sites.en)===origin});
  assert.deepEqual([...sitemap.querySelectorAll('loc')].map(el=>el.textContent),sitemapPaths.map(path=>origin+path));
  for(const [index,url] of [...sitemap.querySelectorAll('url')].entries()) {
    assert.equal(url.getElementsByTagName('xhtml:link').length,articles.some(a=>sitemapPaths[index]===`/articles/${a.slug}/`)?0:4);
    for(const link of url.getElementsByTagName('xhtml:link'))assert.equal(link.getAttribute('href'),(sites[link.getAttribute('hreflang')]??sites.en)+sitemapPaths[index]);
  }
  assert(read(lang,'robots.txt').includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.equal(read(lang,'CNAME').trim(),new URL(origin).hostname);
  const manifest=JSON.parse(read(lang,'site.webmanifest'));assert.equal(manifest.lang,lang);
  const error=parseHTML(read(lang,'404.html')).document;
  assert(error.querySelector('meta[name="robots"]').content.includes('noindex'));
  assert.equal(error.querySelectorAll('link[hreflang],link[rel="canonical"]').length,0);
  assert.equal(error.documentElement.lang,lang);
}
const report={passed:true,pages,translatedNodes,collectionFields,checks:['static translations','single H1','canonical article language or self-canonical page','reciprocal hreflang and x-default','localized social metadata','Persian site metadata; original-language article metadata','structured data','language navigation','per-language sitemap, robots, CNAME and manifest','noindex 404']};
fs.mkdirSync('docs/phase9',{recursive:true});fs.writeFileSync('docs/phase9/seo.json',JSON.stringify(report,null,2)+'\n');
console.log(report);
