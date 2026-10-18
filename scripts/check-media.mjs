import fs from 'node:fs';
import path from 'node:path';
import {parseHTML} from 'linkedom';
import {validateMedia} from './media-validation.mjs';
import {safeArticleHTML} from '../src/security/article-html.mjs';
const root=path.resolve('public');
let count=0;
const slugs=new Set();
for(const collection of ['projects','certificates','articles','featured'])for(const filename of fs.readdirSync(`src/content/${collection}`).filter(file=>file.endsWith('.json'))) {
  const data=JSON.parse(fs.readFileSync(`src/content/${collection}/${filename}`,'utf8'));
  if(collection==='articles')for(const article of [data,...Object.values(data.translations||{})]) {
    const {document}=parseHTML(`<html><body>${safeArticleHTML(article.body||'')}</body></html>`);
    for(const img of document.querySelectorAll('img[src]')) {
      const src=img.getAttribute('src');
      if(src.startsWith('/')&&!src.startsWith('//')) {
        const target=path.resolve(root,'.'+src);
        if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())throw new Error(`${filename}: article image is missing: ${src}`);
        await validateMedia(root,src);count++;
      }
    }
  }
  const id=`${collection}/${data.slug}`;
  if(slugs.has(id))throw new Error(`Duplicate content slug: ${id}`);
  slugs.add(id);
  for(const key of ['thumbnail','image','pdf','cover']) {
    if(!data[key])continue;
    const target=path.resolve(root,'.'+data[key]);
    if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())throw new Error(`${collection}/${filename}: ${key} file is missing: ${data[key]}`);
    await validateMedia(root,data[key]);count++;
  }
}
// Check even unreferenced CMS uploads, not only files already attached to an entry.
async function uploads(directory) {
  if(!fs.existsSync(directory))return;
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    if(entry.isDirectory())await uploads(file);
    else if(entry.name!=='.gitkeep')await validateMedia(root,'/'+path.relative(root,file).split(path.sep).join('/'));
  }
}
await uploads(path.join(root,'media'));
console.log(`Verified ${count} referenced media files.`);
