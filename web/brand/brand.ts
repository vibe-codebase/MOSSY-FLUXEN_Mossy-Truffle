// Store icon, adaptive-icon layers, splash and feature graphic: an autumn forest floor half dug, truffles marked with stakes.
import * as A from '../src/game/art';
import { counts, deduce, dig, type Wood } from '../src/game/sim';
import woods from '../src/game/woods.json';

const OAK = A.MOODS[0];
const W8 = woods as unknown as Record<string, Wood>;
/** Turn a portrait wood on its side, for the wide feature graphic. */
function turn(wd: Wood): Wood { const m = (c: number) => (c % wd.w) * wd.h + Math.floor(c / wd.w); return { w: wd.h, h: wd.w, truffles: wd.truffles.map(m), start: m(wd.start) }; }
/** Reason a few rounds into a wood, so the board looks mid-game. */
function play(wd: Wood, rounds: number) {
  const n = wd.w * wd.h, num = counts(wd), dug = new Array(n).fill(false), marked = new Array(n).fill(false);
  dig(wd, num, dug, wd.start);
  for (let i = 0; i < rounds; i++) { const st = deduce(wd, num, dug, marked); if (!st.length) break; for (const s of st) if (s.truffle) marked[s.cell] = true; else dig(wd, num, dug, s.cell); }
  return { num, dug, marked };
}
function board(g: CanvasRenderingContext2D, wd: Wood, m: A.Mood, ox: number, oy: number, cs: number, rounds: number, reveal: number[] = []) {
  const { num, dug, marked } = play(wd, rounds), t = new Set(wd.truffles);
  for (let c = 0; c < wd.w * wd.h; c++) {
    const x = ox + (c % wd.w) * cs, y = oy + Math.floor(c / wd.w) * cs;
    const s = A.soil(cs, 1, m, c); g.drawImage(s, x, y);
    if (reveal.includes(c) && t.has(c)) { const tr = A.truffle(cs, 1); g.drawImage(tr, x, y); continue; }
    if (dug[c] && num[c] > 0) { g.font = `700 ${Math.round(cs * 0.56)}px Gluten, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = cs * 0.08; g.strokeStyle = '#1a0e06'; g.strokeText(String(num[c]), x + cs / 2, y + cs * 0.52); g.fillStyle = A.NUMBER_COLORS[num[c]]; g.fillText(String(num[c]), x + cs / 2, y + cs * 0.52); }
    if (!dug[c]) { g.drawImage(A.leaves(cs, 1, m, (c * 5 + Math.floor(c / wd.w)) % 4), x, y); if (marked[c]) g.drawImage(A.stake(cs, 1), x, y); }
  }
}
function scene(W: number, H: number, m: A.Mood, wd: Wood, cs: number, ox: number, oy: number, rounds: number, reveal: number[] = []) {
  const { c, g } = A.canvas(W, H);
  g.drawImage(A.floor(m, W, H, 1, 5, [ox, oy, wd.w * cs, wd.h * cs]), 0, 0);
  board(g, wd, m, ox, oy, cs, rounds, reveal);
  return { c, g };
}
/** A dug hole in a bed of autumn leaves, a big truffle lit warm in it, and the stake that marked it. */
function hole(g: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  g.fillStyle = 'rgba(30,14,4,0.5)'; g.beginPath(); g.ellipse(cx, cy + R * 0.06, R * 1.06, R * 1.02, 0, 0, Math.PI * 2); g.fill();
  const s = g.createRadialGradient(cx, cy + R * 0.2, R * 0.1, cx, cy, R); s.addColorStop(0, '#9a6a42'); s.addColorStop(0.65, '#6a4224'); s.addColorStop(1, '#2e180a');
  g.fillStyle = s; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 40; i++) { const a = A.hash(i, 4) * Math.PI * 2, d = Math.sqrt(A.hash(i, 5)) * R * 0.92; g.fillStyle = `rgba(${A.hash(i, 6) < 0.5 ? '0,0,0' : '200,150,100'},0.22)`; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (0.02 + A.hash(i, 7) * 0.03), 0, Math.PI * 2); g.fill(); }
  const sh = g.createLinearGradient(0, cy - R, 0, cy - R * 0.3); sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  const glow = g.createRadialGradient(cx, cy + R * 0.1, 0, cx, cy + R * 0.1, R * 0.8); glow.addColorStop(0, 'rgba(255,190,110,0.45)'); glow.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = glow; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  // the truffle, with a warm rim so it reads on dark soil
  const tr = A.truffle(R * 2.3, 1), ox = cx - tr.width / 2 - R * 0.08, oy = cy - tr.height / 2 + R * 0.1;
  g.save(); g.shadowColor = 'rgba(255,200,130,0.9)'; g.shadowBlur = R * 0.12; g.drawImage(tr, ox, oy); g.restore(); g.drawImage(tr, ox, oy);
  const st = A.stake(R * 1.5, 1); g.drawImage(st, cx + R * 0.05, cy - R * 1.05);
}
/** A bed of oak leaves over a warm ground. */
function litter(g: CanvasRenderingContext2D) {
  for (let i = 0; i < 70; i++) { const x = A.hash(i, 21) * 1100 - 40, y = A.hash(i, 22) * 1100 - 40; A.leaf(g, OAK, x, y, 220 + A.hash(i, 23) * 160, A.hash(i, 24) * Math.PI * 2, A.mix(OAK.leaves[i % OAK.leaves.length], '#3a1a08', 0.1 + A.hash(i, 25) * 0.35)); }
}
export function icon() {
  const { c, g } = A.canvas(1024, 1024);
  const bg = g.createRadialGradient(512, 470, 100, 512, 512, 760); bg.addColorStop(0, '#f0a040'); bg.addColorStop(1, '#a8401a'); g.fillStyle = bg; g.fillRect(0, 0, 1024, 1024);
  litter(g);
  const v = g.createRadialGradient(512, 512, 300, 512, 512, 760); v.addColorStop(0, 'rgba(60,20,4,0)'); v.addColorStop(1, 'rgba(60,20,4,0.5)'); g.fillStyle = v; g.fillRect(0, 0, 1024, 1024);
  hole(g, 512, 540, 300);
  return c;
}
export function adaptive() {
  const { c, g } = A.canvas(1024, 1024);
  hole(g, 512, 540, 240);
  return c;
}
export function adaptiveBg() { const { c, g } = A.canvas(1024, 1024); const bg = g.createRadialGradient(512, 470, 100, 512, 512, 760); bg.addColorStop(0, '#f0a040'); bg.addColorStop(1, '#a8401a'); g.fillStyle = bg; g.fillRect(0, 0, 1024, 1024); litter(g); return c; }
export function splash() {
  const W = 1284, H = 2778, wd = W8.a4, cs = 150, ox = (W - wd.w * cs) / 2, oy = 1050;
  const { c, g } = scene(W, H, OAK, wd, cs, ox, oy, 4);
  const sh = g.createLinearGradient(0, 0, 0, 1000); sh.addColorStop(0, 'rgba(26,16,6,0.9)'); sh.addColorStop(1, 'rgba(26,16,6,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, 1000);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '700 220px Gluten, sans-serif'; g.fillStyle = '#ffe6b0'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.fillText('Truffle', W / 2, 760); g.font = '700 104px Gluten, sans-serif'; g.fillStyle = '#f0b040'; g.fillText('Mossy', W / 2, 520); g.shadowBlur = 0;
  return c;
}
/** The feature graphic: an oak wood on its side, half dug, the pig nosing at a found truffle; words on the left. */
export function feature() {
  const W = 1024, H = 500, wd = turn(W8.a6), cs = 48, ox = W - wd.w * cs - 30, oy = (H - wd.h * cs) / 2, R = 7;
  // the pig stands on a dug patch, nose to a truffle it has just found
  const st = play(wd, R), cands: [number, number][] = [];
  for (let c = 0; c < wd.w * wd.h; c++) if (st.marked[c]) for (const d of [-1, 1, -wd.w, wd.w]) { const o = c + d; if (o >= 0 && o < wd.w * wd.h && (d === -wd.w || d === wd.w || Math.floor(o / wd.w) === Math.floor(c / wd.w)) && st.dug[o]) cands.push([c, o]); }
  cands.sort((a, b) => (b[0] % wd.w) - (a[0] % wd.w));
  const [tc, pc] = cands[0];
  const { c, g } = scene(W, H, OAK, wd, cs, ox, oy, R, [tc]);
  const shade = g.createLinearGradient(0, 0, 560, 0); shade.addColorStop(0, 'rgba(22,16,8,0.94)'); shade.addColorStop(0.7, 'rgba(22,16,8,0.7)'); shade.addColorStop(1, 'rgba(22,16,8,0)'); g.fillStyle = shade; g.fillRect(0, 0, 560, H);
  const warm = g.createRadialGradient(230, 210, 20, 230, 210, 360); warm.addColorStop(0, 'rgba(240,150,60,0.2)'); warm.addColorStop(1, 'rgba(240,150,60,0)'); g.fillStyle = warm; g.fillRect(0, 0, 640, H);
  const P = (q: number) => [ox + ((q % wd.w) + 0.5) * cs, oy + (Math.floor(q / wd.w) + 0.5) * cs];
  const [px, py] = P(pc), [tx, ty] = P(tc), pig = A.pig(cs * 0.85, 1);
  g.save(); g.translate(px, py); g.rotate(Math.atan2(ty - py, tx - px) + Math.PI / 2); g.drawImage(pig, -pig.width / 2, -pig.height * 0.62 + cs * 0.12); g.restore();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#ffe6b0'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16; g.font = '700 40px Gluten, sans-serif'; g.fillStyle = '#f0b040'; g.fillText('Mossy', 54, 104); g.fillStyle = '#ffe6b0'; g.font = '700 92px Gluten, sans-serif'; g.fillText('Truffle', 50, 182); g.shadowBlur = 0;
  g.fillStyle = '#f0b040'; g.font = '700 29px Gluten, sans-serif'; g.fillText('Follow your nose. Never guess.', 54, 230);
  g.fillStyle = '#f0b040'; g.fillRect(56, 252, 48, 2);
  g.fillStyle = 'rgba(255,246,230,0.9)'; g.font = '600 18px "Bricolage Grotesque", sans-serif';
  g.fillText('Dig the forest floor, read the soil and', 56, 288);
  g.fillText('stake every truffle. 24 woods, each one', 56, 314);
  g.fillText('solvable by reasoning alone.', 56, 340);
  return c;
}
(window as unknown as { brand: unknown }).brand = { icon, adaptive, adaptiveBg, splash, feature };
