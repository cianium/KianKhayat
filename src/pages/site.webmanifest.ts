import {siteLanguage} from '../data/sites';
export const GET = () => new Response(JSON.stringify({
  name: 'Kian Khayat', short_name: 'Kian', lang: siteLanguage, dir: siteLanguage === 'fa' ? 'rtl' : 'ltr',
  icons: [192, 512].map(size => ({src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png'})),
  theme_color: '#f8f4ec', background_color: '#f8f4ec', display: 'standalone', start_url: '/', scope: '/',
}), {headers: {'Content-Type': 'application/manifest+json'}});
