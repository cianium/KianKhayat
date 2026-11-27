import {DatabaseSync} from 'node:sqlite';
import {hash,token} from './core.mjs';
import {initCatalog} from './catalog.mjs';
export function openStore(path){
 const db=new DatabaseSync(path);
 db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
 db.exec('CREATE TABLE IF NOT EXISTS owner (id INTEGER PRIMARY KEY CHECK(id=1), subject TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, subject TEXT NOT NULL, csrf TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS oauth (id TEXT PRIMARY KEY, state TEXT NOT NULL, verifier TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY, language TEXT NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN (\'draft\',\'published\')), published_at TEXT, updated_at TEXT NOT NULL, UNIQUE(language,slug));');
 const catalog=initCatalog(db);
 return {
  catalog,
  close:()=>db.close(),
  owner:()=>db.prepare('SELECT subject FROM owner WHERE id=1').get()?.subject,
  pin:sub=>{db.prepare('INSERT OR IGNORE INTO owner VALUES(1,?)').run(sub);return db.prepare('SELECT subject FROM owner WHERE id=1').get()?.subject===sub},
  clean:()=>{db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());db.prepare('DELETE FROM oauth WHERE expires<=?').run(Date.now())},
  startOAuth:()=>{const id=token(),state=token(),verifier=token();db.prepare('INSERT INTO oauth VALUES(?,?,?,?)').run(hash(id),state,verifier,Date.now()+600000);return {id,state,verifier}},
  takeOAuth:id=>db.prepare('DELETE FROM oauth WHERE id=? AND expires>? RETURNING state,verifier').get(hash(id),Date.now()),
  login:sub=>{const id=token();db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(id),sub,token(),Date.now()+28800000);return id},
  session:id=>db.prepare('SELECT subject,csrf FROM sessions WHERE id=? AND expires>?').get(hash(id),Date.now()),
  logout:id=>db.prepare('DELETE FROM sessions WHERE id=?').run(hash(id)),
  list:()=>db.prepare('SELECT id,language,slug,title,summary,status,published_at,updated_at FROM articles ORDER BY updated_at DESC').all(),
  published:()=>db.prepare("SELECT language,slug,title,summary,published_at FROM articles WHERE status='published' ORDER BY published_at DESC,id DESC").all(),
  find:id=>db.prepare('SELECT * FROM articles WHERE id=?').get(id),
  publicArticle:(language,slug)=>db.prepare("SELECT * FROM articles WHERE language=? AND slug=? AND status='published'").get(language,slug),
  save:(a,id)=>{const now=new Date().toISOString();if(id){const old=db.prepare('SELECT * FROM articles WHERE id=?').get(id);if(!old)throw Error('Article not found');if(old.published_at&&(a.slug!==old.slug||a.language!==old.language))throw Error('Published URLs cannot be changed');db.prepare('UPDATE articles SET language=?,slug=?,title=?,summary=?,body=?,status=?,published_at=?,updated_at=? WHERE id=?').run(a.language,a.slug,a.title,a.summary,a.body,a.status,old.published_at||(a.status==='published'?now:null),now,id);return id}return Number(db.prepare('INSERT INTO articles(language,slug,title,summary,body,status,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(a.language,a.slug,a.title,a.summary,a.body,a.status,a.status==='published'?now:null,now).lastInsertRowid)}
 };
}
