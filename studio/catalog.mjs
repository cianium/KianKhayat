import {createHash} from 'node:crypto';
const kinds=new Set(['profile','project','certificate','featured','legacyArticle','skills','siteTranslations']);
const keyPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const digest=value=>createHash('sha256').update(value).digest('hex');
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'&&v.trim().length>0;
const statuses=new Set(['staged','draft','archived']);
export const MAX_MEDIA=20*1024*1024;
export function validateRecord(kind,key,data){
 if(!kinds.has(kind)||!keyPattern.test(key)||key.length>150)throw Error('Invalid content identity');
 if(!object(data)&&!(kind==='skills'&&Array.isArray(data)))throw Error('Invalid content payload');
 if(['project','certificate','featured','legacyArticle'].includes(kind)){
  if(data.slug!==key||!Number.isInteger(data.order)||data.order<0)throw Error('Invalid slug or order');
  if(!text(kind==='certificate'?data.name:data.title))throw Error('Title required');
  if(data.translations!==undefined&&(!object(data.translations)||Object.values(data.translations).some(v=>!object(v))))throw Error('Invalid translations');
 }
 if(kind==='project'&&(!text(data.summary)||!Array.isArray(data.tags)||!data.tags.every(text)||typeof data.featured!=='boolean'))throw Error('Invalid project');
 if(kind==='certificate'&&(!text(data.issuer)||!text(data.date)))throw Error('Invalid certificate');
 if(kind==='legacyArticle'&&(!text(data.body)||!text(data.summary)||typeof data.draft!=='boolean'))throw Error('Invalid legacy article');
 if(kind==='profile'&&(!object(data.names)||!object(data.bio)||!object(data.portraits)))throw Error('Invalid profile');
 const payload=JSON.stringify(data);
 if(Buffer.byteLength(payload)>2*1024*1024)throw Error('Content too large');
 return payload;
}
export function mediaType(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<12||bytes.length>MAX_MEDIA)throw Error('Invalid media size');
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.toString('ascii',0,5)==='%PDF-')return 'application/pdf';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
 if(['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)))return 'image/gif';
 if(bytes.toString('ascii',4,8)==='ftyp'&&['avif','avis'].includes(bytes.toString('ascii',8,12)))return 'image/avif';
 throw Error('Unsupported media signature');
}
// This is private archival storage, not an upload decoder or public serving policy.
export function initCatalog(db){
 db.exec(
 'CREATE TABLE IF NOT EXISTS catalog (kind TEXT NOT NULL, key TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN (\'staged\',\'draft\',\'archived\')), revision INTEGER NOT NULL CHECK(revision>0), updated_at TEXT NOT NULL, PRIMARY KEY(kind,key));'+
 'CREATE TABLE IF NOT EXISTS catalog_revisions (kind TEXT NOT NULL, key TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL, PRIMARY KEY(kind,key,revision), FOREIGN KEY(kind,key) REFERENCES catalog(kind,key));'+
 'CREATE TABLE IF NOT EXISTS media_objects (sha TEXT PRIMARY KEY, mime TEXT NOT NULL, size INTEGER NOT NULL, bytes BLOB NOT NULL, CHECK(length(bytes)=size));'+
 'CREATE TABLE IF NOT EXISTS media_sources (source TEXT PRIMARY KEY, sha TEXT NOT NULL REFERENCES media_objects(sha));'+
 'CREATE TABLE IF NOT EXISTS legacy_imports (source TEXT PRIMARY KEY, sha TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, FOREIGN KEY(kind,key) REFERENCES catalog(kind,key));'
 );
 const get=(kind,key)=>db.prepare('SELECT * FROM catalog WHERE kind=? AND key=?').get(kind,key);
 const transact=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}};
 const saveInternal=(kind,key,data,status,expected,actor)=>{
  const payload=validateRecord(kind,key,data);
  if(!statuses.has(status)||!text(actor)||actor.length>200)throw Error('Invalid status or actor');
  const old=get(kind,key);
  if((old?.revision||0)!==expected)throw Error('Revision conflict');
  const revision=expected+1,at=new Date().toISOString();
  if(old)db.prepare('UPDATE catalog SET payload=?,status=?,revision=?,updated_at=? WHERE kind=? AND key=?').run(payload,status,revision,at,kind,key);
  else db.prepare('INSERT INTO catalog VALUES(?,?,?,?,?,?)').run(kind,key,payload,status,revision,at);
  db.prepare('INSERT INTO catalog_revisions VALUES(?,?,?,?,?,?,?)').run(kind,key,revision,payload,status,actor,at);
  return revision;
 };
 return {
  get:(kind,key)=>{const row=get(kind,key);return row&&{...row,data:JSON.parse(row.payload)}},
  list:()=>db.prepare('SELECT kind,key,status,revision,updated_at FROM catalog ORDER BY kind,key').all(),
  history:(kind,key)=>db.prepare('SELECT revision,status,actor,at FROM catalog_revisions WHERE kind=? AND key=? ORDER BY revision DESC').all(kind,key),
  save:(kind,key,data,status,expected,actor)=>transact(()=>saveInternal(kind,key,data,status,expected,actor)),
  mediaList:()=>db.prepare('SELECT s.source,m.sha,m.mime,m.size FROM media_sources s JOIN media_objects m ON s.sha=m.sha ORDER BY s.source').all(),
  mediaBytes:sha=>db.prepare('SELECT bytes,mime,size FROM media_objects WHERE sha=?').get(sha),
  importBatch:(records,media)=>transact(()=>{
   let inserted=0,mediaInserted=0;
   for(const item of media){
    const mime=mediaType(item.bytes),sha=digest(item.bytes);
    if(item.mime!==mime)throw Error('Media extension/signature mismatch: '+item.source);
    const previous=db.prepare('SELECT sha FROM media_sources WHERE source=?').get(item.source);
    if(previous){if(previous.sha!==sha)throw Error('Legacy media changed: '+item.source);continue}
    db.prepare('INSERT OR IGNORE INTO media_objects VALUES(?,?,?,?)').run(sha,mime,item.bytes.length,item.bytes);
    db.prepare('INSERT INTO media_sources VALUES(?,?)').run(item.source,sha);mediaInserted++;
   }
   for(const item of records){
    validateRecord(item.kind,item.key,item.data);
    const sha=digest(item.raw),old=db.prepare('SELECT sha,kind,key FROM legacy_imports WHERE source=?').get(item.source);
    if(old){if(old.sha!==sha||old.kind!==item.kind||old.key!==item.key)throw Error('Legacy content changed: '+item.source);continue}
    if(get(item.kind,item.key))throw Error('Existing content conflict: '+item.source);
    saveInternal(item.kind,item.key,item.data,'staged',0,'legacy-import');
    db.prepare('INSERT INTO legacy_imports VALUES(?,?,?,?)').run(item.source,sha,item.kind,item.key);inserted++;
   }
   return {inserted,mediaInserted};
  })
 };
}
