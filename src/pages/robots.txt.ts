import {siteOrigin} from '../data/sites';
export const GET = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
