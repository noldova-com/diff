/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { DiffChange } from "@noldova/diff";
import { SequenceDiff } from "@noldova/diff/services/sequence-diff.js";

export class ReadCounter {
  private static readonly index: RegExp = /^\d+$/u;
  public reads: number = 0;

  public diffsOf<T>(work: () => T): T {
    const compute: typeof SequenceDiff.compute = SequenceDiff.compute;
    SequenceDiff.compute = (original: Int32Array, modified: Int32Array): readonly DiffChange[] => compute.call(SequenceDiff, this.counted(original), this.counted(modified));
    try {
      return work();
    }
    finally {
      SequenceDiff.compute = compute;
    }
  }

  private counted(values: Int32Array): Int32Array {
    return new Proxy(values, {
      get: (target: Int32Array, key: string | symbol): unknown => {
        if (Object.isString(key) && ReadCounter.index.test(key))
          this.reads++;
        return Reflect.get(target, key, target);
      }
    });
  }
}
