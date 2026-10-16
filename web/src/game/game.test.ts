import { describe, expect, it } from 'vitest';
import { around, counts, deduce, dig, reason, starsFor, type Wood } from './sim';
import { CHAPTERS, LEVELS, levelIndex } from './levels';
import { freshSave, isUnlocked, parseSave, recordResult, totalStars } from '../state/save';

describe('soil', () => {
  const wd: Wood = { w: 4, h: 3, truffles: [3], start: 8 };
  it('counts truffles in the eight around', () => { expect(counts(wd)).toEqual([0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0]); expect(around(4, 3, 0).sort()).toEqual([1, 4, 5]); expect(around(4, 3, 5)).toHaveLength(8); });
  it('a clearing opens to its edge of numbers', () => { const dug = new Array(12).fill(false), got = dig(wd, counts(wd), dug, 8); expect(got.length).toBe(11); expect(dug[3]).toBe(false); });
  it('reasons a truffle from a number with one hidden neighbour', () => {
    const num = counts(wd), dug = new Array(12).fill(false); dig(wd, num, dug, 8);
    const steps = deduce(wd, num, dug, new Array(12).fill(false)); expect(steps).toContainEqual({ cell: 3, truffle: true, rule: 'count' });
    expect(reason(wd).solved).toBe(true);
  });
  it('the pair rule settles what single numbers cannot', () => {
    // a 1-2-1 edge pattern needs comparing two numbers
    const w2: Wood = { w: 5, h: 3, truffles: [0, 4], start: 12 };
    expect(reason(w2).solved).toBe(true);
  });
  it('stars', () => { expect(starsFor(0, 0)).toBe(3); expect(starsFor(1, 0)).toBe(2); expect(starsFor(0, 1)).toBe(2); expect(starsFor(2, 0)).toBe(1); });
});

describe('woods', () => {
  it('has 24 woods in three chapters of eight, with unique ids and names', () => {
    expect(LEVELS).toHaveLength(24); expect(CHAPTERS).toHaveLength(3);
    for (let c = 0; c < 3; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(8);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(24); expect(new Set(LEVELS.map((l) => l.name)).size).toBe(24);
    expect(levelIndex(LEVELS[9].id)).toBe(9);
  });
  it('get harder through each chapter', () => { for (let c = 0; c < 3; c++) { const s = LEVELS.filter((l) => l.chapter === c).map((l) => l.score); for (let i = 1; i < 8; i++) expect(s[i]).toBeGreaterThanOrEqual(s[i - 1]); } });
});

describe('every wood', () => {
  for (const l of LEVELS) {
    it(`${l.id} ${l.name}: starts in a clearing, finished by reasoning alone, never a guess`, () => {
      const num = counts(l);
      expect(l.truffles).not.toContain(l.start); expect(num[l.start]).toBe(0);
      expect(new Set(l.truffles).size).toBe(l.truffles.length);
      const r = reason(l); expect(r.solved).toBe(true);
      expect(l.w).toBeLessThanOrEqual(8); expect(l.h).toBeLessThanOrEqual(11);
      expect(l.truffles.length / (l.w * l.h)).toBeGreaterThan(0.1);
    });
  }
});

describe('save', () => {
  it('parses safely and records the best', () => {
    expect(parseSave(null)).toEqual(freshSave()); expect(parseSave('{bad')).toEqual(freshSave());
    let t = recordResult(freshSave(), LEVELS[0].id, 2, 1); t = recordResult(t, LEVELS[0].id, 3, 0);
    expect(t.stars[LEVELS[0].id]).toBe(3); expect(t.best[LEVELS[0].id]).toBe(0); expect(totalStars(t)).toBe(3);
  });
  it('unlocks in order', () => { const s = freshSave(); expect(isUnlocked(s, 1)).toBe(false); expect(isUnlocked(recordResult(s, LEVELS[0].id, 1, 2), 1)).toBe(true); });
});
