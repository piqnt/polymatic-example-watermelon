/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Application, Assets, Container, Rectangle, Texture } from "pixi.js";
import { Middleware } from "polymatic";

import { type MainContext } from "../model";
import { type FrameLoopEvent } from "./FrameLoop";

import fruitsImage from "../../media/fruits.png";
import barrelImage from "../../media/barrel.png";
import cellarImage from "../../media/cellar.png";

export interface Textures {
  // fruit slice by level, 1 to 11
  fruits: Record<number, Texture>;
  // the wooden barrel, drawn as the bucket
  barrel: Texture;
  // the cellar behind the board
  cellar: Texture;
}

// media/fruits.png is a 4x3 grid of 512x512 cells, one fruit slice per level,
// each slice a circle of radius 236 at the center of its cell (see fruits-build.mjs)
const FRUIT_CELL = 512;
const FRUIT_RADIUS = 236;
const FRUIT_COLUMNS = 4;
const FRUIT_LEVELS = 11;

/**
 * Creates and owns the Pixi application, and drives Pixi's ticker from the
 * FrameLoop so there is a single loop. The canvas goes into the page's #board,
 * under the Preact hud (#ui-root).
 */
export class PixiManager extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-after", this.handleFrameAfter);
  }

  handleActivate = async () => {
    const board = document.getElementById("board") ?? document.body;

    // Textures
    const barrel = await Assets.load<Texture>(barrelImage);
    const cellar = await Assets.load<Texture>(cellarImage);
    const fruitsAtlas = await Assets.load<Texture>(fruitsImage);
    const fruits: Record<number, Texture> = {};
    for (let level = 1; level <= FRUIT_LEVELS; level++) {
      const index = level - 1;
      // frame is the slice's bounding box, so a sprite sized to the fruit's diameter matches it
      const cx = (index % FRUIT_COLUMNS) * FRUIT_CELL + FRUIT_CELL / 2;
      const cy = Math.floor(index / FRUIT_COLUMNS) * FRUIT_CELL + FRUIT_CELL / 2;
      fruits[level] = new Texture({
        source: fruitsAtlas.source,
        frame: new Rectangle(cx - FRUIT_RADIUS, cy - FRUIT_RADIUS, FRUIT_RADIUS * 2, FRUIT_RADIUS * 2),
      });
    }

    const pixi = new Application();
    await pixi.init({
      resizeTo: board,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      // ticker is updated manually in handleFrameAfter, see FrameLoop
      autoStart: false,
    });
    pixi.canvas.classList.add("terminal");
    board.prepend(pixi.canvas);

    // scene container, scaled and positioned by BoardView to fit the viewbox
    const scene = new Container();
    pixi.stage.addChild(scene);

    this.context.pixi = pixi;
    this.context.scene = scene;
    this.context.textures = { fruits, barrel, cellar };

    this.emit("pixi-ready");
  };

  handleDeactivate = () => {
    this.context.pixi?.destroy({ removeView: true }, { children: true });
    this.context.pixi = undefined;
    this.context.scene = undefined;
  };

  handleFrameAfter = (ev: FrameLoopEvent) => {
    if (!this.context.pixi) return;
    // runs ticker listeners and then renders the stage
    this.context.pixi.ticker.update(ev.now);
  };
}
