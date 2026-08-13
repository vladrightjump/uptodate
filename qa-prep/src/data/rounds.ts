import type { Question, Round } from "../types";
import { ROUND_A } from "./round-a";
import { ROUND_B } from "./round-b";
import { ROUND_C } from "./round-c";
import { ROUND_D } from "./round-d";

export const ROUNDS: Round[] = [ROUND_A, ROUND_B, ROUND_C, ROUND_D];

export const ALL_QUESTIONS: Question[] = ROUNDS.flatMap((r) => r.questions);

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

/* One hue per round, spread around the wheel. Paired with a fixed lightness
   and chroma in the stylesheet, so every round reads at the same weight. */
const ROUND_HUES = [250, 300, 160, 30];

export function roundHue(index: number): number {
  return ROUND_HUES[index % ROUND_HUES.length]!;
}
