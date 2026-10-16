/**
 * Truffle sound, synthesised with Web Audio: a little woodland folk band (a tremolo mandolin and a breathy
 * recorder) over wind in the leaves, with a woodpecker now and then; the crunch of leaves and a soft thud as a patch
 * is dug, a rustling cascade when a clearing opens, the tap of a hazel stake, a squelch and a sorry grunt for a
 * squashed truffle, and the pig's happy oinks as it gathers the haul.
 */
const SCALE = [0, 2, 4, 5, 7, 9, 11];
export function noteHz(degree: number) { const o = Math.floor(degree / 7), s = SCALE[((degree % 7) + 7) % 7] + o * 12; return 293.66 * Math.pow(2, s / 12); }

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private verb!: ConvolverNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private next = 0;
  private beatN = 0;
  private chapter = 0;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private ducked = false;
  private plucks = new Map<number, AudioBuffer>();

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      this.master.connect(comp).connect(ctx.destination);
      this.music = ctx.createGain(); this.sfx = ctx.createGain();
      this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(1.6);
      const wet = ctx.createGain(); wet.gain.value = 0.22;
      this.verb.connect(wet).connect(this.master);
      this.music.connect(this.master); this.music.connect(this.verb);
      this.sfx.connect(this.master); this.sfx.connect(this.verb);
      this.noise = this.makeNoise();
      // wind in the leaves
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.5;
      const wg = ctx.createGain(); wg.gain.value = 0.014; const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11; const lg = ctx.createGain(); lg.gain.value = 0.01; lfo.connect(lg).connect(wg.gain); lfo.start();
      src.connect(bp).connect(wg).connect(this.music); src.start();
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  setVolumes(music: number, sfx: number) { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(this.musicVol * 0.6 * (this.ducked ? 0.6 : 1), t, 0.3);
    this.sfx.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }
  duck(on: boolean) { this.ducked = on; this.applyVolumes(); }
  suspend() { void this.ctx?.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') void this.ctx.resume(); }

  startMusic(chapter: number) {
    if (!this.ctx) return;
    if (this.timer !== null && chapter === this.chapter) return;
    this.chapter = chapter;
    this.next = this.ctx.currentTime + 0.4;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 150);
  }
  /** A jig-ish 6/8: mandolin chords on the beats, a recorder tune every other bar. */
  private schedule() {
    const ctx = this.ctx!;
    const roots = [[0, 3, 4, 0], [5, 3, 4, 0], [0, 5, 3, 4]][this.chapter % 3];
    const tunes = [[4, 5, 7, 5, 4, 2], [7, 9, 7, 5, 4, 5], [9, 7, 5, 4, 2, 4], [2, 4, 2, 0, -1, 0]];
    const beat = 0.22;
    while (this.next < ctx.currentTime + 0.8) {
      const t = this.next, bar = Math.floor(this.beatN / 6), pos = this.beatN % 6, root = roots[bar % 4];
      if (pos === 0 || pos === 3) { this.pluck(t, noteHz(root - 7), 0.05); [2, 4].forEach((d) => this.pluck(t + 0.02, noteHz(root + d), 0.022)); }
      if (pos % 3 === 2) this.pluck(t, noteHz(root + 4), 0.018);
      if (bar % 2 === 1) this.recorder(t, noteHz(tunes[(bar >> 1) % 4][pos] + 7), beat * 0.95);
      if (this.beatN % 79 === 41) this.woodpecker(t);
      this.next += beat; this.beatN++;
    }
  }
  private pluck(t: number, f: number, vol: number, bus?: GainNode) {
    const ctx = this.ctx!, key = Math.round(f);
    let buf = this.plucks.get(key);
    if (!buf) {
      const sr = ctx.sampleRate, len = Math.floor(sr * 1.2), N = Math.max(2, Math.round(sr / f)), d = new Float32Array(len), ring = new Float32Array(N);
      for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
      let p = 0; for (let i = 0; i < len; i++) { const a = ring[p], b = ring[(p + 1) % N]; d[i] = a; ring[p] = (a + b) * 0.496; p = (p + 1) % N; }
      buf = ctx.createBuffer(1, len, sr); buf.copyToChannel(d, 0); this.plucks.set(key, buf);
    }
    const src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain(); g.gain.value = vol; src.connect(g).connect(bus ?? this.music); src.start(t);
  }
  private recorder(t: number, f: number, dur: number, bus?: GainNode, vol = 0.03) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus ?? this.music); o.start(t); o.stop(t + dur + 0.02);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'triangle'; o2.frequency.value = f * 2; g2.gain.value = vol * 0.12; o2.connect(g2).connect(bus ?? this.music); o2.start(t); o2.stop(t + dur);
  }
  private woodpecker(t: number) { for (let k = 0; k < 9; k++) this.hiss(t + k * 0.05, 0.012, 0.012, 1400, 6, this.music); }
  private hiss(t: number, dur: number, vol: number, freq: number, q = 1, bus?: GainNode, sweep?: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = type; bp.Q.value = q; bp.frequency.setValueAtTime(freq, t); if (sweep) bp.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.006, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(bus ?? this.sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  private thud(t: number, vol: number) { const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.12); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.2); }
  /** An oink: a buzzy voice through two formants, sliding down (or up when happy). */
  private oink(t: number, happy: boolean, vol = 0.07) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(happy ? 240 : 230, t); o.frequency.linearRampToValueAtTime(happy ? 300 : 170, t + 0.18);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 650; f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1300; f2.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + 0.13); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(f1).connect(g); o.connect(f2).connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.24);
    this.hiss(t, 0.15, vol * 0.3, 900, 1.5);
  }
  /** Digging a patch: leaves crunch, earth thuds. */
  dig() { if (!this.ctx) return; const t = this.ctx.currentTime; this.hiss(t, 0.12, 0.07, 3000, 0.8, undefined, 1500); this.thud(t + 0.05, 0.08); }
  /** A clearing opens: a rustling run. */
  open(n: number) { if (!this.ctx) return; const t = this.ctx.currentTime; for (let k = 0; k < Math.min(10, n); k++) this.hiss(t + k * 0.03, 0.08, 0.035, 2600 + k * 150, 0.9); this.thud(t, 0.06); }
  mark() { if (!this.ctx) return; const t = this.ctx.currentTime; this.hiss(t, 0.03, 0.08, 1700, 3); this.thud(t, 0.04); }
  unmark() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.05, 0.05, 2200, 2); }
  /** A truffle squashed by mistake. */
  squash() { if (!this.ctx) return; const t = this.ctx.currentTime; this.hiss(t, 0.2, 0.08, 500, 0.8, undefined, 200); this.oink(t + 0.2, false); }
  tap() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.04, 0.03, 2600, 2); }
  undo() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.18, 0.03, 1800, 1, undefined, 800); }
  /** The pig sniffs: a hint. */
  hint() { if (!this.ctx) return; const t = this.ctx.currentTime; for (let k = 0; k < 3; k++) this.hiss(t + k * 0.09, 0.06, 0.05, 1500, 2); this.recorder(t + 0.3, noteHz(9), 0.25, this.sfx, 0.05); }
  /** One truffle into the basket. */
  collect(i: number) { if (this.ctx) { const t = this.ctx.currentTime; this.pluck(t, noteHz(7 + (i % 8)), 0.08, this.sfx); if (i % 3 === 0) this.oink(t + 0.05, true, 0.05); } }
  whole() { if (!this.ctx) return; const t = this.ctx.currentTime; this.oink(t, true); this.oink(t + 0.3, true); [0, 2, 4, 7, 9, 11, 14].forEach((d, i) => this.pluck(t + 0.5 + i * 0.07, noteHz(d + 7), 0.07, this.sfx)); this.recorder(t + 1, noteHz(14), 0.8, this.sfx, 0.05); }
  star(i: number) { if (this.ctx) this.pluck(this.ctx.currentTime, noteHz([9, 11, 14][i] ?? 14), 0.1, this.sfx); }

  private makeNoise() {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return b;
  }
}
export const sound = new Sound();
