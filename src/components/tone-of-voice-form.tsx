"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

export function ToneOfVoiceForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    brandName: "",
    industry: "",
    values: "",
    mission: "",
    benefits: "",
    personality: "",
    audience: "",
    triggers: "",
    webTexts: "",
    socialTexts: "",
    newsletterTexts: "",
    channels: "",
    competitors: "",
    competitorNotes: ""
  });

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    if (!formData.brandName.trim()) {
      setError("Vypln nazov znacky.");
      return;
    }
    if (!formData.industry.trim()) {
      setError("Vypln oblast posobenia znacky.");
      return;
    }
    if (!formData.webTexts.trim() && !formData.socialTexts.trim() && !formData.newsletterTexts.trim()) {
      setError("Vloz aspon nejake ukazky komunikacie (web, socialne siete alebo newslettery).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tone-of-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          formData: {
            brandName: formData.brandName.trim(),
            industry: formData.industry.trim(),
            values: formData.values.trim(),
            mission: formData.mission.trim(),
            benefits: formData.benefits.trim(),
            personality: formData.personality.trim(),
            audience: formData.audience.trim(),
            triggers: formData.triggers.trim(),
            webTexts: formData.webTexts.trim(),
            socialTexts: formData.socialTexts.trim(),
            newsletterTexts: formData.newsletterTexts.trim(),
            channels: formData.channels.trim(),
            competitors: formData.competitors.trim(),
            competitorNotes: formData.competitorNotes.trim()
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
        <h3>Základné informácie o značke</h3>

        <label>
          Názov značky: <span className="required-mark">*</span>
          <input
            type="text"
            value={formData.brandName}
            onChange={(e) => setField("brandName", e.target.value)}
            placeholder="napr. Medante, Gastma, 1Autodiely"
          />
        </label>

        <label>
          Oblasť pôsobenia: <span className="required-mark">*</span>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => setField("industry", e.target.value)}
            placeholder="napr. e-shop s outdoorovým oblečením"
          />
        </label>

        <label>
          Hodnoty značky:
          <textarea
            value={formData.values}
            onChange={(e) => setField("values", e.target.value)}
            placeholder="napr. kvalita, udržateľnosť, transparentnosť"
          />
        </label>

        <label>
          Misia značky:
          <textarea
            value={formData.mission}
            onChange={(e) => setField("mission", e.target.value)}
            placeholder="napr. umožniť ľuďom objavovať prírodu v maximálnom pohodlí"
          />
        </label>

        <label>
          Kľúčové benefity produktov/služieb:
          <textarea
            value={formData.benefits}
            onChange={(e) => setField("benefits", e.target.value)}
            placeholder="napr. odolnosť, trvácnosť, ekologické materiály"
          />
        </label>

        <label>
          Osobnosť značky (Brand personality):
          <textarea
            value={formData.personality}
            onChange={(e) => setField("personality", e.target.value)}
            placeholder="napr. Spoľahlivý odborník, priateľský poradca, mladý rebel..."
          />
        </label>

        <h3>Cieľová skupina</h3>

        <label>
          Popis cieľovej skupiny:
          <textarea
            value={formData.audience}
            onChange={(e) => setField("audience", e.target.value)}
            placeholder="Demografia, psychografia, príklady persón... Tu môžeš využiť výstupy z AI nástroja „Definovanie cieľovej skupiny“."
          />
        </label>

        <label>
          Emočné spúšťače a rozhodovacie motívy zákazníkov:
          <textarea
            value={formData.triggers}
            onChange={(e) => setField("triggers", e.target.value)}
            placeholder="napr. túžba po uznaní, istota, pohodlie, šetrenie času..."
          />
        </label>

        <h3>Texty na analýzu komunikácie</h3>

        <label>
          Texty z webu:
          <textarea
            value={formData.webTexts}
            onChange={(e) => setField("webTexts", e.target.value)}
            placeholder="Skopíruj sem ukážky textov z webu (homepage, produktové stránky, about stránka...)"
          />
        </label>

        <label>
          Texty zo sociálnych sietí:
          <textarea
            value={formData.socialTexts}
            onChange={(e) => setField("socialTexts", e.target.value)}
            placeholder="Príspevky z Facebooku, Instagramu, LinkedInu..."
          />
        </label>

        <label>
          Texty z newsletterov alebo blogu:
          <textarea
            value={formData.newsletterTexts}
            onChange={(e) => setField("newsletterTexts", e.target.value)}
            placeholder="Ukážky e-mailov, blogových článkov alebo iných obsahových formátov."
          />
        </label>

        <label>
          Prioritné komunikačné kanály pre Tone-of-Voice:
          <textarea
            value={formData.channels}
            onChange={(e) => setField("channels", e.target.value)}
            placeholder="napr. web, sociálne siete, Meta Ads, e-mail, blog..."
          />
        </label>

        <h3>Konkurencia (voliteľné)</h3>

        <label>
          Konkurenti a ich komunikácia:
          <textarea
            value={formData.competitors}
            onChange={(e) => setField("competitors", e.target.value)}
            placeholder="napr. https://www.decathlon.sk – priateľský, jednoduchý tón; https://www.inyshop.sk – formálny, odborný tón"
          />
        </label>

        <label>
          Poznámky ku konkurencii (čo sa páči/nepáči):
          <textarea
            value={formData.competitorNotes}
            onChange={(e) => setField("competitorNotes", e.target.value)}
            placeholder="napr. Páči sa mi jednoduchosť Decathlonu, ale chcem byť viac prémiový..."
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
          {loading ? "Analyzujem ..." : "Vytvoriť tone-of-voice manuál"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <div className="result-box audience-html-output" dangerouslySetInnerHTML={{ __html: result }} /> : null}
    </form>
  );
}
