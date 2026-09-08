/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Middleware } from "polymatic";

import { type MainContext } from "../model";

/**
 * The one place the runtime talks to the shell.
 *
 * Gameplay keeps writing the scorecard as fruits merge; once a frame this
 * copies what the hud shows onto `context.hud`'s signals. Signals only notify
 * on a real change, so a frame that merges nothing re-renders nothing.
 */
export class HudManager extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("frame-render", this.handleFrameRender);
  }

  handleFrameRender = () => {
    const { scorecard, hud } = this.context;
    if (!scorecard) return;

    hud.score.value = scorecard.score;
    hud.gameOver.value = scorecard.gameState === "game-over";
  };
}
