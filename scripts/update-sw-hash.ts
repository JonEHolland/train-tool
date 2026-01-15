import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Length of the hash prefix used in cache version names */
const CACHE_VERSION_HASH_LENGTH = 8;

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');
const indexPath = path.join(distDir, 'index.html');
const swPath = path.join(distDir, 'sw.js');
const manifestPath = path.join(distDir, 'manifest.json');
const swSourcePath = path.join(publicDir, 'sw.js');

// Hash multiple files to ensure cache invalidation on any asset change
const hashFiles = crypto.createHash('md5');

// Hash the built index.html
const indexContent = fs.readFileSync(indexPath, 'utf-8');
hashFiles.update(indexContent);

// Hash the source service worker (before the cache name is updated)
const swSourceContent = fs.readFileSync(swSourcePath, 'utf-8');
hashFiles.update(swSourceContent);

// Hash manifest.json if it exists
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  hashFiles.update(manifestContent);
}

// Hash icon files
const iconFiles = ['icon-192.png', 'icon-512.png', 'icon.svg'];
for (const iconFile of iconFiles) {
  const iconPath = path.join(distDir, iconFile);
  if (fs.existsSync(iconPath)) {
    const iconContent = fs.readFileSync(iconPath);
    hashFiles.update(iconContent);
  }
}

const hash = hashFiles.digest('hex').slice(0, CACHE_VERSION_HASH_LENGTH);

// Update the service worker with the new cache name
let swContent = fs.readFileSync(swPath, 'utf-8');
swContent = swContent.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'sounder-${hash}';`);
fs.writeFileSync(swPath, swContent);

console.log(`Updated service worker cache name to: sounder-${hash}`);
