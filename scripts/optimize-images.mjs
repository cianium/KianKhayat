import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const source='src/assets/originals', output='public/images';
await fs.mkdir(output,{recursive:true});
const report=[];
for(const [file,name] of [['15793.jpg','hero-light'],['123.png','hero-dark']]) {
  for(const width of [360,720]) for(const format of ['avif','webp']) {
    const target=path.join(output,`${name}-${width}.${format}`);
    await sharp(path.join(source,file)).rotate().resize(width,width,{fit:'cover'}).toFormat(format,{quality:format==='avif'?58:82}).toFile(target);
    report.push({file:target,bytes:(await fs.stat(target)).size});
  }
}
await sharp(path.join(source,'photo.jpg')).rotate().resize(800,800,{fit:'cover'}).jpeg({quality:82,mozjpeg:true}).toFile('public/photo.jpg');
await fs.writeFile('docs/image-report.json',JSON.stringify(report,null,2)+'\n');
console.log('Optimized both hero portraits to AVIF/WebP at 360 and 720 pixels.');
