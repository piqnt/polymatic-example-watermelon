import { World, CircleShape, EdgeShape, Body, Contact, ChainShape } from "planck";

import { Dataset, Driver, Middleware } from "polymatic";

import { MainContext } from "./Main";
import { Fruit, Bucket } from "./Data";
import { FrameLoopEvent } from "./FrameLoop";

export class Physics extends Middleware<MainContext> {
  world: World;
  time: number = 0;
  timeStep = 1000 / 60;

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("frame-loop", this.handleFrameLoop);
  }

  handleActivate() {
    if (this.world) return;

    this.world = new World({
      gravity: { x: 0, y: 10 },
    });
    this.world.on("pre-solve", this.handleCollide);
  }

  handleFrameLoop(ev: FrameLoopEvent) {
    this.dataset.data([...this.context.fruits, this.context.bucket]);
    this.time += ev.dt;
    while (this.time >= this.timeStep) {
      this.time -= this.timeStep;
      this.world.step(this.timeStep / 1000);
    }
  }

  fruitDriver = Driver.create<Fruit, Body>({
    filter: (data) => data.type === "fruit",
    enter: (data) => {
      const body = this.world.createBody({
        type: "dynamic",
        position: data.position,
        userData: data,
        linearVelocity: { x: 0, y: 20 },
      });
      body.createFixture({
        shape: new CircleShape(data.radius),
        density: 1 / data.level,
        restitution: 0.1,
      });

      return body;
    },
    update: (data, body) => {
      const { x, y } = body.getPosition();
      data.position.x = x;
      data.position.y = y;
    },
    exit: (data, body) => {
      this.world.destroyBody(body);
    },
  });

  bucketDriver = Driver.create<Bucket, Body>({
    filter: (data) => data.type === "bucket",
    enter: (data) => {
      const body = this.world.createBody({
        type: "static",
        userData: data,
      });

      const halfWidth = data.width / 2;
      const halfHeight = data.height / 2;
      body.createFixture({
        shape: new EdgeShape({ x: -halfWidth, y: -halfHeight }, { x: +halfWidth, y: -halfHeight }),
        userData: "top",
      });

      body.createFixture({
        shape: new ChainShape(
          [
            { x: -halfWidth, y: -halfHeight },
            { x: +halfWidth, y: -halfHeight },
            { x: +halfWidth, y: +halfHeight },
            { x: -halfWidth, y: +halfHeight },
          ],
          true
        ),
      });

      return body;
    },
    update: (data, body) => {},
    exit: (data, body) => {
      this.world.destroyBody(body);
    },
  });

  dataset = Dataset.create<Fruit | Bucket>({
    key: (data) => data.key,
  })
    .addDriver(this.fruitDriver)
    .addDriver(this.bucketDriver);

  handleCollide = (contact: Contact) => {
    const fixtureA = contact.getFixtureA();
    const bodyA = fixtureA.getBody();
    const fixtureB = contact.getFixtureB();
    const bodyB = fixtureB.getBody();

    const dataA = bodyA.getUserData() as Fruit | Bucket;
    const dataB = bodyB.getUserData() as Fruit | Bucket;

    if (!dataA || !dataB) return;

    if (dataA.type === "fruit" && dataB.type === "fruit") {
      if (dataA.level === dataB.level) {
        this.world.queueUpdate(() => this.emit("collide-fruits", { fruitA: dataA, fruitB: dataB }));
      }
    }
    if (dataA.type === "fruit" && dataB.type === "bucket" && fixtureB.getUserData() === "top") {
      this.world.queueUpdate(() => this.emit("collide-top", { fruit: dataA, bucket: dataB }));
    } else if (dataA.type === "bucket" && dataB.type === "fruit" && fixtureA.getUserData() === "top") {
      this.world.queueUpdate(() => this.emit("collide-top", { fruit: dataB, bucket: dataA }));
    }
  };
}
