"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

export function StsInsightsForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    sheetUrl: "",
    websiteUrl: "",
    businessDesc: "",
    minImpr: "",
    maxRows: "300"
  });

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    const sheetUrl = formData.sheetUrl.trim();
    if (!sheetUrl) {
      setError("Prosím, zadaj URL Google Sheetu so search terms.");
      return;
    }
    if (!sheetUrl.startsWith("https://docs.google.com/spreadsheets/")) {
      setError("Vyzerá to, ze URL nie je Google Sheet. Skontroluj prosím odkaz.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sts-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          formData: {
            sheetUrl,
            websiteUrl: formData.websiteUrl.trim(),
            businessDesc: formData.businessDesc.trim(),
            minImpr: formData.minImpr ? Number(formData.minImpr) : 0,
            maxRows: formData.maxRows ? Number(formData.maxRows) : 300,
            language: "sk"
          }
        })
      });

      const data = (await response.json()) as ResponseShape;
      if (!response.ok) {
        setError(data.error?.message ?? "Neznama chyba.");
        return;
      }
      setResult(data.generatedText ?? "");
    } catch {
      setError("Volanie API zlyhalo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="tool-stack">
      <section className="card tool-main-card">
        <label>
          URL Google Sheetu so search terms (Search_Terms_Script): <span className="required-mark">*</span>
          <input
            type="text"
            value={formData.sheetUrl}
            onChange={(e) => setField("sheetUrl", e.target.value)}
            placeholder="Vlož URL spreadsheetu, kde beži Search_Terms_Script"
          />
        </label>

        <label>
          URL webu klienta (na rozpoznanie brand / non-brand):
          <input
            type="text"
            value={formData.websiteUrl}
            onChange={(e) => setField("websiteUrl", e.target.value)}
            placeholder="https://www.klient.sk"
          />
        </label>
        <p className="hint-text">Nástroj si z webu stiahne obsah a podľa neho rozlíši brandové dotazy.</p>

        <label>
          Stručný popis biznisu a značiek (voliteľné, odporúčané):
          <textarea
            value={formData.businessDesc}
            onChange={(e) => setField("businessDesc", e.target.value)}
            placeholder="Napíš, čo klient predáva, aké značky, cieľovú skupinu, hlavne USP …"
          />
        </label>
        <p className="hint-text">
          Použije sa ako doplnkový kontext k webu alebo ako fallback, ak sa web nepodarí načítať.
        </p>

        <label>
          Min. impresie (filter v rámci nástroja):
          <input
            type="number"
            min={0}
            value={formData.minImpr}
            onChange={(e) => setField("minImpr", e.target.value)}
            placeholder="napr. 20"
          />
        </label>
        <p className="hint-text">
          Dodatočný filter nad tým, čo už filtroval Search_Terms_Script. Nechaj prázdne pre použitie všetkého.
        </p>

        <label>
          Max. počet search termov v analýze:
          <input
            type="number"
            min={50}
            value={formData.maxRows}
            onChange={(e) => setField("maxRows", e.target.value)}
          />
        </label>
        <p className="hint-text">Odporúčané 200 - 500, podľa veľkosti účtu. Riadky sú zoradené podľa impresií.</p>
      </section>

      <section className="card generation-card">
        <label>Zvol si model:</label>
        <div className="model-button-group">
          <button
            type="button"
            className={model === "gemini" ? "model-btn is-selected" : "model-btn"}
            onClick={() => setModel("gemini")}
          >
            Gemini 2.5 PRO
          </button>
          <button
            type="button"
            className={model === "openai" ? "model-btn is-selected" : "model-btn"}
            onClick={() => setModel("openai")}
          >
            GPT-5
          </button>
          <button
            type="button"
            className={model === "claude" ? "model-btn is-selected" : "model-btn"}
            onClick={() => setModel("claude")}
          >
            Claude 3.5 Sonnet
          </button>
        </div>

        <button className="btn create-btn" type="submit" disabled={loading}>
          {loading ? "Generujem ..." : "Generuj"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
