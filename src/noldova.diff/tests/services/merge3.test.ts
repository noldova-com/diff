/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { Merge3, type MergeRegion, MergeRegionKind } from "@noldova/diff";

import { Random } from "../support/random.js";
import { ReadCounter } from "../support/read-counter.js";

@TestClass
export class Merge3Tests {
  @TestMethod
  public keepsTextsThatNoSideChangedAsOneUnchangedRegionAndGivesNoneForThreeEmptyTexts(): void {
    Assert.areEqual("Unchanged 0-2 0-2 0-2", Merge3Tests.describe(Merge3Tests.check(["a", "b"], ["a", "b"], ["a", "b"])));
    Assert.areEqual("", Merge3Tests.describe(Merge3Tests.check([], [], [])));
  }

  @TestMethod
  public takesAChangeFromOneSideAndTheSameChangeFromBoth(): void {
    Assert.areEqual("Unchanged 0-1 0-1 0-1, Ours 1-2 1-2 1-2, Unchanged 2-4 2-4 2-4, Theirs 4-5 4-5 4-6",
      Merge3Tests.describe(Merge3Tests.check(["a", "b", "c", "d", "e"], ["a", "B", "c", "d", "e"], ["a", "b", "c", "d", "E", "F"])));
    Assert.areEqual("Unchanged 0-1 0-1 0-1, Both 1-2 1-2 1-2, Unchanged 2-3 2-3 2-3", Merge3Tests.describe(Merge3Tests.check(["a", "b", "c"], ["a", "X", "c"], ["a", "X", "c"])));
  }

  @TestMethod
  public marksDifferentChangesToTheSameLinesAConflictAndSoChangesThatTouch(): void {
    Assert.areEqual("Unchanged 0-1 0-1 0-1, Conflict 1-2 1-2 1-2, Unchanged 2-3 2-3 2-3", Merge3Tests.describe(Merge3Tests.check(["a", "b", "c"], ["a", "X", "c"], ["a", "Y", "c"])));
    Assert.areEqual("Unchanged 0-1 0-1 0-1, Conflict 1-3 1-3 1-3, Unchanged 3-4 3-4 3-4", Merge3Tests.describe(Merge3Tests.check(["a", "b", "c", "d"], ["a", "X", "c", "d"], ["a", "b", "Y", "d"])));
    Assert.areEqual("Conflict 0-0 0-1 0-1", Merge3Tests.describe(Merge3Tests.check([], ["x"], ["y"])));
  }

  @TestMethod
  public keepsEveryRegionsSlicesConsistentForRandomEditsOnBothSides(): void {
    const random: Random = new Random(3);
    for (let round = 0; round < 300; round++) {
      const base: readonly string[] = Array.from({ length: random.next(20) }, (_, i) => `l${i}`);
      Merge3Tests.check(base, Merge3Tests.edited(random, base), Merge3Tests.edited(random, base));
    }
  }

  @TestMethod
  public mergesThree100000LineTextsWithScatteredChangesReadingEachLineAFewTimesNoMoreOftenThanInTextsHalfAsLong(): void {
    const half: number = Merge3Tests.mergeReadsPerLine(50_000);
    const full: number = Merge3Tests.mergeReadsPerLine(100_000);

    Assert.isTrue(full < 10, `The merge read each line ${full.toFixed(2)} times.`);
    Assert.isTrue(full < half * 1.25, `The merge read each line ${half.toFixed(2)} times at 50,000 lines and ${full.toFixed(2)} times at 100,000.`);
  }

  private static same(expected: readonly string[], actual: readonly string[]): void {
    Assert.areEqual(JSON.stringify(expected), JSON.stringify(actual));
  }

  private static check(base: readonly string[], ours: readonly string[], theirs: readonly string[]): readonly MergeRegion[] {
    const regions: readonly MergeRegion[] = Merge3.lines(base, ours, theirs);
    Merge3Tests.same(base, regions.flatMap(t => base.slice(t.baseStart, t.baseEnd)));
    Merge3Tests.same(ours, regions.flatMap(t => ours.slice(t.oursStart, t.oursEnd)));
    Merge3Tests.same(theirs, regions.flatMap(t => theirs.slice(t.theirsStart, t.theirsEnd)));
    for (const region of regions) {
      const baseSlice: readonly string[] = base.slice(region.baseStart, region.baseEnd);
      const oursSlice: readonly string[] = ours.slice(region.oursStart, region.oursEnd);
      const theirsSlice: readonly string[] = theirs.slice(region.theirsStart, region.theirsEnd);
      if (region.kind === MergeRegionKind.Unchanged) {
        Merge3Tests.same(baseSlice, oursSlice);
        Merge3Tests.same(baseSlice, theirsSlice);
      }
      else if (region.kind === MergeRegionKind.Ours)
        Merge3Tests.same(baseSlice, theirsSlice);
      else if (region.kind === MergeRegionKind.Theirs)
        Merge3Tests.same(baseSlice, oursSlice);
      else if (region.kind === MergeRegionKind.Both)
        Merge3Tests.same(oursSlice, theirsSlice);
      else
        Assert.areNotEqual(JSON.stringify(oursSlice), JSON.stringify(theirsSlice));
    }
    return regions;
  }

  private static mergeReadsPerLine(count: number): number {
    const random: Random = new Random(9);
    const base: readonly string[] = Array.from({ length: count }, (_, i) => `line ${i}`);
    const ours: readonly string[] = base.filter(() => random.next(200) !== 0).map(t => random.next(200) === 0 ? `${t} ours` : t);
    const theirs: readonly string[] = base.map(t => random.next(200) === 0 ? `${t} theirs` : t).flatMap(t => random.next(200) === 0 ? [t, "added"] : [t]);
    const counter: ReadCounter = new ReadCounter();
    const regions: readonly MergeRegion[] = counter.diffsOf(() => Merge3.lines(base, ours, theirs));
    Assert.areEqual(Merge3Tests.describe(regions), Merge3Tests.describe(Merge3Tests.check(base, ours, theirs)));
    Assert.isTrue(regions.length > count / 100);
    Assert.isTrue(counter.reads >= base.length + ours.length + theirs.length, `The merge read ${counter.reads} lines of ${base.length + ours.length + theirs.length}.`);
    return counter.reads / (base.length + ours.length + theirs.length);
  }

  private static describe(regions: readonly MergeRegion[]): string {
    return regions.map(t => `${t.kind} ${t.baseStart}-${t.baseEnd} ${t.oursStart}-${t.oursEnd} ${t.theirsStart}-${t.theirsEnd}`).join(", ");
  }

  private static edited(random: Random, base: readonly string[]): readonly string[] {
    return base.flatMap(t => {
      const roll: number = random.next(10);
      if (roll === 0)
        return [];
      if (roll === 1)
        return [`${t}*${random.next(2)}`];
      return roll === 2 ? [t, `new${random.next(2)}`] : [t];
    });
  }
}
