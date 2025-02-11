# Polymatic Tutorial - Watermelon Gme

In this tutorial we will recreate the Watermelon game. We use the [Polymatic](https://github.com/piqnt/polymatic) framework, SVG, and [Planck/Box2D](https://github.com/piqnt/planck) physics engine.

Complete tutorial code is available in this repository. You can [play live demo here](https://piqnt.github.io/polymatic-example-watermelon/). For instructions to run the project locally, see the last section of this tutorial.

### Introduction

Polymatic is a minimalist middleware framework for building games, and interactive visual application. It allows you to create complex applications from simple middlewares.

Polymatic is an unopinionated framework with flexible architecture. Polymatic does not come with game loop, rendering, physics, or any other game specific functions. Instead, it provides a simple way to create middlewares that implement those functions or integrate external libraries. Polymatic is designed to use other libraries for rendering, sound, physics, storage, networking, etc.

### Middleware

Middlewares are the building blocks of a polymatic application. Middlewares simplify developing complex applications by breaking down your application into loosely-coupled classes. Middlewares can communicate to each other via events, share data in the context, and use other middlewares.

To create a middleware simply extend the Middleware class:

```ts
class Main extends Middleware {
}
```

We will use the Main class as the entry point of our application.

### Context

Middlewares can share data by reading and writing to application context. You can use any object as context.

Let's create a context object for our game:

```ts
class Fruit {

}

class MainContext {
  fruits: Fruit[] = [],
}
```

### Events

Middlewares can send or receive events. To send an event use the `emit` method, and to receive an event use the `on` method:

```ts
this.emit("drop-next-fruit", data);

this.on("drop-next-fruit", (data) => {
});
```

### Activation

To start a polymatic application we need to activate the entry middleware. To activate a middleware pass an instance of the middleware and context object to `Runtime.activate()`:

```ts
  Runtime.activate(new Main(), new MainContext());
```

If a middleware is activated, it can communicate with other middlewares and access shared context object. All middlewares that are used in an activated middleware are also activated.

When a middleware is activated it will receive "activate" event, and when it is deactivated it will receive "deactivate" event. You could use them to initialize and cleanup resources.

### Use

To use a middleware in another middleware we use the `use` method:

```ts
this.use(new AnotherMiddleware());
```

### Watermelon: Middlewares

In the Watermelon game we will develop the following middlewares:
- Main: Entry point of the application
- Gameplay: Implements game logic
- Physics: Implements physics simulation
- Terminal: Implements user-interface
- FrameLoop: Implements game loop

Game objects such as fruits and score are stored in the context. Gameplay middleware manages game objects and state, and  receives events such as drop-next-fruit, move-next-fruit from Terminal, and collide-fruits, collide-top from Physics.

Terminal middleware accesses game objects and state from the context. and renders them on screen using SVG. Terminal also collects user pointer input and then sends drop-next-fruit and move-next-fruit, which are used by Gameplay.

Physics middleware also accesses game objects and state from the context. Physics adds fruits to physics simulation, updates fruits position, and collects collision events from simulation and sends collide-fruits, collide-fruit-top to gameplay.

FrameLoop middleware implements the game loop. It sends frame-loop event to all middlewares in each frame.

We will discuss each middleware further in the following sections.

```ts
class Main extends Middleware {
  constructor() {
    super();
    this.use(new Gameplay());
    this.use(new Physics());
    this.use(new Terminal());
    this.use(new FrameLoop());
  }
}
```

### Watermelon: FrameLoop

Polymatic does not implement game loop, or any other game specific functions. However, it's very simple to use a middlewares to implement a game loop.

Here is how to implement a fixed frame loop middleware:

```ts
class FixedFrameLoop extends Middleware {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
  }

  handleActivate() {
    this.loop = setInterval(this.handleIntervalCallback, 1000 / 60);
  }

  handleDeactivate() {
    clearInterval(this.loop);
  }

  handleIntervalCallback = () => {
    this.emit("frame-loop")
  }
}

class Physics extends Middleware {
  constructor() {
    super();
    this.on("frame-loop", this.handleFrameLoop);
  }
  handleFrameLoop() {
    // advance physics simulation
    world.step(1 / 60);
  }
}
```

In this repository source code there is a variable frame loop which is slightly more complicated.

### Watermelon: Gameplay

Next, let's implement the gameplay. In the gameplay we implement the logic for dropping new fruits, merging them, and increasing user score.

We store all objects in the context so that they can be accessed by all middlewares, and we listen to events from other middlewares, and update game objects.

```ts
class Gameplay extends Middleware {
  constructor() {
    super();

    this.on("move-next-fruit", this.handleMoveNextFruit);
    this.on("drop-next-fruit", this.handleDropNextFruit);

    this.on("collide-fruits", this.handleCollideFruits);
    this.on("collide-fruit-top", this.handleCollideFruitTop);
  }

  handleMoveNextFruit(point) {
    // change next fruit position in context
  }

  handleDropNextFruit(point) {
    // drop next fruit and assign new fruit to next
  }

  handleCollideFruits(data: { fruitA: Fruit, fruitB: Fruit[] }) {
    // removed collided similar fruits, add new fruit, and increase score
  }

  handleCollideFruitTop(data: { fruit: Fruit }) {
    // game over
  }
}
```

### Data Driver

Middlewares share game objects in the context. A middleware might have internal representation of game objects. For example Terminal middleware creates an svg element for each fruit, and Physics middleware adds new bodies to the physics simulation. Data drivers are used by middlewares to manage middleware components based on game objects.

To use data-drivers we first create a Dataset to track objects, and then add Drivers to the dataset to manage components.

Dataset needs to uniquely identify objects between updates, so it requires a key function. We can create a dataset by extending the Dataset class, or using the `Dataset.create` method:

```ts
// create dataset
const dataset = Dataset.create({
  key: (object) => object.key,
});

// add driver to dataset
dataset.addDriver(driver);

// assign data to dataset
// this will call driver functions
dataset.data([...]);
```

To create a Driver we need to implement enter, update, exit and filter functions. These functions are called when we assign new data to a dataset that a driver is added to:
- `filter`: filter objects that a driver should handle
- `enter`: a new object is added to the dataset
- `update`: called for existing objects and new objects
- `exit`: an object is removed from the dataset

We can create a driver by extending the Driver class, or using the `Driver.create` method:

```ts
const driver = Driver.create<Fruit, Element>({
  filter: (data) => data.type == "fruit",
  enter: (data) => {
    // create new svg element
    // return the element to use it in update, and exit functions
    return component;
  },
  update: (data, element) => {
    // update the svg element
  },
  exit: (data, element) => {
    // remove the svg element
  },
});

dataset.addDriver(driver);
```

### Watermelon: Physics with Planck/Box2D

Physics middleware adds physics simulation to fruits and bucket, and detects collisions. When two similar fruits collide, physics middleware emits an event to informs gameplay middleware about the collision to merge two fruits.

```ts
export class Physics extends Middleware<MainContext> {
  world: World;

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("frame-loop", this.handleFrameLoop);

    dataset.addDriver(this.fruitDriver);
  }

  handleActivate() {
    this.world = new World({ gravity: { x: 0, y: 10 } });
    this.world.on("pre-solve", this.handleCollide);
  }

  handleFrameLoop(ev: FrameLoopEvent) {
   this.dataset.data([...this.context.fruits, this.context.bucket]);
   this.world.step(1 / 60);
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

 dataset = Dataset.create<Entity>({
   key: (data) => data.key,
 });

 handleCollide = (contact: Contact) => {
   const sameFruitsCollision = ...;
   const fruitTopCollision = ...;
   if (sameFruits) {
     this.world.queueUpdate(() => this.emit("collide-fruits", { fruitA, fruitB }));
   } else (fruitTopCollision) {
     this.world.queueUpdate(() => this.emit("collide-fruit-top", { fruit }));
 };
}
```

### Watermelon: Terminal with SVG

Finally we implement the game Terminal (i.e. user-interface). Terminal renders game objects and score, and collects user inputs such as pointer events. Terminal uses data-driver to render game objects, and sends events to other middleware.

```ts
export class Terminal extends Middleware<MainContext> {
 svg: SVGSVGElement;
 fruitsGroup: SVGGElement;

 constructor() {
   super();
   this.on("activate", this.handleActivate);
   this.on("deactivate", this.handleDeactivate);
   this.on("frame-loop", this.handleFrameLoop);

   this.dataset.addDriver(this.fruitsDriver);

   // create a layer for fruits using svg group element
   this.fruitsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
 }

 handleActivate() {
   this.svg = document.getElementById("polymatic-watermelon");

   this.svg.addEventListener("pointerdown", this.handlePointerDown);
   this.svg.addEventListener("pointermove", this.handlePointerMove);
   this.svg.addEventListener("pointerup", this.handlePointerUp);

   this.svg.appendChild(this.fruitsGroup);
 }

 handleDeactivate() {
   this.svg.removeEventListener("pointerdown", this.handlePointerDown);
   this.svg.removeEventListener("pointermove", this.handlePointerMove);
   this.svg.removeEventListener("pointerup", this.handlePointerUp);

   this.fruitsGroup.remove();
 }

 pointerDown = false;

 handlePointerDown = (event: PointerEvent) => {
   this.pointerDown = true;
   const point = this.getSvgPoint(event);
   this.emit("move-next-fruit", point);
 };

 handlePointerMove = (event: PointerEvent) => {
   if (!this.pointerDown) return;
   const point = this.getSvgPoint(event);
   this.emit("move-next-fruit", point);
 };

 handlePointerUp = (event: PointerEvent) => {
   this.pointerDown = false;
   const point = this.getSvgPoint(event);
   this.emit("drop-next-fruit", point);
 };

 handleFrameLoop = () => {
   this.dataset.data(this.context.fruits);
 };

 fruitsDriver = Driver.create<Fruit, Element>({
   filter: (data) => data.type == "fruit",
   enter: (data) => {
     const element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
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

 dataset = Dataset.create<Fruit>({
   key: (data) => data.key,
 });
}
```

### How to run the code

To use the source code in this repository you need to have node.js/npm installed.

Install project dependencies:

```sh
npm install
```

Then to run the project locally:

```sh
npm run dev
```

This will print out the url where you can open the project.

To build the project for production:

```sh
npm run build
```
