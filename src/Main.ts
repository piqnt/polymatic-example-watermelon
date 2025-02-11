/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Middleware } from "polymatic";

import { Fruit, Bucket, Scorecard } from "./Data";
import { Gameplay } from "./Gameplay";
import { Terminal } from "./Terminal";
import { Physics } from "./Physics";
import { FrameLoop } from "./FrameLoop";

export class MainContext {
  scorecard: Scorecard | null;

  next: Fruit | null = null;
  fruits: Fruit[] = [];
  bucket = new Bucket(12, 20);
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new Gameplay());
    this.use(new Physics());
    this.use(new Terminal());

    this.on("activate", this.handleActivate);
  }

  handleActivate() {
    setTimeout(() => this.emit("main-start"), 100);
  }
}
