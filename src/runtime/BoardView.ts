/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Container, Sprite, type FederatedPointerEvent } from "pixi.js";
import { Binder, Driver, Middleware } from "polymatic";

import { type MainContext, type Fruit, type Bucket } from "../model";
import { type FrameLoopEvent } from "./FrameLoop";

// The board is a 16x23 unit box, x from -8 to 8 and y from -12 to 11, scaled
// to fit the window and centered, with room around the barrel on narrow
// screens. The hud (shell/Shell.module.css) sits on the same box, so `--u`
// there is one unit here.
const VIEWBOX = { x: -8, y: -12, width: 16, height: 23 };

// the barrel and cellar textures are drawn at this many pixels per unit (see media/*-build.mjs),
// the barrel starting this much above the bucket's top edge, and extending below its floor
const PIXELS_PER_UNIT = 64;
const BARREL_BORDER = 0.06;

/**
 * The board: the barrel and the fruit slice sprites, both with a data-driver,
 * plus the pointer input that aims and drops the next
 * fruit. The score and the game-over card are the Preact hud (shell/), fed by
 * runtime/HudManager.
 */
export class BoardView extends Middleware<MainContext> {
  background: Sprite;
  bucketGroup: Container;
  fruitsGroup: Container;

  constructor() {
    super();
    this.on("pixi-ready", this.handlePixiReady);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-render", this.handleFrameRender);
  }

  handlePixiReady = () => {
    const pixi = this.context.pixi;
    const scene = this.context.scene;

    this.background = new Sprite(this.context.textures.cellar);
    this.background.anchor.set(0.5);
    scene.addChild(this.background);

    this.bucketGroup = new Container();
    this.fruitsGroup = new Container();
    scene.addChild(this.bucketGroup);
    scene.addChild(this.fruitsGroup);

    // receive pointer events anywhere on the screen, not just on shapes
    pixi.stage.eventMode = "static";
    pixi.stage.hitArea = pixi.screen;
    pixi.stage.on("pointerdown", this.handlePointerDown);
    pixi.stage.on("pointermove", this.handlePointerMove);
    pixi.stage.on("pointerup", this.handlePointerUp);
    pixi.stage.on("pointerupoutside", this.handlePointerUp);

    pixi.renderer.on("resize", this.handleViewport);
    this.handleViewport();
  };

  handleDeactivate = () => {
    this.context.pixi?.renderer.off("resize", this.handleViewport);
  };

  /**
   * Fit the viewbox inside the screen, centered, and cover the screen with the background.
   */
  handleViewport = () => {
    const pixi = this.context.pixi;
    const scene = this.context.scene;

    const screenWidth = pixi.screen.width;
    const screenHeight = pixi.screen.height;

    const scale = Math.min(screenWidth / VIEWBOX.width, screenHeight / VIEWBOX.height);
    scene.scale.set(scale);
    // the center of the viewbox goes to the center of the screen
    scene.position.set(
      screenWidth / 2 - (VIEWBOX.x + VIEWBOX.width / 2) * scale,
      screenHeight / 2 - (VIEWBOX.y + VIEWBOX.height / 2) * scale,
    );

    // the background covers the visible area, centered on the viewbox
    const texture = this.background.texture;
    const cover = Math.max(screenWidth / texture.width, screenHeight / texture.height);
    this.background.scale.set(cover / scale);
    this.background.position.set(VIEWBOX.x + VIEWBOX.width / 2, VIEWBOX.y + VIEWBOX.height / 2);
  };

  toBoardPoint = (e: FederatedPointerEvent) => {
    const point = this.context.scene.toLocal(e.global);
    return { x: point.x, y: point.y };
  };

  pointerDown = false;

  handlePointerDown = (e: FederatedPointerEvent) => {
    this.pointerDown = true;
    this.emit("move-next-fruit", this.toBoardPoint(e));
  };

  handlePointerMove = (e: FederatedPointerEvent) => {
    if (!this.context.next) return;
    if (!this.pointerDown) return;
    this.emit("move-next-fruit", this.toBoardPoint(e));
  };

  handlePointerUp = (e: FederatedPointerEvent) => {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    this.emit("drop-next-fruit", this.toBoardPoint(e));
  };

  handleFrameRender = (ev: FrameLoopEvent) => {
    if (!this.fruitsGroup) return;
    this.binder.data([...this.context.fruits, this.context.next, this.context.bucket]);
  };

  fruitsDriver = Driver.create<Fruit, Sprite>({
    filter: (data) => data.type == "fruit",
    enter: (data) => {
      const sprite = new Sprite(this.context.textures.fruits[data.level]);
      sprite.anchor.set(0.5);
      // the slice fills the physics circle
      sprite.width = data.radius * 2;
      sprite.height = data.radius * 2;
      this.fruitsGroup.addChild(sprite);
      return sprite;
    },
    update: (data, sprite) => {
      sprite.position.set(data.position.x, data.position.y);
      sprite.rotation = data.angle;
    },
    exit: (data, sprite) => {
      sprite.removeFromParent();
      sprite.destroy();
    },
  });

  bucketDriver = Driver.create<Bucket, Sprite>({
    filter: (data) => data.type == "bucket",
    enter: (data) => {
      const sprite = new Sprite(this.context.textures.barrel);
      // the texture is drawn from the same profile at a fixed scale, hung from the top edge
      sprite.anchor.set(0.5, 0);
      sprite.scale.set(1 / PIXELS_PER_UNIT);
      sprite.position.set(0, -data.height / 2 - BARREL_BORDER);
      this.bucketGroup.addChild(sprite);
      return sprite;
    },
    update: (data, sprite) => {},
    exit: (data, sprite) => {
      sprite.removeFromParent();
      sprite.destroy();
    },
  });

  binder = Binder.create<Fruit | Bucket>({
    key: (data) => data.key,
    drivers: [this.fruitsDriver, this.bucketDriver],
  });
}
