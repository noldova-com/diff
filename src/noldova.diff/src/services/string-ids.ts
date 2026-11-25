/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class StringIds {
  private readonly ids: Map<string, number> = new Map<string, number>();

  public encode(values: readonly string[]): Int32Array {
    const encoded: Int32Array = new Int32Array(values.length);
    for (let index = 0; index < values.length; index++) {
      const value: string = String(values[index]);
      let id: number | undefined = this.ids.get(value);
      if (Object.isUndefined(id)) {
        id = this.ids.size;
        this.ids.set(value, id);
      }
      encoded[index] = id;
    }
    return encoded;
  }
}
