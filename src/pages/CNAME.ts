import {siteOrigin} from '../data/sites';
export const GET = () => new Response(new URL(siteOrigin).hostname + '\n');
