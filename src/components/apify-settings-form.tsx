"use client";

import { useEffect, useState } from "react";

type Status = {
  keys: { apify: boolean };
};

export function ApifySettingsForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [apifyApiKey, setApifyApiKey] = useState("");

  async function loadStatus() {
    setError("");
    const response = await fetch("/api/apify-settings");
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error?.message ?? "Nepodarilo sa nacitat stav Apify kluca.");
      return;
    }

    setStatus(data);
  }

  useEffect(() => {
    loadStatus().catch(() => setError("Nepodarilo sa nacitat stav Apify kluca."));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const value = apifyApiKey.trim();
    if (!value) {
      setError("Vypln API kluc na ulozenie.");
      return;
    }

    const response = await fetch("/api/apify-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apifyApiKey: value })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error?.message ?? "Ulozenie zlyhalo.");
      return;
    }

    setStatus(data);
    setMessage("Apify kluc bol ulozeny.");
    setApifyApiKey("");
  }

  return (
    <div className="stack">
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Apify API key
          <span className={status?.keys.apify ? "provider-badge is-added" : "provider-badge"}>
            {status?.keys.apify ? "Pridaný" : "Chýba"}
          </span>
          <input type="password" value={apifyApiKey} onChange={(e) => setApifyApiKey(e.target.value)} />
        </label>

        <button className="btn create-btn settings-save-btn" type="submit">
          Uložiť
        </button>
      </form>

      {message ? <p className="ok-box">{message}</p> : null}
      {error ? <p className="error-box">{error}</p> : null}
    </div>
  );
}
