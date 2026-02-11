"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

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
      setError("Povinne polia: ponuka, cielova skupina a ton komunikacie.");
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
        Typ biznisu
        <select value={formData.businessType} onChange={(e) => setField("businessType", e.target.value)}>
          <option value="">Vyber</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
          <option value="E-shop">E-shop</option>
          <option value="Sluzba">Sluzba</option>
          <option value="Lokalny biznis">Lokalny biznis</option>
        </select>
      </label>

      <label>
        Hlavny ciel kampane
        <select value={formData.campaignGoal} onChange={(e) => setField("campaignGoal", e.target.value)}>
          <option value="">Vyber</option>
          <option value="Predaj / nakupy">Predaj / nakupy</option>
          <option value="Leady / dopyty / formulare">Leady / dopyty / formulare</option>
          <option value="Rezervacie / objednanie terminu">Rezervacie / objednanie terminu</option>
          <option value="Navstevnost webu">Navstevnost webu</option>
          <option value="Brand awareness / engagement">Brand awareness / engagement</option>
          <option value="Navstevy prevadzky">Navstevy prevadzky</option>
        </select>
      </label>

      <label>
        Popis ponuky *
        <textarea value={formData.offer} onChange={(e) => setField("offer", e.target.value)} />
      </label>

      <label>
        Cielova skupina *
        <textarea value={formData.targetAudience} onChange={(e) => setField("targetAudience", e.target.value)} />
      </label>

      <label>
        Ton komunikacie *
        <input value={formData.toneOfVoice} onChange={(e) => setField("toneOfVoice", e.target.value)} />
      </label>

      <label>
        URL (nepovinne)
        <input value={formData.url} onChange={(e) => setField("url", e.target.value)} />
      </label>

      <label>
        Poznamky (nepovinne)
        <textarea value={formData.notes} onChange={(e) => setField("notes", e.target.value)} />
      </label>

      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Generujem..." : "Vytvorit Meta texty"}
      </button>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
