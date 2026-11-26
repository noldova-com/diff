# Changelog

**Scope:** What each published version of `@noldova/diff` holds, newest first.

Each version's section is written by the pull request that changes the version, from the pull requests merged since the previous version; other pull requests don't edit this file.

## 0.0.2

Diffs of texts with many changes stay fast, and give an edit that turns the original into the modified text rather than always the shortest one.

- A line diff ends its search for the shortest edit after a fixed cost and splits where it reached furthest, so texts over a few repeated lines with half their lines changed diff in well under a second; the changes still turn the original into the modified text.
- A character diff of a text over 2,048 characters diffs its words first, then the characters inside the changed words, so a 5,000,000-character text with many changes diffs in under a second.
- Diffs count lines in typed arrays rather than maps, and walk their regions from a work list rather than by recursion, so a long text can no longer overflow the stack.

## 0.0.1

The first published version of `@noldova/diff`.

- Line and character diffs, and a 3-way merge of line sequences, that diff two 100,000-line texts reading each line only a few times.
