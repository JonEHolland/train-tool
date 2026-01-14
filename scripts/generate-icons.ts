import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs>
    <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' style='stop-color:#5FEAD4'/>
      <stop offset='100%' style='stop-color:#4DD4BC'/>
    </linearGradient>
  </defs>
  <rect fill='#0A1628' width='100' height='100' rx='22'/>
  <g fill='url(#g)'>
    <rect x='20' y='35' width='60' height='35' rx='6'/>
    <rect x='27' y='42' width='18' height='14' rx='3' opacity='0.3' fill='#0A1628'/>
    <rect x='55' y='42' width='18' height='14' rx='3' opacity='0.3' fill='#0A1628'/>
    <circle cx='30' cy='78' r='7' opacity='0.8'/>
    <circle cx='70' cy='78' r='7' opacity='0.8'/>
    <rect x='42' y='27' width='16' height='4' rx='2'/>
  </g>
</svg>`;

const SIZES = [192, 512];
const OUTPUT_DIR = join(import.meta.dirname, '..', 'public');

async function generateIcons() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of SIZES) {
    const outputPath = join(OUTPUT_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  // Also save the SVG file for reference
  writeFileSync(join(OUTPUT_DIR, 'icon.svg'), SVG);
  console.log('Generated icon.svg');
}

generateIcons().catch(console.error);
