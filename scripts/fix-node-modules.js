#!/usr/bin/env node
/**
 * @angular-devkit içindeki bozuk inquirer_tmp_* klasörlerini siler.
 * Metro ENOENT hatası için.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const angularPath = path.join(root, 'node_modules', '@angular-devkit', 'schematics-cli', 'node_modules');

if (!fs.existsSync(angularPath)) {
  console.log('@angular-devkit/schematics-cli/node_modules yok, atlanıyor.');
  process.exit(0);
}

const entries = fs.readdirSync(angularPath, { withFileTypes: true });
let removed = 0;

for (const e of entries) {
  if (e.isDirectory() && e.name.startsWith('inquirer_tmp_')) {
    const full = path.join(angularPath, e.name);
    try {
      fs.rmSync(full, { recursive: true });
      console.log('Silindi:', full);
      removed++;
    } catch (err) {
      console.warn('Silinemedi:', full, err.message);
    }
  }
}

if (removed > 0) {
  console.log(removed, 'bozuk klasör silindi. Şimdi: pnpm dev:mobile');
} else {
  console.log('Silinecek inquirer_tmp_ klasörü bulunamadı.');
}
