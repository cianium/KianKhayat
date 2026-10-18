// Shared by the static renderer and the editorial audit. No browser or service dependency.
import {parseHTML} from 'linkedom';
export const originalLanguage = data => data.language || 'en';
export const articleDirection = data => ['fa','ar','he','ur'].includes(originalLanguage(data).split('-')[0]) ? 'rtl' : 'ltr';
export function readingStats(html, language='en') {
  const {document}=parseHTML('<html><body>'+html+'</body></html>');
  const text=document.body.textContent || '';
  const words=[...new Intl.Segmenter(language,{granularity:'word'}).segment(text)].filter(item=>item.isWordLike).length;
  const minutes=Math.max(1,Math.ceil(words/200));
  const baseLanguage=language.split('-')[0].toLowerCase();
  return {words,minutes,label:baseLanguage==='fa'?`${minutes.toLocaleString('fa-IR')} دقیقه مطالعه`:baseLanguage==='de'?`${minutes} Min. Lesezeit`:`${minutes} min read`};
}
export function prepareArticle(data) {
  const language=originalLanguage(data);
  return {...data,language,readTime:data.readingTimeMode==='manual'&&data.readTime?data.readTime:readingStats(data.body,language).label};
}
export function articleOutline(html) {
  const {document}=parseHTML('<html><body>'+html+'</body></html>');
  const headings=[...document.querySelectorAll('h2,h3')].map((node,index)=>{
    const id=`article-section-${index+1}`;node.id=id;
    return {id,text:node.textContent,level:Number(node.localName.slice(1))};
  });
  return {html:document.body.innerHTML,headings};
}
export function editorialReview(data) {
  const {document}=parseHTML('<html><body>'+data.body+'</body></html>');
  const stats=readingStats(data.body,originalLanguage(data));
  const title=data.seoTitle||data.title,description=data.seoDescription||data.summary;
  const normalize=text=>text.normalize('NFKC').toLocaleLowerCase(originalLanguage(data)).replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim();
  const keyword=normalize(data.focusKeyword||'');
  const checks=[
    {name:'عنوان سئو کوتاه و توصیفی',ok:title.length>0&&title.length<=65,note:'۶۵ نویسه فقط راهنمای نگارش است؛ حد قطعی گوگل نیست.'},
    {name:'توضیح نتیجهٔ جست‌وجو',ok:description.length>0&&description.length<=170,note:'توضیح روشن و مستقل بنویس؛ گوگل ممکن است آن را بازنویسی کند.'},
    {name:'ساختار بخش‌ها',ok:document.querySelectorAll('h2,h3').length>0},
    {name:'توضیح تصاویر داخل متن',ok:[...document.querySelectorAll('img')].every(img=>img.hasAttribute('alt')),note:'برای تصویر تزئینی alt خالی مجاز است.'},
    {name:'توضیح تصویر روی جلد',ok:!data.cover||Boolean(data.coverAlt)},
  ];
  if(keyword)checks.push(...[
    {name:'عبارت هدف در عنوان',ok:normalize(title).includes(keyword)},
    {name:'عبارت هدف در توضیح',ok:normalize(description).includes(keyword)},
    {name:'عبارت هدف در متن',ok:normalize(document.body.textContent).includes(keyword)},
  ]);
  return {slug:data.slug,language:originalLanguage(data),...stats,title,description,checks};
}
