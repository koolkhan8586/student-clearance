const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dist = path.resolve(__dirname, '..', 'dist');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else copyFile(src, dest);
  }
}

// index.html
copyFile(path.join(dist, 'index.html'), path.join(root, 'index.html'));

// bundled assets
const assetsSrc = path.join(dist, 'assets');
const assetsDest = path.join(root, 'assets');
if (fs.existsSync(assetsDest)) {
  fs.rmSync(assetsDest, { recursive: true, force: true });
}
copyDir(assetsSrc, assetsDest);

// public assets (logo) at workspace root for legacy paths
const logoSrc = path.join(dist, 'UOL-Green-V1.png');
if (fs.existsSync(logoSrc)) {
  copyFile(logoSrc, path.join(root, 'UOL-Green-V1.png'));
}

console.log('Deploy complete.');
