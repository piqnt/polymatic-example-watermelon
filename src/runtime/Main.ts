/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Middleware } from "polymatic";

import { type MainContext } from "../model";
import { Gameplay } from "./Gameplay";
import { BoardView } from "./BoardView";
import { Physics } from "./Physics";
import { FrameLoop } from "./FrameLoop";
import { HudManager } from "./HudManager";

/**
 * The runtime. It owns the bucket, the fruits and the physics; the score and
 * the game-over card are the shell's (see shell/App), and the two meet at the
 * signals on MainContext.
 */
export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new Gameplay());
    this.use(new Physics());
    this.use(new BoardView());
    this.use(new HudManager());

    this.on("activate", this.handleActivate);
    this.on("main-start", this.handleStart);
  }

  handleActivate = () => {
    setTimeout(() => this.emit("main-start"), 100);
  };

  handleStart = () => {
    this.context.ready.value = true;
  };
}
