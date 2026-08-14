import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App, { barSegments } from "../App";
import { ALL_QUESTIONS, ROUNDS, TOTAL_QUESTIONS } from "../data/rounds";

beforeEach(() => window.localStorage.clear());

const seedStatus = (byId: Record<string, "review" | "known">) =>
  window.localStorage.setItem("qa-prep:status", JSON.stringify(byId));

/** The pre-three-state shape: a flat list of ids that all meant "known". */
const seedLegacyReviewed = (ids: string[]) =>
  window.localStorage.setItem("qa-prep:reviewed", JSON.stringify(ids));

const fromBank = (n: number, offset = 0) =>
  ALL_QUESTIONS.slice(offset, offset + n).map((q) => q.id);

const strip = () =>
  document.querySelector<HTMLElement>(".progress-label")!.textContent ?? "";

const barWidths = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(".progress-bar span")].map((el) =>
    Number.parseFloat(el.style.width)
  );

describe("App progress", () => {
  it("starts with everything unmarked", () => {
    render(<App />);
    expect(strip()).toContain("0 known");
    expect(strip()).toContain("0 to review");
    expect(strip()).toContain(`${TOTAL_QUESTIONS} unmarked`);
  });

  it("counts the two marked buckets separately", () => {
    const [k1, k2, r1] = fromBank(3);
    seedStatus({ [k1!]: "known", [k2!]: "known", [r1!]: "review" });
    render(<App />);

    expect(strip()).toContain("2 known");
    expect(strip()).toContain("1 to review");
    expect(strip()).toContain(`${TOTAL_QUESTIONS - 3} unmarked`);
  });

  it("reads a pre-three-state browser's progress as known", () => {
    seedLegacyReviewed(fromBank(3));
    render(<App />);
    expect(strip()).toContain("3 known");
  });

  /* The bank is hand-edited, so a renamed or deleted id leaves an orphan in a
     returning user's storage. Counting those raw once produced "45 of 41
     (110%)" and pushed the progress bar past its track. */
  it("ignores stored ids that no longer exist", () => {
    const real = Object.fromEntries(
      fromBank(2).map((id) => [id, "known" as const])
    );
    const orphans = Object.fromEntries(
      Array.from({ length: TOTAL_QUESTIONS }, (_, i) => [
        `gone-${i}`,
        "known" as const,
      ])
    );
    seedStatus({ ...real, ...orphans });

    render(<App />);

    expect(strip()).toContain("2 known");
    expect(strip()).toContain(`${TOTAL_QUESTIONS - 2} unmarked`);
  });

  it("renders both segments inside the track", () => {
    seedStatus({
      ...Object.fromEntries(fromBank(3).map((id) => [id, "known" as const])),
      ...Object.fromEntries(fromBank(2, 3).map((id) => [id, "review" as const])),
    });
    const { container } = render(<App />);
    const [known, review] = barWidths(container);
    expect(known! + review!).toBeLessThanOrEqual(100);
    expect(review).toBeGreaterThan(0);
  });

  it("offers a reset once anything is marked", () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: "reset" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "review" })[0]!);
    expect(screen.getByRole("button", { name: "reset" })).toBeInTheDocument();
    expect(strip()).toContain("1 to review");
  });
});

/* Rounding each share on its own lets them sum past 100 and overflow the
   track: 1 known + 39 to review out of 40 rounds to 3% + 98%. Whether the
   current TOTAL_QUESTIONS has such a split is an accident — 41 does not — so
   the invariant is checked directly, across bank sizes. */
describe("barSegments", () => {
  it("never sums past 100, at any split of any bank size", () => {
    for (let total = 1; total <= 120; total += 1) {
      for (let known = 0; known <= total; known += 1) {
        const review = total - known;
        const { knownPct, reviewPct } = barSegments(known, review, total);
        expect(
          knownPct + reviewPct,
          `${known} known + ${review} to review of ${total}`
        ).toBeLessThanOrEqual(100);
      }
    }
  });

  it("still gives each bucket its share", () => {
    expect(barSegments(1, 39, 40)).toEqual({ knownPct: 3, reviewPct: 97 });
    expect(barSegments(20, 0, 40)).toEqual({ knownPct: 50, reviewPct: 0 });
    expect(barSegments(0, 0, 40)).toEqual({ knownPct: 0, reviewPct: 0 });
  });

  it("does not divide by zero on an empty bank", () => {
    expect(barSegments(0, 0, 0)).toEqual({ knownPct: 0, reviewPct: 0 });
  });
});

describe("App filtering", () => {
  it("narrows the list to one bucket", () => {
    render(<App />);
    const firstRound = ROUNDS[0]!;
    const shown = () => screen.queryAllByRole("article").length;
    const all = shown();
    expect(all).toBe(firstRound.questions.length);

    /* Both scoped: "known" and "review" name a button in the filter row AND
       one on every card, so an unscoped query is ambiguous either way. */
    const filter = (name: string) =>
      fireEvent.click(
        within(
          screen.getByRole("group", { name: "Filter by what you know" })
        ).getByRole("button", { name })
      );

    const firstCard = screen.getAllByRole("article")[0]!;
    fireEvent.click(within(firstCard).getByRole("button", { name: "known" }));

    filter("to review");
    expect(shown()).toBe(0);

    filter("unmarked");
    expect(shown()).toBe(all - 1);

    filter("known");
    expect(shown()).toBe(1);
  });
});

describe("App shell", () => {
  it("renders a button for every round", () => {
    render(<App />);
    for (const r of ROUNDS) {
      expect(screen.getByRole("button", { name: new RegExp(r.label, "i") }))
        .toBeInTheDocument();
    }
  });

  it("shows the first round's questions by default", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: ROUNDS[0]!.label })
    ).toBeInTheDocument();
  });
});
