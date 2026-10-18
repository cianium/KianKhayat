import type {CollectionEntry} from 'astro:content';
import type {Language} from './sites';
export const articlePath=(slug:string)=>`/articles/${slug}/`;
export {originalLanguage, articleDirection, readingStats, articleOutline} from './article-tools.mjs';
import {prepareArticle} from './article-tools.mjs';
export function localizeArticle(data:CollectionEntry<'articles'>['data'],_lang?:Language) {
  return prepareArticle(data) as CollectionEntry<'articles'>['data'] & {readTime:string;language:string};
}
// Preserve month-only dates without inventing a publication day.
export function articleDate(data:CollectionEntry<'articles'>['data']) {
  if(data.publishedAt)return data.publishedAt;
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const match=data.date.match(/^(\w+) (\d{4})$/);
  const month=match?months.indexOf(match[1]):-1;
  return match && month>=0?`${match[2]}-${String(month+1).padStart(2,'0')}`:undefined;
}
