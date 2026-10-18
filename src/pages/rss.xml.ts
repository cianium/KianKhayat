import type {APIRoute} from 'astro';
import {getCollection} from 'astro:content';
import {siteLanguage,siteOrigin,origins} from '../data/sites';
import {seo} from '../data/seo';
import {articlePath,localizeArticle} from '../data/articles';
import {feedHTML} from '../data/feed-html';

const xml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export const GET:APIRoute=async()=>{
  const articles=(await getCollection('articles',({data})=>!data.draft)).sort((a,b)=>a.data.order-b.data.order);
  const items=articles.map(({data})=>{
    const article=localizeArticle(data,siteLanguage);
    const link=(origins[article.language.split('-')[0] as keyof typeof origins]||origins.en)+articlePath(data.slug);
    // A month/year in the original content is not an exact RFC 822 publication date.
    const published=data.publishedAt?`<pubDate>${new Date(data.publishedAt+'T00:00:00Z').toUTCString()}</pubDate>`:'';
    return `<item><title>${xml(article.title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><description>${xml(article.summary)}</description><dc:language>${article.language}</dc:language><content:encoded>${xml(feedHTML(article.body,siteOrigin))}</content:encoded>${article.categories.map(category=>`<category>${xml(category)}</category>`).join('')}${published}</item>`;
  }).join('');
  const body=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${xml(seo.articles[0])}</title><link>${siteOrigin}/articles/</link><description>${xml(seo.articles[1])}</description><language>${siteLanguage}</language><atom:link href="${siteOrigin}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(body,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
};
