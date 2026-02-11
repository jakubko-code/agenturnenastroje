"use client";

import { useEffect, useState } from "react";

type Status = {
  keys: { openai: boolean; gemini: boolean; claude: boolean };
};

export function SettingsForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");

  async function loadStatus() {
    setError("");
    const response = await fetch("/api/settings");
    const data = await response.json();

    if (!response.ok) {
      setError(data?.error?.message ?? "Nepodarilo sa nacitat stav klucov.");
      return;
    }

    setStatus(data);
  }

  useEffect(() => {
    loadStatus().catch(() => setError("Nepodarilo sa nacitat stav klucov."));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload: { openaiApiKey?: string; geminiApiKey?: string; claudeApiKey?: string } = {};
    const openai = openaiApiKey.trim();
    const gemini = geminiApiKey.trim();
    const claude = claudeApiKey.trim();

    if (openai) payload.openaiApiKey = openai;
    if (gemini) payload.geminiApiKey = gemini;
    if (claude) payload.claudeApiKey = claude;

    if (Object.keys(payload).length === 0) {
      setError("Vypln aspon jeden API kluc na ulozenie.");
      return;
    }

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.error?.message ?? "Ulozenie zlyhalo.");
      return;
    }

    setStatus(data);
    setMessage("Kluc bol ulozeny.");
    setOpenaiApiKey("");
    setGeminiApiKey("");
    setClaudeApiKey("");
  }

  return (
    <div className="stack">
      <div className="status-row">
        <span>OpenAI: {status?.keys.openai ? "configured" : "missing"}</span>
        <span>Gemini: {status?.keys.gemini ? "configured" : "missing"}</span>
        <span>Claude: {status?.keys.claude ? "configured" : "missing"}</span>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label>
          OpenAI API key
          <span className={status?.keys.openai ? "provider-badge is-added" : "provider-badge"}>
            {status?.keys.openai ? "Pridany" : "Chyba"}
          </span>
          <input type="password" value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)} />
        </label>

        <label>
          Gemini API key
          <span className={status?.keys.gemini ? "provider-badge is-added" : "provider-badge"}>
            {status?.keys.gemini ? "Pridany" : "Chyba"}
          </span>
          <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} />
        </label>

        <label>
          Claude API key
          <span className={status?.keys.claude ? "provider-badge is-added" : "provider-badge"}>
            {status?.keys.claude ? "Pridany" : "Chyba"}
          </span>
          <input type="password" value={claudeApiKey} onChange={(e) => setClaudeApiKey(e.target.value)} />
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
