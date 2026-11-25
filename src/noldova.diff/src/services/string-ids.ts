/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class StringIds {
  private static readonly INITIAL_SLOTS: number = 1024;
  private static readonly FNV_OFFSET: number = 0x811c9dc5;
  private static readonly FNV_PRIME: number = 0x01000193;

  private readonly values: string[] = [];
  private slots: Int32Array = new Int32Array(StringIds.INITIAL_SLOTS);
  private hashes: Int32Array = new Int32Array(StringIds.INITIAL_SLOTS / 2);

  public encode(values: readonly string[]): Int32Array {
    const encoded: Int32Array = new Int32Array(values.length);
    for (let index = 0; index < values.length; index++)
      encoded[index] = this.id(String(values[index]));
    return encoded;
  }

  private id(value: string): number {
    const hash: number = StringIds.hash(value);
    const mask: number = this.slots.length - 1;
    let slot: number = hash & mask;
    for (let stored = Number(this.slots[slot]); stored !== 0; stored = Number(this.slots[slot])) {
      if (this.values[stored - 1] === value)
        return stored - 1;
      slot = (slot + 1) & mask;
    }
    const id: number = this.values.length;
    this.values.push(value);
    this.hashes[id] = hash;
    this.slots[slot] = id + 1;
    if (this.values.length === this.hashes.length)
      this.grow();
    return id;
  }

  private grow(): void {
    const hashes: Int32Array = new Int32Array(this.hashes.length * 2);
    hashes.set(this.hashes);
    this.hashes = hashes;
    this.slots = new Int32Array(this.slots.length * 2);
    const mask: number = this.slots.length - 1;
    for (let id = 0; id < this.values.length; id++) {
      let slot: number = Number(this.hashes[id]) & mask;
      while (this.slots[slot] !== 0)
        slot = (slot + 1) & mask;
      this.slots[slot] = id + 1;
    }
  }

  private static hash(value: string): number {
    let hash: number = StringIds.FNV_OFFSET;
    for (let index = 0; index < value.length; index++)
      hash = Math.imul(hash ^ value.charCodeAt(index), StringIds.FNV_PRIME);
    return hash;
  }
}
