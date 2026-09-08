/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Signal, signal } from "@preact/signals";

/**
 * What the hud draws, mirrored out of the scorecard once per frame by
 * runtime/HudManager. The shell reads only these - it never reaches into the
 * scorecard or the fruits.
 */
export class HudData {
  score: Signal<number>;
  gameOver: Signal<boolean>;

  constructor() {
    this.score = signal(0);
    this.gameOver = signal(false);
  }
}
