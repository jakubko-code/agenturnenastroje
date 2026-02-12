"use client";

import { Fragment, useEffect, useState } from "react";

type Row = {
  id: string;
  toolName: string;
  provider?: string | null;
  model: string;
  inputJson?: unknown;
  status: string;
  createdAt: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  outputText?: string | null;
  errorMessage?: string | null;
};

function getToolDisplayName(toolName: string): string {
  if (toolName === "meta_universal") return "Generovanie reklamných textov pre META Ads (AI)";
  if (toolName === "rsa") return "Generovanie RSA reklám pre Google Ads (AI)";
  if (toolName === "sts_insights") return "(AI) Insights zo search terms";
  return toolName;
}

function formatInput(input: unknown): string {
  if (input === null || typeof input === "undefined") return "";
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

export function HistoryTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message ?? "Nepodarilo sa nacitat historiu.");
        }
        setRows(data.rows ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <p className="error-box">{error}</p>;
  }

  if (rows.length === 0) {
    return <p className="hint-text">Zatial tu nie su ziadne zaznamy historie.</p>;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows =
    normalizedQuery.length === 0
      ? rows
      : rows.filter((row) => {
          const haystack = [
            getToolDisplayName(row.toolName),
            row.toolName,
            row.provider ?? "",
            row.model ?? "",
            row.status ?? "",
            formatInput(row.inputJson),
            row.outputText ?? "",
            row.errorMessage ?? "",
            new Date(row.createdAt).toLocaleString()
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        });

  return (
    <div className="stack">
      <section className="card history-search-card">
        <label htmlFor="history-search-input" className="history-search-label">
          Vyhľadať v histórii:
        </label>
        <input
          id="history-search-input"
          type="text"
          className="history-search-input"
          placeholder="Zadaj slovo alebo frazu..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      {filteredRows.length === 0 ? (
        <p className="hint-text">Pre zadany vyraz sa nenasli ziadne zaznamy.</p>
      ) : (
        <div className="history-accordion">
          {filteredRows.map((row) => {
            const isOpen = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <button
                  type="button"
                  className={isOpen ? "history-accordion-header is-open" : "history-accordion-header"}
                  onClick={() => setExpandedId(isOpen ? null : row.id)}
                >
                  <div className="history-accordion-main">
                    <p className="history-title">
                      {getToolDisplayName(row.toolName)}{" "}
                      <span className="history-provider">({row.provider ?? "-"} / {row.model})</span>
                    </p>
                    <p className="history-meta">
                      {new Date(row.createdAt).toLocaleString()} | tokeny: {row.totalTokens ?? "-"} | odhad:{" "}
                      {typeof row.estimatedCostUsd === "number" ? `$${row.estimatedCostUsd.toFixed(4)}` : "-"} | status:{" "}
                      {row.status}
                    </p>
                  </div>
                  <span className={isOpen ? "history-arrow is-open" : "history-arrow"}>▾</span>
                </button>

                {isOpen ? (
                  <div className="history-accordion-body">
                    {row.inputJson ? (
                      <>
                        <p className="history-section-title">Vstup používateľa</p>
                        <pre className="result-box">{formatInput(row.inputJson)}</pre>
                      </>
                    ) : null}
                    {row.errorMessage ? <p className="error-box">{row.errorMessage}</p> : null}
                    {row.outputText ? (
                      <>
                        <p className="history-section-title">Výstup AI</p>
                        <pre className="result-box">{row.outputText}</pre>
                      </>
                    ) : (
                      <p className="hint-text">Bez vystupu.</p>
                    )}
                    <p className="history-token-detail">
                      Input tokeny: {row.inputTokens ?? "-"} | Output tokeny: {row.outputTokens ?? "-"}
                    </p>
                  </div>
                ) : null}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
