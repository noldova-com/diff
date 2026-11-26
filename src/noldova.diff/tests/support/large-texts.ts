/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Random } from "./random.js";

export class LargeTexts {
  private static readonly SCALE: number = 1_000_000;
  private static readonly LETTERS: string = "abcdefghijklmnopqrstuvwxyz ";
  private static readonly CHANGED_CHARACTER: string = "#";

  public static uniqueLines(count: number): readonly string[] {
    return Array.from({ length: count }, (_, i) => `const value${i} = compute(${i}, ${i * 7 % 1000});`);
  }

  public static scattered(lines: readonly string[], rate: number, seed: number, tag: string): readonly string[] {
    const random: Random = new Random(seed);
    const limit: number = rate * LargeTexts.SCALE;
    const result: string[] = [];
    for (const line of lines) {
      const roll: number = random.next(LargeTexts.SCALE);
      if (roll < limit / 3)
        continue;
      if (roll < 2 * limit / 3)
        result.push(`${line} // ${tag}`);
      else if (roll < limit)
        result.push(line, `inserted by ${tag} ${random.next(LargeTexts.SCALE)}`);
      else
        result.push(line);
    }
    return result;
  }

  public static repetitive(count: number): readonly string[] {
    return Array.from({ length: count }, (_, i) => `    item${i % 10}();`);
  }

  public static changedHalf(lines: readonly string[], seed: number): readonly string[] {
    const random: Random = new Random(seed);
    return lines.map(line => random.next(2) === 0 ? `    other${random.next(10)}();` : line);
  }

  public static characters(count: number, seed: number): string {
    const random: Random = new Random(seed);
    return Array.from({ length: count }, () => LargeTexts.LETTERS.charAt(random.next(LargeTexts.LETTERS.length))).join("");
  }

  public static words(count: number, seed: number): readonly string[] {
    const random: Random = new Random(seed);
    return Array.from({ length: count }, () => Array.from({ length: 3 + random.next(6) }, () => LargeTexts.LETTERS.charAt(random.next(26))).join(""));
  }

  public static blocksMoved(words: readonly string[], blockLength: number, moves: number, seed: number): readonly string[] {
    const random: Random = new Random(seed);
    const blocks: (readonly string[])[] = [];
    for (let i = 0; i < words.length; i += blockLength)
      blocks.push(words.slice(i, i + blockLength));
    for (let i = 0; i < moves; i++) {
      const from: number = random.next(blocks.length);
      const to: number = random.next(blocks.length);
      const moved: readonly string[] = blocks[from] ?? [];
      blocks[from] = blocks[to] ?? [];
      blocks[to] = moved;
    }
    return blocks.flat();
  }

  public static changedHundredth(text: string, seed: number): string {
    const random: Random = new Random(seed);
    const characters: string[] = text.split("");
    for (let i = 0; i < Math.floor(text.length / 100); i++)
      characters[random.next(text.length)] = LargeTexts.CHANGED_CHARACTER;
    return characters.join("");
  }
}
