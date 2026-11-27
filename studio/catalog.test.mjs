import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,symlinkSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {openStore} from './store.mjs';
import {collectLegacy,migrateLegacy} from './import-legacy.mjs';
import {mediaType} from './catalog.mjs';
import {createStudio} from './server.mjs';
import http from 'node:http';
const root=fileURLToPath(new URL('../',import.meta.url));
test('actual repository import preserves all source content and original media, persists and never publishes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'studio-catalog-')),path=join(dir,'catalog.sqlite');
 let db=openStore(path);
 try{
  const {records,media}=collectLegacy(root),counts={};
  for(const r of records)counts[r.kind]=(counts[r.kind]||0)+1;
  assert.deepEqual(counts,{project:3,certificate:8,featured:2,legacyArticle:4,skills:1,siteTranslations:1,profile:1});
  const result=migrateLegacy(root,db);assert.equal(result.inserted,20);assert.equal(result.mediaInserted,media.length);assert.ok(media.length>=10);
  for(const r of records){const saved=db.catalog.get(r.kind,r.key);assert.deepEqual(saved.data,r.data);assert.equal(saved.status,'staged');assert.equal(saved.revision,1)}
  for(const m of media){const sha=createHash('sha256').update(m.bytes).digest('hex');assert.deepEqual(Buffer.from(db.catalog.mediaBytes(sha).bytes),m.bytes)}
  assert.equal(db.published().length,0);
  const old=db.catalog.get('project','personal-hq');
  assert.equal(db.catalog.save('project','personal-hq',{...old.data,featured:false},'draft',1,'test-owner'),2);
  assert.throws(()=>db.catalog.save('project','personal-hq',old.data,'draft',1,'test-owner'),/Revision conflict/);
  assert.equal(migrateLegacy(root,db).inserted,0);
  assert.equal(db.catalog.get('project','personal-hq').data.featured,false);
  assert.equal(db.catalog.history('project','personal-hq').length,2);
  db.close();db=openStore(path);assert.equal(db.catalog.list().length,20);
  assert.equal(db.catalog.get('project','personal-hq').revision,2);
 }finally{db.close();rmSync(dir,{recursive:true,force:true})}
});
test('transaction rollback on content conflict, media validation and changed source detection',()=>{
 const db=openStore(':memory:');
 try{
  const {records,media}=collectLegacy(root);
  const bad={...records[0],key:'invalid',source:'bad'};
  assert.throws(()=>db.catalog.importBatch([...records,bad],media));
  assert.equal(db.catalog.list().length,0);assert.equal(db.catalog.mediaList().length,0);
  assert.throws(()=>mediaType(Buffer.from('<svg onload=alert(1)>')));
  assert.throws(()=>db.catalog.importBatch(records,[{...media[0],mime:'application/invalid'}]));
  migrateLegacy(root,db);
  assert.throws(()=>db.catalog.importBatch([{...records[0],raw:Buffer.from('changed')}],[]),/Legacy content changed/);
  assert.equal(db.catalog.list().length,20);
 }finally{db.close()}
});
test('inventory cannot be read by anonymous or blog users',async()=>{
 const db=openStore(':memory:');migrateLegacy(root,db);
 const server=createStudio({owner:'owner@gmail.com',subject:''},db);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const req=(host,cookie)=>new Promise((resolve,reject)=>{const r=http.get({hostname:'127.0.0.1',port:server.address().port,path:'/inventory',headers:{Host:host,...(cookie?{Cookie:cookie}:{})}},res=>{let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,body}))});r.on('error',reject)});
 try{
  assert.equal((await req('manage.kiankhayat.me')).status,401);
  db.pin('owner');const cookie='__Host-studio-session='+db.login('owner');
  assert.equal((await req('blog.kiankhayat.me',cookie)).status,404);
  const response=await req('manage.kiankhayat.me',cookie);
  assert.equal(response.status,200);assert.ok(response.body.includes('personal-hq'));
 }finally{await new Promise(r=>server.close(r));db.close()}
});
