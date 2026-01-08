import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
const swPath = path.join(distDir, 'sw.js');

// Read the built index.html and generate a hash
const indexContent = fs.readFileSync(indexPath, 'utf-8');
const hash = crypto.createHash('md5').update(indexContent).digest('hex').slice(0, 8);

// Update the service worker with the new cache name
let swContent = fs.readFileSync(swPath, 'utf-8');
swContent = swContent.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'sounder-${hash}';`);
fs.writeFileSync(swPath, swContent);

console.log(`Updated service worker cache name to: sounder-${hash}`);
