/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Timed<T> {
  public readonly value: T;
  public readonly milliseconds: number;

  private constructor(value: T, milliseconds: number) {
    this.value = value;
    this.milliseconds = milliseconds;
  }

  public static of<T>(work: () => T): Timed<T> {
    const started: number = performance.now();
    const value: T = work();
    return new Timed<T>(value, Math.round(performance.now() - started));
  }
}
