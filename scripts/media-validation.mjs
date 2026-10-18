import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function validateMedia(root, url) {
  if(!/^\/(?!\/)/.test(url)||/[?#%\\\s]/.test(url)||url.split('/').some(p=>p==='.'||p==='..'))throw new Error(`Invalid local media path: ${url}`);
  const base=fs.realpathSync(root), file=fs.realpathSync(path.resolve(base,'.'+url));
  if(!file.startsWith(base+path.sep))throw new Error(`Media escapes public directory: ${url}`);
  const stat=fs.statSync(file);
  if(!stat.isFile()||stat.size===0||stat.size>20*1024*1024)throw new Error(`Media must be a nonempty file of at most 20 MiB: ${url}`);
  const extension=path.extname(file).toLowerCase();
  if(extension==='.pdf') {
    const handle=fs.openSync(file,'r'), prefix=Buffer.alloc(5);
    try{fs.readSync(handle,prefix,0,5,0)}finally{fs.closeSync(handle)}
    if(prefix.toString()!=='%PDF-')throw new Error(`File is not a PDF: ${url}`);
    return;
  }
  const formats={'.png':'png','.jpg':'jpeg','.jpeg':'jpeg','.webp':'webp','.avif':'heif','.gif':'gif'};
  if(!formats[extension])throw new Error(`Unsupported uploaded file type: ${url}`);
  const info=await sharp(file,{limitInputPixels:40_000_000}).metadata();
  if(info.format!==formats[extension]||!info.width||!info.height||info.width*info.height>40_000_000)throw new Error(`Invalid or oversized image: ${url}`);
}
