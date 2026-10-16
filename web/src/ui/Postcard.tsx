import { useEffect, useRef } from 'react';
import { canvas, MOODS, NUMBER_COLORS } from '../game/art';
import type { Level } from '../game/levels';
import { counts } from '../game/sim';

const cache = new Map<string, HTMLCanvasElement>();
/** The wood in miniature: leaves with the starting clearing; once cleared, the numbers and the truffles found. */
function paintCard(level: Level, solved: boolean, w: number, h: number, dpr: number) {
  const m = MOODS[level.chapter], { c, g } = canvas(w * dpr, h * dpr);
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 8); g.clip();
  g.fillStyle = m.floor[1]; g.fillRect(0, 0, w, h);
  const cs = Math.min((w - 8) / level.w, (h - 8) / level.h), ox = (w - level.w * cs) / 2, oy = (h - level.h * cs) / 2, t = new Set(level.truffles), num = counts(level);
  // the starting clearing
  const open = new Set<number>(), st = [level.start]; open.add(level.start);
  while (st.length) { const x = st.pop()!; if (num[x] !== 0) continue; for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) { const nx = (x % level.w) + dx, ny = Math.floor(x / level.w) + dy; if (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h) continue; const o = ny * level.w + nx; if (!open.has(o) && !t.has(o)) { open.add(o); st.push(o); } } }
  for (let i = 0; i < level.w * level.h; i++) {
    const x = ox + (i % level.w) * cs, y = oy + Math.floor(i / level.w) * cs, dug = solved ? !t.has(i) : open.has(i);
    g.fillStyle = dug ? m.soil[0] : m.leaves[(i * 3) % m.leaves.length]; g.fillRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
    if (solved && t.has(i)) { g.fillStyle = '#1a1210'; g.beginPath(); g.arc(x + cs / 2, y + cs / 2, cs * 0.3, 0, Math.PI * 2); g.fill(); }
    else if (dug && num[i] > 0) { g.fillStyle = NUMBER_COLORS[num[i]]; g.fillRect(x + cs * 0.38, y + cs * 0.38, cs * 0.24, cs * 0.24); }
  }
  g.restore();
  return c;
}

export function Postcard({ level, solved, locked, width }: { level: Level; solved: boolean; locked: boolean; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * 1.25);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), key = `${level.id}|${solved}|${locked}|${width}|${dpr}`;
    let src = cache.get(key);
    if (!src) { src = paintCard(level, solved && !locked, width, height, dpr); cache.set(key, src); }
    el.width = src.width; el.height = src.height; el.getContext('2d')!.drawImage(src, 0, 0);
  }, [level, solved, locked, width, height]);
  return <canvas ref={ref} className="postcard" style={{ width, height }} aria-hidden />;
}
