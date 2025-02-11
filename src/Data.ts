/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


export class Scorecard {
  key = "scorecard-" + Math.random();
  type = "scorecard" as const;
  score = 0;
  gameState: "game-play" | "game-over";
}

export class Fruit {
  key = "fruit-" + Math.random();
  type = "fruit" as const;
  position: { x: number; y: number };
  level: number;
  collected = false;
  constructor(level: number, position = { x: 0, y: 0 }) {
    this.level = level;
    this.position = position;
  }
  get radius() {
    return this.level / 6 + 0.2;
  }
}

export class Bucket {
  key = "bucket-" + Math.random();
  type = "bucket" as const;
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}
