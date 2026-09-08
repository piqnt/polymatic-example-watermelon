/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Signal, signal } from "@preact/signals";

import { Bucket, type Fruit, type Scorecard } from "./Data";
import { HudData } from "./Hud";

/**
 * Global context, shared between the runtime and the shell.
 *
 * The plain fields belong to the runtime - the fruits, the bucket, the
 * scorecard - and are written many times a frame. The signals are the bridge:
 * the runtime writes them, the shell subscribes by reading `.value` as it
 * renders. What the hud shows is mirrored onto `hud` once a frame
 * (runtime/HudManager) rather than being signals at the source, so a frame that
 * changes no displayed number re-renders nothing.
 */
export class MainContext {
  scorecard: Scorecard | null = null;

  next: Fruit | null = null;
  fruits: Fruit[] = [];
  bucket = new Bucket(12, 20);

  // --- shell facing state ---

  /** the first round has begun; the shell draws nothing before this */
  ready: Signal<boolean>;

  hud: HudData;

  constructor() {
    this.ready = signal(false);
    this.hud = new HudData();
  }
}
