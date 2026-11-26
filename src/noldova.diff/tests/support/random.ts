/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Random {
  private static readonly RANGE: number = 2_147_483_648;
  private seed: number;

  public constructor(seed: number) {
    this.seed = seed;
  }

  public next(limit: number): number {
    this.seed = (this.seed * 1_103_515_245 + 12_345) % Random.RANGE;
    return this.seed % limit;
  }

  public below(limit: number): number {
    return Math.floor(this.next(Random.RANGE) / Random.RANGE * limit);
  }
}
