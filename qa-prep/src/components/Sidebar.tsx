import type { Round } from "../types";

interface Props {
  rounds: Round[];
  activeId: string;
  reviewed: Set<string>;
  onSelect: (id: string) => void;
}

export function Sidebar({ rounds, activeId, reviewed, onSelect }: Props) {
  return (
    <nav className="sidebar" aria-label="Interview rounds">
      <p className="sidebar-title">Rounds</p>
      <ul>
        {rounds.map((r) => {
          const done = r.questions.filter((q) => reviewed.has(q.id)).length;
          const pct = Math.round((done / r.questions.length) * 100);
          return (
            <li key={r.id}>
              <button
                type="button"
                className={`round-btn${r.id === activeId ? " is-active" : ""}`}
                aria-current={r.id === activeId ? "true" : undefined}
                onClick={() => onSelect(r.id)}
              >
                <span className="round-label">{r.label}</span>
                <span className="round-count">
                  {done}/{r.questions.length}
                </span>
                <span className="round-bar" aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
