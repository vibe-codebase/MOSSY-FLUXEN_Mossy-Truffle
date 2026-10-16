/**
 * Wood generator. Truffles are scattered at the chapter's density, a clearing (a patch with no truffles around it)
 * is chosen as the start, and the board is kept only if reasoning alone finishes it from there. Difficulty is how
 * many rounds of reasoning it takes, with comparisons between two numbers counting extra; the candidate nearest
 * each level's target is kept.
 * Run: npx esbuild tools/gen.ts --bundle --platform=node --format=esm --outfile=tools/.gen.mjs && node tools/.gen.mjs
 */
import fs from 'node:fs';
import { counts, dig, reason, type Wood } from '../src/game/sim';

type T = { id: string; w: number; h: number; density: number; pairs: number; target: number; seed: number };
const tpl = (c: string, rows: [number, number, number, number, number][]) => rows.map(([w, h, density, pairs, target], i): T => ({ id: `${c}${i + 1}`, w, h, density, pairs, target, seed: c.charCodeAt(0) * 100 + i }));
const TEMPLATES = [
  ...tpl('a', [[6, 8, 0.12, 0, 8], [6, 8, 0.13, 0, 10], [6, 9, 0.13, 0, 11], [7, 9, 0.13, 0, 12], [7, 9, 0.14, 0, 13], [7, 9, 0.14, 1, 14], [7, 10, 0.15, 1, 15], [7, 10, 0.15, 1, 16]]),
  ...tpl('b', [[7, 10, 0.16, 1, 15], [7, 10, 0.16, 1, 16], [7, 10, 0.17, 2, 17], [8, 10, 0.16, 2, 18], [8, 10, 0.17, 2, 19], [8, 11, 0.17, 2, 20], [8, 11, 0.17, 3, 21], [8, 11, 0.18, 3, 22]]),
  ...tpl('c', [[8, 11, 0.18, 3, 20], [8, 11, 0.18, 3, 21], [8, 11, 0.19, 4, 22], [8, 11, 0.19, 4, 23], [8, 11, 0.2, 4, 24], [8, 11, 0.2, 5, 25], [8, 11, 0.2, 5, 26], [8, 11, 0.21, 6, 28]]),
];
function rng(seed: number) { let s = Math.imul(seed + 0x9e3779b9, 2654435761) >>> 0 || 1; for (let i = 0; i < 8; i++) { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; } return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

const out: Record<string, unknown> = {};
for (const T of TEMPLATES) {
  const rnd = rng(T.seed * 7919), n = T.w * T.h, k = Math.round(n * T.density);
  let best: { wd: Wood; score: number; pairs: number } | null = null;
  for (let a = 0, found = 0; a < 20000 && found < 80; a++) {
    const set = new Set<number>(); while (set.size < k) set.add(Math.floor(rnd() * n));
    const truffles = [...set].sort((x, y) => x - y), wd0 = { w: T.w, h: T.h, truffles, start: -1 }, num = counts(wd0);
    const zeros = [...Array(n).keys()].filter((c) => !set.has(c) && num[c] === 0);
    if (!zeros.length) continue;
    // a clearing of a sensible size, towards the middle
    const start = zeros.sort((x, y) => Math.abs((x % T.w) - T.w / 2) + Math.abs(Math.floor(x / T.w) - T.h / 2) - (Math.abs((y % T.w) - T.w / 2) + Math.abs(Math.floor(y / T.w) - T.h / 2)) + (rnd() - 0.5) * 4)[0];
    const dug = new Array(n).fill(false), open = dig(wd0, num, dug, start).length;
    if (open < n * 0.08 || open > n * 0.3) continue;
    const wd = { ...wd0, start }, r = reason(wd);
    if (!r.solved || r.pairs < T.pairs) continue;
    found++;
    const score = r.rounds + r.pairs * 2;
    if (!best || Math.abs(score - T.target) < Math.abs(best.score - T.target)) best = { wd, score, pairs: r.pairs };
  }
  if (!best) throw new Error(`no wood for ${T.id}`);
  out[T.id] = { ...best.wd, score: best.score };
  console.log(T.id, `${T.w}x${T.h}`, 'truffles', best.wd.truffles.length, 'score', best.score, 'pairs', best.pairs, 'target', T.target);
}
fs.writeFileSync(new URL('../src/game/woods.json', import.meta.url), JSON.stringify(out));
