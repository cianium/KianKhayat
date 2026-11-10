import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parse} from 'yaml';
const config=parse(fs.readFileSync('.pages.yml','utf8'));
assert.equal(config.settings.content.merge,true,'Preserve existing unmanaged content fields.');
assert.deepEqual(config.content.map(c=>c.name),['featured','projects','certificates','articles']);
// Editing projects should not require copying technology lists, links, or
// workflow statuses into every translation, and the shared cover must be clear.
const projectEditor=config.content.find(entry=>entry.name==='projects');
assert(projectEditor,'Projects editor is missing from Pages CMS.');
assert.deepEqual(projectEditor.view.fields,['title','status','featured','order']);
const projectField=key=>projectEditor.fields.find(field=>field.name===key);
const translationFields=projectField('translations').fields;
assert.equal(projectField('featured').type,'boolean');
assert.equal(projectField('thumbnail').options.media,'project_images');
assert.match(projectField('thumbnail').description,/Home.*Work/);
assert.deepEqual(translationFields.map(field=>field.name),['fa','de']);
for(const language of translationFields) {
  const keys=language.fields.map(field=>field.name);
  assert(keys.includes('title')&&keys.includes('summary'),language.name+': missing localized fields');
  assert(['tags','links','status','thumbnail'].every(key=>!keys.includes(key)),language.name+': avoid duplicate shared fields');
  assert(language.fields.find(field=>field.name==='title').required);
  assert(language.fields.find(field=>field.name==='summary').required);
}
assert(projectEditor.actions?.some(action=>action.workflow==='content-build.yml'&&action.scope==='collection'),'Pages CMS validation action is missing.');
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
for(const item of media.values()) {
  assert.equal(item.input,'public'+item.output);assert.equal(item.rename,'random');
  assert(item.extensions.every(ext=>['png','jpg','jpeg','webp','avif','gif','pdf'].includes(ext)));
}
const report={passed:true,collections:config.content.length,records,fieldChecks:fields,mediaSources:media.size,preservesUnmanagedKeys:true,hostedLoginTested:false};
fs.mkdirSync('docs/phase9',{recursive:true});fs.writeFileSync('docs/phase9/cms.json',JSON.stringify(report,null,2)+'\n');console.log(report);
