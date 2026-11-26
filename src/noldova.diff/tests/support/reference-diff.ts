/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TextDiff } from "@noldova/diff";

import { LargeTexts } from "./large-texts.js";

export class ReferenceDiff {
  private static readonly LINES: number = 250_000;

  private readonly original: readonly string[];
  private readonly modified: readonly string[];

  public constructor() {
    this.original = LargeTexts.uniqueLines(ReferenceDiff.LINES);
    this.modified = LargeTexts.scattered(this.original, 0.001, 1, "ours");
  }

  public run(): void {
    TextDiff.lines(this.original, this.modified);
  }
}
