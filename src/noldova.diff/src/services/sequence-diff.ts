/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { DiffChange } from "../models/diff-change.js";
import { DiffSplit } from "../models/diff-split.js";

export class SequenceDiff {
  private static readonly ANCHORED_LENGTH: number = 2048;

  private readonly original: Int32Array;
  private readonly modified: Int32Array;
  private readonly changes: DiffChange[] = [];

  private constructor(original: Int32Array, modified: Int32Array) {
    this.original = original;
    this.modified = modified;
  }

  public static compute(original: Int32Array, modified: Int32Array): readonly DiffChange[] {
    const diff: SequenceDiff = new SequenceDiff(original, modified);
    diff.run(0, original.length, 0, modified.length);
    return SequenceDiff.coalesce(diff.changes);
  }

  private run(originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number): void {
    let aLo: number = originalStart;
    let aHi: number = originalEnd;
    let bLo: number = modifiedStart;
    let bHi: number = modifiedEnd;
    while (aLo < aHi && bLo < bHi && this.original[aLo] === this.modified[bLo]) {
      aLo++;
      bLo++;
    }
    while (aLo < aHi && bLo < bHi && this.original[aHi - 1] === this.modified[bHi - 1]) {
      aHi--;
      bHi--;
    }
    if (aLo === aHi || bLo === bHi) {
      if (aLo !== aHi || bLo !== bHi)
        this.changes.push(new DiffChange(aLo, aHi, bLo, bHi));
      return;
    }
    if (aHi - aLo + bHi - bLo > SequenceDiff.ANCHORED_LENGTH) {
      const anchors: readonly DiffSplit[] = this.anchors(aLo, aHi, bLo, bHi);
      if (anchors.length > 0) {
        let original: number = aLo;
        let modified: number = bLo;
        for (const anchor of anchors) {
          this.run(original, anchor.original, modified, anchor.modified);
          original = anchor.original + 1;
          modified = anchor.modified + 1;
        }
        this.run(original, aHi, modified, bHi);
        return;
      }
    }
    const split: DiffSplit = this.bisect(aLo, aHi, bLo, bHi);
    this.run(aLo, split.original, bLo, split.modified);
    this.run(split.original, aHi, split.modified, bHi);
  }

  private bisect(aLo: number, aHi: number, bLo: number, bHi: number): DiffSplit {
    const n: number = aHi - aLo;
    const m: number = bHi - bLo;
    const maxD: number = Math.ceil((n + m) / 2);
    const offset: number = maxD;
    const size: number = 2 * maxD + 2;
    const forward: Int32Array = new Int32Array(size).fill(-1);
    const backward: Int32Array = new Int32Array(size).fill(-1);
    forward[offset + 1] = 0;
    backward[offset + 1] = 0;
    const delta: number = n - m;
    const checksForward: boolean = delta % 2 !== 0;
    let forwardStart: number = 0;
    let forwardEnd: number = 0;
    let backwardStart: number = 0;
    let backwardEnd: number = 0;
    for (let d = 0; ; d++) {
      for (let k = -d + forwardStart; k <= d - forwardEnd; k += 2) {
        const index: number = offset + k;
        let x: number = k === -d || (k !== d && SequenceDiff.at(forward, index - 1) < SequenceDiff.at(forward, index + 1))
          ? SequenceDiff.at(forward, index + 1)
          : SequenceDiff.at(forward, index - 1) + 1;
        let y: number = x - k;
        while (x < n && y < m && this.original[aLo + x] === this.modified[bLo + y]) {
          x++;
          y++;
        }
        forward[index] = x;
        if (x > n)
          forwardEnd += 2;
        else if (y > m)
          forwardStart += 2;
        else if (checksForward) {
          const other: number = offset + delta - k;
          if (other >= 0 && other < size && SequenceDiff.at(backward, other) !== -1 && x >= n - SequenceDiff.at(backward, other))
            return new DiffSplit(aLo + x, bLo + y);
        }
      }
      for (let k = -d + backwardStart; k <= d - backwardEnd; k += 2) {
        const index: number = offset + k;
        let x: number = k === -d || (k !== d && SequenceDiff.at(backward, index - 1) < SequenceDiff.at(backward, index + 1))
          ? SequenceDiff.at(backward, index + 1)
          : SequenceDiff.at(backward, index - 1) + 1;
        let y: number = x - k;
        while (x < n && y < m && this.original[aHi - x - 1] === this.modified[bHi - y - 1]) {
          x++;
          y++;
        }
        backward[index] = x;
        if (x > n)
          backwardEnd += 2;
        else if (y > m)
          backwardStart += 2;
        else if (!checksForward) {
          const other: number = offset + delta - k;
          if (other >= 0 && other < size && SequenceDiff.at(forward, other) !== -1) {
            const forwardX: number = SequenceDiff.at(forward, other);
            if (forwardX >= n - x)
              return new DiffSplit(aLo + forwardX, bLo + forwardX - (other - offset));
          }
        }
      }
    }
  }

  private anchors(aLo: number, aHi: number, bLo: number, bHi: number): readonly DiffSplit[] {
    const originalCounts: Map<number, number> = SequenceDiff.counts(this.original, aLo, aHi);
    const modifiedCounts: Map<number, number> = SequenceDiff.counts(this.modified, bLo, bHi);
    const modifiedPositions: Map<number, number> = new Map<number, number>();
    for (let index = bLo; index < bHi; index++)
      modifiedPositions.set(SequenceDiff.at(this.modified, index), index);
    const originalAnchors: number[] = [];
    const modifiedAnchors: number[] = [];
    for (let index = aLo; index < aHi; index++) {
      const value: number = SequenceDiff.at(this.original, index);
      if (originalCounts.get(value) === 1 && modifiedCounts.get(value) === 1) {
        originalAnchors.push(index);
        modifiedAnchors.push(Number(modifiedPositions.get(value)));
      }
    }
    const tails: number[] = [];
    const previous: number[] = [];
    modifiedAnchors.forEach((position, index) => {
      let low: number = 0;
      let high: number = tails.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (SequenceDiff.at(modifiedAnchors, SequenceDiff.at(tails, middle)) < position)
          low = middle + 1;
        else
          high = middle;
      }
      previous.push(low > 0 ? SequenceDiff.at(tails, low - 1) : -1);
      tails[low] = index;
    });
    const anchors: DiffSplit[] = [];
    for (let index = tails.length > 0 ? SequenceDiff.at(tails, tails.length - 1) : -1; index >= 0; index = SequenceDiff.at(previous, index))
      anchors.push(new DiffSplit(SequenceDiff.at(originalAnchors, index), SequenceDiff.at(modifiedAnchors, index)));
    return anchors.reverse();
  }

  private static counts(values: Int32Array, start: number, end: number): Map<number, number> {
    const counts: Map<number, number> = new Map<number, number>();
    for (let index = start; index < end; index++) {
      const value: number = SequenceDiff.at(values, index);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return counts;
  }

  private static at(values: ArrayLike<number>, index: number): number {
    return Number(values[index]);
  }

  private static coalesce(changes: readonly DiffChange[]): readonly DiffChange[] {
    const result: DiffChange[] = [];
    for (const change of changes) {
      const last: DiffChange | undefined = result.at(-1);
      if (!Object.isUndefined(last) && last.originalEnd === change.originalStart && last.modifiedEnd === change.modifiedStart)
        result[result.length - 1] = new DiffChange(last.originalStart, change.originalEnd, last.modifiedStart, change.modifiedEnd);
      else
        result.push(change);
    }
    return result;
  }
}
