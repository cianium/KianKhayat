import fs from 'node:fs';
import assert from 'node:assert/strict';

const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
assert.equal(config.$schema,'https://openapi.vercel.sh/vercel.json');
assert.equal(config.headers.length,3);
const all=config.headers.find(x=>x.source==='/(.*)');
assert(all,'Missing full-site security headers');
const headers=Object.fromEntries(all.headers.map(x=>[x.key.toLowerCase(),x.value]));
for(const [key,value] of [
  ['x-content-type-options','nosniff'],
  ['x-frame-options','SAMEORIGIN'],
  ['referrer-policy','strict-origin-when-cross-origin'],
  ['permissions-policy','camera=(), microphone=(), geolocation=()']
]) assert.equal(headers[key],value,'Unexpected '+key);
assert(!('content-security-policy' in headers),'Never overwrite per-build script-hash CSP with a generic static policy');
assert(!('strict-transport-security' in headers),'Wait for real TLS/DNS checks before changing browser HSTS state');
const admin=config.headers.find(x=>x.source==='/admin/(.*)');
const media=config.headers.find(x=>x.source==='/media/(.*)');
assert(admin?.headers.some(x=>x.key==='X-Robots-Tag'&&x.value==='noindex, follow'));
assert(media?.headers.some(x=>x.key==='X-Robots-Tag'&&x.value==='noindex'));
console.log('Vercel header configuration passes static security checks; live response headers still require verification.');
