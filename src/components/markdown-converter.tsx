"use client";

import { useMemo, useState } from "react";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdownToHtml(input: string): string {
  if (!input.trim()) return "<p></p>";

  let text = escapeHtml(input);

  text = text.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
  text = text.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, "<oli>$1</oli>");
  text = text.replace(/(?:<oli>[\s\S]*?<\/oli>\n?)+/g, (match) => `<ol>${match.replaceAll("<oli>", "<li>").replaceAll("</oli>", "</li>")}</ol>`);

  text = text.replace(/^\s*-\s+(.+)$/gm, "<li>$1</li>");
  text = text.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (match) => {
    if (match.includes("<ol>")) return match;
    return `<ul>${match}</ul>`;
  });

  text = text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^<\/?(h1|h2|h3|pre|ul|ol|li|p|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return text;
}

function convertMarkdownToPlainText(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```(?:\w+)?/g, "").trim())
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "• ")
    .replace(/^\|/gm, "")
    .replace(/\|$/gm, "")
    .replace(/\|/g, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function MarkdownConverter() {
  const [sourceText, setSourceText] = useState("");
  const convertedText = useMemo(() => convertMarkdownToPlainText(sourceText), [sourceText]);
  const markdownHtml = useMemo(() => renderMarkdownToHtml(sourceText), [sourceText]);

  async function copyOutput() {
    if (!convertedText) return;
    await navigator.clipboard.writeText(convertedText);
  }

  function clearAll() {
    setSourceText("");
  }

  return (
    <div className="tool-stack">
      <section className="card tool-main-card">
        <label>
          Vstupný text (markdown):
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Sem vlož text z Gemini/Claude s markdown formátovaním..."
          />
        </label>
      </section>

      <section className="card tool-main-card">
        <h3>Renderovaný markdown</h3>
        <div className="result-box audience-html-output markdown-preview" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
      </section>

      <section className="card generation-card">
        <div className="button-row">
          <button type="button" className="btn btn-secondary" onClick={copyOutput} disabled={!convertedText}>
            Kopírovať výstup
          </button>
          <button type="button" className="btn btn-secondary" onClick={clearAll} disabled={!sourceText}>
            Vyčistiť
          </button>
        </div>
      </section>
    </div>
  );
}
