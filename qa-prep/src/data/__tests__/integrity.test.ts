import { describe, expect, it } from "vitest";
import { ALL_QUESTIONS, ROUNDS, TOTAL_QUESTIONS, roundHue } from "../rounds";

/* The question bank is hand-authored TypeScript, so these guard the shapes the
   UI relies on. A malformed question should fail the build, not ship. */

const DIFFS = new Set(["easy", "mid", "hard"]);
const LANGS = new Set(["sql", "js", "ts", "text"]);

describe("question bank", () => {
  it("has rounds, each with questions", () => {
    expect(ROUNDS.length).toBeGreaterThan(0);
    for (const r of ROUNDS) {
      expect(r.questions.length, `${r.id} is empty`).toBeGreaterThan(0);
    }
  });

  it("keeps TOTAL_QUESTIONS in step with the data", () => {
    const counted = ROUNDS.reduce((n, r) => n + r.questions.length, 0);
    expect(TOTAL_QUESTIONS).toBe(counted);
    expect(ALL_QUESTIONS).toHaveLength(counted);
  });

  it("has globally unique question ids", () => {
    /* Ids key localStorage progress across every round, so a collision would
       silently mark two questions known at once. */
    const seen = new Map<string, number>();
    for (const q of ALL_QUESTIONS) {
      seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
    }
    const dupes = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    expect(dupes).toEqual([]);
  });

  it("has unique round ids", () => {
    const ids = ROUNDS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses difficulties the stylesheet has colours for", () => {
    for (const q of ALL_QUESTIONS) {
      expect(DIFFS.has(q.diff), `${q.id} has diff "${q.diff}"`).toBe(true);
    }
  });

  it("only uses code languages the renderer knows", () => {
    for (const q of ALL_QUESTIONS) {
      for (const block of [...(q.solution ?? []), q.prompt].filter(Boolean)) {
        expect(LANGS.has(block!.lang), `${q.id} uses "${block!.lang}"`).toBe(
          true
        );
      }
    }
  });

  it("has non-empty question text and answers", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.q.trim(), `${q.id} has no question`).not.toBe("");
      expect(q.answer.trim(), `${q.id} has no answer`).not.toBe("");
    }
  });

  it("gives every table the same number of cells as columns", () => {
    for (const q of ALL_QUESTIONS) {
      if (!q.table) continue;
      for (const [i, row] of q.table.rows.entries()) {
        expect(row, `${q.id} row ${i} is ragged`).toHaveLength(
          q.table.columns.length
        );
      }
    }
  });
});

describe("roundHue", () => {
  it("gives every round a hue and wraps past the end", () => {
    const hues = ROUNDS.map((_, i) => roundHue(i));
    expect(new Set(hues).size).toBe(ROUNDS.length);
    expect(roundHue(ROUNDS.length)).toBe(roundHue(0));
  });
});
