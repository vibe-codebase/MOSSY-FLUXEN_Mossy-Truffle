import type { Wood } from './sim';
import DATA from './woods.json';

export type Level = Wood & { id: string; name: string; chapter: number; hint?: string; score: number };
export const CHAPTERS = [
  { name: 'Oak Wood', short: 'Oak', blurb: 'Each number is how many truffles lie in the eight patches around it. Mark them, dig the rest.' },
  { name: 'Pine Forest', short: 'Pine', blurb: 'Denser truffle ground. Compare two numbers side by side to find what one alone can’t tell you.' },
  { name: 'Misty Grove', short: 'Misty', blurb: 'The richest, trickiest ground. Every board can still be solved without a guess.' },
];
const NAMES: [string, string?][] = [
  ['Acorn Hollow', 'Tap leaves to dig. The number in the soil counts the truffles in the eight patches around it.'],
  ['Mossy Log', 'Hold a patch, or switch to the marker, to mark a truffle. Tap a number whose truffles are all marked to dig round it.'],
  ['Fern Dell'], ['Badger Bank'], ['Chestnut Path'], ['Owl Oak'], ['Bramble Way'], ['Old Stump'],
  ['Needle Floor', 'Two numbers side by side share neighbours. What one must hold, the other can’t.'], ['Resin Ridge'], ['Cone Corner'], ['Lichen Rock'], ['Woodpecker'], ['Fox Den'], ['Cold Spring'], ['Dark Pines'],
  ['Fog Bank', 'Rich ground. Take your time: no board ever needs a guess.'], ['Dew Path'], ['Ghost Birch'], ['Moonlit Glade'], ['Hidden Brook'], ['Silver Moss'], ['Deep Hollow'], ['Black Diamond'],
];
const D = DATA as unknown as Record<string, Wood & { score: number }>;
/** Within each chapter, woods come in order of how much reasoning they take. */
const ORDER = ['a', 'b', 'c'].flatMap((c) => Object.keys(D).filter((k) => k[0] === c).sort((a, b) => D[a].score - D[b].score || D[a].w * D[a].h - D[b].w * D[b].h || a.localeCompare(b)));
export const LEVELS: Level[] = ORDER.map((id, i) => ({ ...D[id], id, name: NAMES[i][0], hint: NAMES[i][1], chapter: Math.floor(i / 8) }));
export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
