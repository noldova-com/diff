/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { DiffChange } from "../models/diff-change.js";
import { SequenceDiff } from "./sequence-diff.js";
import { StringIds } from "./string-ids.js";

export class TextDiff {
  private static readonly WORD_DIFF_LENGTH: number = 2048;
  private static readonly WORD: RegExp = /[\p{L}\p{N}_]+|[\s\S]/gu;

  public static lines(original: readonly string[], modified: readonly string[]): readonly DiffChange[] {
    const ids: StringIds = new StringIds();
    return SequenceDiff.compute(ids.encode(original), ids.encode(modified));
  }

  public static characters(original: string, modified: string): readonly DiffChange[] {
    if (original.length + modified.length <= TextDiff.WORD_DIFF_LENGTH)
      return TextDiff.points(original, modified, 0, 0);
    const originalWords: readonly string[] = original.match(TextDiff.WORD) ?? [];
    const modifiedWords: readonly string[] = modified.match(TextDiff.WORD) ?? [];
    const originalOffsets: readonly number[] = TextDiff.offsets(originalWords);
    const modifiedOffsets: readonly number[] = TextDiff.offsets(modifiedWords);
    const ids: StringIds = new StringIds();
    return SequenceDiff.compute(ids.encode(originalWords), ids.encode(modifiedWords)).flatMap(t => {
      const originalStart: number = TextDiff.offsetAt(originalOffsets, t.originalStart);
      const modifiedStart: number = TextDiff.offsetAt(modifiedOffsets, t.modifiedStart);
      return TextDiff.points(original.slice(originalStart, TextDiff.offsetAt(originalOffsets, t.originalEnd)),
        modified.slice(modifiedStart, TextDiff.offsetAt(modifiedOffsets, t.modifiedEnd)), originalStart, modifiedStart);
    });
  }

  public static encode(values: readonly string[], ids: Map<string, number>): Int32Array {
    const encoded: Int32Array = new Int32Array(values.length);
    values.forEach((value, index) => {
      let id: number | undefined = ids.get(value);
      if (Object.isUndefined(id)) {
        id = ids.size;
        ids.set(value, id);
      }
      encoded[index] = id;
    });
    return encoded;
  }

  private static points(original: string, modified: string, originalBase: number, modifiedBase: number): readonly DiffChange[] {
    const originalPoints: readonly string[] = Array.from(original);
    const modifiedPoints: readonly string[] = Array.from(modified);
    const originalOffsets: readonly number[] = TextDiff.offsets(originalPoints);
    const modifiedOffsets: readonly number[] = TextDiff.offsets(modifiedPoints);
    const ids: StringIds = new StringIds();
    return SequenceDiff.compute(ids.encode(originalPoints), ids.encode(modifiedPoints)).map(t => new DiffChange(
      originalBase + TextDiff.offsetAt(originalOffsets, t.originalStart),
      originalBase + TextDiff.offsetAt(originalOffsets, t.originalEnd),
      modifiedBase + TextDiff.offsetAt(modifiedOffsets, t.modifiedStart),
      modifiedBase + TextDiff.offsetAt(modifiedOffsets, t.modifiedEnd)));
  }

  private static offsets(points: readonly string[]): readonly number[] {
    const offsets: number[] = [0];
    let offset: number = 0;
    for (const point of points) {
      offset += point.length;
      offsets.push(offset);
    }
    return offsets;
  }

  private static offsetAt(offsets: readonly number[], index: number): number {
    return Number(offsets[index]);
  }
}
