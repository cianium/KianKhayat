/** Dependency-free, read-only source preflight. Run before npm install or build. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const failures=[]; const warnings=[];const checks=[];
const note=(name,passed,details='')=>{checks.push({name,passed,details});if(!passed)failures.push(`${name}: ${details}`)};
const read=(file)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const present=(file)=>fs.existsSync(path.join(root,file));
const collections=['projects','certificates','articles','featured'];
let contentEntries=0;
for(const name of collections){
 const folder=path.join(root,'src','content',name);
 const files=fs.readdirSync(folder).filter(f=>f.endsWith('.json'));
 const seen=new Set();
 for(const filename of files){
  const relative=`src/content/${name}/${filename}`;
  let data;
  try{data=read(relative)}catch(error){note(`valid JSON ${relative}`,false,error.message);continue}
  contentEntries++;
  note(`slug ${relative}`,typeof data.slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)&&filename===data.slug+'.json','file and slug must match');
  if(seen.has(data.slug))note(`unique slug ${relative}`,false,'duplicate slug');
  seen.add(data.slug);
  for(const key of ['thumbnail','image','pdf','cover']){
   if(!data[key])continue;
   const local=data[key];const valid=typeof local==='string'&&/^\/media\/(?!\/)/.test(local)&&!/[?#%\\\s]/.test(local)&&!local.split('/').some(part=>part==='..'||part==='.');
   const filename=valid?path.resolve(root,'public','.'+local):null;
   note(`media ${relative}:${key}`,!!filename&&filename.startsWith(path.join(root,'public')+path.sep)&&fs.existsSync(filename)&&fs.statSync(filename).isFile(),String(local));
  }
  if(name==='articles'&&data.draft===true)warnings.push(`Draft ${relative} remains publicly readable in a public Git repository.`);
 }
}
const allFiles=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
 if(['node_modules','dist','.git'].includes(entry.name))return [];
 const file=path.join(dir,entry.name);
 return entry.isDirectory()?allFiles(file):[file];
});
let sourceJS=0;
for(const file of allFiles(root)){
 if(!/\.(mjs|js)$/.test(file))continue;
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:10000});
 sourceJS++;
 if(result.status!==0)note(`node syntax ${path.relative(root,file)}`,false,(result.stderr||result.error?.message||'unknown error').slice(0,300));
}
const packageJson=read('package.json');
const lock=read('package-lock.json');
const npmEngine=lock.packages?.['node_modules/undici']?.engines?.node;
if(npmEngine)warnings.push(`Undici engine requirement in lockfile: ${npmEngine}. Set Node 24 explicitly on your build host.`);
if(!present('.node-version'))warnings.push('No explicit Node build version file.');
if(!present('.github/workflows/content-build.yml'))warnings.push('No CI workflow found.');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/content-build.yml'),'utf8');
if(!/cloudflare\/pages-action|wrangler pages deploy|netlify deploy|deploy-pages/.test(workflow))warnings.push('CI validates and uploads an artifact; it does not deploy to production. Configure host Git integration separately.');
const buildOutput=collections.map(x=>[x,fs.readdirSync(path.join(root,'src','content',x)).filter(y=>y.endsWith('.json')).length]);
const results={generatedAt:new Date().toISOString(),node:process.version,projectRoot:".",sourceJS,contentEntries,collections:Object.fromEntries(buildOutput),checks:checks.length,failures,warnings,notes:['This is source preflight, not dependency vulnerability scanning, Astro type-checking or browser testing.','Media signature and HTML sanitizer tests require npm dependencies.','Public Git history, CMS OAuth and live HTTP security were not assessed.']};
const output=path.join(root,'docs','debug','source-preflight.json');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
process.exitCode=failures.length?1:0;
