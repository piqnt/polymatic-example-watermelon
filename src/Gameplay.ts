/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Middleware } from "polymatic";

import { MainContext } from "./Main";
import { Fruit, Scorecard } from "./Data";

const MAX_LEVEL = 11;

/**
 * Implements gameplay, manges game objects such as fruits and score.
 * Receives user interaction events from Terminal, and collision events from Physics.
 */
export class Gameplay extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("main-start", this.handleStart);

    this.on("drop-next-fruit", this.handleDropFruit);
    this.on("move-next-fruit", this.handleMoveFruit);
    this.on("collide-fruits", this.handleCollideFruits);
    this.on("collide-top", this.handleCollideTop);
  }

  handleStart() {
    this.context.scorecard = new Scorecard();
    this.context.scorecard.gameState = "game-play";
    this.createNextFruit();
    this.emit("game-update");
  }

  handleActivate() {}

  createNextFruit(point = { x: 0, y: 0 }) {
    if (this.context.scorecard?.gameState !== "game-play") return;
    const level = Math.floor(Math.random() * 6) + 1;
    this.context.next = new Fruit(level);
    this.setInitFruitPosition(this.context.next, point);
  }

  handleMoveFruit(point) {
    if (!this.context.next) return;
    this.setInitFruitPosition(this.context.next, point);
  }

  handleDropFruit(point) {
    if (this.context.next) {
      const fruit = this.context.next;
      this.setInitFruitPosition(fruit, point);
      this.context.fruits.push(fruit);
      this.context.next = null;
    }
    this.createNextFruit(point);
    this.emit("game-update");
  }

  handleCollideTop({ fruit }: { fruit: Fruit }) {
    if (this.context.scorecard?.gameState !== "game-play") return;
    if (fruit.collected) return;
    this.context.next = null;
    this.context.scorecard.gameState = "game-over";
    this.context.fruits = [];
  }

  handleCollideFruits({ fruitA, fruitB }: { fruitA: Fruit; fruitB: Fruit }) {
    if (this.context.scorecard?.gameState !== "game-play") return;
    if (fruitA.collected || fruitB.collected) return;

    fruitA.collected = true;
    fruitB.collected = true;
    const level = fruitA.level;

    this.context.fruits = this.context.fruits.filter((fruit) => fruit !== fruitA && fruit !== fruitB);

    this.context.scorecard.score += level;

    if (level >= MAX_LEVEL) return;

    const merged = new Fruit(level + 1);
    merged.position.x = (fruitA.position.x + fruitB.position.x) / 2;
    merged.position.y = (fruitA.position.y + fruitB.position.y) / 2;

    this.context.fruits.push(merged);
    this.emit("game-update");
  }

  setInitFruitPosition(fruit: Fruit, p: { x: number; y: number }) {
    const halfWidth = this.context.bucket.width / 2;
    const halfHeight = this.context.bucket.height / 2;
    const xMax = halfWidth - fruit.radius;
    const xMin = -xMax;
    const x = Math.min(xMax, Math.max(xMin, p.x));
    const y = -(halfHeight - 2);
    fruit.position.x = x;
    fruit.position.y = y;
  }
}
