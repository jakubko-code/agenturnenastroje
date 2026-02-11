"use client";

import { Fragment, useEffect, useState } from "react";

type Row = {
  id: string;
  toolName: string;
  provider?: string | null;
  model: string;
  status: string;
  createdAt: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  outputText?: string | null;
  errorMessage?: string | null;
};

export function HistoryTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <div className="history-accordion">
      {rows.map((row) => {
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
                  {row.toolName} <span className="history-provider">({row.provider ?? "-"} / {row.model})</span>
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
                {row.errorMessage ? <p className="error-box">{row.errorMessage}</p> : null}
                {row.outputText ? <pre className="result-box">{row.outputText}</pre> : <p className="hint-text">Bez vystupu.</p>}
                <p className="history-token-detail">
                  Input tokeny: {row.inputTokens ?? "-"} | Output tokeny: {row.outputTokens ?? "-"}
                </p>
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
