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
- Each test counts the reads of the line arrays the diff takes, allows under 10 reads per line, and fails when the reads per line grow by more than a quarter from the half-length texts to the full ones.

## Testing

- The tests are `@noldova/context.testing` test classes, compiled by `src/noldova.diff/tests/tsconfig.json` into `_build/node/noldova.diff.tests` and run in Node on Linux, macOS and Windows against the installed package, which they import by its name, as an app does; `npm test` fails unless they run every block of the installed package, `api/index.js` included.
- The scripts' own tests, under `scripts/tests`, run in the same suite, as CONTEXT's do.

## Decisions

- **Myers with patience anchors.** `TextDiff.lines` and `TextDiff.characters` give the shortest edit by Myers' linear-space algorithm.
  A region over 2,048 lines first splits at lines that occur once on each side, in their longest common order, as patience diff does, so a 100,000-line diff stays near-linear, at the cost of a shortest edit for such regions.
- **Its own package.** Diff and 3-way merge are general capabilities with no editor types, so they live in their own repository and package, which an app or editor installs from npm, pinned exactly.
