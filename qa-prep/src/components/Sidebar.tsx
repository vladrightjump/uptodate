import type { CSSProperties } from "react";
import type { Round } from "../types";
import { roundHue } from "../data/rounds";

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
        {rounds.map((r, i) => {
          const done = r.questions.filter((q) => reviewed.has(q.id)).length;
          const pct = Math.round((done / r.questions.length) * 100);
          /* The dot colour is derived from the round's position, so the CSS
             only needs the hue — lightness and chroma stay theme-controlled. */
          const hue = { "--round-h": roundHue(i) } as CSSProperties;
          return (
            <li key={r.id}>
              <button
                type="button"
                className={`round-btn${r.id === activeId ? " is-active" : ""}`}
                aria-current={r.id === activeId ? "true" : undefined}
                style={hue}
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
