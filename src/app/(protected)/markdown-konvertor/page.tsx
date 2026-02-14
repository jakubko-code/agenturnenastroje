import { MarkdownConverter } from "@/components/markdown-converter";

export default function MarkdownKonvertorPage() {
  return (
    <section className="stack">
      <h1>Markdown konvertor</h1>
      <p className="lead">
        Jednoduchý konvertor na odstránenie markdown formátovania z výstupov AI (Gemini, Claude) do čistého textu.
      </p>
      <MarkdownConverter />
    </section>
  );
}

