/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DiffChange {
  public readonly originalStart: number;
  public readonly originalEnd: number;
  public readonly modifiedStart: number;
  public readonly modifiedEnd: number;

  public constructor(originalStart: number, originalEnd: number, modifiedStart: number, modifiedEnd: number) {
    this.originalStart = originalStart;
    this.originalEnd = originalEnd;
    this.modifiedStart = modifiedStart;
    this.modifiedEnd = modifiedEnd;
  }

  public get originalLength(): number {
    return this.originalEnd - this.originalStart;
  }

  public get modifiedLength(): number {
    return this.modifiedEnd - this.modifiedStart;
  }
}
