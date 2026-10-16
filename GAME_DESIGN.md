# Mossy Truffle: design notes

**Pillars.** The classic hidden-hazard number grid, made fair and cosy. Every board can be solved by logic alone, so there are no forced 50/50 guesses. A mistake costs a star rather than ending the game. Clearing a wood pays off with a pig happily gathering the harvest.

**Rules.**
- A patch's number = the truffles among its eight neighbours. Digging a 0 opens its neighbours (flood).
- The wood is done when every safe patch is dug. Stakes are optional notes, though a chord (tap a number whose stakes match it) digs the rest.

**Deduction (`sim.ts`).**
- Count rule: if a number is already met by stakes, its other unknowns are safe; if its unknowns exactly make up what's left, they are all truffles.
- Pair rule: if A's unknowns are a subset of B's, the difference settles B's extra patches when B.need − A.need is 0 or equals the size of the difference.
- `reason()` applies these rules from the start clearing until nothing changes. A wood is accepted only if this clears every safe patch.

**Generation (`tools/gen.ts`).**
- Random truffles at a density for each chapter (0.12 to 0.21), with a start patch whose neighbourhood is empty.
- Keep only woods the solver clears. Score each one by rounds and pair steps, and order the chapters by score.

**Mistakes.** Digging a truffle squashes it. Play continues, the squashed truffle counts as found, and stars drop.

**Hints.** First pull up a wrong stake if there is one. Otherwise take the next deducible step for the player (stake or dig) and highlight it.

**Stars.** Squashed + hints: 0 = three acorns, 1 = two, otherwise one.

**Accessibility.**
- Numbers use distinct colours and a heavy outlined font, readable without colour.
- Hold-to-mark works alongside the tool toggle.
- Reduced motion removes the pig's walk, leaf fades and shakes.
- Every control is 46 px+ and aria-labelled.
- Plays fully offline.
