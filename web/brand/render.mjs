// Usage: node brand/render.mjs <outDir>  — bundles brand.ts and paints PNGs in headless Chromium.
import { build } from 'esbuild'; import { chromium } from 'playwright-core'; import fs from 'node:fs'; import path from 'node:path';
const out = path.resolve(process.argv[2] || '../assets'); const here = path.dirname(new URL(import.meta.url).pathname);
const js = (await build({ entryPoints: [path.join(here, 'brand.ts')], bundle: true, write: false, format: 'iife' })).outputFiles[0].text;
const font = fs.readFileSync(path.join(here, '../node_modules/@fontsource/gluten/files/gluten-latin-700-normal.woff2')).toString('base64');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent(`<style>@font-face{font-family:"Gluten";font-style:normal;font-weight:700;src:url(data:font/woff2;base64,${font})}</style><div style="font-family:'Gluten';font-style:normal;font-weight:700">.</div>`);
await p.evaluate(() => document.fonts.ready);
await p.addScriptTag({ content: js });
for (const [name, file] of [['icon', 'icons/app-icon.png'], ['adaptive', 'icons/adaptive-foreground.png'], ['adaptiveBg', 'icons/adaptive-background.png'], ['splash', 'key-art/splash.png']]) {
  const data = await p.evaluate(async (n) => (await window.brand[n]()).toDataURL('image/png'), name);
  const f = path.join(out, file); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64')); console.log('wrote', f);
}
await b.close();
