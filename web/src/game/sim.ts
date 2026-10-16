/**
 * Truffle: truffles hide under the leaves of a forest floor. Dig a patch and the soil tells you how many truffles
 * lie in the eight patches around it. Mark the truffles, dig everything else. A clearing is dug for you to start,
 * and from there every board can be finished by reasoning alone, without ever having to guess.
 */
export type Wood = { w: number; h: number; truffles: number[]; start: number };
export const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
export function around(w: number, h: number, c: number) { const x = c % w, y = Math.floor(c / w), out: number[] = []; for (const [dx, dy] of N8) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) out.push(ny * w + nx); } return out; }
export function counts(wd: Wood) { const t = new Set(wd.truffles); return Array.from({ length: wd.w * wd.h }, (_, c) => around(wd.w, wd.h, c).filter((o) => t.has(o)).length); }
/** Dig a patch: zero patches open their neighbours too (flood). Returns the patches newly dug. */
export function dig(wd: Wood, num: number[], dug: boolean[], c: number) {
  const t = new Set(wd.truffles), out: number[] = []; if (dug[c]) return out;
  const st = [c]; dug[c] = true; out.push(c);
  while (st.length) { const x = st.pop()!; if (t.has(x) || num[x] !== 0) continue; for (const o of around(wd.w, wd.h, x)) if (!dug[o] && !t.has(o)) { dug[o] = true; out.push(o); st.push(o); } }
  return out;
}

export type Step = { cell: number; truffle: boolean; rule: 'count' | 'pair' };
/**
 * One step of reasoning from what is known: a dug patch whose number is already met by marked truffles frees the
 * rest; one whose unknown neighbours exactly make up its number marks them all; and two numbers compared (one's
 * unknowns inside the other's) settle the difference.
 */
export function deduce(wd: Wood, num: number[], dug: boolean[], marked: boolean[]): Step[] {
  const n = wd.w * wd.h, out: Step[] = [], seen = new Set<number>();
  const add = (cell: number, truffle: boolean, rule: Step['rule']) => { if (!seen.has(cell)) { seen.add(cell); out.push({ cell, truffle, rule }); } };
  const info: { c: number; unk: number[]; need: number }[] = [];
  for (let c = 0; c < n; c++) {
    if (!dug[c]) continue;
    const nb = around(wd.w, wd.h, c), unk = nb.filter((o) => !dug[o] && !marked[o]), need = num[c] - nb.filter((o) => marked[o]).length;
    if (!unk.length) continue;
    if (need === 0) unk.forEach((o) => add(o, false, 'count'));
    else if (need === unk.length) unk.forEach((o) => add(o, true, 'count'));
    else info.push({ c, unk, need });
  }
  if (out.length) return out;
  for (const a of info) for (const b of info) {
    if (a === b || a.unk.length >= b.unk.length) continue;
    if (!a.unk.every((o) => b.unk.includes(o))) continue;
    const rest = b.unk.filter((o) => !a.unk.includes(o)), diff = b.need - a.need;
    if (diff === 0) rest.forEach((o) => add(o, false, 'pair'));
    else if (diff === rest.length) rest.forEach((o) => add(o, true, 'pair'));
  }
  return out;
}
/** Play the board by reasoning alone from the start clearing. Solved if every safe patch gets dug. */
export function reason(wd: Wood) {
  const n = wd.w * wd.h, num = counts(wd), dug = new Array(n).fill(false), marked = new Array(n).fill(false), t = new Set(wd.truffles);
  dig(wd, num, dug, wd.start);
  let rounds = 0, pairs = 0;
  for (;;) {
    const steps = deduce(wd, num, dug, marked); if (!steps.length) break;
    rounds++; if (steps[0].rule === 'pair') pairs++;
    for (const s of steps) { if (s.truffle) { if (!t.has(s.cell)) throw new Error('bad deduction'); marked[s.cell] = true; } else dig(wd, num, dug, s.cell); }
  }
  const safeLeft = Array.from({ length: n }, (_, c) => c).filter((c) => !t.has(c) && !dug[c]).length;
  return { solved: safeLeft === 0, rounds, pairs, opened: dug.filter(Boolean).length };
}
/** Stars: three with no truffle squashed and no hint, two with one slip, else one. */
export function starsFor(squashed: number, hints: number) { const bad = squashed + hints; return bad === 0 ? 3 : bad === 1 ? 2 : 1; }
