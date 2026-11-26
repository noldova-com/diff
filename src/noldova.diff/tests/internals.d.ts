/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/diff/services/sequence-diff.js" {
  import type { DiffChange } from "@noldova/diff";

  export class SequenceDiff {
    public static compute(original: Int32Array, modified: Int32Array): readonly DiffChange[];
  }
}

declare module "@noldova/diff/services/string-ids.js" {
  export class StringIds {
    public constructor(ids?: Map<string, number>);
    public encode(values: readonly string[]): Int32Array;
  }
}
