import { build } from 'esbuild';
import { copyFile, mkdir, mkdtemp, rename, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = await mkdtemp(resolve('.build-'));
await mkdir(`${output}/data`);
for (const file of ['index.html', 'bootstrap.js', 'styles.css', 'operations.css', 'board.css']) {
  await copyFile(`src/${file}`, `${output}/${file}`);
}
await build({ entryPoints: ['src/app.js'], outfile: `${output}/app.js`, bundle: true, minify: true, platform: 'browser', format: 'iife', target: ['es2020'] });
// Explicit allowlist: public synthetic teaching files only.
for (const file of ['01_영업실적.xlsx', '02_온라인실적.xlsx', '03_팝업실적.xlsx', '04_보고양식.xlsx', '07_팝업브리프.md', '08_행사준비.csv', '11_날씨응답_예제.json']) {
  await copyFile(resolve('public-data', file), `${output}/data/${file}`);
}
try { await access('dist'); await rename('dist', `.dist-backup-${Date.now()}`); } catch {}
await rename(output, 'dist');
console.log('Dashboard built in dist/ (7 allowlisted synthetic teaching inputs).');
