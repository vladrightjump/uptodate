import { useState } from "react";
import type { Note, QuestionStatus } from "../hooks/useQuestionState";
import type { Question } from "../types";
import { CodeBlock } from "./CodeBlock";
import { NoteEditor } from "./NoteEditor";

interface Props {
  question: Question;
  index: number;
  open: boolean;
  status: QuestionStatus;
  /** Undefined when this question has no note yet. */
  note?: Note;
  onToggleOpen: (id: string) => void;
  onSetStatus: (id: string, status: QuestionStatus) => void;
  onSaveNote: (id: string, body: string) => void;
  onDeleteNote: (id: string) => void;
}

/* "new" is the absence of a choice, so it is offered as a way back out rather
   than as something you set on purpose — hence the dash. */
const STATUS_CHOICES: { value: QuestionStatus; label: string; hint: string }[] = [
  { value: "new", label: "–", hint: "Not marked yet" },
  { value: "review", label: "review", hint: "Come back to this one" },
  { value: "known", label: "known", hint: "Solid — I can answer this" },
];

const DIFF_LABEL: Record<Question["diff"], string> = {
  easy: "easy",
  mid: "medium",
  hard: "hard",
};

export function QuestionCard({
  question,
  index,
  open,
  status,
  note,
  onToggleOpen,
  onSetStatus,
  onSaveNote,
  onDeleteNote,
}: Props) {
  const answerId = `answer-${question.id}`;
  const [editing, setEditing] = useState(false);

  return (
    <article className={`card is-${status}`}>
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
          <div
            className="status-pick"
            role="group"
            aria-label={`How well do you know question ${index}?`}
          >
            {STATUS_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                className={`status-opt opt-${choice.value}${
                  status === choice.value ? " is-on" : ""
                }`}
                aria-pressed={status === choice.value}
                title={choice.hint}
                /* Clicking the state you're already in steps back to unmarked,
                   so undoing a misclick is one tap, not a hunt for the dash. */
                onClick={() =>
                  onSetStatus(
                    question.id,
                    status === choice.value ? "new" : choice.value
                  )
                }
              >
                {choice.value === "new" ? (
                  <span aria-hidden="true">{choice.label}</span>
                ) : (
                  choice.label
                )}
                {choice.value === "new" && (
                  <span className="sr-only">Not marked</span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`note-btn${note ? " has-note" : ""}`}
            aria-expanded={editing}
            onClick={() => setEditing((e) => !e)}
          >
            {note ? "edit note" : "add note"}
          </button>
        </div>
      </div>

      {/* Your own words, so they stay visible whether or not the model answer
          is expanded. */}
      {(note || editing) && (
        <div className="note-block">
          {editing ? (
            <NoteEditor
              questionId={question.id}
              initial={note?.body ?? ""}
              onSave={(body) => onSaveNote(question.id, body)}
              onDelete={() => onDeleteNote(question.id)}
              onClose={() => setEditing(false)}
            />
          ) : (
            <p className="note-text">{note!.body}</p>
          )}
        </div>
      )}

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
