/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dataset, Driver, Middleware } from "polymatic";

import { MainContext } from "./Main";
import { Fruit, Bucket, Scorecard } from "./Data";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Implements user-interface of the game.
 * Uses data-driver to render fruits and score with SVG, and collects user pointer inputs and sends events to other middlewares.
 */
export class Terminal extends Middleware<MainContext> {
  svg: SVGSVGElement | null;

  scorecardGroup: SVGGElement;
  fruitsGroup: SVGGElement;
  bucketGroup: SVGGElement;

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-loop", this.handleFrameLoop);
    this.on("main-start", this.handleStart);

    this.dataset.addDriver(this.fruitsDriver);
    this.dataset.addDriver(this.bucketDriver);
    this.dataset.addDriver(this.scorecardDriver);

    this.scorecardGroup = document.createElementNS(SVG_NS, "g");
    this.fruitsGroup = document.createElementNS(SVG_NS, "g");
    this.bucketGroup = document.createElementNS(SVG_NS, "g");
  }

  handleActivate() {
    const svg = document.getElementById("polymatic-watermelon");
    if (svg && svg instanceof SVGSVGElement) {
      this.svg = svg;
      this.svg.addEventListener("pointerdown", this.handlePointerDown);
      this.svg.addEventListener("pointermove", this.handlePointerMove);
      this.svg.addEventListener("pointerup", this.handlePointerUp);

      this.svg.appendChild(this.bucketGroup);
      this.svg.appendChild(this.fruitsGroup);
      this.svg.appendChild(this.scorecardGroup);
    } else {
      this.svg = null;
      console.error("Container SVG element not found");
    }
  }

  handleDeactivate() {
    if (this.svg) {
      this.svg.removeEventListener("pointerdown", this.handlePointerDown);
      this.svg.removeEventListener("pointermove", this.handlePointerMove);
      this.svg.removeEventListener("pointerup", this.handlePointerUp);
      this.svg = null;
    }
  }

  handleStart() {}

  getSvgPoint = (event: PointerEvent) => {
    if (!this.svg) return;
    const domPoint = new DOMPoint(event.clientX, event.clientY);
    const transform = this.svg.getScreenCTM();
    if (!transform) return;
    const svgPoint = domPoint.matrixTransform(transform.inverse());
    return svgPoint;
  };

  pointerDown = false;

  handlePointerDown = (event: PointerEvent) => {
    this.pointerDown = true;
    const point = this.getSvgPoint(event);
    this.emit("move-next-fruit", point);
  };

  handlePointerMove = (event: PointerEvent) => {
    if (!this.context.next) return;
    if (!this.pointerDown) return;
    event.preventDefault();
    const point = this.getSvgPoint(event);
    this.emit("move-next-fruit", point);
  };

  handlePointerUp = (event: PointerEvent) => {
    this.pointerDown = false;
    const point = this.getSvgPoint(event);
    this.emit("drop-next-fruit", point);
  };

  handleFrameLoop = (dt: number) => {
    this.dataset.data([this.context.scorecard, ...this.context.fruits, this.context.next, this.context.bucket]);
  };

  fruitsDriver = Driver.create<Fruit, Element>({
    filter: (data) => data.type == "fruit",
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "circle");
      element.classList.add("fruit");
      element.classList.add("level-" + data.level);
      element.setAttribute("r", String(data.radius - 0.06));
      this.fruitsGroup.appendChild(element);
      return element;
    },
    update: (data, element) => {
      element.setAttribute("cx", String(data.position.x));
      element.setAttribute("cy", String(data.position.y));
    },
    exit: (data, element) => {
      element.remove();
    },
  });

  bucketDriver = Driver.create<Bucket, SVGElement>({
    filter: (data) => data.type == "bucket",
    enter: (data) => {
      const halfWidth = data.width / 2 + 0.06;
      const halfHeight = data.height / 2 + 0.06;

      const element = document.createElementNS(SVG_NS, "rect");
      element.classList.add("bucket");

      element.setAttribute("x", String(-halfWidth));
      element.setAttribute("y", String(-halfHeight));
      element.setAttribute("width", String(halfWidth * 2));
      element.setAttribute("height", String(halfHeight * 2));

      element.setAttribute("rx", String(data.height / 50));
      element.setAttribute("ry", String(data.height / 50));

      this.bucketGroup.prepend(element);
      return element;
    },
    update: (data, element) => {},
    exit: (data, element) => {
      element.remove();
    },
  });

  scorecardDriver = Driver.create<Scorecard, SVGTextElement>({
    filter: (data) => {
      return data.type === "scorecard";
    },
    enter: (data) => {
      const element = document.createElementNS(SVG_NS, "text");
      element.classList.add("score");
      this.scorecardGroup.appendChild(element);
      return element;
    },
    update: (data, element) => {
      element.setAttribute("x", String(-this.context.bucket.width / 2 + 0.5));
      element.setAttribute("y", String(-this.context.bucket.height / 2 - 1));
      if (element.textContent !== String(data.score)) {
        element.textContent = String(data.score);
      }
    },
    exit: (data, text) => {
      text.remove();
    },
  });

  dataset = Dataset.create<Fruit | Bucket | Scorecard>({
    key: (data) => data.key,
  });
}
