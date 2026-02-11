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

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cas</th>
            <th>Nastroj</th>
            <th>Provider / model</th>
            <th>Tokeny</th>
            <th>Odhad ceny</th>
            <th>Status</th>
            <th>Chyba</th>
            <th>Vystup</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <tr>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.toolName}</td>
                  <td>{row.provider ?? "-"} / {row.model}</td>
                  <td>{row.totalTokens ?? "-"}</td>
                  <td>{typeof row.estimatedCostUsd === "number" ? `$${row.estimatedCostUsd.toFixed(4)}` : "-"}</td>
                  <td>{row.status}</td>
                  <td>{row.errorMessage ?? ""}</td>
                  <td>
                    {row.outputText ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setExpandedId(isOpen ? null : row.id)}
                      >
                        {isOpen ? "Skryt" : "Zobrazit"}
                      </button>
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
                {isOpen ? (
                  <tr>
                    <td colSpan={8}>
                      <pre className="result-box">{row.outputText}</pre>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
