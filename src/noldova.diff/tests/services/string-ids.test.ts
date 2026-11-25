/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { StringIds } from "@noldova/diff/services/string-ids.js";

@TestClass
export class StringIdsTests {
  @TestMethod
  public numbersValuesInOrderExtendingTheNumbersAlreadyGiven(): void {
    const ids: StringIds = new StringIds();

    Assert.areEqual("0,1,0", ids.encode(["a", "b", "a"]).join(","));
    Assert.areEqual("1,2", ids.encode(["b", "c"]).join(","));
  }

  @TestMethod
  public keepsEachValuesNumberAcrossTenThousandValues(): void {
    const ids: StringIds = new StringIds();
    const values: readonly string[] = Array.from({ length: 10_000 }, (_, index) => `line ${index}`);
    const encoded: Int32Array = ids.encode(values);
    const again: Int32Array = ids.encode(values.toReversed().map(t => [...t].join("")));

    Assert.isTrue(encoded.every((id, index) => id === index));
    Assert.isTrue(again.every((id, index) => id === values.length - 1 - index));
    Assert.areEqual(String(values.length), ids.encode(["new"]).join(","));
  }

  @TestMethod
  public numbersTheEmptyStringAndAnEmptyListLikeAnyOther(): void {
    const ids: StringIds = new StringIds();

    Assert.areEqual(0, ids.encode([]).length);
    Assert.areEqual("0,1,0", ids.encode(["", "x", ""]).join(","));
  }
}
