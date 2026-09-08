/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createContext } from "preact";
import { useContext } from "preact/hooks";

import { type MainContext } from "../model";

/**
 * What a component is handed: the shared context to read signals off, and the
 * runtime's own emit to send events back into it. Nothing else of the runtime
 * is exposed - the shell never holds a middleware.
 */
export interface GameRuntime {
  context: MainContext;
  emit: (type: string, ev?: any) => void;
}

export const GameContext = createContext<GameRuntime | null>(null);

export function useRuntime(): GameRuntime {
  const runtime = useContext(GameContext);
  if (!runtime) throw new Error("useRuntime must be used within a GameContext.Provider");
  return runtime;
}
