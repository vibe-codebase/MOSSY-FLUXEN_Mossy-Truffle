/**
 * Truffle art, painted with Canvas 2D, from above: a forest floor of roots, moss, ferns and toadstools; patches of
 * fallen leaves (oak, pine needles, or misty birch); dug soil, dark and crumbly, with its number; a hazel stake
 * with a red ribbon to mark a truffle; knobbly black truffles; and the pig who sniffs them out.
 */
export type Mood = { name: string; floor: [string, string]; leaves: string[]; soil: [string, string]; moss: string; mist: number };
export const MOODS: Mood[] = [
  { name: 'oak', floor: ['#4a3a1e', '#2a2010'], leaves: ['#e8823a', '#d8562a', '#f0b040', '#b8642a', '#c8a03a'], soil: ['#4a2e1c', '#2e1a0e'], moss: '#6a8a3a', mist: 0 },
  { name: 'pine', floor: ['#2e3a22', '#182214'], leaves: ['#9a6a3a', '#7a5a30', '#5a7a3a', '#b0804a', '#6a4a26'], soil: ['#3e2a1a', '#22160c'], moss: '#4a7a3a', mist: 0.05 },
  { name: 'misty', floor: ['#2e3240', '#181a24'], leaves: ['#b8b098', '#d8c890', '#a8a8b8', '#c8b878', '#8a90a0'], soil: ['#3a2e2a', '#201814'], moss: '#5a7a6a', mist: 0.18 },
];
export const NUMBER_COLORS = ['', '#9ad0ff', '#9aea8a', '#ffa080', '#d0a8ff', '#ffd060', '#7ae8e0', '#ff9ad0', '#ffffff'];
export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { c, g: c.getContext('2d')! };
}
export const hash = (a: number, b: number) => { let h = Math.imul(a + 0x9e3779b9, 374761393) ^ Math.imul(b + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const TAU = Math.PI * 2;
export function hexA(hex: string, a: number) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
export function mix(a: string, b: string, t: number) {
  const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
export const toInt = (hex: string) => parseInt(hex.slice(1), 16);

export function leaf(g: CanvasRenderingContext2D, m: Mood, x: number, y: number, s: number, a: number, col: string) {
  g.save(); g.translate(x, y); g.rotate(a);
  if (m.name === 'pine') { g.strokeStyle = col; g.lineWidth = s * 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(-s * 0.5, 0); g.lineTo(s * 0.5, 0); g.stroke(); g.restore(); return; }
  g.fillStyle = col;
  if (m.name === 'oak') {
    g.beginPath(); g.moveTo(-s * 0.5, 0);
    for (let i = 0; i <= 6; i++) { const t = i / 6, xx = -s * 0.5 + t * s, w = Math.sin(t * Math.PI) * s * 0.28 * (i % 2 ? 1.25 : 0.8); g.lineTo(xx, -w); }
    for (let i = 6; i >= 0; i--) { const t = i / 6, xx = -s * 0.5 + t * s, w = Math.sin(t * Math.PI) * s * 0.28 * (i % 2 ? 1.25 : 0.8); g.lineTo(xx, w); }
    g.fill();
  } else { g.beginPath(); g.ellipse(0, 0, s * 0.42, s * 0.28, 0, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(60,30,10,0.35)'; g.lineWidth = Math.max(0.6, s * 0.03); g.beginPath(); g.moveTo(-s * 0.48, 0); g.lineTo(s * 0.45, 0); g.stroke();
  g.restore();
}
/** A patch still under its leaves. */
export function leaves(cs: number, r: number, m: Mood, seed: number) {
  const k = cs * r, { c, g } = canvas(k, k);
  const bg = g.createLinearGradient(0, 0, k, k); bg.addColorStop(0, mix(m.leaves[3], '#000000', 0.25)); bg.addColorStop(1, mix(m.leaves[4], '#000000', 0.45));
  g.fillStyle = bg; g.beginPath(); g.roundRect(k * 0.03, k * 0.03, k * 0.94, k * 0.94, k * 0.14); g.fill();
  g.save(); g.beginPath(); g.roundRect(k * 0.03, k * 0.03, k * 0.94, k * 0.94, k * 0.14); g.clip();
  const n = m.name === 'pine' ? 34 : 9;
  for (let i = 0; i < n; i++) leaf(g, m, hash(i, seed) * k, hash(seed, i + 3) * k, k * (m.name === 'pine' ? 0.42 : 0.42 + hash(i, seed + 1) * 0.2), hash(i + 9, seed) * TAU, mix(m.leaves[i % m.leaves.length], '#ffffff', hash(i, 7) * 0.15));
  g.restore();
  // a raised edge: light on top, shade below
  g.strokeStyle = 'rgba(255,240,200,0.25)'; g.lineWidth = k * 0.03; g.beginPath(); g.roundRect(k * 0.05, k * 0.05, k * 0.9, k * 0.9, k * 0.13); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = k * 0.025; g.beginPath(); g.moveTo(k * 0.12, k * 0.965); g.lineTo(k * 0.88, k * 0.965); g.stroke();
  return c;
}
/** A dug patch: crumbly dark soil, slightly sunk. */
export function soil(cs: number, r: number, m: Mood, seed: number) {
  const k = cs * r, { c, g } = canvas(k, k);
  const bg = g.createRadialGradient(k * 0.5, k * 0.55, k * 0.1, k * 0.5, k * 0.5, k * 0.7); bg.addColorStop(0, m.soil[0]); bg.addColorStop(1, m.soil[1]);
  g.fillStyle = bg; g.beginPath(); g.roundRect(k * 0.04, k * 0.04, k * 0.92, k * 0.92, k * 0.12); g.fill();
  for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(${hash(i, seed) < 0.5 ? '0,0,0' : '180,140,100'},${0.12 + hash(i, seed + 2) * 0.15})`; g.beginPath(); g.arc(k * (0.1 + hash(i, seed + 3) * 0.8), k * (0.1 + hash(seed, i) * 0.8), k * (0.015 + hash(i, 5) * 0.03), 0, TAU); g.fill(); }
  const sh = g.createLinearGradient(0, k * 0.04, 0, k * 0.3); sh.addColorStop(0, 'rgba(0,0,0,0.4)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(k * 0.04, k * 0.04, k * 0.92, k * 0.26);
  return c;
}
/** A hazel stake with a red ribbon. */
export function stake(cs: number, r: number) {
  const k = cs * r, { c, g } = canvas(k, k);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(k * 0.52, k * 0.8, k * 0.16, k * 0.06, 0, 0, TAU); g.fill();
  g.strokeStyle = '#8a5a2a'; g.lineWidth = k * 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(k * 0.5, k * 0.8); g.lineTo(k * 0.44, k * 0.18); g.stroke();
  g.strokeStyle = '#c8945a'; g.lineWidth = k * 0.025; g.beginPath(); g.moveTo(k * 0.48, k * 0.76); g.lineTo(k * 0.43, k * 0.2); g.stroke();
  g.fillStyle = '#e03a3a'; g.beginPath(); g.moveTo(k * 0.45, k * 0.24); g.quadraticCurveTo(k * 0.7, k * 0.2, k * 0.8, k * 0.32); g.quadraticCurveTo(k * 0.66, k * 0.36, k * 0.46, k * 0.4); g.closePath(); g.fill();
  g.fillStyle = '#ff7a6a'; g.beginPath(); g.moveTo(k * 0.47, k * 0.27); g.quadraticCurveTo(k * 0.64, k * 0.25, k * 0.72, k * 0.3); g.lineTo(k * 0.47, k * 0.32); g.fill();
  return c;
}
/** A black truffle, or one squashed by a careless spade. */
export function truffle(cs: number, r: number, squashed = false) {
  const k = cs * r, { c, g } = canvas(k, k), cx = k / 2, cy = k / 2, R = k * 0.27;
  if (squashed) {
    g.fillStyle = '#1e1612'; g.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, rr = R * (1 + (i % 2 ? 0.45 : 0.1)); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.75); } g.closePath(); g.fill();
    g.fillStyle = '#5a4a40'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(cx + (hash(i, 1) - 0.5) * R * 1.6, cy + (hash(i, 2) - 0.5) * R, k * 0.02, 0, TAU); g.fill(); }
    g.strokeStyle = '#e0a060'; g.lineWidth = k * 0.025; g.beginPath(); g.moveTo(cx - R * 0.6, cy - R * 0.2); g.lineTo(cx + R * 0.5, cy + R * 0.3); g.stroke();
    return c;
  }
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx + k * 0.03, cy + k * 0.06, R * 1.05, R * 0.88, 0, 0, TAU); g.fill();
  // a knobbly silhouette: a ring of warts around a round body
  const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1); body.addColorStop(0, '#5a4234'); body.addColorStop(0.55, '#2a1c14'); body.addColorStop(1, '#100804');
  g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R * 0.92, 0, TAU); g.fill();
  for (let i = 0; i < 13; i++) { const a = (i / 13) * TAU + hash(i, 8) * 0.2, x = cx + Math.cos(a) * R * 0.86, y = cy + Math.sin(a) * R * 0.86; g.beginPath(); g.arc(x, y, R * (0.2 + hash(i, 9) * 0.06), 0, TAU); g.fill(); }
  // warts: little pyramids, lit from the top left
  for (let i = 0; i < 26; i++) {
    const a = hash(i, 3) * TAU, d = Math.sqrt(hash(i, 4)) * R * 0.88, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, w = R * (0.09 + hash(i, 6) * 0.05);
    const lit = 0.5 + 0.5 * Math.max(0, -(x - cx) - (y - cy)) / R;
    g.fillStyle = `rgba(150,110,85,${0.25 + lit * 0.35})`; g.beginPath(); g.arc(x - w * 0.25, y - w * 0.25, w * 0.55, 0, TAU); g.fill();
    g.fillStyle = 'rgba(8,4,2,0.55)'; g.beginPath(); g.arc(x + w * 0.3, y + w * 0.3, w * 0.45, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgba(255,236,210,0.22)'; g.beginPath(); g.ellipse(cx - R * 0.38, cy - R * 0.45, R * 0.32, R * 0.15, -0.65, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,200,140,0.18)'; g.lineWidth = k * 0.012; g.beginPath(); g.arc(cx, cy, R * 1.02, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
  return c;
}
/** The pig, from above, facing up. */
export function pig(cs: number, r: number) {
  const k = cs * r * 1.75, { c, g } = canvas(k, k * 1.2), cx = k / 2, cy = k * 0.62;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx + k * 0.03, cy + k * 0.05, k * 0.28, k * 0.38, 0, 0, TAU); g.fill();
  // tail
  g.strokeStyle = '#e88aa0'; g.lineWidth = k * 0.03; g.beginPath(); g.arc(cx + k * 0.03, cy + k * 0.4, k * 0.04, 0.5, Math.PI * 2.2); g.stroke();
  const body = g.createRadialGradient(cx - k * 0.06, cy - k * 0.05, k * 0.05, cx, cy, k * 0.36); body.addColorStop(0, '#ffd0dc'); body.addColorStop(1, '#f090a8');
  g.fillStyle = body; g.beginPath(); g.ellipse(cx, cy, k * 0.26, k * 0.36, 0, 0, TAU); g.fill();
  // head and ears
  g.fillStyle = '#f8a8bc'; g.beginPath(); g.ellipse(cx, cy - k * 0.36, k * 0.18, k * 0.15, 0, 0, TAU); g.fill();
  for (const s of [-1, 1]) { g.fillStyle = '#e8829c'; g.beginPath(); g.moveTo(cx + s * k * 0.1, cy - k * 0.44); g.lineTo(cx + s * k * 0.22, cy - k * 0.5); g.lineTo(cx + s * k * 0.17, cy - k * 0.36); g.closePath(); g.fill(); }
  g.fillStyle = '#ffb8c8'; g.beginPath(); g.ellipse(cx, cy - k * 0.5, k * 0.085, k * 0.06, 0, 0, TAU); g.fill();
  g.fillStyle = '#c8607a'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * k * 0.03, cy - k * 0.5, k * 0.015, k * 0.022, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#2a1a1a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * k * 0.07, cy - k * 0.41, k * 0.018, 0, TAU); g.fill(); }
  return c;
}
/** The forest floor around the patches: moss, roots, ferns and a few toadstools. */
export function floor(m: Mood, W: number, H: number, r: number, seed: number, keep: [number, number, number, number]) {
  const { c, g } = canvas(W * r, H * r); g.scale(r, r);
  const bg = g.createLinearGradient(0, 0, W * 0.3, H); bg.addColorStop(0, m.floor[0]); bg.addColorStop(1, m.floor[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = hash(i, seed) * W, y = hash(i, seed + 1) * H, rr = 20 + hash(i, 2) * 60; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, hexA(m.moss, 0.22)); gr.addColorStop(1, hexA(m.moss, 0)); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  const [kx, ky, kw, kh] = keep, outside = (x: number, y: number) => x < kx - 6 || x > kx + kw + 6 || y < ky - 6 || y > ky + kh + 6;
  // roots
  for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(60,36,18,0.6)'; g.lineWidth = 4 + hash(i, 3) * 6; g.lineCap = 'round'; const x = hash(i, seed + 4) * W, y = hash(i, seed + 5) * H; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y + 20, x + 60, y - 30, x + 120 * (hash(i, 6) - 0.5) * 2, y + 80 * (hash(i, 7) - 0.5) * 2); g.stroke(); }
  // fallen leaves and toadstools around the edges
  for (let i = 0; i < 90; i++) { const x = hash(i, seed + 8) * W, y = hash(i, seed + 9) * H; if (!outside(x, y)) continue; leaf(g, m, x, y, 10 + hash(i, 10) * 10, hash(i, 11) * TAU, hexA(m.leaves[i % m.leaves.length], 0.8)); }
  for (let i = 0; i < 6; i++) {
    const x = hash(i, seed + 12) * W, y = hash(i, seed + 13) * H; if (!outside(x, y)) continue;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + 2, y + 3, 9, 7, 0, 0, TAU); g.fill();
    g.fillStyle = i % 2 ? '#d8402a' : '#c88a4a'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill();
    g.fillStyle = '#fff4e0'; for (let s = 0; s < 4; s++) { g.beginPath(); g.arc(x + (hash(s, i) - 0.5) * 9, y + (hash(i, s) - 0.5) * 9, 1.4, 0, TAU); g.fill(); }
  }
  if (m.mist) { const mg = g.createLinearGradient(0, 0, 0, H); mg.addColorStop(0, `rgba(220,226,240,${m.mist})`); mg.addColorStop(0.5, `rgba(220,226,240,${m.mist * 0.3})`); mg.addColorStop(1, `rgba(220,226,240,${m.mist})`); g.fillStyle = mg; g.fillRect(0, 0, W, H); }
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}
