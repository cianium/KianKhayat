import fs from 'node:fs';
import assert from 'node:assert/strict';

const dir = new URL('../src/content/projects/', import.meta.url);
const items = fs.readdirSync(dir).filter(name=>name.endsWith('.json')).map(name=>JSON.parse(fs.readFileSync(new URL(name,dir),'utf8')));

const verifiedProjects = {
  'personal-hq': {
    source: 'https://github.com/cianium/KianKhayat',
    demo: 'https://kiankhayat.me'
  },
  'nightwalker-hub': {
    source: 'https://github.com/cianium/Nightwalker-',
    demo: 'https://cianium.github.io/Nightwalker-/'
  }
};
const expectedLabels = {
  en: ['Source Code', 'Live Demo'],
  de: ['Quellcode', 'Live-Demo'],
  fa: ['کد منبع', 'دموی زنده']
};

assert.equal(items.length,Object.keys(verifiedProjects).length,'Portfolio must contain only verified-source projects; extend source audit before adding new ones.');

for(const project of items) {
  const known=verifiedProjects[project.slug];
  assert(known, 'Unverified project is included in public portfolio: '+project.slug);
  assert.equal(project.githubUrl,known.source,project.slug+': incorrect source repository');
  assert.equal(project.liveUrl,known.demo,project.slug+': incorrect demo URL');
  assert.equal(project.status,'Live',project.slug+': current curated portfolio should only include deployed demos');

  for(const locale of ['en','de','fa']) {
    const localized=locale==='en'?project:project.translations?.[locale];
    assert(localized,project.slug+': missing '+locale+' content');
    const links=localized.links;
    assert(Array.isArray(links)&&links.length===2,project.slug+': expected precisely two calls-to-action in '+locale);
    assert.deepEqual(links.map(x=>x.label),expectedLabels[locale],project.slug+': incorrect button labels in '+locale);
    assert.deepEqual(links.map(x=>x.url),[known.source,known.demo],project.slug+': incorrect button links in '+locale);
    assert.equal(links.filter(x=>x.primary).length,1,project.slug+': expected one primary button in '+locale);
    assert.equal(links[1].primary,true,project.slug+': demo should be primary in '+locale);
    for(const link of links) {
      const u=new URL(link.url);
      assert.equal(u.protocol,'https:',project.slug+': links must be HTTPS');
      assert.notEqual(link.url,'https://github.com/cianium',project.slug+': generic profile link is not source');
    }
  }
}
console.log('Portfolio project QA: '+items.length+' verified-source projects, each with Source Code and Live Demo buttons in EN/DE/FA.');
