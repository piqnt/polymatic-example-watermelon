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

// fruit size relative to the barrel
const FRUIT_SCALE = 1.1;

export class Fruit {
  key = "fruit-" + Math.random();
  type = "fruit" as const;
  position: { x: number; y: number };
  angle = 0;
  level: number;
  collected = false;
  constructor(level: number, position = { x: 0, y: 0 }) {
    this.level = level;
    this.position = position;
  }
  get radius() {
    return (this.level / 6 + 0.2) * FRUIT_SCALE;
  }
}

/**
 * The barrel the fruits fall into. Its sides bulge out: `width` is the width at
 * the top and the bottom, and the middle is wider by `bulge` on each side.
 */
export class Bucket {
  key = "bucket-" + Math.random();
  type = "bucket" as const;
  width: number;
  height: number;
  bulge: number;
  constructor(width: number, height: number, bulge = 0) {
    this.width = width;
    this.height = height;
    this.bulge = bulge;
  }

  /** half width of the barrel at height y, y is 0 at the center, negative up */
  halfWidthAt(y: number) {
    const t = (2 * y) / this.height;
    return this.width / 2 + this.bulge * (1 - t * t);
  }

  /** the right side of the barrel from top to bottom, as points on the profile curve */
  profile(segments = 12) {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= segments; i++) {
      const y = -this.height / 2 + (this.height * i) / segments;
      points.push({ x: this.halfWidthAt(y), y });
    }
    return points;
  }
}
