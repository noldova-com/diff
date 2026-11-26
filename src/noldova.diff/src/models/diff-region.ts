/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DiffRegion {
  public readonly originalStart: number;
  public readonly originalEnd: number;
  public readonly modifiedStart: number;
  public readonly modifiedEnd: number;
  public readonly canAnchor: boolean;

  public constructor(originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number, canAnchor: boolean) {
    this.originalStart = originalStart;
    this.originalEnd = originalEnd;
    this.modifiedStart = modifiedStart;
    this.modifiedEnd = modifiedEnd;
    this.canAnchor = canAnchor;
  }
}
