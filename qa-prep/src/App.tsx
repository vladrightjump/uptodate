import { useMemo, useState } from "react";
import { QuestionCard } from "./components/QuestionCard";
import { Sidebar } from "./components/Sidebar";
import { ROUNDS, TOTAL_QUESTIONS } from "./data/rounds";
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

  const allOpen =
    visible.length > 0 && visible.every(({ q }) => opened.set.has(q.id));

  const toggleAll = () => {
    const ids = visible.map(({ q }) => q.id);
    if (allOpen) ids.forEach((id) => opened.set.has(id) && opened.toggle(id));
    else ids.forEach((id) => !opened.set.has(id) && opened.toggle(id));
  };

  const donePct = Math.round((reviewed.size / TOTAL_QUESTIONS) * 100);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            QA
          </span>
          <span>
            <strong>Interview Prep</strong>
            <span className="brand-sub">
              {TOTAL_QUESTIONS} questions · 4 rounds
            </span>
          </span>
        </div>

        <div className="controls">
          <input
            type="search"
            className="search"
            placeholder="Search all rounds…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search questions and answers"
          />

          <div className="segmented" role="group" aria-label="Filter by difficulty">
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

          <button
            type="button"
            className="ghost"
            onClick={cycle}
            title={`Theme: ${theme}`}
            aria-label={`Theme: ${theme}. Click to change.`}
          >
            {theme === "auto" ? "◐" : theme === "light" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <div className="progress-strip">
        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${donePct}%` }} />
        </div>
        <span className="progress-label">
          {reviewed.size} of {TOTAL_QUESTIONS} marked known ({donePct}%)
          {reviewed.size > 0 && (
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
