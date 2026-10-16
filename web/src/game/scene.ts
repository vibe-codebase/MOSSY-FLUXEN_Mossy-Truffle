import Phaser from 'phaser';
import * as A from './art';
import { LEVELS, type Level } from './levels';
import { around, counts, deduce, dig, starsFor } from './sim';
import { sound } from '../audio/sound';

export type Result = { squashed: number; hints: number; stars: number; hinted: boolean };
export type Finish = { level: Level; result: Result };
type Hooks = { onFinish?: (f: Finish) => void; onFirstAction?: () => void; onHaptic?: (s: 'light' | 'medium' | 'success' | 'warning') => void };
export type Mode = 'dig' | 'mark';
export type HudState = { phase: 'play' | 'done'; marked: number; total: number; left: number; mode: Mode; squashed: number; hints: number; started: boolean; msg: string; msgId: number };

/** Bridge between React and the Phaser scene. */
export const wood = {
  hooks: {} as Hooks,
  scene: null as WoodScene | null,
  reducedMotion: false,
  mode: 'dig' as Mode,
  show(mode: 'menu' | 'play', level: Level) { this.scene?.show(mode, level); },
  setPaused(p: boolean) { this.scene?.setPaused(p); },
  setMode(m: Mode) { this.mode = m; },
  state(): HudState | null { return this.scene?.hudState() ?? null; },
  hint() { this.scene?.hint(); },
  restart() { this.scene?.restart(); },
  debug() { return this.scene?.debugState(); },
  /** QA only: a patch's CSS centre, and the next safe patches and truffles that reasoning gives. */
  qaCell(c: number) { return this.scene?.qaCell(c); },
  solvePath(): { cell: number; truffle: boolean }[] | null { return this.scene?.nextSteps() ?? null; },
};
(window as unknown as { __wood: typeof wood }).__wood = wood;

const VIEW_W = 360;
const SHOWCASE = ['b6', 'c3', 'a7'];
const HOLD_MS = 420;

export class WoodScene extends Phaser.Scene {
  level: Level = LEVELS[0];
  private mode: 'menu' | 'play' = 'menu';
  private phase: 'play' | 'done' = 'play';
  private paused = false;
  private acted = false;
  private texSeq = 0;
  private r = 2;
  private viewW = VIEW_W; private viewH = 700;
  private cs = 40; private ox = 0; private oy = 0;
  private num: number[] = []; private truffles = new Set<number>();
  private dug: boolean[] = []; private marked: boolean[] = []; private squashedAt = new Set<number>();
  private squashed = 0; private hints = 0;
  private cover: (Phaser.GameObjects.Image | null)[] = []; private overlay: (Phaser.GameObjects.GameObject | null)[] = [];
  private tex = { leaves: [] as string[], soil: [] as string[], stake: '', truffle: '', squash: '' };
  private fx!: Phaser.GameObjects.Graphics;
  private press: { c: number; t: number; held: boolean } | null = null;
  private msg = ''; private msgId = 0;
  private clock = 0; private hintCell = -1; private hintT = -9;
  private pigImg: Phaser.GameObjects.Image | null = null;
  private crumbs: { x: number; y: number; vx: number; vy: number; t: number; col: number }[] = [];
  private demoWait = 0;
  private gen = 0;

  constructor() { super('wood'); }

  create() {
    wood.scene = this;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.pDown(p));
    this.input.on('pointerup', () => this.pUp());
    this.input.on('pointerupoutside', () => { this.press = null; });
    this.scale.on('resize', () => this.rebuild());
    this.show('menu', LEVELS.find((l) => l.id === SHOWCASE[0])!);
  }
  isMenu() { return this.mode === 'menu'; }
  setPaused(p: boolean) { this.paused = p; if (p) this.press = null; }
  private safeLeft() { let n = 0; for (let c = 0; c < this.dug.length; c++) if (!this.dug[c] && !this.truffles.has(c)) n++; return n; }
  hudState(): HudState { return { phase: this.phase, marked: this.marked.filter(Boolean).length + this.squashedAt.size, total: this.truffles.size, left: this.safeLeft(), mode: wood.mode, squashed: this.squashed, hints: this.hints, started: this.acted, msg: this.msg, msgId: this.msgId }; }
  debugState() { return { ...this.hudState(), mode2: this.mode, dug: this.dug.filter(Boolean).length }; }
  private css() { const z = this.cameras.main.zoom, kk = (this.game.canvas.clientWidth || VIEW_W) / this.scale.width; return z * kk; }
  qaCell(c: number) { const p = this.centre(c), k = this.css(); return { x: p.x * k, y: p.y * k }; }
  /** Correct marks only: what reasoning gives next. */
  nextSteps() { const m = this.marked.map((v, c) => v && this.truffles.has(c)); this.squashedAt.forEach((c) => (m[c] = true)); return deduce(this.level, this.num, this.dug, m).map(({ cell, truffle }) => ({ cell, truffle })); }
  private say(m: string) { this.msg = m; this.msgId++; }
  private later(ms: number, fn: () => void) { const g = this.gen; this.time.delayedCall(ms, () => { if (g === this.gen) fn(); }); }
  private first() { if (!this.acted) { this.acted = true; wood.hooks.onFirstAction?.(); } }

  show(mode: 'menu' | 'play', level: Level) {
    this.mode = mode; this.level = level; this.gen++;
    this.num = counts(level); this.truffles = new Set(level.truffles);
    const n = level.w * level.h; this.dug = new Array(n).fill(false); this.marked = new Array(n).fill(false); this.squashedAt = new Set();
    dig(level, this.num, this.dug, level.start);
    this.paused = false; this.acted = false; this.phase = 'play'; this.squashed = 0; this.hints = 0; this.msg = ''; this.hintCell = -1; this.press = null; this.crumbs = [];
    wood.mode = 'dig'; this.demoWait = 1.2;
    this.rebuild();
  }
  restart() { if (this.mode === 'play' && this.phase === 'play' && this.acted) { const h = this.hints, s = this.squashed; this.show('play', this.level); this.hints = h; this.squashed = s; sound.undo(); } }

  // ── layout ────────────────────────────────────────────────────────────
  private addTex(prefix: string, c: HTMLCanvasElement) { const key = `${prefix}-${++this.texSeq}`; this.textures.addCanvas(key, c); return key; }
  private rebuild() {
    const stale = this.textures.getTextureKeys().filter((k) => /-\d+$/.test(k));
    this.tweens.killAll();
    this.children.removeAll(true);
    if (stale.length) this.events.once('postrender', () => stale.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    this.pigImg = null;
    const pw = this.scale.width, ph = this.scale.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const zoom = Math.min(pw / VIEW_W, ph / 640);
    this.r = Math.min(2, Math.max(1, zoom));
    this.viewW = pw / zoom; this.viewH = ph / zoom;
    this.cameras.main.setZoom(zoom).centerOn(this.viewW / 2, this.viewH / 2);
    const css = zoom / dpr, play = this.mode === 'play', W = this.viewW, H = this.viewH, l = this.level, m = A.MOODS[l.chapter], r = this.r;
    const top = (play ? 84 : 236) / css, bottom = (play ? 100 : 196) / css, availH = H - top - bottom;
    this.cs = Math.min((W - 16) / l.w, availH / l.h, 52);
    const cs = this.cs; this.ox = (W - l.w * cs) / 2; this.oy = top + (availH - l.h * cs) / 2;
    this.add.image(0, 0, this.addTex('fl', A.floor(m, W, H, Math.min(r, 1.5), 5 + l.chapter * 7, [this.ox, this.oy, l.w * cs, l.h * cs]))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    this.tex = { leaves: [0, 1, 2, 3].map((i) => this.addTex('lv', A.leaves(cs, r, m, i * 17 + 3))), soil: [0, 1, 2].map((i) => this.addTex('so', A.soil(cs, r, m, i * 11 + 1))), stake: this.addTex('st', A.stake(cs, r)), truffle: this.addTex('tr', A.truffle(cs, r)), squash: this.addTex('sq', A.truffle(cs, r, true)) };
    const n = l.w * l.h;
    this.cover = new Array(n).fill(null); this.overlay = new Array(n).fill(null);
    for (let c = 0; c < n; c++) {
      const p = this.centre(c);
      this.add.image(p.x, p.y, this.tex.soil[(c * 7) % 3]).setScale(1 / r).setDepth(1);
      if (this.num[c] > 0 && !this.truffles.has(c)) this.add.text(p.x, p.y + cs * 0.02, String(this.num[c]), { fontFamily: 'Gluten, sans-serif', fontStyle: '700', fontSize: `${Math.round(cs * 0.56 * r)}px`, color: A.NUMBER_COLORS[this.num[c]], stroke: '#1a0e06', strokeThickness: Math.round(cs * 0.06 * r) }).setOrigin(0.5).setScale(1 / r).setDepth(2);
      if (this.truffles.has(c)) this.add.image(p.x, p.y, this.squashedAt.has(c) ? this.tex.squash : this.tex.truffle).setScale(1 / r).setDepth(2);
      if (!this.dug[c] && !this.squashedAt.has(c)) this.cover[c] = this.add.image(p.x, p.y, this.tex.leaves[(c * 5 + Math.floor(c / l.w)) % 4]).setScale(1 / r).setDepth(4);
      if (this.marked[c]) this.overlay[c] = this.add.image(p.x, p.y, this.tex.stake).setScale(1 / r).setDepth(5);
    }
    this.fx = this.add.graphics().setDepth(9);
    if (this.phase === 'done') this.revealAll(false);
  }
  private centre(c: number) { return { x: this.ox + ((c % this.level.w) + 0.5) * this.cs, y: this.oy + (Math.floor(c / this.level.w) + 0.5) * this.cs }; }
  private cellAt(x: number, y: number) { const cx = Math.floor((x - this.ox) / this.cs), cy = Math.floor((y - this.oy) / this.cs); return cx < 0 || cy < 0 || cx >= this.level.w || cy >= this.level.h ? -1 : cy * this.level.w + cx; }

  // ── playing ───────────────────────────────────────────────────────────
  private pDown(p: Phaser.Input.Pointer) {
    if (this.mode !== 'play' || this.paused || this.phase !== 'play') return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y), c = this.cellAt(w.x, w.y); if (c < 0) return;
    this.first();
    this.press = { c, t: performance.now(), held: false };
  }
  private pUp() {
    const pr = this.press; this.press = null; if (!pr || pr.held || this.phase !== 'play') return;
    const c = pr.c;
    if (this.dug[c] || this.squashedAt.has(c)) { this.chord(c); return; }
    if (wood.mode === 'mark') this.toggleMark(c);
    else if (this.marked[c]) { sound.tap(); this.say('That patch is marked. Hold it, or use the marker, to unmark it.'); }
    else this.digAt(c);
  }
  private toggleMark(c: number) {
    if (this.dug[c] || this.squashedAt.has(c)) return;
    this.marked[c] = !this.marked[c]; this.hintCell = -1;
    this.overlay[c]?.destroy(); this.overlay[c] = null;
    if (this.marked[c]) { const p = this.centre(c), im = this.add.image(p.x, p.y, this.tex.stake).setScale(1 / this.r).setDepth(5); this.overlay[c] = im; if (!wood.reducedMotion) { im.setY(p.y - this.cs * 0.3).setAlpha(0); this.tweens.add({ targets: im, y: p.y, alpha: 1, duration: 140, ease: 'Bounce.easeOut' }); } if (this.mode === 'play') sound.mark(); }
    else if (this.mode === 'play') sound.unmark();
    wood.hooks.onHaptic?.('light');
  }
  /** Dig a patch: a truffle there is squashed; otherwise the soil shows its number, and clearings open. */
  private digAt(c: number) {
    this.hintCell = -1;
    if (this.truffles.has(c)) {
      this.squashed++; this.squashedAt.add(c); this.marked[c] = false;
      this.uncover(c, 0); const p = this.centre(c); this.add.image(p.x, p.y, this.tex.squash).setScale(1 / this.r).setDepth(3);
      sound.squash(); wood.hooks.onHaptic?.('warning'); this.say('Squashed a truffle! The pig is not amused. The board carries on.');
      this.check(); return;
    }
    const opened = dig(this.level, this.num, this.dug, c);
    opened.sort((a, b) => this.dist(c, a) - this.dist(c, b)).forEach((o) => this.uncover(o, wood.reducedMotion ? 0 : Math.min(400, this.dist(c, o) * 45)));
    if (this.mode === 'play') { if (opened.length > 1) sound.open(opened.length); else sound.dig(); }
    wood.hooks.onHaptic?.('light');
    opened.forEach((o) => { if (this.marked[o]) { this.marked[o] = false; this.overlay[o]?.destroy(); this.overlay[o] = null; } });
    this.check();
  }
  private dist(a: number, b: number) { const w = this.level.w; return Math.max(Math.abs((a % w) - (b % w)), Math.abs(Math.floor(a / w) - Math.floor(b / w))); }
  private uncover(c: number, delay: number) {
    const im = this.cover[c]; this.cover[c] = null; if (!im) return;
    const p = this.centre(c);
    const go = () => { if (wood.reducedMotion) { im.destroy(); return; } this.tweens.add({ targets: im, scale: 1.25 / this.r, alpha: 0, duration: 180, onComplete: () => im.destroy() }); const m = A.MOODS[this.level.chapter]; for (let k = 0; k < 5; k++) { const a = Math.random() * Math.PI * 2, v = this.cs * (1 + Math.random() * 1.5); this.crumbs.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - this.cs, t: 0, col: A.toInt(m.leaves[k % m.leaves.length]) }); } };
    if (delay) this.later(delay, go); else go();
  }
  /** Tap a dug number whose truffles are all marked to dig all round it. */
  private chord(c: number) {
    if (!this.dug[c] || this.num[c] === 0) return;
    const nb = around(this.level.w, this.level.h, c), flags = nb.filter((o) => this.marked[o] || this.squashedAt.has(o)).length, todo = nb.filter((o) => !this.dug[o] && !this.marked[o] && !this.squashedAt.has(o));
    if (!todo.length) return;
    if (flags !== this.num[c]) { sound.tap(); this.say(`This ${this.num[c]} has ${flags} marked so far. Mark all its truffles, then tap it to dig the rest.`); return; }
    for (const o of todo) { if (this.phase !== 'play') break; this.digAt(o); }
  }
  private check() { if (this.safeLeft() === 0 && this.phase === 'play') this.win(); }
  /** A hint pulls up a wrong stake, or else digs or marks the next patch reasoning gives. */
  hint() {
    if (this.mode !== 'play' || this.phase !== 'play') return;
    this.first();
    const wrong = this.marked.findIndex((v, c) => v && !this.truffles.has(c));
    this.hints++;
    if (wrong >= 0) { this.toggleMark(wrong); this.hintCell = wrong; this.hintT = this.clock; sound.hint(); this.say('No truffle under that stake. It’s pulled up.'); return; }
    const steps = this.nextSteps(); if (!steps.length) { this.hints--; return; }
    const s = steps.find((x) => !x.truffle) ?? steps[0];
    this.hintCell = s.cell; this.hintT = this.clock; sound.hint();
    if (s.truffle) { if (!this.marked[s.cell]) this.toggleMark(s.cell); this.say('The pig sniffs: a truffle here. Marked.'); }
    else { this.say('The pig sniffs: nothing here. Dug.'); this.digAt(s.cell); }
  }
  private revealAll(animate: boolean) { this.truffles.forEach((c) => { const im = this.cover[c]; if (im) { this.cover[c] = null; if (animate && !wood.reducedMotion) this.tweens.add({ targets: im, alpha: 0, duration: 300, onComplete: () => im.destroy() }); else im.destroy(); } this.overlay[c]?.destroy(); this.overlay[c] = null; }); }
  /** Every safe patch dug: the pig trots round, gathering every truffle. */
  private win() {
    this.phase = 'done'; this.hintCell = -1;
    wood.hooks.onHaptic?.('success');
    this.revealAll(true);
    const l = this.level, cs = this.cs, order = [...this.truffles].filter((c) => !this.squashedAt.has(c)).sort((a, b) => Math.floor(a / l.w) - Math.floor(b / l.w) || ((Math.floor(a / l.w) % 2 ? -1 : 1) * ((a % l.w) - (b % l.w))));
    const start = this.centre(l.start), pig = this.add.image(start.x, start.y, this.addTex('pg', A.pig(cs, this.r))).setScale(1 / this.r).setDepth(8);
    this.pigImg = pig;
    const rm = wood.reducedMotion, step = rm ? 0 : Math.max(110, Math.min(260, 2200 / Math.max(1, order.length)));
    if (this.mode === 'play') sound.whole();
    order.forEach((c, i) => this.later(300 + i * step, () => {
      const p = this.centre(c);
      if (!rm) { const a = Math.atan2(p.y - pig.y, p.x - pig.x); pig.setAngle((a * 180) / Math.PI + 90); this.tweens.add({ targets: pig, x: p.x, y: p.y, duration: step * 0.85, ease: 'Sine.easeInOut' }); }
      this.later(rm ? 0 : step * 0.8, () => { if (this.mode === 'play') sound.collect(i); const t = this.children.list.find((o) => o instanceof Phaser.GameObjects.Image && o.texture.key === this.tex.truffle && Math.abs(o.x - p.x) < 1 && Math.abs(o.y - p.y) < 1) as Phaser.GameObjects.Image | undefined; if (t) this.tweens.add({ targets: t, scale: 0, duration: rm ? 0 : 150, onComplete: () => t.destroy() }); });
    }));
    const st = starsFor(this.squashed, this.hints), at = 300 + order.length * step + 900;
    if (this.mode === 'play') this.later(at, () => wood.hooks.onFinish?.({ level: this.level, result: { squashed: this.squashed, hints: this.hints, stars: st, hinted: this.hints > 0 } }));
    else this.later(at + 1200, () => { const i = (SHOWCASE.indexOf(this.level.id) + 1) % SHOWCASE.length; this.show('menu', LEVELS.find((x) => x.id === SHOWCASE[i])!); });
  }

  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    if (this.paused) return;
    this.clock += dt;
    if (this.press && !this.press.held && performance.now() - this.press.t > HOLD_MS) { this.press.held = true; if (!this.dug[this.press.c]) this.toggleMark(this.press.c); }
    if (this.mode === 'menu' && this.phase === 'play') { this.demoWait -= dt; if (this.demoWait <= 0) { const s = this.nextSteps(); if (s.length) { const x = s[0]; if (x.truffle) this.toggleMark(x.cell); else this.digAt(x.cell); this.demoWait = 0.16; } } }
    const fx = this.fx, cs = this.cs; fx.clear();
    if (this.press && !this.press.held && !this.dug[this.press.c]) { const p = this.centre(this.press.c), f = Math.min(1, (performance.now() - this.press.t) / HOLD_MS); if (f > 0.25) { fx.lineStyle(3, 0xfff0c0, 0.85); fx.beginPath(); fx.arc(p.x, p.y, cs * 0.45, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); fx.strokePath(); } }
    if (this.hintCell >= 0 && this.clock - this.hintT < 3) { const p = this.centre(this.hintCell), e = this.clock - this.hintT, a = wood.reducedMotion ? 0.8 : Math.max(0, 1 - e / 3) * (0.6 + 0.4 * Math.sin(e * 7)); fx.lineStyle(3, 0xffe08a, a); fx.strokeRoundedRect(p.x - cs * 0.47, p.y - cs * 0.47, cs * 0.94, cs * 0.94, cs * 0.14); }
    this.crumbs = this.crumbs.filter((c) => (c.t += dt) < 0.6);
    for (const c of this.crumbs) { c.vx *= 0.92; c.vy = c.vy * 0.92 + cs * 3 * dt; c.x += c.vx * dt; c.y += c.vy * dt; fx.fillStyle(c.col, 1 - c.t / 0.6); fx.fillEllipse(c.x, c.y, cs * 0.12, cs * 0.07); }
    void this.pigImg;
  }
}

export function startGame(parent: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#2a1e14',
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * dpr, height: parent.clientHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: false },
    input: { activePointers: 1 },
    scene: [WoodScene],
    banner: false,
  });
  const onResize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    game.scale.setZoom(1 / d);
    game.scale.resize(parent.clientWidth * d, parent.clientHeight * d);
  };
  window.addEventListener('resize', onResize);
  return () => { window.removeEventListener('resize', onResize); game.destroy(true); };
}
