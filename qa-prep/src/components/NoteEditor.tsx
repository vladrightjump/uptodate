import { useEffect, useRef, useState } from "react";

interface Props {
  questionId: string;
  /** Existing note body, or "" when writing the first one. */
  initial: string;
  onSave: (body: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * The textarea behind "add note". One note per question, so this edits a
 * single body rather than appending to a list.
 */
export function NoteEditor({
  questionId,
  initial,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [draft, setDraft] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    /* Land the caret at the end, not over the text you came back to edit. */
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const dirty = draft.trim() !== initial.trim();

  const save = () => {
    onSave(draft);
    onClose();
  };

  return (
    <form
      className="note-editor"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="sr-only" htmlFor={`note-${questionId}`}>
        Your note on this question
      </label>
      <textarea
        id={`note-${questionId}`}
        ref={ref}
        className="note-input"
        rows={4}
        maxLength={5000}
        value={draft}
        placeholder="What tripped you up? The answer in your own words…"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          /* ⌘/Ctrl+Enter saves — a newline is the plain Enter you want here. */
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
      />

      <div className="note-actions">
        <button type="submit" className="primary-sm" disabled={!dirty}>
          save
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          cancel
        </button>
        {initial && (
          <button
            type="button"
            className="link note-delete"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            delete
          </button>
        )}
        <span className="note-hint" aria-hidden="true">
          ⌘↵ to save
        </span>
      </div>
    </form>
  );
}
