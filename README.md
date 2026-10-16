# Mossy Truffle

By **MOSSY FLUXEN** · package `com.mossyfluxen.mossytruffle` · Expo owner `MOSSY-FLUXEN`.

A no-guess forest logic puzzle for Android: dig the forest floor, read the soil, stake every truffle, and let the pig gather the haul.

**How it plays.**
- Truffles hide under patches of fallen leaves. A dug patch shows how many truffles lie in the eight patches around it.
- A clearing is dug for you to start. From there, every wood can be finished by reasoning alone, with no guessing ever needed.
- Tap with the spade to dig, or switch to the stake (or hold a patch) to mark a truffle. Tap a number whose truffles are all staked to dig the rest around it at once.
- Dig a truffle by mistake and it's squashed. The wood carries on, but it costs a star.
- A hint pulls up a wrong stake if there is one; otherwise the pig sniffs out the next patch you could be sure of, and digs or stakes it.
- When every safe patch is dug, the pig trots round and gathers every truffle.
- Stars (acorns): three with nothing squashed and no hint, two with one slip, otherwise one.

**Content.**
- 24 woods in three chapters:
  - **Oak Wood:** 6×8 to 7×9, sparse.
  - **Pine Forest:** denser ground where you compare two numbers side by side.
  - **Misty Grove:** up to 8×11, the richest and trickiest.
- Every wood is generated and then verified: a solver using only the count and pair rules must clear it from the starting clearing. The tests replay this for all 24.

**Look and sound.**
- Visuals: an autumn forest floor seen from above, with moss, roots, toadstools and fallen leaves. Each chapter has its own leaf litter (oak, pine needles, misty birch). There's crumbly dug soil, hazel stakes with red ribbons, knobbly black truffles, and a pink pig.
- Sound: a folk tune on mandolin and recorder over a forest bed, with soft digs, a ribbon flick for stakes, a squelch for a squash, rising plucks as the pig collects, and the odd happy oink.

## Structure

| Path | What it is |
| --- | --- |
| `web/src/game/sim.ts` | Counts, flood-dig, the count and pair deductions, the no-guess solver |
| `web/src/game/woods.json` | The 24 generated woods |
| `web/tools/gen.ts` | The wood generator and verifier |
| `web/src/game/art.ts` | Leaves, soil, stakes, truffles, the pig and the forest floor |
| `web/src/game/scene.ts` | The Phaser wood |
| `web/brand/` | Icon, splash and feature graphic |
| `Delivery/V1_MOSSY FLUXEN_Mossy Truffle(game)/` | Play Store pack: icon, company logo and header, feature graphic, screenshots, Docx |
| `src/native/` | Expo WebView shell |

```bash
npm install && npm run web:install
npm run web:test     # 33 tests
npm run build:game && npm run validate:assets && npm run android
```

## Release builds

The Android release is configured for Google Play: target and compile SDK 36, R8 minification and resource shrinking, a non-debuggable release build, no Internet permission, and the game served offline from the app's own assets. Builds run on EAS; `eas.json` has two profiles:

```bash
npm install -g eas-cli && eas login
eas init                     # once: links this folder to your Expo project
npm run eas:apk              # preview profile: a signed APK for testing on devices
npm run eas:aab              # production profile: an AAB for Google Play (versionCode auto-increments)
```
