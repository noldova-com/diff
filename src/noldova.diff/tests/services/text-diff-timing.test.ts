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
import { Timed } from "../support/timed.js";

@TestClass
export class TextDiffTimingTests {
  private static readonly LINES_MILLISECONDS: number = 15_000;
  private static readonly REPETITIVE_MILLISECONDS: number = 30_000;
  private static readonly CHARACTERS_MILLISECONDS: number = 18_000;
  private static readonly MOVED_BLOCKS_CHANGES: number = 100_000;
  private static readonly WHY: string = "a timing test, bounded at more than twice this test's time on the slowest CI target, since that target's time doubles between runs as other test files share its cores, and below the time the call takes without the guard it checks";

  @TestMethod
  public diffsTwo1000000LineTextsWithScatteredChangesWithinTheTimeOfALargeDiff(): void {
    const original: readonly string[] = LargeTexts.uniqueLines(1_000_000);
    const modified: readonly string[] = LargeTexts.scattered(original, 0.001, 1, "ours");

    const diff: Timed<readonly DiffChange[]> = Timed.of(() => TextDiff.lines(original, modified));

    Assert.isTrue(diff.value.length > 0);
    Assert.isTrue(diff.milliseconds < TextDiffTimingTests.LINES_MILLISECONDS, `The diff took ${diff.milliseconds} ms; ${TextDiffTimingTests.WHY}.`);
  }

  @TestMethod
  public diffsTwo100000LineRepetitiveTextsWithHalfTheirLinesChangedWithinTheTimeTheCostCapKeeps(): void {
    const original: readonly string[] = LargeTexts.repetitive(100_000);
    const modified: readonly string[] = LargeTexts.changedHalf(original, 3);

    const diff: Timed<readonly DiffChange[]> = Timed.of(() => TextDiff.lines(original, modified));

    Assert.isTrue(diff.value.length > 0);
    Assert.isTrue(diff.milliseconds < TextDiffTimingTests.REPETITIVE_MILLISECONDS, `The diff took ${diff.milliseconds} ms; ${TextDiffTimingTests.WHY}.`);
  }

  @TestMethod
  public diffsTwo5000000CharacterTextsWithAHundredthOfTheirCharactersChangedWithinTheTimeTheCostCapKeeps(): void {
    const original: string = LargeTexts.characters(5_000_000, 4);
    const modified: string = LargeTexts.changedHundredth(original, 5);

    const diff: Timed<readonly DiffChange[]> = Timed.of(() => TextDiff.characters(original, modified));

    Assert.isTrue(diff.value.length > 0);
    Assert.isTrue(diff.milliseconds < TextDiffTimingTests.CHARACTERS_MILLISECONDS, `The diff took ${diff.milliseconds} ms; ${TextDiffTimingTests.WHY}.`);
  }

  @TestMethod
  public diffsA200000WordTextWithMovedBlocksInAsFewChangesAsTheWordsFirstPassKeeps(): void {
    const words: readonly string[] = LargeTexts.words(200_000, 6);
    const original: string = words.join(" ");
    const modified: string = LargeTexts.blocksMoved(words, 400, 50, 7).join(" ");

    const changes: readonly DiffChange[] = TextDiff.characters(original, modified);

    Assert.isTrue(changes.length > 0);
    Assert.isTrue(changes.length < TextDiffTimingTests.MOVED_BLOCKS_CHANGES, `The diff gave ${changes.length} changes.`);
  }
}
