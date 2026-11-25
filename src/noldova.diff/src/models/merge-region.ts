/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { MergeRegionKind } from "../enums/merge-region-kind.js";

export class MergeRegion {
  public readonly kind: MergeRegionKind;
  public readonly baseStart: number;
  public readonly baseEnd: number;
  public readonly oursStart: number;
  public readonly oursEnd: number;
  public readonly theirsStart: number;
  public readonly theirsEnd: number;

  public constructor(kind: MergeRegionKind, baseStart: number, baseEnd: number, oursStart: number, oursEnd: number, theirsStart: number, theirsEnd: number) {
    this.kind = kind;
    this.baseStart = baseStart;
    this.baseEnd = baseEnd;
    this.oursStart = oursStart;
    this.oursEnd = oursEnd;
    this.theirsStart = theirsStart;
    this.theirsEnd = theirsEnd;
  }
}
