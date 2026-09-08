/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { render } from "preact";

import { App } from "./shell/App";

// the shell paints first and waits on the `runtime` signal; the game is loaded
// after, and fills that signal in when it is activated
render(<App />, document.getElementById("ui-root") as HTMLElement);

import("./async-loader");
