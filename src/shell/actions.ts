/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type GameRuntime } from "./context";

// Everything a control can do, in one file. Components call these; they never
// emit an event or set a signal inline.

/**
 * Deal a fresh scorecard and a new first fruit. The same event the game starts
 * on, which is all a restart needs: losing already emptied the bucket.
 */
/** @action */
export function restart({ emit }: GameRuntime) {
  emit("main-start");
}
