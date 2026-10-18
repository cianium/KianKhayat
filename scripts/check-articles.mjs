import fs from 'node:fs';
import {prepareArticle,originalLanguage} from '../src/data/article-tools.mjs';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
const all=fs.readdirSync('src/content/articles').filter(file=>file.endsWith('.json')).map(file=>JSON.parse(fs.readFileSync(`src/content/articles/${file}`,'utf8'))).sort((a,b)=>a.order-b.order);
const published=all.filter(article=>!article.draft);
const output=process.env.ARTICLE_OUTPUT||'dist';
const sites={en:'https://kiankhayat.me',de:'https://de.kiankhayat.me',fa:'https://fa.kiankhayat.me'};
const display=(text,lang)=>lang==='fa'?text.replaceAll('کیان خیاط','Kian Khayat').replaceAll('کیان','Kian'):text;
const bodyText=html=>parseHTML(`<html><body>${html}</body></html>`).document.body.textContent;
let checked=0;
for(const [lang,origin] of Object.entries(sites)) {
  const read=file=>fs.readFileSync(`${output}/${lang}/${file}`,'utf8');
  const feed=new DOMParser().parseFromString(read('rss.xml'),'text/xml');
  assert.equal(feed.documentElement.getAttribute('version'),'2.0');
  assert.equal(feed.querySelector('channel>language').textContent,lang);
  assert.equal(feed.getElementsByTagName('atom:link')[0].getAttribute('href'),origin+'/rss.xml');
  const items=[...feed.querySelectorAll('item')];assert.equal(items.length,published.length);
  const index=parseHTML(read('articles/index.html')).document;
  const cards=[...index.querySelectorAll('.article-title a')];assert.equal(cards.length,published.length);
  for(const [i,source] of published.entries()) {
    const article=prepareArticle(source),canonicalOrigin=sites[originalLanguage(source).split('-')[0]]||sites.en,path=`/articles/${source.slug}/`;
    const document=parseHTML(read(path.slice(1)+'index.html')).document;
    assert.equal(document.querySelector('h1').textContent,article.title);
    assert.equal(document.querySelector('.article-content').textContent,bodyText(article.body));
    assert.equal(document.querySelector('.article-deck').textContent,article.summary);
    assert(document.querySelector('.article-meta').textContent.includes(article.readTime));
    assert.equal(document.querySelector('.article-detail').getAttribute('lang'),originalLanguage(source));
    assert.equal(document.querySelector('link[rel="canonical"]').href,canonicalOrigin+path);
    assert.equal(document.querySelectorAll('link[hreflang]').length,0);
    for(const link of document.querySelectorAll('.article-toc a'))assert(document.querySelector(link.getAttribute('href')));
    assert.equal(cards[i].getAttribute('href'),path);

    assert.equal(document.querySelector('meta[property="og:type"]').content,'article');
    assert.equal(document.querySelector('link[type="application/rss+xml"]').href,origin+'/rss.xml');
    const graph=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    const schema=graph.find(node=>node['@type']==='Article');
    assert.equal(schema.headline,article.title);assert.equal(schema.inLanguage,originalLanguage(source));
    assert.equal(schema.mainEntityOfPage['@id'],canonicalOrigin+path+'#webpage');
    assert.equal(schema.datePublished,source.publishedAt||undefined);
    assert.equal(items[i].querySelector('title').textContent,article.title);
    assert.equal(items[i].querySelector('description').textContent,article.summary);
    assert.equal(items[i].querySelector('link').textContent,canonicalOrigin+path);
    assert.equal(items[i].querySelector('guid').textContent,canonicalOrigin+path);
    const feedBody=items[i].getElementsByTagName('content:encoded')[0].textContent;
    assert.equal(bodyText(feedBody),bodyText(article.body));
    const originalBody=parseHTML(`<html><body>${article.body}</body></html>`).document;
    const feedDocument=parseHTML(`<html><body>${feedBody}</body></html>`).document;
    for(const attr of ['src','href']) {
      const before=[...originalBody.querySelectorAll(`[${attr}]`)];
      const after=[...feedDocument.querySelectorAll(`[${attr}]`)];assert.equal(after.length,before.length);
      before.forEach((element,index)=>{const value=element.getAttribute(attr);assert.equal(after[index].getAttribute(attr),value.startsWith('/')?new URL(value,origin).href:value)});
    }
    assert.equal(items[i].querySelector('pubDate')?.textContent,source.publishedAt?new Date(source.publishedAt+'T00:00:00Z').toUTCString():undefined);
    checked++;
  }
  for(const draft of all.filter(article=>article.draft)) {
    assert(!fs.existsSync(`${output}/${lang}/articles/${draft.slug}/index.html`));
    for(const file of ['rss.xml','sitemap.xml','articles/index.html','index.html'])assert(!read(file).includes(draft.slug),`Draft leaked into ${lang}/${file}`);
  }
}
const report={passed:true,articlePages:checked,feeds:3,draftsExcluded:all.filter(article=>article.draft).length,checks:['original-language body and summary on every site','automatic or legacy manual reading times','real index links','Article structured data','RSS discovery','original-language RSS and canonical GUIDs','no invented publication dates','draft exclusion']};
fs.mkdirSync('docs/phase9',{recursive:true});fs.writeFileSync(process.env.ARTICLE_REPORT||'docs/phase9/articles.json',JSON.stringify(report,null,2)+'\n');console.log(report);
