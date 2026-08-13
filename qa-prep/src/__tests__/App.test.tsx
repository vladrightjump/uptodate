import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import { ALL_QUESTIONS, ROUNDS, TOTAL_QUESTIONS } from "../data/rounds";

beforeEach(() => window.localStorage.clear());

const seedReviewed = (ids: string[]) =>
  window.localStorage.setItem("qa-prep:reviewed", JSON.stringify(ids));

describe("App progress", () => {
  it("starts at zero", () => {
    render(<App />);
    expect(
      screen.getByText(`0 of ${TOTAL_QUESTIONS} marked known (0%)`, {
        exact: false,
      })
    ).toBeInTheDocument();
  });

  it("counts reviewed questions that exist", () => {
    const ids = ALL_QUESTIONS.slice(0, 3).map((q) => q.id);
    seedReviewed(ids);
    render(<App />);
    expect(
      screen.getByText(`3 of ${TOTAL_QUESTIONS} marked known`, { exact: false })
    ).toBeInTheDocument();
  });

  /* The bank is hand-edited, so a renamed or deleted id leaves an orphan in a
     returning user's storage. Counting those raw once produced "45 of 41
     (110%)" and pushed the progress bar past its track. */
  it("ignores stored ids that no longer exist", () => {
    const real = ALL_QUESTIONS.slice(0, 2).map((q) => q.id);
    const orphans = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => `gone-${i}`);
    seedReviewed([...real, ...orphans]);

    render(<App />);

    expect(
      screen.getByText(`2 of ${TOTAL_QUESTIONS} marked known`, { exact: false })
    ).toBeInTheDocument();
  });

  it("never renders the bar wider than its track", () => {
    seedReviewed(Array.from({ length: 500 }, (_, i) => `gone-${i}`));
    const { container } = render(<App />);
    const fill = container.querySelector<HTMLElement>(".progress-bar span")!;
    expect(Number.parseFloat(fill.style.width)).toBeLessThanOrEqual(100);
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
