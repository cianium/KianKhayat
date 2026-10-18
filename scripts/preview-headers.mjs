import fs from 'node:fs';
import path from 'node:path';
export function previewHeaders(root, pathname) {
  const file=path.join(root,'_headers');if(!fs.existsSync(file))return {};
  const headers={};let matches=false;
  for(const line of fs.readFileSync(file,'utf8').split('\n')) {
    if(!line.trim()||line.startsWith('#'))continue;
    if(!/^\s/.test(line))matches=line.endsWith('*')?pathname.startsWith(line.slice(0,-1)):pathname===line;
    else if(matches) {const match=line.trim().match(/^([^:]+):\s*(.*)$/);if(match)headers[match[1]]=match[2]}
  }
  return headers;
}
