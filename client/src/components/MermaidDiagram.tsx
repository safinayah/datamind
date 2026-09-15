import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#7c3aed",
    primaryTextColor: "#f1f5f9",
    primaryBorderColor: "#6d28d9",
    lineColor: "#94a3b8",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    background: "#0f172a",
    mainBkg: "#1e293b",
    nodeBorder: "#6d28d9",
    clusterBkg: "#1e293b",
    titleColor: "#f1f5f9",
    edgeLabelBackground: "#1e293b",
    fontFamily: "Inter, sans-serif",
  },
  flowchart: { curve: "basis", padding: 16 },
  sequence: { actorMargin: 50 },
});

let counter = 0;

export default function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++counter}`;
    mermaid
      .render(id, code.trim())
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="text-xs text-red-400 bg-slate-900 rounded-lg p-3 overflow-x-auto">
        {code}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-20 text-slate-500 text-sm">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 rounded-xl bg-slate-900/60 border border-white/10 p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
