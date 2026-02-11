"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

const CLIENT_TYPES = ["eshop", "sluzba"] as const;

export function RsaForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    clientType: "eshop",
    productService: "",
    targetAudience: "",
    keywords: "",
    usp: "",
    trustSignals: "",
    objections: "",
    cta: "",
    tone: "",
    url: ""
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    if (!formData.productService.trim() || !formData.keywords.trim()) {
      setError("Prosim, vypln minimalne: Produkt/sluzba a Hladane vyrazy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/rsa", {
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

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="tool-stack">
      <section className="card tool-main-card">
        <label>Typ klienta:</label>
        <div className="chip-group">
          {CLIENT_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              className={formData.clientType === value ? "chip-btn is-selected" : "chip-btn"}
              onClick={() => setField("clientType", value)}
            >
              {value === "eshop" ? "E-shop" : "Sluzba"}
            </button>
          ))}
        </div>

        <label>
          Produkt/sluzba: <span className="required-mark">*</span>
          <textarea value={formData.productService} onChange={(e) => setField("productService", e.target.value)} />
        </label>

        <label>
          Cielova skupina:
          <textarea value={formData.targetAudience} onChange={(e) => setField("targetAudience", e.target.value)} />
        </label>

        <label>
          Hladane vyrazy, na ktore cielis: <span className="required-mark">*</span>
          <textarea value={formData.keywords} onChange={(e) => setField("keywords", e.target.value)} />
        </label>

        <label>
          Hlavne predajne argumenty (USP):
          <textarea value={formData.usp} onChange={(e) => setField("usp", e.target.value)} />
        </label>

        <label>
          Signaly doveryhodnosti:
          <textarea value={formData.trustSignals} onChange={(e) => setField("trustSignals", e.target.value)} />
        </label>

        <label>
          Najcastejsie namietky zakaznikov:
          <textarea value={formData.objections} onChange={(e) => setField("objections", e.target.value)} />
        </label>

        <label>
          Spustace urgencie / CTA:
          <textarea value={formData.cta} onChange={(e) => setField("cta", e.target.value)} />
        </label>

        <label>
          Ton komunikacie:
          <input value={formData.tone} onChange={(e) => setField("tone", e.target.value)} />
        </label>

        <label>
          URL webu:
          <input value={formData.url} onChange={(e) => setField("url", e.target.value)} />
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
          {loading ? "Generujem ..." : "Generuj"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
