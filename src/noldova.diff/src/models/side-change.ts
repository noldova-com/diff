/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiffChange } from "./diff-change.js";

export class SideChange {
  public readonly change: DiffChange;
  public readonly isOurs: boolean;

  public constructor(change: DiffChange, isOurs: boolean) {
    this.change = change;
    this.isOurs = isOurs;
  }
}
