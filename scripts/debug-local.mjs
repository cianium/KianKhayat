/** Read-only smoke and header checks against the bundled local preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const basePort=Number(process.env.PORT||4322);
const hosts=[['en','kiankhayat.me'],['de','de.kiankhayat.me'],['fa','fa.kiankhayat.me']];
const results=[];
const paths=['/','/work/','/articles/','/contact/','/privacy/','/admin/','/robots.txt','/sitemap.xml','/rss.xml','/nonexistent-debug-path/'];
for(const [index,[locale,domain]] of hosts.entries()){
 for(const pathname of paths){
  const url=`http://127.0.0.1:${basePort+index}${pathname}`;
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(5000),redirect:'manual'});
   const body=await r.text();
   const expected=pathname==='/nonexistent-debug-path/'?404:200;
   const isHtml=r.headers.get('content-type')?.includes('text/html');
   const headersOk=!isHtml||(!!r.headers.get('x-content-type-options')&&!!r.headers.get('content-security-policy'));
   const canonicalOk=!isHtml||r.status===404||body.includes(`https://${domain}`);
   results.push({locale,pathname,status:r.status,expected,headersOk,canonicalOk,ok:r.status===expected&&headersOk&&canonicalOk});
  }catch(error){results.push({locale,pathname,ok:false,error:error.message});}
 }
}
const failures=results.filter(x=>!x.ok);
const report={generatedAt:new Date().toISOString(),basePort,total:results.length,passed:results.length-failures.length,failed:failures.length,results};
fs.mkdirSync(path.join(root,'docs','debug'),{recursive:true});
fs.writeFileSync(path.join(root,'docs','debug','local-smoke.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({basePort,total:results.length,passed:report.passed,failed:failures.length,failures},null,2));
process.exitCode=failures.length?1:0;
