import http from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {configuration,MANAGE,BLOG} from './config.mjs';
import {openStore} from './store.mjs';
import {cookie,readCookie,equal,challenge,ownerAllowed,articleInput,formBody} from './core.mjs';
import * as view from './views.mjs';
import {profileInput,revision,preparePortrait,prepareResume,readUpload} from './profile.mjs';

const SESSION='__Host-studio-session', OAUTH='__Host-studio-oauth';
const callback=MANAGE+'/auth/callback';
const css=readFileSync(new URL('./studio.css',import.meta.url));
const uiScript=readFileSync(new URL('./studio-ui.js',import.meta.url));
const headers=(res,admin)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
 res.setHeader('Cache-Control',admin?'private, no-store':'no-cache');
 if(admin)res.setHeader('X-Robots-Tag','noindex, nofollow');
};
function send(res,status,body,type='text/html; charset=utf-8'){res.writeHead(status,{'Content-Type':type});res.end(body)}
function redirect(res,to){res.writeHead(303,{Location:to});res.end()}
const plain=(res,status,body)=>send(res,status,body,'text/plain; charset=utf-8');
async function googleJSON(url,options={}){
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!response.ok)throw Error('Google request failed');
 return response.json();
}
export function createStudio(config,store){
 let attempts=[],uploadBusy=false;
 return http.createServer({requestTimeout:15000,headersTimeout:10000,maxHeaderSize:16384},async(req,res)=>{
  try{
   const host=req.headers.host;
   if(host!==new URL(MANAGE).host&&host!==new URL(BLOG).host)return plain(res,421,'Unknown host');
   const admin=host===new URL(MANAGE).host;
   headers(res,admin);
   if(!req.url?.startsWith('/')||req.url.startsWith('//'))return plain(res,400,'Invalid URL');
   const url=new URL(req.url,admin?MANAGE:BLOG), path=url.pathname;
   const get=req.method==='GET',post=req.method==='POST';
   if(get&&path==='/studio.css')return send(res,200,css,'text/css; charset=utf-8');
   if(admin&&get&&path==='/studio-ui.js')return send(res,200,uiScript,'text/javascript; charset=utf-8');
   if(get&&path==='/healthz')return plain(res,200,'ok');
   if(!admin){
    if(!get)return plain(res,405,'Method not allowed');
    if(path==='/')return send(res,200,view.blogList(store.published()));
    const match=path.match(/^\/([A-Za-z0-9-]{1,35})\/([a-z0-9-]{1,100})\/?$/);
    const article=match&&store.publicArticle(match[1],match[2]);
    return article?send(res,200,view.blogArticle(article)):plain(res,404,'Not found');
   }
   const sessionId=readCookie(req,SESSION);
   const session=sessionId&&store.session(sessionId);
   if(get&&path==='/auth/google'){
    attempts=attempts.filter(t=>t>Date.now()-600000);
    if(attempts.length>=30)return plain(res,429,'Try again later');
    attempts.push(Date.now());
    store.clean();
    const transaction=store.startOAuth();
    res.setHeader('Set-Cookie',cookie(OAUTH,transaction.id,600));
    const authorization=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorization.search=new URLSearchParams({client_id:config.clientId,redirect_uri:callback,response_type:'code',scope:'openid email',state:transaction.state,code_challenge:challenge(transaction.verifier),code_challenge_method:'S256',prompt:'select_account',login_hint:config.owner}).toString();
    return redirect(res,authorization.href);
   }
   if(get&&path==='/auth/callback'){
    const id=readCookie(req,OAUTH),transaction=id&&store.takeOAuth(id);
    res.setHeader('Set-Cookie',cookie(OAUTH,'',0));
    if(!transaction||!equal(url.searchParams.get('state'),transaction.state)||!url.searchParams.get('code'))return plain(res,403,'Login denied');
    // The access token is obtained directly from Google's fixed TLS endpoint using the
    // authorization code, confidential client credentials, redirect URI and PKCE verifier.
    // Identity is read from Google's authenticated UserInfo endpoint, never browser claims.
    const result=await googleJSON('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:url.searchParams.get('code'),client_id:config.clientId,client_secret:config.secret,redirect_uri:callback,grant_type:'authorization_code',code_verifier:transaction.verifier})});
    if(typeof result.access_token!=='string'||!result.access_token)return plain(res,403,'Login denied');
    const user=await googleJSON('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+result.access_token}});
    if(!ownerAllowed(user,config,store.owner())||!store.pin(user.sub))return plain(res,403,'Account not authorized');
    if(sessionId)store.logout(sessionId);
    res.setHeader('Set-Cookie',[cookie(OAUTH,'',0),cookie(SESSION,store.login(user.sub),28800)]);
    return redirect(res,'/');
   }
   const authorized=session&&session.subject===store.owner()&&(!config.subject||session.subject===config.subject);
   if(!authorized)return get?send(res,401,view.login()):plain(res,401,'Authentication required');
   if(get&&path==='/')return send(res,200,view.dashboard(store.list(),session,store.catalog.list(),store.catalog.mediaList()));
   if(get&&path==='/inventory')return send(res,200,view.inventory(store.catalog.list(),store.catalog.mediaList(),session));
   if(get&&path==='/media')return send(res,200,view.mediaPage(store.catalog.mediaList(),session));
   if(get&&path==='/profile')return send(res,200,view.profilePage(store.catalog.get('profile','owner'),session,{saved:url.searchParams.get('saved')==='1'}));
   const mediaMatch=path.match(/^\/profile\/media\/(light|dark|resume)$/);
   if(mediaMatch){
    const slot=mediaMatch[1],record=store.catalog.get('profile','owner');
    if(!record)return plain(res,404,'Profile not found');
    if(get){
     const source=slot==='resume'?record.data.resume:record.data.portraits?.[slot];
     const file=source&&store.catalog.mediaBySource(source);
     if(!file)return plain(res,404,'Media not found');
     if(slot==='resume'){
      if(file.mime!=='application/pdf')return plain(res,404,'Not found');
      res.setHeader('Content-Disposition','attachment; filename="resume.pdf"');
      return send(res,200,Buffer.from(file.bytes),'application/pdf');
     }
     try{return send(res,200,await preparePortrait(Buffer.from(file.bytes)),'image/webp')}catch{return plain(res,422,'Invalid image')}
    }
    if(post){
     if(req.headers.origin!==MANAGE||!equal(req.headers['x-studio-csrf'],session.csrf))return plain(res,403,'Invalid origin or CSRF token');
     let expected;try{expected=revision(req.headers['x-studio-revision'])}catch{return plain(res,400,'Invalid revision')}
     if(expected!==record.revision)return plain(res,409,'Revision conflict');
     if(uploadBusy)return plain(res,429,'Upload already running');
     uploadBusy=true;
     try{
      const bytes=await readUpload(req,slot==='resume'?20*1024*1024:10*1024*1024);
      const processed=slot==='resume'?prepareResume(bytes):await preparePortrait(bytes,url.searchParams.get('crop')||'centre');
      const next=store.catalog.replaceProfileMedia(slot,processed,expected,session.subject);
      return send(res,200,JSON.stringify({revision:next}),'application/json; charset=utf-8');
     }catch(error){return plain(res,error.message==='Revision conflict'?409:400,'Upload rejected')}
     finally{uploadBusy=false}
    }
    return plain(res,405,'Method not allowed');
   }
   const catalogKind=({'/projects':'project','/certificates':'certificate'})[path];
   if(get&&typeof catalogKind==='string')return send(res,200,view.catalogPage(catalogKind,store.catalog.list().filter(r=>r.kind===catalogKind).map(r=>store.catalog.get(r.kind,r.key)),session));
   if(get&&path==='/articles'){
    const q=(url.searchParams.get('q')||'').slice(0,120).trim(),status=url.searchParams.get('status');
    return send(res,200,view.listing(store.list(),session,{q,status:['draft','published'].includes(status)?status:'all'}));
   }
   const match=path.match(/^\/articles\/([1-9][0-9]{0,11})$/);
   const id=match?Number(match[1]):null;
   if(get&&path==='/articles/new')return send(res,200,view.editor({},session));
   if(get&&id){const a=store.find(id);return a?send(res,200,view.editor(a,session,'',url.searchParams.get('saved')==='1')):plain(res,404,'Not found')}
   if(post){
    if(req.headers.origin!==MANAGE)return plain(res,403,'Invalid origin');
    let form;try{form=await formBody(req)}catch{return plain(res,400,'Invalid request')}
    if(!equal(form.get('csrf'),session.csrf))return plain(res,403,'Invalid CSRF token');
    if(path==='/profile'){
     const old=store.catalog.get('profile','owner');
     if(!old)return plain(res,404,'Profile not found');
     let data;
     try{
      data=profileInput(form,old.data);
      store.catalog.save('profile','owner',data,'draft',revision(form.get('revision')),session.subject);
      return redirect(res,'/profile?saved=1');
     }catch(error){
      const conflict=error.message==='Revision conflict';
      return send(res,conflict?409:400,view.profilePage(old,session,{error:conflict?'نسخه جدیدتری ذخیره شده است. صفحه را تازه‌سازی کن و تغییرات را دوباره اعمال کن.':'اطلاعات معتبر نیست؛ مقادیر را بررسی کن.',input:conflict?null:data||Object.fromEntries(form)}));
     }
    }
    if(path==='/logout'){store.logout(sessionId);res.setHeader('Set-Cookie',cookie(SESSION,'',0));return redirect(res,'/')}
    if(path==='/articles/new'||id){
     if(id&&!store.find(id))return plain(res,404,'Not found');
     try{const saved=store.save(articleInput(form),id);return redirect(res,'/articles/'+saved+'?saved=1')}
     catch{return send(res,400,view.editor({...Object.fromEntries(form),id,published_at:id?store.find(id)?.published_at:null},session,'ذخیره انجام نشد؛ اطلاعات را بررسی کنید. شناسه تکراری یا تغییر آدرس منتشرشده مجاز نیست.'))}
    }
   }
   return plain(res,404,'Not found');
  }catch{if(!res.headersSent)plain(res,500,'Request failed');else res.end()}
 });
}
if(process.argv[1]&&import.meta.url===new URL('file:'+process.argv[1]).href){
 const config=configuration();mkdirSync(dirname(config.db),{recursive:true});
 const store=openStore(config.db);const server=createStudio(config,store);
 server.listen(config.port,'0.0.0.0',()=>console.log('Studio listening'));
 const stop=()=>server.close(()=>{store.close();process.exit(0)});
 process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
