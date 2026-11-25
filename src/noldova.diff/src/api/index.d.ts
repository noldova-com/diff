/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * What a region of a 3-way merge holds, compared with the base.
 */
export declare enum MergeRegionKind {
  /**
   * Neither side changed these lines.
   */
  Unchanged = "Unchanged",
  /**
   * Only ours changed these lines.
   */
  Ours = "Ours",
  /**
   * Only theirs changed these lines.
   */
  Theirs = "Theirs",
  /**
   * Both sides made the same change.
   */
  Both = "Both",
  /**
   * The sides changed these lines differently, or their changes touch.
   */
  Conflict = "Conflict"
}

/**
 * One change of a diff: the span `originalStart` to `originalEnd` of the original becomes the span
 * `modifiedStart` to `modifiedEnd` of the modified sequence; either span may be empty.
 *
 * @example
 * ```ts
 * import { TextDiff } from "@noldova/diff";
 *
 * const [change] = TextDiff.lines(["a", "b"], ["a", "x"]);
 * change.originalStart; // 1
 * change.modifiedLength; // 1
 * ```
 */
export declare class DiffChange {
  /**
   * Where the change starts in the original sequence.
   */
  public readonly originalStart: number;

  /**
   * Where the change ends in the original sequence, exclusive.
   */
  public readonly originalEnd: number;

  /**
   * Where the change starts in the modified sequence.
   */
  public readonly modifiedStart: number;

  /**
   * Where the change ends in the modified sequence, exclusive.
   */
  public readonly modifiedEnd: number;

  /**
   * Initializes the change from its two spans. The spans are taken as given, unchecked.
   *
   * @param originalStart Where the change starts in the original sequence, from 0.
   * @param originalEnd Where the change ends in the original sequence, exclusive; equal to `originalStart` when the change only adds.
   * @param modifiedStart Where the change starts in the modified sequence, from 0.
   * @param modifiedEnd Where the change ends in the modified sequence, exclusive; equal to `modifiedStart` when the change only removes.
   * @example
   * ```ts
   * import { DiffChange } from "@noldova/diff";
   *
   * new DiffChange(1, 2, 1, 1).originalLength; // 1
   * ```
   */
  public constructor(originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number);

  /**
   * How many items of the original the change removes.
   */
  public get originalLength(): number;

  /**
   * How many items of the modified sequence the change adds.
   */
  public get modifiedLength(): number;
}

/**
 * One region of a 3-way merge, with its span in the base, ours and theirs; the regions together cover each sequence once, in order.
 */
export declare class MergeRegion {
  /**
   * What the region holds.
   */
  public readonly kind: MergeRegionKind;

  /**
   * Where the region starts in the base.
   */
  public readonly baseStart: number;

  /**
   * Where the region ends in the base, exclusive.
   */
  public readonly baseEnd: number;

  /**
   * Where the region starts in ours.
   */
  public readonly oursStart: number;

  /**
   * Where the region ends in ours, exclusive.
   */
  public readonly oursEnd: number;

  /**
   * Where the region starts in theirs.
   */
  public readonly theirsStart: number;

  /**
   * Where the region ends in theirs, exclusive.
   */
  public readonly theirsEnd: number;

  /**
   * Initializes the region from its kind and its three spans. The spans are taken as given, unchecked.
   *
   * @param kind What the region holds.
   * @param baseStart Where the region starts in the base, from 0.
   * @param baseEnd Where the region ends in the base, exclusive; equal to `baseStart` when the region holds no base lines.
   * @param oursStart Where the region starts in ours, from 0.
   * @param oursEnd Where the region ends in ours, exclusive; equal to `oursStart` when the region holds none of our lines.
   * @param theirsStart Where the region starts in theirs, from 0.
   * @param theirsEnd Where the region ends in theirs, exclusive; equal to `theirsStart` when the region holds none of their lines.
   * @example
   * ```ts
   * import { MergeRegion, MergeRegionKind } from "@noldova/diff";
   *
   * new MergeRegion(MergeRegionKind.Ours, 0, 1, 0, 2, 0, 1).kind; // "Ours"
   * ```
   */
  public constructor(kind: MergeRegionKind, baseStart: number, baseEnd: number, oursStart: number, oursEnd: number, theirsStart: number, theirsEnd: number);
}

/**
 * A 3-way merge of line sequences.
 */
export declare class Merge3 {
  /**
   * Splits base, ours and theirs into unchanged, one-sided, same and conflicting regions.
   *
   * @param base The lines both sides started from.
   * @param ours One side's lines.
   * @param theirs The other side's lines.
   * @returns The regions, in order; none for three empty sequences.
   * @example
   * ```ts
   * import { Merge3, MergeRegionKind } from "@noldova/diff";
   *
   * const regions = Merge3.lines(["a", "b"], ["a", "X"], ["a", "Y"]);
   * regions[1]?.kind === MergeRegionKind.Conflict; // true
   * ```
   */
  public static lines(base: readonly string[], ours: readonly string[], theirs: readonly string[]): readonly MergeRegion[];
}

/**
 * Shortest diffs of lines and of characters.
 */
export declare class TextDiff {
  /**
   * Gives the shortest edit from one line sequence to another.
   *
   * @param original The lines before.
   * @param modified The lines after.
   * @returns The changes, in order and apart; none for equal sequences.
   * @example
   * ```ts
   * import { TextDiff } from "@noldova/diff";
   *
   * TextDiff.lines(["a", "b"], ["a", "b"]).length; // 0
   * ```
   */
  public static lines(original: readonly string[], modified: readonly string[]): readonly DiffChange[];

  /**
   * Gives the shortest edit from one string to another, by code point, as UTF-16 offsets that never split a surrogate pair.
   *
   * @param original The text before.
   * @param modified The text after.
   * @returns The changes, in order and apart.
   * @example
   * ```ts
   * import { TextDiff } from "@noldova/diff";
   *
   * TextDiff.characters("cat", "cut")[0]?.originalStart; // 1
   * ```
   */
  public static characters(original: string, modified: string): readonly DiffChange[];

  /**
   * Gives each value the number `ids` holds for it, adding the next number for a value it doesn't hold yet.
   *
   * @param values The values to number.
   * @param ids The numbers given so far, which the call extends.
   * @returns Each value's number, in order.
   * @example
   * ```ts
   * import { TextDiff } from "@noldova/diff";
   *
   * const ids = new Map<string, number>();
   * TextDiff.encode(["a", "b", "a"], ids); // Int32Array [0, 1, 0]
   * TextDiff.encode(["b", "c"], ids); // Int32Array [1, 2], extending the same numbers
   * ```
   */
  public static encode(values: readonly string[], ids: Map<string, number>): Int32Array;
}
