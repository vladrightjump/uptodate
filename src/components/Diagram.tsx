import { useEffect, useRef, useState } from "react";

interface DiagramProps {
  source: string;
}

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      const m = mod.default;
      m.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        // The app ships a single light ("modern") palette, so diagrams always
        // use mermaid's light theme to stay visually consistent.
        theme: "default",
        fontFamily: "inherit",
      });
      return m;
    });
  }
  return mermaidPromise;
}

export function Diagram({ source }: DiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mmd-${Math.random().toString(36).slice(2)}`;
    (async () => {
      try {
        const mermaid = await loadMermaid();
        const { svg } = await mermaid.render(id, source);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Diagram render failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <pre className="diagram-error" role="alert">
        Diagram error: {error}
      </pre>
    );
  }
  return <div className="diagram" ref={ref} aria-label="Diagram" />;
}
