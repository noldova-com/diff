/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Random {
  private seed: number;

  public constructor(seed: number) {
    this.seed = seed;
  }

  public next(limit: number): number {
    this.seed = (this.seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return this.seed % limit;
  }
}
