"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

export function MetaProductForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    targetAudience: "",
    toneOfVoice: "",
    productDescription: "",
    productUrl: ""
  });

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    if (!formData.toneOfVoice.trim() || !formData.targetAudience.trim() || !formData.productDescription.trim()) {
      setError("Prosim, vypln vsetky povinne polia (okrem URL).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/meta-texty-pre-produkty", {
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
        <label>
          Popis cieľovej skupiny: <span className="required-mark">*</span>
          <textarea
            value={formData.targetAudience}
            onChange={(e) => setField("targetAudience", e.target.value)}
            placeholder="Napr. Muzi vo veku 25-40 rokov..."
          />
        </label>

        <label>
          Tone-of-voice klienta: <span className="required-mark">*</span>
          <textarea
            value={formData.toneOfVoice}
            onChange={(e) => setField("toneOfVoice", e.target.value)}
            placeholder="Napr. Priatelsky, ale zaroven odborny..."
          />
        </label>

        <label>
          Popis produktu: <span className="required-mark">*</span>
          <textarea
            value={formData.productDescription}
            onChange={(e) => setField("productDescription", e.target.value)}
            placeholder="Co najdetailnejsi popis produktu. Klucove vyhody..."
          />
        </label>

        <label>
          URL adresa produktu (nepovinné):
          <input
            type="text"
            value={formData.productUrl}
            onChange={(e) => setField("productUrl", e.target.value)}
            placeholder="https://www.vas-eshop.sk/nazov-produktu"
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
            Gemini 3 PRO Preview
          </button>
          <button
            type="button"
            className={model === "openai" ? "model-btn is-selected" : "model-btn"}
            onClick={() => setModel("openai")}
          >
            ChatGPT 5.2
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
