/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DiffSplit {
  public readonly original: number;
  public readonly modified: number;

  public constructor(original: number, modified: number) {
    this.original = original;
    this.modified = modified;
  }
}
