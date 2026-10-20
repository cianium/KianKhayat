import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir = new URL('../src/content/projects/', import.meta.url);
const items = fs.readdirSync(dir).filter(name=>name.endsWith('.json')).map(name=>JSON.parse(fs.readFileSync(new URL(name,dir),'utf8')));
const expectedRepos = {
  'personal-hq': 'https://github.com/cianium/KianKhayat',
  'nightwalker-hub': 'https://github.com/cianium/Nightwalker-'
};
const expectedNoPublicSource = new Set([
  'deutsch-tracker','learning-dashboard','linux-config-vault','mini-llm-experiments','pymind-cli'
]);
const expectedSlugs = new Set([...Object.keys(expectedRepos),...expectedNoPublicSource]);

assert.equal(items.length,expectedSlugs.size,'reviewed project count changed; extend the audit when adding projects');
for(const item of items) {
  assert(expectedSlugs.has(item.slug),`Unreviewed project: ${item.slug}`);
  const known = expectedRepos[item.slug];
  if(known) assert.equal(item.githubUrl,known,`${item.slug}: repository must match verified source`);
  else assert.equal(item.githubUrl,undefined,`${item.slug}: no verified public repository`);

  if(item.status==='Live') assert(item.liveUrl,`${item.slug}: Live requires a stated site URL (not proof of deployment)`);
  if(item.slug==='linux-config-vault') assert.equal(item.status,'Planned','Do not claim unpublished vault is Live');

  for(const [locale,record] of [
    ['en',item],['de',item.translations?.de],['fa',item.translations?.fa]
  ]) {
    assert(record,`${item.slug}: missing ${locale} translations`);
    const links=record.links||[];
    if(!known) assert.equal(links.length,0,`${item.slug}: unverifiable external CTA in ${locale}`);
    for(const entry of links) {
      const u = new URL(entry.url);
      assert(['https:','http:'].includes(u.protocol),`${item.slug}: invalid protocol`);
      assert.notEqual(entry.url.replace(/\\/$/,''),'https://github.com/cianium',`${item.slug}: generic GitHub profile is not project source`);
      if(/github|گیت‌هاب/i.test(entry.label)) assert.equal(entry.url,item.githubUrl,`${item.slug}: GitHub CTA does not match repository`);
      if(/live|زنده/i.test(entry.label)) assert.equal(entry.url,item.liveUrl,`${item.slug}: demo URL inconsistent`);
    }
    if(!known) assert(!record.tags?.some(tag=>/open source|متن‌باز/i.test(tag)),`${item.slug}: unverified open-source claim`);
  }
}
console.log(`Project provenance QA: ${items.length} entries, ${Object.keys(expectedRepos).length} repository links, ${expectedNoPublicSource.size} unlinked concepts validated`);
