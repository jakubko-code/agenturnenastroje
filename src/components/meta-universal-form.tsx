"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

const BUSINESS_TYPES = [
  "B2B (predaj firmam)",
  "B2C (koncovi zakaznici)",
  "E-shop",
  "Sluzba",
  "Lokalny biznis",
  "Ine / specificke"
] as const;

const CAMPAIGN_GOALS = [
  "Predaj / nakupy",
  "Leady / dopyty / formulare",
  "Rezervacie / objednanie terminu",
  "Navstevnost webu",
  "Brand awareness / engagement",
  "Navstevy prevadzky / lokalny biznis"
] as const;

export function MetaUniversalForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    businessType: "",
    campaignGoal: "",
    offer: "",
    targetAudience: "",
    toneOfVoice: "",
    url: "",
    notes: ""
  });

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    if (!formData.offer.trim() || !formData.targetAudience.trim() || !formData.toneOfVoice.trim()) {
      setError("Prosim, vypln minimalne: Popis ponuky, Cielovu skupinu a Ton komunikacie.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/meta-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, formData })
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
        <label>Typ biznisu:</label>
        <div className="chip-group">
          {BUSINESS_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              className={formData.businessType === value ? "chip-btn is-selected" : "chip-btn"}
              onClick={() => setField("businessType", value)}
            >
              {value}
            </button>
          ))}
        </div>

        <label>Hlavny ciel kampane v Meta Ads:</label>
        <div className="chip-group">
          {CAMPAIGN_GOALS.map((value) => (
            <button
              key={value}
              type="button"
              className={formData.campaignGoal === value ? "chip-btn is-selected" : "chip-btn"}
              onClick={() => setField("campaignGoal", value)}
            >
              {value}
            </button>
          ))}
        </div>

        <label>
          Popis ponuky (sluzba/produkt/benefit): <span className="required-mark">*</span>
          <textarea
            value={formData.offer}
            onChange={(e) => setField("offer", e.target.value)}
            placeholder="Strucne, ale vystizne popis, co ponukate. Co presne klient ziska, aky problem riesite, ake su hlavne benefity."
          />
        </label>

        <label>
          Cielova skupina: <span className="required-mark">*</span>
          <textarea
            value={formData.targetAudience}
            onChange={(e) => setField("targetAudience", e.target.value)}
            placeholder="Kto su, v akej situacii su, co riesia, co chcu dosiahnut. Mozes sem vlozit vystup z nastroja Definovanie cielovej skupiny."
          />
        </label>

        <label>
          Ton komunikacie (tone-of-voice): <span className="required-mark">*</span>
          <input
            value={formData.toneOfVoice}
            onChange={(e) => setField("toneOfVoice", e.target.value)}
            placeholder="napr. Profesionalny a vecny, Priatelsky a uvolneny, Expertne-poradensky, Odvazny a priamy..."
          />
        </label>

        <label>
          URL landing page / webu (nepovinne):
          <input
            value={formData.url}
            onChange={(e) => setField("url", e.target.value)}
            placeholder="https://www.vas-web.sk/sluzba alebo landing page"
          />
        </label>

        <label>
          Specifika kampane / poznamky (nepovinne):
          <textarea
            value={formData.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="napr. prebiehajuca akcia, obmedzena kapacita, unikatne odlisnie, info o referenciach..."
          />
        </label>
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
          {loading ? "GENERUJEM..." : "Generuj"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
