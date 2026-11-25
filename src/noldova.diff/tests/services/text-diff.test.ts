/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { type DiffChange, TextDiff } from "@noldova/diff";

import { Random } from "../support/random.js";
import { ReadCounter } from "../support/read-counter.js";

const RANDOM_RANGE: number = 2_147_483_648;

@TestClass
export class TextDiffTests {
  @TestMethod
  public numbersValuesInOrderExtendingTheNumbersTheMapHolds(): void {
    const ids: Map<string, number> = new Map<string, number>();

    Assert.areEqual("0,1,0", TextDiff.encode(["a", "b", "a"], ids).join(","));
    Assert.areEqual("1,2", TextDiff.encode(["b", "c"], ids).join(","));
    Assert.areEqual(3, ids.size);
  }

  @TestMethod
  public findsNoChangeBetweenEqualTexts(): void {
    Assert.areEqual(0, TextDiff.lines(["a", "b"], ["a", "b"]).length);
    Assert.areEqual(0, TextDiff.lines([], []).length);
  }

  @TestMethod
  public givesAnInsertionARemovalAndAReplacementAsOneChangeEach(): void {
    const changes: readonly DiffChange[] = TextDiffTests.check(["a", "b", "c", "d", "e"], ["a", "x", "b", "d", "y"]);

    Assert.areEqual("1-1 1-2, 2-3 3-3, 4-5 4-5", TextDiffTests.spans(changes));
  }

  @TestMethod
  public diffsTextsWithNothingInCommonAndEitherSideEmpty(): void {
    TextDiffTests.check(["a", "b"], ["c", "d", "e"]);
    TextDiffTests.check(["x"], ["a", "b", "c", "d", "e", "f", "g"]);
    TextDiffTests.check(["a", "b", "c", "d", "e", "f", "g"], ["x"]);
    TextDiffTests.check(["x", "y"], ["a", "b", "c", "d", "e", "f", "g", "h"]);
    TextDiffTests.check([], ["a"]);
    TextDiffTests.check(["a"], []);
  }

  @TestMethod
  public givesAShortestDiffForRandomTextsOfSkewedSizes(): void {
    const random: Random = new Random(11);
    for (let round = 0; round < 400; round++) {
      const symbols: number = 2 + random.next(4);
      const original: readonly string[] = Array.from({ length: random.next(round % 5 === 0 ? 40 : 12) }, () => String(random.next(symbols)));
      const modified: readonly string[] = Array.from({ length: random.next(round % 7 === 0 ? 40 : 12) }, () => String(random.next(symbols)));
      TextDiffTests.check(original, modified);
    }
  }

  @TestMethod
  public diffsTwo100000LineTextsWithScatteredChangesReadingEachLineAFewTimesNoMoreOftenThanInTextsHalfAsLong(): void {
    const half: number = TextDiffTests.diffReadsPerLine(50_000);
    const full: number = TextDiffTests.diffReadsPerLine(100_000);

    Assert.isTrue(full < 10, `The diff read each line ${full.toFixed(2)} times.`);
    Assert.isTrue(full < half * 1.25, `The diff read each line ${half.toFixed(2)} times at 50,000 lines and ${full.toFixed(2)} times at 100,000.`);
  }

  @TestMethod
  public diffsLargeTextsWhoseLinesAreNeverUniqueWithoutAnchors(): void {
    const original: readonly string[] = Array.from({ length: 1500 }, (_, i) => i % 2 === 0 ? "a" : "b");
    const modified: readonly string[] = ["b", ...original.slice(0, -1), "c"];

    TextDiffTests.check(original, modified);
  }

  @TestMethod
  public diffsALargeTextWhoseBlockOfUniqueLinesMovedAnchoringOnTheLongestRunInOrder(): void {
    const original: readonly string[] = Array.from({ length: 3000 }, (_, i) => `line ${i}`);
    const modified: readonly string[] = [...original.slice(0, 100), ...original.slice(2500), ...original.slice(100, 2500)];

    const changes: readonly DiffChange[] = TextDiff.lines(original, modified);

    Assert.areEqual(modified.join("\n"), TextDiffTests.applied(original, modified, changes).join("\n"));
    Assert.areEqual("100-100 100-600, 2500-3000 3000-3000", TextDiffTests.spans(changes));
  }

  @TestMethod
  public diffsRepetitiveTextsWithHalfTheirLinesChangedValidlyReadingEachLineNoMoreOftenThanInTextsHalfAsLong(): void {
    const half: number = TextDiffTests.repetitiveReadsPerLine(2_500);
    const full: number = TextDiffTests.repetitiveReadsPerLine(5_000);

    Assert.isTrue(full < 400, `The diff read each line ${full.toFixed(2)} times.`);
    Assert.isTrue(full < half * 1.25, `The diff read each line ${half.toFixed(2)} times at 2,500 lines and ${full.toFixed(2)} times at 5,000.`);
  }

  @TestMethod
  public diffsALongLineWithManyChangedCharactersValidlyReadingEachCharacterNoMoreOftenThanInALineHalfAsLong(): void {
    const half: number = TextDiffTests.characterReadsPerCharacter(25_000);
    const full: number = TextDiffTests.characterReadsPerCharacter(50_000);

    Assert.isTrue(full < 100, `The diff read each character ${full.toFixed(2)} times.`);
    Assert.isTrue(full < half * 1.25, `The diff read each character ${half.toFixed(2)} times at 25,000 and ${full.toFixed(2)} times at 50,000.`);
  }

  @TestMethod
  public keepsDiffsOfRandomTextsValidOnceTheCostCapEndsTheSearch(): void {
    const random: Random = new Random(23);
    for (let round = 0; round < 6; round++) {
      const original: readonly string[] = Array.from({ length: 1500 + random.next(1500) }, () => String(random.next(3)));
      const modified: readonly string[] = Array.from({ length: 1500 + random.next(1500) }, () => String(random.next(3)));
      const changes: readonly DiffChange[] = TextDiff.lines(original, modified);
      Assert.areEqual(modified.join("\n"), TextDiffTests.applied(original, modified, changes).join("\n"));
      changes.slice(1).forEach((change, index) => Assert.isTrue((changes[index]?.originalEnd ?? -1) < change.originalStart));
    }
  }

  @TestMethod
  public diffsALongTextWordByWordThenCharacterByCharacterInsideTheChangedWords(): void {
    const words: readonly string[] = Array.from({ length: 400 }, (_, i) => `word${i}`);
    const original: string = words.join(" ");
    const modified: string = [...words.slice(0, 100), "wurd100", "new", ...words.slice(101)].join(" ");

    const changes: readonly DiffChange[] = TextDiff.characters(original, modified);

    Assert.areEqual(modified, TextDiffTests.applied(original.split(""), modified.split(""), changes).join(""));
    Assert.areEqual("691-692 691-692", TextDiffTests.spans(changes.slice(0, 1)));
    Assert.areEqual(2, changes.length);
    Assert.areEqual(6, changes.reduce((sum, t) => sum + t.originalLength + t.modifiedLength, 0));
  }

  @TestMethod
  public diffsALongTextAgainstAnEmptyOneAsOneChange(): void {
    const text: string = "a b".repeat(1000);

    Assert.areEqual("0-3000 0-0", TextDiffTests.spans(TextDiff.characters(text, "")));
    Assert.areEqual("0-0 0-3000", TextDiffTests.spans(TextDiff.characters("", text)));
  }

  @TestMethod
  public givesCharacterChangesAsUtf16OffsetsThatNeverSplitASurrogatePair(): void {
    const changes: readonly DiffChange[] = TextDiff.characters("a\u{1F600}b c", "a\u{1F601}b d");

    Assert.areEqual("1-3 1-3, 5-6 5-6", TextDiffTests.spans(changes));
  }

  private static applied(original: readonly string[], modified: readonly string[], changes: readonly DiffChange[]): readonly string[] {
    const result: string[] = [];
    let position: number = 0;
    for (const change of changes) {
      result.push(...original.slice(position, change.originalStart), ...modified.slice(change.modifiedStart, change.modifiedEnd));
      position = change.originalEnd;
    }
    result.push(...original.slice(position));
    return result;
  }

  private static longestCommon(a: readonly string[], b: readonly string[]): number {
    const width: number = b.length + 1;
    const table: Int32Array = new Int32Array((a.length + 1) * width);
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        table[i * width + j] = a[i - 1] === b[j - 1]
          ? (table[(i - 1) * width + j - 1] ?? 0) + 1
          : Math.max(table[(i - 1) * width + j] ?? 0, table[i * width + j - 1] ?? 0);
    return table[a.length * width + b.length] ?? 0;
  }

  private static check(original: readonly string[], modified: readonly string[]): readonly DiffChange[] {
    const changes: readonly DiffChange[] = TextDiff.lines(original, modified);
    Assert.areEqual(modified.join("\n"), TextDiffTests.applied(original, modified, changes).join("\n"));
    Assert.areEqual(modified.length, TextDiffTests.applied(original, modified, changes).length);
    const edited: number = changes.reduce((sum, t) => sum + t.originalLength + t.modifiedLength, 0);
    Assert.areEqual(original.length + modified.length - 2 * TextDiffTests.longestCommon(original, modified), edited);
    changes.slice(1).forEach((change, index) => Assert.isTrue((changes[index]?.originalEnd ?? -1) < change.originalStart && (changes[index]?.modifiedEnd ?? -1) < change.modifiedStart));
    return changes;
  }

  private static diffReadsPerLine(count: number): number {
    const random: Random = new Random(5);
    const original: readonly string[] = Array.from({ length: count }, (_, i) => `line ${i}`);
    const modified: readonly string[] = original.filter(() => random.next(100) !== 0).map(t => random.next(100) === 0 ? `${t} changed` : t);
    const counter: ReadCounter = new ReadCounter();
    const changes: readonly DiffChange[] = counter.diffsOf(() => TextDiff.lines(original, modified));
    Assert.areEqual(modified.join("\n"), TextDiffTests.applied(original, modified, changes).join("\n"));
    Assert.isTrue(changes.length > count / 100);
    Assert.isTrue(counter.reads >= original.length + modified.length, `The diff read ${counter.reads} lines of ${original.length + modified.length}.`);
    return counter.reads / (original.length + modified.length);
  }

  private static repetitiveReadsPerLine(count: number): number {
    const random: Random = new Random(7);
    const original: readonly string[] = Array.from({ length: count }, (_, i) => `item${i % 10}`);
    const modified: readonly string[] = original.map(t => TextDiffTests.below(random, 2) === 0 ? `other${TextDiffTests.below(random, 10)}` : t);
    const counter: ReadCounter = new ReadCounter();
    const changes: readonly DiffChange[] = counter.diffsOf(() => TextDiff.lines(original, modified));
    Assert.areEqual(modified.join("\n"), TextDiffTests.applied(original, modified, changes).join("\n"));
    return counter.reads / (original.length + modified.length);
  }

  private static characterReadsPerCharacter(count: number): number {
    const random: Random = new Random(9);
    const letters: string = "abcdefghijklmnopqrstuvwxyz ";
    const original: string = Array.from({ length: count }, () => letters[TextDiffTests.below(random, letters.length)]).join("");
    const modified: string = Array.from(original, t => TextDiffTests.below(random, 100) === 0 ? "#" : t).join("");
    const counter: ReadCounter = new ReadCounter();
    const changes: readonly DiffChange[] = counter.diffsOf(() => TextDiff.characters(original, modified));
    Assert.areEqual(modified, TextDiffTests.applied([...original], [...modified], changes).join(""));
    return counter.reads / (original.length + modified.length);
  }

  private static below(random: Random, limit: number): number {
    return Math.floor(random.next(RANDOM_RANGE) / RANDOM_RANGE * limit);
  }

  private static spans(changes: readonly DiffChange[]): string {
    return changes.map(t => `${t.originalStart}-${t.originalEnd} ${t.modifiedStart}-${t.modifiedEnd}`).join(", ");
  }
}
