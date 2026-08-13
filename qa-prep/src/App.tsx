import { useMemo, useState } from "react";
import { QuestionCard } from "./components/QuestionCard";
import { Sidebar } from "./components/Sidebar";
import { ALL_QUESTIONS, ROUNDS, TOTAL_QUESTIONS } from "./data/rounds";
import { useIdSet, useLocalStorage } from "./hooks/useLocalStorage";
import { useTheme } from "./hooks/useTheme";
import type { DiffFilter, Question } from "./types";

const DIFF_FILTERS: DiffFilter[] = ["all", "easy", "mid", "hard"];
const DIFF_FILTER_LABEL: Record<DiffFilter, string> = {
  all: "all",
  easy: "easy",
  mid: "medium",
  hard: "hard",
};

/** Jumps back to the top after a navigation. jsdom has no real scrolling. */
function scrollToTop() {
  if (typeof window.scrollTo !== "function") return;
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  try {
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  } catch {
    /* older or headless browsers — the jump is a nicety, not a requirement */
  }
}

/** Strips the HTML in an answer so search matches on the words, not the markup. */
function searchableText(q: Question): string {
  const solutions = (q.solution ?? []).map((s) => s.src).join(" ");
  return [
    q.q,
    q.tags?.join(" ") ?? "",
    q.prompt?.src ?? "",
    q.answer.replace(/<[^>]+>/g, " "),
    solutions,
  ]
    .join(" ")
    .toLowerCase();
}

export default function App() {
  const [activeRoundId, setActiveRoundId] = useLocalStorage(
    "qa-prep:round",
    ROUNDS[0].id
  );
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState<DiffFilter>("all");
  const [hideKnown, setHideKnown] = useState(false);
  /* Phone-only: the filter row is collapsed behind a button so the sticky
     header stays short. Wider screens show the row and ignore this. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  const reviewed = useIdSet("qa-prep:reviewed");
  const opened = useIdSet("qa-prep:open");
  const { theme, cycle } = useTheme();

  const query = search.trim().toLowerCase();
  const searching = query.length > 0;

  const activeRound =
    ROUNDS.find((r) => r.id === activeRoundId) ?? ROUNDS[0];

  const visible = useMemo(() => {
    const pool = searching
      ? ROUNDS.flatMap((r) =>
          r.questions.map((q) => ({ q, round: r.label }))
        )
      : activeRound.questions.map((q) => ({ q, round: activeRound.label }));

    return pool.filter(({ q }) => {
      if (diff !== "all" && q.diff !== diff) return false;
      if (hideKnown && reviewed.set.has(q.id)) return false;
      if (searching && !searchableText(q).includes(query)) return false;
      return true;
    });
  }, [searching, query, activeRound, diff, hideKnown, reviewed.set]);

  /* Shown on the phone's "filters" button, so a filter hiding questions is
     still visible once the row it lives in is collapsed. */
  const activeFilters = (diff === "all" ? 0 : 1) + (hideKnown ? 1 : 0);

  const allOpen =
    visible.length > 0 && visible.every(({ q }) => opened.set.has(q.id));

  const toggleAll = () => {
    const ids = visible.map(({ q }) => q.id);
    if (allOpen) ids.forEach((id) => opened.set.has(id) && opened.toggle(id));
    else ids.forEach((id) => !opened.set.has(id) && opened.toggle(id));
  };

  /* Count only ids that still exist. The question bank is hand-edited, so a
     renamed or deleted id leaves an orphan in a returning user's storage —
     counting those raw gives "45 of 41 (110%)" and overflows the progress bar. */
  const doneCount = useMemo(
    () => ALL_QUESTIONS.reduce((n, q) => n + (reviewed.set.has(q.id) ? 1 : 0), 0),
    [reviewed.set]
  );
  const donePct = Math.round((doneCount / TOTAL_QUESTIONS) * 100);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-main">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              QA
            </span>
            <span>
              <strong>Interview Prep</strong>
              <span className="brand-sub">
                {TOTAL_QUESTIONS} questions · {ROUNDS.length} rounds
              </span>
            </span>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="ghost icon-btn"
              onClick={cycle}
              title={`Theme: ${theme}`}
              aria-label={`Theme: ${theme}. Click to change.`}
            >
              {theme === "auto" ? "◐" : theme === "light" ? "☀" : "☾"}
            </button>

            {/* Phone only — hidden by the stylesheet from 641px up. */}
            <button
              type="button"
              className="ghost filter-toggle"
              aria-expanded={filtersOpen}
              aria-controls="filter-row"
              aria-label={
                activeFilters > 0
                  ? `Filters, ${activeFilters} active`
                  : "Filters"
              }
              onClick={() => setFiltersOpen((o) => !o)}
            >
              filters
              {activeFilters > 0 && (
                <span className="filter-count" aria-hidden="true">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="controls">
          <input
            type="search"
            className="search"
            placeholder="Search all rounds…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search questions and answers"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <div
            className={`filter-row${filtersOpen ? " is-open" : ""}`}
            id="filter-row"
          >
            <div
              className="segmented"
              role="group"
              aria-label="Filter by difficulty"
            >
              {DIFF_FILTERS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={diff === d ? "is-active" : ""}
                  aria-pressed={diff === d}
                  onClick={() => setDiff(d)}
                >
                  {DIFF_FILTER_LABEL[d]}
                </button>
              ))}
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={hideKnown}
                onChange={(e) => setHideKnown(e.target.checked)}
              />
              <span>hide known</span>
            </label>

            <button type="button" className="ghost" onClick={toggleAll}>
              {allOpen ? "collapse all" : "expand all"}
            </button>
          </div>
        </div>
      </header>

      <div className="progress-strip">
        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${donePct}%` }} />
        </div>
        <span className="progress-label">
          {doneCount} of {TOTAL_QUESTIONS} marked known ({donePct}%)
          {doneCount > 0 && (
            <button type="button" className="link" onClick={reviewed.clear}>
              reset
            </button>
          )}
        </span>
      </div>

      <div className="layout">
        <Sidebar
          rounds={ROUNDS}
          activeId={activeRound.id}
          reviewed={reviewed.set}
          onSelect={(id) => {
            setActiveRoundId(id);
            setSearch("");
            /* On a phone the round tiles sit above the list, so switching
               rounds would otherwise leave you mid-list in the new round. */
            scrollToTop();
          }}
        />

        <main className="content">
          <div className="content-head">
            <h1>{searching ? `Results for “${search.trim()}”` : activeRound.label}</h1>
            <p>{searching ? `${visible.length} matching questions across all rounds` : activeRound.desc}</p>
          </div>

          {visible.length === 0 ? (
            <p className="empty">
              Nothing matches those filters. Try clearing the search or the
              difficulty filter.
            </p>
          ) : (
            <ol className="cards">
              {visible.map(({ q, round }, i) => (
                <li key={q.id}>
                  {searching && <p className="result-round">{round}</p>}
                  <QuestionCard
                    question={q}
                    index={i + 1}
                    open={opened.set.has(q.id)}
                    reviewed={reviewed.set.has(q.id)}
                    onToggleOpen={opened.toggle}
                    onToggleReviewed={reviewed.toggle}
                  />
                </li>
              ))}
            </ol>
          )}
        </main>
      </div>
    </div>
  );
}
