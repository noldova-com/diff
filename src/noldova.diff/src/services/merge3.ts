/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { MergeRegionKind } from "../enums/merge-region-kind.js";
import { MergeRegion } from "../models/merge-region.js";
import { SideChange } from "../models/side-change.js";
import { SequenceDiff } from "./sequence-diff.js";
import { TextDiff } from "./text-diff.js";

export class Merge3 {
  public static lines(base: readonly string[], ours: readonly string[], theirs: readonly string[]): readonly MergeRegion[] {
    const ids: Map<string, number> = new Map<string, number>();
    const baseIds: Int32Array = TextDiff.encode(base, ids);
    const oursIds: Int32Array = TextDiff.encode(ours, ids);
    const theirsIds: Int32Array = TextDiff.encode(theirs, ids);
    const changes: readonly SideChange[] = [
      ...SequenceDiff.compute(baseIds, oursIds).map(t => new SideChange(t, true)),
      ...SequenceDiff.compute(baseIds, theirsIds).map(t => new SideChange(t, false))
    ].sort((a, b) => a.change.originalStart - b.change.originalStart);
    const regions: MergeRegion[] = [];
    let basePosition: number = 0;
    let oursDelta: number = 0;
    let theirsDelta: number = 0;
    for (const cluster of Merge3.clusters(changes)) {
      const low: number = cluster.reduce((least, t) => Math.min(least, t.change.originalStart), Infinity);
      const high: number = cluster.reduce((most, t) => Math.max(most, t.change.originalEnd), low);
      if (low > basePosition)
        regions.push(new MergeRegion(MergeRegionKind.Unchanged, basePosition, low, basePosition + oursDelta, low + oursDelta, basePosition + theirsDelta, low + theirsDelta));
      const oursGrowth: number = Merge3.growth(cluster, true);
      const theirsGrowth: number = Merge3.growth(cluster, false);
      const oursStart: number = low + oursDelta;
      const oursEnd: number = high + oursDelta + oursGrowth;
      const theirsStart: number = low + theirsDelta;
      const theirsEnd: number = high + theirsDelta + theirsGrowth;
      regions.push(new MergeRegion(
        Merge3.kind(cluster, oursIds.subarray(oursStart, oursEnd), theirsIds.subarray(theirsStart, theirsEnd)),
        low, high, oursStart, oursEnd, theirsStart, theirsEnd));
      oursDelta += oursGrowth;
      theirsDelta += theirsGrowth;
      basePosition = high;
    }
    if (basePosition < base.length)
      regions.push(new MergeRegion(MergeRegionKind.Unchanged, basePosition, base.length, basePosition + oursDelta, base.length + oursDelta, basePosition + theirsDelta, base.length + theirsDelta));
    return regions;
  }

  private static clusters(changes: readonly SideChange[]): readonly (readonly SideChange[])[] {
    const clusters: SideChange[][] = [];
    let high: number = -1;
    for (const change of changes) {
      const current: SideChange[] | undefined = clusters.at(-1);
      if (!Object.isUndefined(current) && change.change.originalStart <= high) {
        current.push(change);
        high = Math.max(high, change.change.originalEnd);
      }
      else {
        clusters.push([change]);
        high = change.change.originalEnd;
      }
    }
    return clusters;
  }

  private static growth(cluster: readonly SideChange[], isOurs: boolean): number {
    return cluster.filter(t => t.isOurs === isOurs).reduce((sum, t) => sum + t.change.modifiedLength - t.change.originalLength, 0);
  }

  private static kind(cluster: readonly SideChange[], ours: Int32Array, theirs: Int32Array): MergeRegionKind {
    if (cluster.every(t => t.isOurs))
      return MergeRegionKind.Ours;
    if (cluster.every(t => !t.isOurs))
      return MergeRegionKind.Theirs;
    return ours.length === theirs.length && ours.every((t, i) => t === theirs[i]) ? MergeRegionKind.Both : MergeRegionKind.Conflict;
  }
}
