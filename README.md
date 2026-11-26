# Diff

[![Build and test](https://github.com/noldova-com/diff/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/noldova-com/diff/actions/workflows/build-and-test.yml)
[![npm](https://badgen.net/npm/v/@noldova/diff)](https://www.npmjs.com/package/@noldova/diff)
[![License: MIT](https://badgen.net/static/license/MIT/blue)](LICENSE)

`@noldova/diff` is Noldova's diff package: line and character diffs, and a 3-way merge of line sequences, framework-free, in TypeScript.
It diffs two 100,000-line texts, and merges three, reading each line only a few times.
Noldova's [code editor](https://github.com/noldova-com/code-editor) uses it for its diff and merge views, and it runs as well in Node, a page or a worker.

The package is below 1.0 for now, and its API may change from one version to the next.
To report a bug or ask for a change, open an issue in this repository, as the organization's [contributing guide](https://github.com/noldova-com/.github/blob/main/CONTRIBUTING.md) says.
Report a security problem privately, as its [security policy](https://github.com/noldova-com/.github/blob/main/SECURITY.md) says.

## Getting started

Install it pinned exactly:

```bash
npm install --save-exact @noldova/diff
```

Its peers are `@noldova/context.core` and `@noldova/context.exceptions` 0.0.9 or later, below 0.1.0.

`TextDiff.lines` gives the changes between two lists of lines, and `Merge3.lines` splits a base and two sides into regions:

```ts
import { Merge3, TextDiff } from "@noldova/diff";

const changes = TextDiff.lines(["a", "b", "c"], ["a", "c", "d"]);
const regions = Merge3.lines(base, ours, theirs);
```

[documents/ARCHITECTURE.md](documents/ARCHITECTURE.md) describes the algorithms and the decisions behind them.

## Building from source

The repository needs Node.js 26.13.1 and npm 11.20.0, as `package.json` says under `engines`.

```bash
npm ci
npm run build
npm test
```

`npm run build` builds the package at the version `version.json` holds into `_build/node/noldova.diff`, packs it with `npm pack` into `_packages`, and installs the archive with `npm install --no-save`, so the tests use the package as an app does and it never enters the manifest or the lockfile; it runs `npm ci --ignore-scripts` first when `node_modules` is missing.
The build writes the checkout's head commit into the package's `package.json` as `gitHead`, and fails before building when git can't read it.
`npm run build --silent -- --list-copies` builds nothing and prints each file the build copies into the package, one per line, with tabs between its source, the package's name and its path inside the package, and then `end of copies`.
`npm test` compiles the package's tests and the scripts' tests, runs them, which are `@noldova/context.testing` test classes, against the installed package with a 100% coverage gate, and then prints its ten slowest tests with their times, which fail nothing; `npm test -- <filter>` runs only the tests whose package, file, class or method name holds the filter, without the coverage gate.
`npm run test:timing`, after `npm test`, is the timing check: it runs the built suite three times without coverage, takes each test file's median time, and fails a file over 2 seconds, or a listed file over the time the list gives it, each with a margin of 50%; the files slower than that are listed under [Checks](#checks).
The entry points live in `scripts/`, the same scripts as CONTEXT's.
Two options shorten `npm test`'s output, as the CI run uses them:

```bash
npm test -- --skip-test-details --skip-coverage-details
```

- `--skip-test-details` hides the line of each passing test; failures, skipped tests and the totals still print.
- `--skip-coverage-details` hides the coverage rows of fully covered files; files with gaps and the overall row still print.

The suite has one hang limit, 60 seconds, which `scripts/suite-script.ts` sets for every run of it; no test carries a limit of its own.

## Checks

Every pull request runs "Check / Linked issue", which needs the pull request to name the issue it resolves, and "Build and test", which builds and tests on Linux, Windows and macOS, each on x64 and arm64, as CONTEXT's does.
Build and test also checks that a second build packs the same archive, and that the archive passes the release's checks.

Test files slower than the timing check's budget:

| File | Time | Why |
|---|---|---|
| `noldova.diff/services/text-diff-timing.test.js` | 4600 ms | Its timing tests diff a million lines, 5 million characters and 100,000 repetitive lines to bound the diff's time and its cost cap, and a 200,000-word text with moved blocks to count the words-first pass's changes. |
| `noldova.diff/services/merge3-timing.test.js` | 3100 ms | Its timing test merges three million-line texts to bound the merge's time. |

## Releases

The package is published to npm by the "Release npm packages" workflow, `.github/workflows/release-npm.yml`, through npm's trusted publishing, so no token is stored, and a release never deletes a published version.
[CHANGELOG.md](CHANGELOG.md) says what each version changed.

## License

`@noldova/diff` is licensed under the [MIT License](LICENSE).

Node.js, npm, TypeScript and the other product names used here are names of their owners.

## Trademarks

The code is under the MIT License, while the name "Noldova" and its logo are not: the MIT License grants no right to them.
A build from this code that is published by anyone but Noldova uses another name and its own logo.
