import fs from 'node:fs';
import assert from 'node:assert/strict';

const directory = new URL('../src/content/projects/', import.meta.url);
const projects = fs.readdirSync(directory).filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(fs.readFileSync(new URL(name, directory), 'utf8')));

// Preserve the verified provenance of earlier public projects, while allowing
// new, in-progress or private-source projects to be added through Pages CMS.
const established = {
  'personal-hq': { source: 'https://github.com/cianium/KianKhayat', demo: 'https://kiankhayat.me' },
  'nightwalker-hub': { source: 'https://github.com/cianium/Nightwalker-', demo: 'https://cianium.github.io/Nightwalker-/' },
};
const expectedLabels = {
  en: ['Source Code', 'Live Demo'],
  de: ['Quellcode', 'Live-Demo'],
  fa: ['کد منبع', 'دموی زنده'],
};
const canonical = value => new URL(value).href;
const requireHttps = (value, context) => {
  const parsed = new URL(value);
  assert.equal(parsed.protocol, 'https:', context + ': HTTPS is required');
  return parsed.href;
};

const slugs = new Set();
for (const project of projects) {
  assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid project slug');
  assert(!slugs.has(project.slug), 'Duplicate project slug: ' + project.slug);
  slugs.add(project.slug);

  assert(project.title?.trim() && project.summary?.trim(), project.slug + ': missing English text');
  assert(Array.isArray(project.tags) && project.tags.length > 0, project.slug + ': missing technologies');
  assert(['Live', 'In Progress', 'Building', 'Planned'].includes(project.status), project.slug + ': invalid status');

  if(project.githubUrl) {
    const github = requireHttps(project.githubUrl, project.slug + ' repository');
    assert.match(new URL(github).pathname, /^\/[^/]+\/[^/]+\/?$/, project.slug + ': use a repository URL, not a profile');
  }
  if(project.liveUrl)requireHttps(project.liveUrl, project.slug + ' demo');
  if(project.status === 'Live') assert(project.liveUrl, project.slug + ': live status requires a demo URL');

  const verified = established[project.slug];
  if(verified) {
    assert.equal(canonical(project.githubUrl), canonical(verified.source), project.slug + ': source provenance changed');
    assert.equal(canonical(project.liveUrl), canonical(verified.demo), project.slug + ': demo provenance changed');
    assert.equal(project.status, 'Live', project.slug + ': established project live status changed');
  }

  for(const locale of ['en', 'de', 'fa']) {
    const data = locale === 'en' ? project : project.translations?.[locale];
    assert(data?.title?.trim() && data?.summary?.trim(), project.slug + ': missing ' + locale + ' content');
    assert(Array.isArray(data.tags) && data.tags.length, project.slug + ': missing ' + locale + ' technologies');
    assert(data.status?.trim(), project.slug + ': missing ' + locale + ' status');
    const links = data.links ?? [];
    assert(Array.isArray(links), project.slug + ': malformed links in ' + locale);
    assert(links.filter(link => link.primary === true).length <= 1, project.slug + ': multiple primary links in ' + locale);
    if(links.length)assert.equal(links.filter(link => link.primary === true).length,1,project.slug + ': add one primary action in ' + locale);
    for(const link of links) {
      assert(link.label?.trim(), project.slug + ': missing link label in ' + locale);
      requireHttps(link.url, project.slug + ' ' + locale + ' link');
      assert.notEqual(link.url, 'https://github.com/cianium', project.slug + ': generic profile link is not a repository');
    }
    if(verified) {
      assert.deepEqual(links.map(link => link.label), expectedLabels[locale], project.slug + ': established button labels changed in ' + locale);
      assert.deepEqual(links.map(link => canonical(link.url)), [canonical(verified.source), canonical(verified.demo)], project.slug + ': established button links changed in ' + locale);
      assert.equal(links[1].primary, true, project.slug + ': demo should be primary in ' + locale);
    }
  }
}
console.log('Portfolio project QA passed for ' + projects.length + ' projects; verified provenance preserved and in-progress projects supported.');
