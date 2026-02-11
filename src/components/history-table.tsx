"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  toolName: string;
  model: string;
  status: string;
  createdAt: string;
  errorMessage?: string | null;
};

export function HistoryTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

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
            <th>Model</th>
            <th>Status</th>
            <th>Chyba</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.createdAt).toLocaleString()}</td>
              <td>{row.toolName}</td>
              <td>{row.model}</td>
              <td>{row.status}</td>
              <td>{row.errorMessage ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
