import type { APIRoute } from 'astro';
import {routes, languages, languageURL, siteLanguage} from '../data/sites';
import {getCollection} from 'astro:content';
import {articlePath,originalLanguage} from '../data/articles';
export const GET: APIRoute = async () => {
  const projects=(await getCollection('projects')).sort((a,b)=>a.data.order-b.data.order);
  const articles=(await getCollection('articles',({data})=>!data.draft)).sort((a,b)=>a.data.order-b.data.order);
  const paths=[...routes,...projects.map(({data})=>`/work/${data.slug}/`),...articles.filter(({data})=>(languages.find(lang=>lang===originalLanguage(data).split('-')[0])||'en')===siteLanguage).map(({data})=>articlePath(data.slug))];
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + paths.map(path => `<url><loc>${languageURL(siteLanguage, path)}</loc>${(path.startsWith('/articles/')&&path!=='/articles/'?[]:[...languages, 'x-default']).map(lang => `<xhtml:link rel="alternate" hreflang="${lang}" href="${languageURL(lang === 'x-default' ? 'en' : lang as typeof siteLanguage, path)}"/>`).join('')}</url>`).join('') + '</urlset>', {headers: {'Content-Type': 'application/xml; charset=utf-8'}});
};
