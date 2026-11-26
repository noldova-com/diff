/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LargeTexts } from "./large-texts.js";

export class ReferenceWork {
  private static readonly LINES: number = 1_000_000;

  private readonly lines: readonly string[];

  public constructor() {
    this.lines = LargeTexts.uniqueLines(ReferenceWork.LINES);
  }

  public run(): void {
    const indexes: Map<string, number> = new Map<string, number>();
    this.lines.forEach((line, index) => indexes.set(line, index));
    [...this.lines].sort();
  }
}
