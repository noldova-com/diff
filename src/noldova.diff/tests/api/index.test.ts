/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import * as api from "@noldova/diff";

@TestClass
export class DiffApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames: readonly string[] = ["DiffChange", "Merge3", "MergeRegion", "MergeRegionKind", "TextDiff"];

    Assert.areEqual(exportNames.join(","), Object.keys(api).sort().join(","));
  }
}
