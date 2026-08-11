import { useState } from "react";
import type { CodeBlock as CodeBlockType } from "../types";

export function CodeBlock({ block }: { block: CodeBlockType }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(block.src);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — nothing useful to do */
    }
  };

  return (
    <figure className="code">
      <figcaption>
        <span className="code-lang">{block.lang}</span>
        {block.caption && <span className="code-caption">{block.caption}</span>}
        <button type="button" className="copy" onClick={copy}>
          {copied ? "copied" : "copy"}
        </button>
      </figcaption>
      <pre>
        <code>{block.src}</code>
      </pre>
    </figure>
  );
}
