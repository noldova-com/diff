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

export class TextDiff {
  public static lines(original: readonly string[], modified: readonly string[]): readonly DiffChange[] {
    const ids: Map<string, number> = new Map<string, number>();
    return SequenceDiff.compute(TextDiff.encode(original, ids), TextDiff.encode(modified, ids));
  }

  public static characters(original: string, modified: string): readonly DiffChange[] {
    const originalPoints: readonly string[] = Array.from(original);
    const modifiedPoints: readonly string[] = Array.from(modified);
    const originalOffsets: readonly number[] = TextDiff.offsets(originalPoints);
    const modifiedOffsets: readonly number[] = TextDiff.offsets(modifiedPoints);
    const ids: Map<string, number> = new Map<string, number>();
    return SequenceDiff.compute(TextDiff.encode(originalPoints, ids), TextDiff.encode(modifiedPoints, ids)).map(t => new DiffChange(
      TextDiff.offsetAt(originalOffsets, t.originalStart),
      TextDiff.offsetAt(originalOffsets, t.originalEnd),
      TextDiff.offsetAt(modifiedOffsets, t.modifiedStart),
      TextDiff.offsetAt(modifiedOffsets, t.modifiedEnd)));
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
