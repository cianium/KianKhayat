import sharp from 'sharp';
import {mediaType,MAX_MEDIA} from './catalog.mjs';
export const portraitSlots=['light','dark'];
export const profileFields={names:120,bio:4000,focus:500,location:240};
export const profileLanguages=['fa','en','de'];
export const cropPositions=['centre','north','south','west','east'];
export function revision(value){
 if(typeof value!=='string'||!/^[1-9][0-9]{0,12}$/.test(value))throw Error('Invalid revision');
 return Number(value);
}
export function profileInput(form,original){
 const out={...original};
 for(const [field,max] of Object.entries(profileFields)){
  out[field]={...original[field]};
  for(const lang of profileLanguages){
   const value=(form.get(field+'_'+lang)||'').trim();
   if(value.length>max||((field==='names'||field==='bio')&&!value))throw Error('Invalid profile field');
   out[field][lang]=value;
  }
 }
 out.socials={...original.socials};
 for(const key of Object.keys(original.socials||{})){
  const value=(form.get('social_'+key)||'').trim();
  if(!value){delete out.socials[key];continue}
  const url=new URL(value);
  if(value.length>1000||url.protocol!=='https:'||url.username||url.password)throw Error('Invalid social URL');
  out.socials[key]=value;
 }
 return out;
}
export async function preparePortrait(bytes,position='centre'){
 if(!cropPositions.includes(position)||bytes.length>10*1024*1024)throw Error('Invalid image or crop');
 const mime=mediaType(bytes);
 if(!['image/jpeg','image/png','image/webp'].includes(mime))throw Error('Unsupported portrait format');
 const image=sharp(bytes,{limitInputPixels:40_000_000,failOn:'error'});
 const meta=await image.metadata();
 if(!meta.width||!meta.height||meta.width*meta.height>40_000_000||(meta.pages||1)>1||!['jpeg','png','webp'].includes(meta.format))throw Error('Invalid image dimensions or format');
 return image.rotate().resize(720,720,{fit:'cover',position}).webp({quality:84}).toBuffer();
}
export function prepareResume(bytes){
 if(mediaType(bytes)!=='application/pdf'||!bytes.subarray(-2048).includes(Buffer.from('%%EOF')))throw Error('Invalid PDF');
 return bytes;
}
export async function readUpload(req,max=MAX_MEDIA){
 const declared=req.headers['content-length'];
 if(declared!==undefined&&(!/^[0-9]+$/.test(declared)||Number(declared)>max))throw Error('File too large');
 if(req.headers['content-type']!=='application/octet-stream')throw Error('Invalid upload content type');
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>max)throw Error('File too large');chunks.push(chunk)}
 if(!size)throw Error('Empty file');
 return Buffer.concat(chunks);
}
