/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { type DiffChange, TextDiff } from "@noldova/diff";

import { LargeTexts } from "../support/large-texts.js";
import { ReferenceWork } from "../support/reference-work.js";
import { RelativeTime } from "../support/relative-time.js";

@TestClass
export class TextDiffTimingTests {
  private static readonly LINES_RATIO: number = 0;
  private static readonly REPETITIVE_RATIO: number = 0;
  private static readonly CHARACTERS_RATIO: number = 0;
  private static readonly MOVED_BLOCKS_CHANGES: number = 100_000;
  private static readonly WHY: string = "a timing test, bounded by a ratio to a reference work of the language's built-ins over 1,000,000 lines, a Map of them and a sorted copy, which runs no diff code, timed just before it in the same process, so the runner's speed cancels out; the bound is the slowest ratio in several runs on each test machine, Linux, macOS x64 and Windows, times three, a margin for a CI runner whose other test files share its cores";
  private static readonly CAP_WHY: string = "and below the ratio with the cost cap off";

  @TestMethod
  public diffsTwo1000000LineTextsWithScatteredChangesWithinARatioToTheTimeOfTheReferenceWork(): void {
    const reference: ReferenceWork = new ReferenceWork();
    const original: readonly string[] = LargeTexts.uniqueLines(1_000_000);
    const modified: readonly string[] = LargeTexts.scattered(original, 0.001, 1, "ours");

    const diff: RelativeTime<readonly DiffChange[]> = RelativeTime.of(() => reference.run(), () => TextDiff.lines(original, modified));

    Assert.isTrue(diff.value.length > 0);
    Assert.isTrue(diff.ratio < TextDiffTimingTests.LINES_RATIO, `${diff.format("million-line diff")}; ${TextDiffTimingTests.WHY}.`);
  }

  @TestMethod
  public diffsTwo100000LineRepetitiveTextsWithHalfTheirLinesChangedWithinTheRatioTheCostCapKeeps(): void {
    const reference: ReferenceWork = new ReferenceWork();
    const original: readonly string[] = LargeTexts.repetitive(100_000);
    const modified: readonly string[] = LargeTexts.changedHalf(original, 3);

    const diff: RelativeTime<readonly DiffChange[]> = RelativeTime.of(() => reference.run(), () => TextDiff.lines(original, modified));

    Assert.isTrue(diff.value.length > 0);
    Assert.isTrue(diff.ratio < TextDiffTimingTests.REPETITIVE_RATIO, `${diff.format("repetitive diff")}; ${TextDiffTimingTests.WHY}, ${TextDiffTimingTests.CAP_WHY}.`);
  }

  @TestMethod
  public diffsTwo5000000CharacterTextsWithAHundredthOfTheirCharactersChangedWithinTheRatioTheCostCapKeeps(): void {
    const reference: ReferenceWork = new ReferenceWork();
    const original: string = LargeTexts.characters(5_000_000, 4);
    const modified: string = LargeTexts.changedHundredth(original, 5);

    const diff: RelativeTime<readonly DiffChange[]> = RelativeTime.of(() => reference.run(), () => TextDiff.characters(original, modified));

    Assert.isTrue(diff.value.length > 0);
    Assert.isTrue(diff.ratio < TextDiffTimingTests.CHARACTERS_RATIO, `${diff.format("character diff")}; ${TextDiffTimingTests.WHY}, ${TextDiffTimingTests.CAP_WHY}.`);
  }

  @TestMethod
  public diffsA100000WordTextWithMovedBlocksInAsFewChangesAsTheWordsFirstPassKeeps(): void {
    const words: readonly string[] = LargeTexts.words(100_000, 6);
    const original: string = words.join(" ");
    const modified: string = LargeTexts.blocksMoved(words, 400, 50, 7).join(" ");

    const changes: readonly DiffChange[] = TextDiff.characters(original, modified);

    Assert.isTrue(changes.length > 0);
    Assert.isTrue(changes.length < TextDiffTimingTests.MOVED_BLOCKS_CHANGES, `The diff gave ${changes.length} changes.`);
  }
}
