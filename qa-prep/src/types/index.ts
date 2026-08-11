export type Difficulty = "easy" | "mid" | "hard";

export interface CodeBlock {
  lang: "sql" | "js" | "ts" | "text";
  src: string;
  caption?: string;
}

export interface TableBlock {
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface Question {
  id: string;
  /** The question as it was asked in the interview. */
  q: string;
  diff: Difficulty;
  tags?: string[];
  /** Optional table shown with the prompt (e.g. a schema sample). */
  table?: TableBlock;
  /** Optional code shown with the prompt — the thing you're asked to explain. */
  prompt?: CodeBlock;
  /** Model answer. Trusted, hand-authored HTML. */
  answer: string;
  /** Optional code shown inside the answer (e.g. the query you'd write). */
  solution?: CodeBlock[];
}

export interface Round {
  id: string;
  label: string;
  desc: string;
  questions: Question[];
}

export type Theme = "auto" | "light" | "dark";
export type DiffFilter = "all" | Difficulty;
