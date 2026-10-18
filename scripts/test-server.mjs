import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {previewHeaders} from './preview-headers.mjs';
const locales=['en','de','fa'];
const domains=['kiankhayat.me','de.kiankhayat.me','fa.kiankhayat.me'];
const basePort=Number(process.env.PORT || 4322);
const servers=[];
const testMedia=process.env.TEST_MEDIA==='1' ? (await import('../tests/fixtures/certificate.mjs')).testPDF() : null;
// Preview-only navigation keeps SEO metadata and packaged production files intact.
const localLinks=html=>html.replace(/(<a\b[^>]*\bhref=")https:\/\/([^/]+)\//g,(match,start,domain)=>{
  const index=domains.indexOf(domain);
  return index<0?match:`${start}http://127.0.0.1:${basePort+index}/`;
});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.pdf':'application/pdf','.avif':'image/avif','.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
for (const [index,locale] of locales.entries()) {
const root=path.resolve('dist',locale);
const server=http.createServer(async(req,res)=>{
  try {
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    for(const [key,value] of Object.entries(previewHeaders(root,pathname)))res.setHeader(key,value);
    if(testMedia && pathname==='/test-certificate.pdf') {
      res.writeHead(200,{'Content-Type':'application/pdf'});res.end(testMedia);return;
    }
    let filename=path.resolve(root,'.'+pathname);
    if(!filename.startsWith(root+path.sep)&&filename!==root){res.writeHead(403);res.end();return}
    let stat;try{stat=await fs.stat(filename)}catch{}
    if(stat?.isDirectory()) {
      if(!pathname.endsWith('/')) {res.writeHead(301,{Location:pathname+'/'});res.end();return}
      filename=path.join(filename,'index.html');
    }
    let data,status=200;
    try {data=await fs.readFile(filename)}
    catch {
      status=404;
      try {data=await fs.readFile(path.join(root,'404.html'))}
      catch {res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8'});res.end('Build unavailable. Finish npm run build, then refresh.');return}
    }
    const html=status===404||path.extname(filename)==='.html';
    if(status===404)res.setHeader('X-Robots-Tag','noindex');
    res.writeHead(status,{'Content-Type':html?'text/html; charset=utf-8':types[path.extname(filename)]||'text/plain; charset=utf-8'});
    res.end(html?localLinks(data.toString()):data);
  } catch {if(!res.headersSent)res.writeHead(400);res.end()}
});
servers.push(server);
server.on('error',error=>{console.error(error.message);for(const item of servers)item.close();process.exitCode=1});
server.listen(basePort+index,'127.0.0.1',()=>console.log(`${locale}: http://127.0.0.1:${basePort+index}`));
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{for(const server of servers)server.close()});
