"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

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
      setError("Povinne polia: produkt/sluzba a klucove slova.");
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
    <form onSubmit={onSubmit} className="stack">
      <label>
        Model
        <select value={model} onChange={(e) => setModel(e.target.value as Model)}>
          <option value="gemini">Gemini 2.5 Pro</option>
          <option value="openai">GPT-5</option>
          <option value="claude">Claude Sonnet</option>
        </select>
      </label>

      <label>
        Typ klienta
        <select value={formData.clientType} onChange={(e) => setField("clientType", e.target.value)}>
          <option value="eshop">E-shop</option>
          <option value="sluzba">Sluzba</option>
        </select>
      </label>

      <label>
        Produkt/sluzba *
        <textarea value={formData.productService} onChange={(e) => setField("productService", e.target.value)} />
      </label>

      <label>
        Klucove slova *
        <textarea value={formData.keywords} onChange={(e) => setField("keywords", e.target.value)} />
      </label>

      <label>
        Cielova skupina
        <textarea value={formData.targetAudience} onChange={(e) => setField("targetAudience", e.target.value)} />
      </label>

      <label>
        USP
        <textarea value={formData.usp} onChange={(e) => setField("usp", e.target.value)} />
      </label>

      <label>
        Signaly dovery
        <textarea value={formData.trustSignals} onChange={(e) => setField("trustSignals", e.target.value)} />
      </label>

      <label>
        Namietky
        <textarea value={formData.objections} onChange={(e) => setField("objections", e.target.value)} />
      </label>

      <label>
        CTA
        <textarea value={formData.cta} onChange={(e) => setField("cta", e.target.value)} />
      </label>

      <label>
        Ton
        <input value={formData.tone} onChange={(e) => setField("tone", e.target.value)} />
      </label>

      <label>
        URL
        <input value={formData.url} onChange={(e) => setField("url", e.target.value)} />
      </label>

      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Generujem..." : "Vytvorit RSA"}
      </button>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
