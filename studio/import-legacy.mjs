import {readFileSync,readdirSync,realpathSync,statSync,lstatSync,mkdirSync} from 'node:fs';
import {join,resolve,dirname,sep,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openStore} from './store.mjs';
import {MAX_MEDIA} from './catalog.mjs';
const types={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif'};
export function collectLegacy(root){
 const base=realpathSync(root);
 function checked(relative){
  if(!/^[A-Za-z0-9_./-]+$/.test(relative)||relative.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid source path');
  const target=join(base,relative);
  if(lstatSync(target).isSymbolicLink())throw Error('Symlink rejected');
  const actual=realpathSync(target);
  if(!actual.startsWith(base+sep)||actual!==target)throw Error('Source escapes or aliases root');
  return actual;
 }
 function read(relative,max=2*1024*1024){const path=checked(relative),stat=statSync(path);if(!stat.isFile()||stat.size===0||stat.size>max)throw Error('Invalid source size: '+relative);return readFileSync(path)}
 function walk(relative){const dir=checked(relative);return readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>{const p=relative+'/'+e.name;if(e.isSymbolicLink())throw Error('Symlink rejected');if(e.isDirectory())return walk(p);if(!e.isFile())throw Error('Not a regular file');return [p]})}
 const records=[],media=[];
 for(const [folder,kind] of Object.entries({projects:'project',certificates:'certificate',featured:'featured',articles:'legacyArticle'})){
  for(const source of walk('src/content/'+folder)){
   if(!source.endsWith('.json'))continue;
   const raw=read(source),data=JSON.parse(raw.toString('utf8')),key=source.split('/').at(-1).slice(0,-5);
   records.push({kind,key,data,source,raw});
  }
 }
 for(const [source,kind,key] of [['src/data/skills.json','skills','skills'],['src/data/translations.json','siteTranslations','translations']]){
  const raw=read(source);records.push({kind,key,source,raw,data:JSON.parse(raw.toString('utf8'))});
 }
 const home=read('src/pages/index.astro').toString('utf8');
 const translations=records.find(x=>x.kind==='siteTranslations').data;
 const bio=home.match(/<p class="hero-bio">\s*([\s\S]*?)\s*<\/p>/)?.[1];
 const focus=home.match(/<div class="hero-location">\s*<span><\/span>\s*([\s\S]*?)\s*<\/div>/)?.[1]?.replaceAll('&amp;','&');
 const location=home.match(/<div class="hero-eyebrow">\s*<span>[^<]*<\/span>\s*([\s\S]*?)\s*<\/div>/)?.[1];
 if(!bio||!focus||!location)throw Error('Legacy hero markup changed; review migration');
 const localize=value=>({en:value,de:translations.de?.[value]??value,fa:translations.fa?.[value]??value});
 const socials=Object.fromEntries([...home.matchAll(/<a aria-label="([^"]+)" class="social-btn" href="([^"]+)"/g)].map(m=>[m[1],m[2].replaceAll('&amp;','&')]));
 const data={names:{en:'Kian Khayat',de:'Kian Khayat',fa:'کیان خیاط'},bio:localize(bio),focus:localize(focus),location:localize(location),socials,portraits:{light:'src/assets/originals/15793.jpg',dark:'src/assets/originals/123.png',original:'src/assets/originals/photo.jpg'},resume:'public/Kian-Khayat-CV.pdf'};
 records.push({kind:'profile',key:'owner',source:'derived/profile-v1',raw:Buffer.from(JSON.stringify(data)),data});
 const paths=[...walk('public/media'),...walk('src/assets/originals'),'public/photo.jpg','public/Kian-Khayat-CV.pdf'];
 for(const source of paths){if(source.endsWith('/.gitkeep'))continue;const mime=types[extname(source).toLowerCase()];if(!mime)throw Error('Unexpected media: '+source);media.push({source,mime,bytes:read(source,MAX_MEDIA)})}
 const names=new Set(media.map(m=>m.source));
 for(const r of records){
  if(['project','certificate','featured','legacyArticle'].includes(r.kind))for(const field of ['thumbnail','image','pdf','cover']){
   const value=r.data[field];if(value&&(!value.startsWith('/')||!names.has('public'+value)))throw Error('Missing local asset: '+r.source+' '+field);
  }
 }
 return {records,media};
}
export function migrateLegacy(root,store){const {records,media}=collectLegacy(root);return {...store.catalog.importBatch(records,media),records:records.length,media:media.length}}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const root=process.argv[2],db=process.env.STUDIO_DB;
 if(!root||!db)throw Error('Usage: STUDIO_DB=/absolute/private/database.sqlite node studio/import-legacy.mjs /repo/root');
 mkdirSync(dirname(resolve(db)),{recursive:true});
 const store=openStore(db);
 try{console.log(JSON.stringify(migrateLegacy(root,store)))}finally{store.close()}
}
