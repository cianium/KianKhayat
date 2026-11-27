import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
export const token=()=>randomBytes(32).toString('base64url');
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const challenge=value=>createHash('sha256').update(value).digest('base64url');
export const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cookie=(name,value,age)=>name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age;
export const readCookie=(req,name)=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';
export function articleInput(form){
 const get=k=>(form.get(k)||'').trim();
 const title=get('title'),slug=get('slug'),summary=get('summary'),body=get('body'),status=get('status');
 let language;
 try{language=Intl.getCanonicalLocales(get('language'))[0]}catch{}
 if(!language||language.length>35||!title||title.length>180||!summary||summary.length>500||!body||body.length>60000||slug.length>100||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!['draft','published'].includes(status))throw Error('مقادیر مقاله معتبر نیستند. شناسه باید انگلیسی و یکتا باشد.');
 return {title,slug,summary,body,status,language};
}
export function ownerAllowed(user,config,pinned){
 return user?.email_verified===true&&typeof user.sub==='string'&&!!user.sub&&typeof user.email==='string'&&user.email.toLowerCase()===config.owner&&(!config.subject||user.sub===config.subject)&&(!pinned||user.sub===pinned);
}
export async function formBody(req){
 if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers['content-type']||''))throw Error('Unsupported content type');
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>400000)throw Error('Request too large');chunks.push(chunk)}
 return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}
