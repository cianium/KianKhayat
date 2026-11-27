import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import sharp from 'sharp';
import {openStore} from './store.mjs';
import {migrateLegacy} from './import-legacy.mjs';
import {preparePortrait,prepareResume,profileInput,revision} from './profile.mjs';
import {createStudio} from './server.mjs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=()=>sharp({create:{width:100,height:160,channels:3,background:'#5f9674'}}).png().toBuffer();
test('portrait processing normalizes image; rejects spoofed files and invalid crop',async()=>{
 const bytes=await source(),out=await preparePortrait(bytes,'north'),meta=await sharp(out).metadata();
 assert.equal(meta.format,'webp');assert.equal(meta.width,720);assert.equal(meta.height,720);
 assert.equal(meta.exif,undefined);
 await assert.rejects(()=>preparePortrait(bytes,'bad'));
 await assert.rejects(()=>preparePortrait(Buffer.from('<svg onload=alert(1)>')));
 assert.throws(()=>prepareResume(bytes));
 assert.throws(()=>revision('1e2'));
});
test('profile text validation preserves original media and rejects unsafe social links',()=>{
 const db=openStore(':memory:');try{
  migrateLegacy(root,db);const record=db.catalog.get('profile','owner'),d=record.data;
  const form=new URLSearchParams();
  for(const key of ['names','bio','focus','location'])for(const lang of ['fa','en','de'])form.set(key+'_'+lang,d[key][lang]);
  for(const [key,value] of Object.entries(d.socials))form.set('social_'+key,value);
  form.set('bio_fa','بیوگرافی تازه');const result=profileInput(form,d);
  assert.equal(result.bio.fa,'بیوگرافی تازه');assert.deepEqual(result.portraits,d.portraits);assert.equal(result.resume,d.resume);
  form.set('social_'+Object.keys(d.socials)[0],'javascript:alert(1)');assert.throws(()=>profileInput(form,d));
 }finally{db.close()}
});
test('profile HTTP edits, private media and atomic revision checks',async()=>{
 const db=openStore(':memory:');migrateLegacy(root,db);db.pin('owner');
 const session=db.login('owner'),csrf=db.session(session).csrf,cookie='__Host-studio-session='+session;
 const server=createStudio({owner:'owner@gmail.com',subject:''},db);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const request=(path,{host='manage.kiankhayat.me',method='GET',headers={},body}={})=>new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port:server.address().port,path,method,headers:{Host:host,...headers}},res=>{
   const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
  });req.on('error',reject);req.end(body);
 });
 try{
  assert.equal((await request('/profile')).status,401);
  assert.equal((await request('/profile/media/light',{host:'blog.kiankhayat.me',headers:{Cookie:cookie}})).status,404);
  const old=db.catalog.get('profile','owner');
  const bytes=await source();
  const headers={Cookie:cookie,Origin:'https://manage.kiankhayat.me','X-Studio-CSRF':csrf,'X-Studio-Revision':String(old.revision),'Content-Type':'application/octet-stream','Content-Length':String(bytes.length)};
  assert.equal((await request('/profile/media/light',{method:'POST',headers:{...headers,'X-Studio-CSRF':'bad'},body:bytes})).status,403);
  assert.equal((await request('/profile/media/light',{method:'POST',headers:{...headers,Origin:'https://evil.example'},body:bytes})).status,403);
  const saved=await request('/profile/media/light?crop=north',{method:'POST',headers,body:bytes});
  assert.equal(saved.status,200,saved.body.toString());assert.equal(JSON.parse(saved.body).revision,old.revision+1);
  const current=db.catalog.get('profile','owner');
  assert.match(current.data.portraits.light,/^uploads\/[a-f0-9]{64}\.webp$/);
  assert.equal(current.data.portraits.dark,old.data.portraits.dark);
  assert.equal((await request('/profile/media/light',{method:'POST',headers,body:bytes})).status,409);
  assert.equal(db.catalog.get('profile','owner').revision,current.revision);
  const photo=await request('/profile/media/light',{headers:{Cookie:cookie}});assert.equal(photo.status,200);assert.equal(photo.headers['content-type'],'image/webp');assert.equal(photo.headers['cache-control'],'private, no-store');
  const resume=await request('/profile/media/resume',{headers:{Cookie:cookie}});assert.equal(resume.status,200);assert.match(resume.headers['content-disposition'],/^attachment/);
  const form=new URLSearchParams({csrf,revision:String(current.revision)});
  for(const key of ['names','bio','focus','location'])for(const lang of ['fa','en','de'])form.set(key+'_'+lang,current.data[key][lang]);
  for(const [key,value] of Object.entries(current.data.socials))form.set('social_'+key,value);
  form.set('bio_en','Updated test bio');
  const update=await request('/profile',{method:'POST',headers:{Cookie:cookie,Origin:'https://manage.kiankhayat.me','Content-Type':'application/x-www-form-urlencoded'},body:form.toString()});
  assert.equal(update.status,303);assert.equal(db.catalog.get('profile','owner').data.bio.en,'Updated test bio');
  assert.equal(db.catalog.get('profile','owner').data.portraits.light,current.data.portraits.light);
 }finally{await new Promise(r=>server.close(r));db.close()}
});
