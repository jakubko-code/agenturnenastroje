"use client";

import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  users?: UserRow[];
  error?: { code: string; message: string };
};

export function AdminUsersManager() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = (await response.json()) as UsersResponse;

      if (!response.ok) {
        setError(data.error?.message ?? "Nepodarilo sa nacitat pouzivatelov.");
        return;
      }

      setRows(data.users ?? []);
    } catch {
      setError("Nepodarilo sa nacitat pouzivatelov.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.email.localeCompare(b.email));
  }, [rows]);

  async function changeRole(userId: string, role: "admin" | "editor" | "viewer") {
    setSavingId(userId);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
      });

      const data = (await response.json()) as {
        user?: Pick<UserRow, "id" | "role" | "updatedAt">;
        error?: { code: string; message: string };
      };

      if (!response.ok) {
        setError(data.error?.message ?? "Nepodarilo sa zmenit rolu.");
        return;
      }

      setRows((prev) => prev.map((row) => (row.id === userId ? { ...row, role, updatedAt: data.user?.updatedAt ?? row.updatedAt } : row)));
      setInfo("Rola bola aktualizovana.");
    } catch {
      setError("Nepodarilo sa zmenit rolu.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <p>Nacitavam pouzivatelov...</p>;
  }

  return (
    <div className="stack">
      <div className="button-row">
        <button type="button" className="btn btn-secondary" onClick={loadUsers}>
          Obnovit zoznam
        </button>
      </div>

      {info ? <p className="ok-box">{info}</p> : null}
      {error ? <p className="error-box">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Meno</th>
              <th>Rola</th>
              <th>Status</th>
              <th>Vytvoreny</th>
              <th>Naposledy zmeneny</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.email}</td>
                <td>{row.name ?? ""}</td>
                <td>
                  <select
                    value={row.role}
                    onChange={(e) => changeRole(row.id, e.target.value as "admin" | "editor" | "viewer")}
                    disabled={savingId === row.id}
                  >
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                    <option value="viewer">viewer</option>
                  </select>
                </td>
                <td>{row.isActive ? "active" : "inactive"}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{new Date(row.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
