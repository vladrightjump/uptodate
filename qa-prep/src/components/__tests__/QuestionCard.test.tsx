import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Question } from "../../types";
import { QuestionCard } from "../QuestionCard";

const question: Question = {
  id: "q1",
  q: "What is an index?",
  diff: "easy",
  answer: "<p>A lookup structure.</p>",
};

function setup(overrides: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onSaveNote = vi.fn();
  const onDeleteNote = vi.fn();
  const utils = render(
    <QuestionCard
      question={question}
      index={1}
      open={false}
      reviewed={false}
      onToggleOpen={vi.fn()}
      onToggleReviewed={vi.fn()}
      onSaveNote={onSaveNote}
      onDeleteNote={onDeleteNote}
      {...overrides}
    />
  );
  return { ...utils, onSaveNote, onDeleteNote };
}

describe("QuestionCard notes", () => {
  it("offers to add a note and hides the editor until asked", () => {
    setup();
    expect(screen.getByRole("button", { name: "add note" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("saves what you type and closes", () => {
    const { onSaveNote } = setup();

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "B-tree, not a hash" },
    });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    expect(onSaveNote).toHaveBeenCalledWith("q1", "B-tree, not a hash");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("will not save an untouched editor", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("drops the draft on cancel", () => {
    const { onSaveNote } = setup();

    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "throwaway" },
    });
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(onSaveNote).not.toHaveBeenCalled();
    expect(screen.queryByText("throwaway")).not.toBeInTheDocument();
  });

  /* A note is your own material — it should not be buried behind the same
     toggle that hides the model answer. */
  it("shows an existing note while the answer is collapsed", () => {
    setup({
      open: false,
      note: { body: "check the query plan", updated_at: "2026-08-01" },
    });

    expect(screen.getByText("check the query plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "edit note" })).toBeInTheDocument();
  });

  it("opens an existing note for editing, prefilled", () => {
    const { onSaveNote } = setup({
      note: { body: "old text", updated_at: "2026-08-01" },
    });

    fireEvent.click(screen.getByRole("button", { name: "edit note" }));
    const box = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(box.value).toBe("old text");

    fireEvent.change(box, { target: { value: "new text" } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(onSaveNote).toHaveBeenCalledWith("q1", "new text");
  });

  it("deletes only when a note exists", () => {
    const { onDeleteNote, unmount } = setup();
    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    expect(screen.queryByRole("button", { name: "delete" })).not.toBeInTheDocument();
    unmount();

    const second = setup({ note: { body: "gone soon", updated_at: "" } });
    fireEvent.click(screen.getByRole("button", { name: "edit note" }));
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(second.onDeleteNote).toHaveBeenCalledWith("q1");
    expect(onDeleteNote).not.toHaveBeenCalled();
  });

  it("saves on ⌘↵ without submitting a newline", () => {
    const { onSaveNote } = setup();
    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "quick save" } });
    fireEvent.keyDown(box, { key: "Enter", metaKey: true });

    expect(onSaveNote).toHaveBeenCalledWith("q1", "quick save");
  });

  it("closes on Escape without saving", () => {
    const { onSaveNote } = setup();
    fireEvent.click(screen.getByRole("button", { name: "add note" }));
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "nope" } });
    fireEvent.keyDown(box, { key: "Escape" });

    expect(onSaveNote).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
