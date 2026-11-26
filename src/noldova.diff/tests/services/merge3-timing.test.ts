/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { Merge3, type MergeRegion } from "@noldova/diff";

import { LargeTexts } from "../support/large-texts.js";
import { Timed } from "../support/timed.js";

@TestClass
export class Merge3TimingTests {
  private static readonly MERGE_MILLISECONDS: number = 46_000;
  private static readonly WHY: string = "a timing test, bounded at about twice this test's time on the slowest CI target, the most the suite's hang limit leaves room for";

  @TestMethod
  public mergesThree1000000LineTextsWithScatteredChangesWithinTheTimeOfALargeMerge(): void {
    const base: readonly string[] = LargeTexts.uniqueLines(1_000_000);
    const ours: readonly string[] = LargeTexts.scattered(base, 0.001, 1, "ours");
    const theirs: readonly string[] = LargeTexts.scattered(base, 0.001, 2, "theirs");

    const merge: Timed<readonly MergeRegion[]> = Timed.of(() => Merge3.lines(base, ours, theirs));

    Assert.isTrue(merge.value.length > 1);
    Assert.isTrue(merge.milliseconds < Merge3TimingTests.MERGE_MILLISECONDS, `The merge took ${merge.milliseconds} ms; ${Merge3TimingTests.WHY}.`);
  }
}
