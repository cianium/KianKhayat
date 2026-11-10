import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parse} from 'yaml';
const config=parse(fs.readFileSync('.pages.yml','utf8'));
assert.equal(config.settings.content.merge,true,'Preserve existing unmanaged content fields.');
assert.deepEqual(config.content.map(c=>c.name),['featured','projects','certificates','articles']);
const collectionNameFrom=value=>value.split('/')[0];
const media=new Map(config.media.map(item=>[item.name,item]));
let records=0,fields=0;
function checkFields(definitions,data,path) {
  for(const f of definitions) {
    fields++;const value=data?.[f.name];const here=`${path}.${f.name}`;
    if(f.required)assert(value!==null&&value!==undefined&&value!=='',`Missing ${here}`);
    if(value===undefined||value===null||value==='')continue;
    const values=f.list?value:[value];assert(Array.isArray(values),here);
    for(const item of values) {
      if(f.type==='object') {checkFields(f.fields,item,here);continue}
      if(f.pattern)assert(new RegExp(typeof f.pattern==='string'?f.pattern:f.pattern.regex).test(item),`Invalid ${here}`);
      if(f.type==='boolean')assert.equal(typeof item,'boolean',here);
      if(f.type==='number')assert(Number.isInteger(item)&&item>=0,here);
      if(f.type==='rich-text')assert.equal(f.options.format,'html');
      if(['file','image'].includes(f.type)) {
        const storage=media.get(f.options.media);assert(storage,here);
        assert(item.startsWith(storage.output+'/') || (collectionNameFrom(here)==='featured' && item.startsWith('/media/')),here);
        assert(fs.existsSync('public'+item),here);
      }
    }
  }
}
for(const collection of config.content) {
  assert.equal(collection.format,'json');assert.equal(collection.filename.template,'{fields.slug}.json');
  assert.equal(collection.operations.rename,false);
  const translations=collection.fields.find(f=>f.name==='translations');
  if(collection.name==='articles')assert(!translations,'Article translation inputs must be absent');
  else assert.deepEqual(translations.fields.map(f=>f.name),['fa','de']);
  for(const name of fs.readdirSync(collection.path).filter(name=>name.endsWith('.json'))) {
    checkFields(collection.fields,JSON.parse(fs.readFileSync(`${collection.path}/${name}`,'utf8')),`${collection.name}/${name}`);records++;
  }
}
// Prevent silent CMS edits that save a valid entry under the wrong route.
const projectPaths=new Set();
for(const collection of config.content) {
  const seen=new Set();
  for(const filename of fs.readdirSync(collection.path).filter(name=>name.endsWith('.json'))) {
    const entry=JSON.parse(fs.readFileSync(`${collection.path}/${filename}`,'utf8'));
    assert.equal(filename,`${entry.slug}.json`,`${collection.name}/${filename}: filename must match slug`);
    assert(!seen.has(entry.slug),`${collection.name}: duplicate slug ${entry.slug}`);
    seen.add(entry.slug);
  }
  if(collection.name==='projects')for(const slug of seen)projectPaths.add(slug);
}
// Legacy Featured entries for a project are ignored by the new renderer.
// Flag them so editors can eventually remove the redundant records safely.
const redundantFeatured=fs.readdirSync('src/content/featured').filter(name=>name.endsWith('.json')).filter(name=>{
  const entry=JSON.parse(fs.readFileSync('src/content/featured/'+name,'utf8'));
  return projectPaths.has(entry.slug);
});
if(redundantFeatured.length)console.warn('CMS notice: legacy Featured cards shadowed by Projects:',redundantFeatured.join(', '));
const projectsForm=config.content.find(item=>item.name==='projects').fields;
assert(projectsForm.find(field=>field.name==='thumbnail'),'Projects CMS must expose a cover image');
assert(projectsForm.find(field=>field.name==='featured'),'Projects CMS must expose a featured switch');
assert(projectsForm.findIndex(field=>field.name==='thumbnail')<projectsForm.findIndex(field=>field.name==='translations'),'Project cover should be visible before translations');
for(const item of media.values()) {
  assert.equal(item.input,'public'+item.output);assert.equal(item.rename,'random');
  assert(item.extensions.every(ext=>['png','jpg','jpeg','webp','avif','gif','pdf'].includes(ext)));
}
const report={passed:true,collections:config.content.length,records,fieldChecks:fields,mediaSources:media.size,preservesUnmanagedKeys:true,hostedLoginTested:false};
fs.mkdirSync('docs/phase9',{recursive:true});fs.writeFileSync('docs/phase9/cms.json',JSON.stringify(report,null,2)+'\n');console.log(report);
