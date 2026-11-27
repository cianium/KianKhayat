export const MANAGE='https://manage.kiankhayat.me';
export const BLOG='https://blog.kiankhayat.me';
export function configuration(env=process.env){
 const owner=(env.GOOGLE_OWNER_EMAIL||'').trim().toLowerCase();
 const subject=(env.GOOGLE_OWNER_SUB||'').trim();
 if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET||!owner||(!subject&&!owner.endsWith('@gmail.com')))throw Error('Configure Google client credentials and owner Gmail, or explicit owner subject.');
 return {owner,subject,clientId:env.GOOGLE_CLIENT_ID,secret:env.GOOGLE_CLIENT_SECRET,db:env.STUDIO_DB||'/data/studio.sqlite',port:Number(env.PORT||8080)};
}
