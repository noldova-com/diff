/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RelativeTime<T> {
  private static readonly REFERENCE_RUNS: number = 2;

  public readonly value: T;
  public readonly referenceMilliseconds: number;
  public readonly milliseconds: number;

  private constructor(value: T, referenceMilliseconds: number, milliseconds: number) {
    this.value = value;
    this.referenceMilliseconds = referenceMilliseconds;
    this.milliseconds = milliseconds;
  }

  public get ratio(): number {
    return this.milliseconds / this.referenceMilliseconds;
  }

  public static of<T>(reference: () => unknown, work: () => T): RelativeTime<T> {
    let referenceMilliseconds: number = Number.POSITIVE_INFINITY;
    for (let i = 0; i < RelativeTime.REFERENCE_RUNS; i++) {
      const referenceStarted: number = performance.now();
      reference();
      referenceMilliseconds = Math.min(referenceMilliseconds, performance.now() - referenceStarted);
    }

    const started: number = performance.now();
    const value: T = work();
    const ended: number = performance.now();

    return new RelativeTime<T>(value, referenceMilliseconds, ended - started);
  }

  public format(name: string): string {
    return `The ${name} took ${Math.round(this.milliseconds)} ms, ${this.ratio.toFixed(1)} times the reference work's ${Math.round(this.referenceMilliseconds)} ms`;
  }
}
