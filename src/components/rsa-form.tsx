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
        <label>Typ biznisu:</label>
        <div className="chip-group">
          {CLIENT_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              className={formData.clientType === value ? "chip-btn is-selected" : "chip-btn"}
              onClick={() => setField("clientType", value)}
            >
              {value === "eshop" ? "E-shop" : "Služba"}
            </button>
          ))}
        </div>

        <label>
          Služba/produkt: <span className="required-mark">*</span>
          <textarea
            value={formData.productService}
            onChange={(e) => setField("productService", e.target.value)}
            placeholder="Jasne popíš produkt/kategóriu e-shopu alebo službu..."
          />
        </label>

        <label>
          Cieľová skupina:
          <textarea
            value={formData.targetAudience}
            onChange={(e) => setField("targetAudience", e.target.value)}
            placeholder="Kto sú (demografia), čo pravdepodobne vyhľadávajú (problémy), čo chcú (výsledok)..."
          />
        </label>

        <label>
          Hľadané výrazy, na ktoré cieliš: <span className="required-mark">*</span>
          <textarea
            value={formData.keywords}
            onChange={(e) => setField("keywords", e.target.value)}
            placeholder="Uveď 5–10 presných alebo frázových kľúčových slov..."
          />
        </label>

        <label>
          Hlavné predajné argumenty (USP):
          <textarea
            value={formData.usp}
            onChange={(e) => setField("usp", e.target.value)}
            placeholder="Konkrétne vlastnosti produktu, benefity, odlíšenie od konkurencie..."
          />
        </label>

        <label>
          Signály dôveryhodnosti:
          <textarea
            value={formData.trustSignals}
            onChange={(e) => setField("trustSignals", e.target.value)}
            placeholder="Hodnotenia, certifikácie, roky na trhu..."
          />
        </label>

        <label>
          Najčastejšie námietky zákazníkov:
          <textarea
            value={formData.objections}
            onChange={(e) => setField("objections", e.target.value)}
            placeholder="Aké sú najčastejšie pochybnosti alebo obavy, ktoré bránia zákazníkom v nákupe? Napr. vysoká cena, nedôvera v kvalitu, zložitosť použitia, dĺžka dodania..."
          />
        </label>

        <label>
          Spúšťače urgencie / CTA:
          <textarea
            value={formData.cta}
            onChange={(e) => setField("cta", e.target.value)}
            placeholder="Časovo obmedzené akcie, limitovaná dostupnosť..."
          />
        </label>

        <label>
          Tón komunikácie:
          <input
            value={formData.tone}
            onChange={(e) => setField("tone", e.target.value)}
            placeholder="Profesionálny, Priamy a urgentný, Empatický..."
          />
        </label>

        <label>
          URL webu:
          <input
            value={formData.url}
            onChange={(e) => setField("url", e.target.value)}
            placeholder="https://www.vas-eshop.sk"
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
          {loading ? "Generujem ..." : "Generuj"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
