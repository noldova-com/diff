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
import { ReferenceWork } from "../support/reference-work.js";
import { RelativeTime } from "../support/relative-time.js";

@TestClass
export class Merge3TimingTests {
  private static readonly MERGE_RATIO: number = 0;
  private static readonly WHY: string = "a timing test, bounded by a ratio to a reference work of the language's built-ins over 1,000,000 lines, a Map of them and a sorted copy, which runs no diff code, timed just before it in the same process, so the runner's speed cancels out; the bound is the slowest ratio in several runs on each test machine, Linux, macOS x64 and Windows, times three, a margin for a CI runner whose other test files share its cores";

  @TestMethod
  public mergesThree1000000LineTextsWithScatteredChangesWithinARatioToTheTimeOfTheReferenceWork(): void {
    const reference: ReferenceWork = new ReferenceWork();
    const base: readonly string[] = LargeTexts.uniqueLines(1_000_000);
    const ours: readonly string[] = LargeTexts.scattered(base, 0.001, 1, "ours");
    const theirs: readonly string[] = LargeTexts.scattered(base, 0.001, 2, "theirs");

    const merge: RelativeTime<readonly MergeRegion[]> = RelativeTime.of(() => reference.run(), () => Merge3.lines(base, ours, theirs));

    Assert.isTrue(merge.value.length > 1);
    Assert.isTrue(merge.ratio < Merge3TimingTests.MERGE_RATIO, `${merge.format("million-line merge")}; ${Merge3TimingTests.WHY}.`);
  }
}
