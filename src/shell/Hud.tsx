/*
 * Copyright (c) Ali Shakiba
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TbRefresh } from "react-icons/tb";

import { useRuntime } from "./context";
import { restart } from "./actions";
import styles from "./Shell.module.css";

/**
 * The score above the bucket, the button that starts the round over, and the
 * card you get when a fruit tops out.
 */
export function Hud() {
  return (
    <>
      <Score />
      <ResetButton />
      <GameOver />
    </>
  );
}

function Score() {
  const { score } = useRuntime().context.hud;
  return (
    <span class={styles.score} aria-label="Score">
      {score.value}
    </span>
  );
}

/** Opposite the score, on the bucket's other shoulder. Starts a fresh round. */
function ResetButton() {
  const runtime = useRuntime();
  return (
    <button type="button" class={styles.reset} aria-label="Start over" onClick={() => restart(runtime)}>
      <TbRefresh aria-hidden size="1em" />
    </button>
  );
}

/**
 * Losing already empties the bucket and stops the game, but nothing said so.
 * This is that card, and the way back into a round.
 */
function GameOver() {
  const runtime = useRuntime();
  const { gameOver, score } = runtime.context.hud;
  if (!gameOver.value) return null;

  return (
    <div class={styles.backdrop}>
      <div class={styles.card} role="dialog" aria-modal="true" aria-label="Game over">
        <span class={styles.cardTitle}>Game over</span>
        <span class={styles.cardScore}>{score.value}</span>
        <button type="button" class={styles.again} onClick={() => restart(runtime)}>
          <TbRefresh aria-hidden size="1em" />
          Play again
        </button>
      </div>
    </div>
  );
}
