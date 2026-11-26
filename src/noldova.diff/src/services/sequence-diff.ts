/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { DiffChange } from "../models/diff-change.js";
import { DiffRegion } from "../models/diff-region.js";
import { DiffSplit } from "../models/diff-split.js";

export class SequenceDiff {
  private static readonly ANCHORED_LENGTH: number = 2048;
  private static readonly COST_LIMIT: number = 256;

  private readonly original: Int32Array;
  private readonly modified: Int32Array;
  private readonly changes: DiffChange[] = [];
  private readonly originalCounts: Int32Array;
  private readonly modifiedCounts: Int32Array;
  private readonly originalCounted: Int32Array;
  private readonly modifiedCounted: Int32Array;
  private readonly modifiedPositions: Int32Array;
  private generation: number = 0;

  private constructor(original: Int32Array, modified: Int32Array) {
    this.original = original;
    this.modified = modified;
    const size: number = Math.max(SequenceDiff.largest(original), SequenceDiff.largest(modified)) + 1;
    this.originalCounts = new Int32Array(size);
    this.modifiedCounts = new Int32Array(size);
    this.originalCounted = new Int32Array(size);
    this.modifiedCounted = new Int32Array(size);
    this.modifiedPositions = new Int32Array(size);
  }

  public static compute(original: Int32Array, modified: Int32Array): readonly DiffChange[] {
    const diff: SequenceDiff = new SequenceDiff(original, modified);
    const regions: DiffRegion[] = [new DiffRegion(0, original.length, 0, modified.length, true)];
    for (let region: DiffRegion | undefined = regions.pop(); !Object.isUndefined(region); region = regions.pop()) {
      for (const part of diff.split(region).toReversed())
        regions.push(part);
    }
    return SequenceDiff.coalesce(diff.changes);
  }

  private split(region: DiffRegion): readonly DiffRegion[] {
    let aLo: number = region.originalStart;
    let aHi: number = region.originalEnd;
    let bLo: number = region.modifiedStart;
    let bHi: number = region.modifiedEnd;
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
      return [];
    }
    const anchors: readonly DiffSplit[] = region.canAnchor && aHi - aLo + bHi - bLo > SequenceDiff.ANCHORED_LENGTH ? this.anchors(aLo, aHi, bLo, bHi) : [];
    if (anchors.length > 0) {
      const parts: DiffRegion[] = [];
      let original: number = aLo;
      let modified: number = bLo;
      for (const anchor of anchors) {
        parts.push(new DiffRegion(original, anchor.original, modified, anchor.modified, true));
        original = anchor.original + 1;
        modified = anchor.modified + 1;
      }
      parts.push(new DiffRegion(original, aHi, modified, bHi, true));
      return parts;
    }
    const split: DiffSplit = this.bisect(aLo, aHi, bLo, bHi);
    return [new DiffRegion(aLo, split.original, bLo, split.modified, false), new DiffRegion(split.original, aHi, split.modified, bHi, false)];
  }

  private bisect(aLo: number, aHi: number, bLo: number, bHi: number): DiffSplit {
    const n: number = aHi - aLo;
    const m: number = bHi - bLo;
    const limit: number = Math.min(Math.ceil((n + m) / 2), SequenceDiff.COST_LIMIT);
    const offset: number = limit;
    const size: number = 2 * limit + 2;
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
    let furthest: DiffSplit = new DiffSplit(aLo, bLo);
    let reach: number = 0;
    for (let d = 0; d <= limit; d++) {
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
        else {
          const other: number = offset + delta - k;
          if (checksForward && other >= 0 && other < size && SequenceDiff.at(backward, other) !== -1 && x >= n - SequenceDiff.at(backward, other))
            return new DiffSplit(aLo + x, bLo + y);
          if (d === limit && x + y > reach) {
            reach = x + y;
            furthest = new DiffSplit(aLo + x, bLo + y);
          }
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
        else {
          const other: number = offset + delta - k;
          if (!checksForward && other >= 0 && other < size && SequenceDiff.at(forward, other) !== -1 && SequenceDiff.at(forward, other) >= n - x)
            return new DiffSplit(aLo + SequenceDiff.at(forward, other), bLo + SequenceDiff.at(forward, other) - (other - offset));
          if (d === limit && x + y > reach) {
            reach = x + y;
            furthest = new DiffSplit(aHi - x, bHi - y);
          }
        }
      }
    }
    return furthest;
  }

  private anchors(aLo: number, aHi: number, bLo: number, bHi: number): readonly DiffSplit[] {
    this.generation++;
    const values: Int32Array = new Int32Array(aHi - aLo);
    for (let index = aLo; index < aHi; index++) {
      const value: number = SequenceDiff.at(this.original, index);
      values[index - aLo] = value;
      this.count(this.originalCounts, this.originalCounted, value);
    }
    for (let index = bLo; index < bHi; index++) {
      const value: number = SequenceDiff.at(this.modified, index);
      this.count(this.modifiedCounts, this.modifiedCounted, value);
      this.modifiedPositions[value] = index;
    }
    const originalAnchors: number[] = [];
    const modifiedAnchors: number[] = [];
    values.forEach((value, index) => {
      if (SequenceDiff.at(this.originalCounts, value) === 1 && SequenceDiff.at(this.modifiedCounted, value) === this.generation
        && SequenceDiff.at(this.modifiedCounts, value) === 1) {
        originalAnchors.push(aLo + index);
        modifiedAnchors.push(SequenceDiff.at(this.modifiedPositions, value));
      }
    });
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

  private count(counts: Int32Array, counted: Int32Array, value: number): void {
    if (SequenceDiff.at(counted, value) === this.generation)
      counts[value] = SequenceDiff.at(counts, value) + 1;
    else {
      counted[value] = this.generation;
      counts[value] = 1;
    }
  }

  private static largest(values: Int32Array): number {
    let largest: number = -1;
    for (let index = 0; index < values.length; index++)
      largest = Math.max(largest, SequenceDiff.at(values, index));
    return largest;
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
