/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Runtime } from "polymatic";

import { MainContext } from "./model";
import { Main } from "./runtime/Main";
import { runtime } from "./async-signals";

const main = new Main();
const context = new MainContext();
Runtime.activate(main, context);

runtime.value = { context, emit: main.emit.bind(main) };

// for debugging
if (typeof window !== "undefined") {
  window["runtime"] = runtime.value;
}

// deactivate runtime on hot module reloading
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    Runtime.deactivate(main);
    runtime.value = null;
  });
}
