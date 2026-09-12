import sharp from 'sharp';
import fs from 'node:fs/promises';
await fs.mkdir('assets/studio',{recursive:true});
for(const width of [960,1920])await sharp('prototypes/desktop/assets/classroom.png').resize({width,withoutEnlargement:true}).webp({quality:85}).toFile(`assets/studio/classroom-${width}.webp`);
await sharp('prototypes/desktop/assets/lake.jpg').resize({width:1920,withoutEnlargement:true}).webp({quality:86}).toFile('assets/studio/lake.webp');
console.log('Optimized classroom and wallpaper');
