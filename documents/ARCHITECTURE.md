# Diff architecture

**Scope:** What `@noldova/diff` is, its API and boundaries, how it builds, and the decisions behind its algorithms.

## What it is

`@noldova/diff` is Noldova's diff package: line and character diffs, and a 3-way merge of line sequences.
It is framework-free and holds no DOM, so it runs in Node, a page or a worker; it is shaped as a package of CONTEXT, Noldova's base framework (`@noldova/context.*`), so it can move into CONTEXT later.
It names no app or editor; its first user is Noldova's code editor, whose diff and merge views are built over it.

## API

- `TextDiff.lines(original, modified)` gives the changes between two lists of lines, each a `DiffChange` with the original's and the modified side's line ranges.
- `TextDiff.characters(original, modified)` gives the changes between two strings, by character, in the same form.
- `Merge3.lines(base, ours, theirs)` splits a base and two sides into regions: unchanged, changed in ours, changed in theirs, changed the same way on both, and conflicting; changes from both sides that overlap or touch form one conflict.

## Build

The build is CONTEXT's, `scripts/build.ts` with the scripts beside it, with `scripts/config.ts` naming the one package.
`npm run build` compiles `src/noldova.diff/src` with TypeScript into `_build/node/noldova.diff`, beside a copy of the handwritten declarations `src/api/index.d.ts`, the package's README and the repository's LICENSE, writes its manifest from `src/noldova.diff/package.json` with `__VERSION__` set to the version `version.json` holds and the checkout's commit as `gitHead`, packs it with `npm pack` into `_packages`, and installs the archive at the root with `npm install --no-save`.
The manifest's entry is `api/index.js`, with `api/index.d.ts`, and its peers, `@noldova/context.core` and `@noldova/context.exceptions`, are `>=0.0.12 <0.1.0`; `npm run build --silent -- --list-copies` lists the files the build copies into the package and builds nothing.

## Performance

The tests count the work rather than time it, so a slower or busier machine can't fail them, and a change that makes the work grow with the text does.

- A line diff of two 100,000-line texts with scattered changes reads each line about twice, and no more often per line than in texts half as long: `TextDiffTests.diffsTwo100000LineTextsWithScatteredChangesReadingEachLineAFewTimesNoMoreOftenThanInTextsHalfAsLong`.
- A merge of three such texts reads each line about three times, by the same bound: `Merge3Tests.mergesThree100000LineTextsWithScatteredChangesReadingEachLineAFewTimesNoMoreOftenThanInTextsHalfAsLong`.
- A line diff of two 5,000-line texts over a few repeated lines, with half the lines changed, reads each line under 400 times, and no more often per line than in texts half as long: `TextDiffTests.diffsRepetitiveTextsWithHalfTheirLinesChangedValidlyReadingEachLineNoMoreOftenThanInTextsHalfAsLong`.
- A character diff of two 50,000-character lines with many changed characters reads each character under 100 times, by the same bound: `TextDiffTests.diffsALongLineWithManyChangedCharactersValidlyReadingEachCharacterNoMoreOftenThanInALineHalfAsLong`.
- Each test counts the reads of the arrays the diff takes, allows under 10 reads per line for scattered changes, and fails when the reads per item grow by more than a quarter from the half-length texts to the full ones.
- Diffs whose search the cost cap ends stay valid: applying the changes to the original gives the modified text, by `TextDiffTests.keepsDiffsOfRandomTextsValidOnceTheCostCapEndsTheSearch`.

## Testing

- The tests are `@noldova/context.testing` test classes, compiled by `src/noldova.diff/tests/tsconfig.json` into `_build/node/noldova.diff.tests` and run in Node on Linux, macOS and Windows against the installed package, which they import by its name, as an app does; `npm test` fails unless they run every block of the installed package, `api/index.js` included.
- The scripts' own tests, under `scripts/tests`, run in the same suite, as CONTEXT's do.

## Decisions

- **Myers with patience anchors.** `TextDiff.lines` and `TextDiff.characters` give the shortest edit by Myers' linear-space algorithm.
  A region over 2,048 lines first splits at lines that occur once on each side, in their longest common order, as patience diff does, so a 100,000-line diff stays near-linear, at the cost of a shortest edit for such regions.
- **A cost cap.** A bisect that hasn't met its other half after 256 rounds splits at the point either search reached furthest, so texts with many changes stay near-linear, at the cost of a shortest edit for such regions; the changes still turn the original into the modified text.
  The regions are diffed from a work list rather than by recursion, so a long text can't overflow the stack, and a region a bisect made doesn't look for anchors again.
- **Typed-array counts.** The anchor pass counts lines in `Int32Array`s indexed by line id, cleared by a generation stamp rather than refilled, instead of in maps.
- **Words first.** `TextDiff.characters` diffs texts over 2,048 characters by words, runs of letters, digits and underscores, and the single characters between them, then each changed span by character, so a long line with many changes costs about as much as its changed words.
- **Its own package.** Diff and 3-way merge are general capabilities with no editor types, so they live in their own repository and package, which an app or editor installs from npm, pinned exactly.
