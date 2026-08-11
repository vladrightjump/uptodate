import type { Question } from "../types";
import { CodeBlock } from "./CodeBlock";

interface Props {
  question: Question;
  index: number;
  open: boolean;
  reviewed: boolean;
  onToggleOpen: (id: string) => void;
  onToggleReviewed: (id: string) => void;
}

const DIFF_LABEL: Record<Question["diff"], string> = {
  easy: "easy",
  mid: "medium",
  hard: "hard",
};

export function QuestionCard({
  question,
  index,
  open,
  reviewed,
  onToggleOpen,
  onToggleReviewed,
}: Props) {
  const answerId = `answer-${question.id}`;

  return (
    <article className={`card${reviewed ? " is-reviewed" : ""}`}>
      <div className="card-head">
        <button
          type="button"
          className="card-toggle"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => onToggleOpen(question.id)}
        >
          <span className="card-num">{index}</span>
          <span className="card-q">{question.q}</span>
          <span className="card-chevron" aria-hidden="true">
            {open ? "−" : "+"}
          </span>
        </button>

        <div className="card-meta">
          <span className={`pill diff-${question.diff}`}>
            {DIFF_LABEL[question.diff]}
          </span>
          {question.tags?.map((t) => (
            <span key={t} className="pill tag">
              {t}
            </span>
          ))}
          <label className="reviewed-box">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={() => onToggleReviewed(question.id)}
            />
            <span>known</span>
          </label>
        </div>
      </div>

      {question.table && (
        <div className="table-wrap">
          {question.table.caption && (
            <p className="table-caption">{question.table.caption}</p>
          )}
          <table className="data">
            <thead>
              <tr>
                {question.table.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {question.prompt && <CodeBlock block={question.prompt} />}

      {open && (
        <div className="card-body" id={answerId}>
          {/* Answers are hand-authored static HTML from src/data — no user input. */}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: question.answer }}
          />
          {question.solution?.map((block, i) => (
            <CodeBlock key={i} block={block} />
          ))}
        </div>
      )}
    </article>
  );
}
