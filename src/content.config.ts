import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {safeArticleHTML} from './security/article-html.mjs';

const text = z.string().min(1);
const optional = <T extends z.ZodType>(schema:T) => z.preprocess(value=>value===null||value===''?undefined:value,schema.optional());
const url = z.url().refine(v => /^https?:\/\//.test(v), 'Use an HTTP or HTTPS URL.');
const media = (extensions: string) => text.refine(value => {
  if(!value.startsWith('/') || value.startsWith('//') || /[?#%\\\s]/.test(value) || value.split('/').includes('..')) return false;
  return new RegExp(`\\.(${extensions})$`, 'i').test(value);
}, 'Use a local /media/ path with a supported file extension.');
const image = media('png|jpe?g|webp|avif|gif');
const publicationDate=text.regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{
  const date=new Date(value+'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10)===value;
},'Use a real publication date in YYYY-MM-DD format.');
const link = z.object({label: text, url, primary: z.boolean().optional()});
const shared = {slug: text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), order: z.number().int().nonnegative(), featured: z.boolean().default(false)};
const translated = <T extends z.ZodRawShape>(shape: T) => z.object({de: z.object(shape).optional(), fa: z.object(shape).optional()});
const links=z.preprocess(value=>value===null?[]:value,z.array(link).default([]));
const color=text.regex(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i,'Use a hexadecimal color.');
const project = {title: text, summary: text, tags: z.array(text), status: z.enum(['Live','In Progress','Building','Planned']), emoji: text, colorA: color, colorB: color, links};
// Translated status and link labels are display strings, not workflow enum values.
const projectTranslation = {...project, emoji:optional(text),colorA:optional(color),colorB:optional(color),status: text, documentation:optional(z.string()), seoTitle:optional(text)};
const certificate = {name: text, issuer: text, date: text, category: text, description: text, emoji: text};
const certificateTranslation={...certificate,category:optional(text),emoji:optional(text)};
const articleBody=text.transform((value,ctx)=>{
  try{return safeArticleHTML(value)}catch(error){ctx.addIssue({code:'custom',message:error instanceof Error?error.message:'Invalid article HTML'});return z.NEVER}
});
const article = {title: text, summary: text, date: text, categories: z.array(text), body: articleBody, readTime: optional(text)};

export const collections = {
  projects: defineCollection({loader: glob({pattern:'*.json', base:'./src/content/projects'}), schema: z.object({...shared, ...project, liveUrl:optional(url), githubUrl:optional(url), thumbnail:optional(image), documentation:optional(z.string()), translations:translated(projectTranslation)})}),
  certificates: defineCollection({loader: glob({pattern:'*.json', base:'./src/content/certificates'}), schema: z.object({...shared, ...certificate, date:text.regex(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/,'Use an English month and four-digit year, for example Oct 2026.'), image:optional(image), pdf:optional(media('pdf')), credentialUrl:optional(url), translations:translated(certificateTranslation)})}),
  featured: defineCollection({loader:glob({pattern:'*.json',base:'./src/content/featured'}),schema:z.object({slug:shared.slug,order:shared.order,title:text,summary:text,url:text.refine(v=>/^https?:\/\//.test(v)||/^\/(?!\/)/.test(v),'Use HTTPS or a local path.'),image:optional(image),emoji:text.default('⭐'),published:z.boolean().default(true),translations:translated({title:text,summary:text}).optional()})}),
  articles: defineCollection({loader: glob({pattern:'*.json', base:'./src/content/articles'}), schema: z.object({...shared, ...article, cover:optional(image), publishedAt:optional(publicationDate), draft:z.boolean(), language:text.regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).refine(value=>{try{return Intl.getCanonicalLocales(value).length===1}catch{return false}},'Use a valid language code.').default('en'), readingTimeMode:z.enum(['auto','manual']).default('auto'), toc:z.boolean().default(true), coverAlt:optional(text), seoTitle:optional(text), seoDescription:optional(text), focusKeyword:optional(text), updatedAt:optional(publicationDate), translations:translated(article).optional()})})
};
