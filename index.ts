import { Runtime } from "polymatic";

import { Main, MainContext } from "./src/Main";

Runtime.activate(new Main(), new MainContext());