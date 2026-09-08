/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GameContext } from "./context";
import { runtime } from "../async-signals";
import { Hud } from "./Hud";
import styles from "./Shell.module.css";

/**
 * The shell. It mounts before the runtime exists (see index.tsx), so every read
 * below is guarded: `runtime` fills in once the game has been activated, and
 * `ready` once the first round has begun.
 */
export function App() {
  const context = runtime.value?.context;
  const ready = context?.ready.value;

  return (
    <GameContext.Provider value={runtime.value ?? null}>
      <div class={styles.frame}>{runtime.value && ready && <Hud />}</div>
    </GameContext.Provider>
  );
}
