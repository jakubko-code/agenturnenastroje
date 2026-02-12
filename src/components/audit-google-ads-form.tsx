"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

export function AuditGoogleAdsForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    sheetUrl: "",
    businessDesc: "",
    brandTerms: "",
    servicesOffered: "",
    servicesNotOffered: "",
    primaryKeywords: "",
    adjacentServices: "",
    pricePositioning: "",
    locationsServed: "",
    primaryConversion: "",
    maxRowsPerSheet: "200"
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
      setError("Prosim, zadaj URL Google Sheetu s exportom dat.");
      return;
    }
    if (!sheetUrl.startsWith("https://docs.google.com/spreadsheets/")) {
      setError("Prosim, zadaj platnu URL Google Sheetu.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/audit-google-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          formData: {
            sheetUrl,
            language: "sk",
            maxRowsPerSheet: Number(formData.maxRowsPerSheet) || 200,
            businessContext: {
              businessDesc: formData.businessDesc.trim(),
              brand_terms: formData.brandTerms.trim(),
              services_offered: formData.servicesOffered.trim(),
              services_not_offered: formData.servicesNotOffered.trim(),
              primary_service_keywords: formData.primaryKeywords.trim(),
              adjacent_services_offered: formData.adjacentServices.trim(),
              price_positioning: formData.pricePositioning.trim(),
              locations_served: formData.locationsServed.trim(),
              primary_conversion_name: formData.primaryConversion.trim()
            }
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
          URL Google Sheetu s exportom Google Ads dát (Full_Data_Export): <span className="required-mark">*</span>
          <input
            type="text"
            value={formData.sheetUrl}
            onChange={(e) => setField("sheetUrl", e.target.value)}
            placeholder="Vloz URL spreadsheetu, kam exportujes data zo scriptu Full_Data_Export"
          />
        </label>

        <label>
          Stručný popis biznisu (voliteľné, odporúčané):
          <textarea
            value={formData.businessDesc}
            onChange={(e) => setField("businessDesc", e.target.value)}
            placeholder="Napis, co klient predava / poskytuje, cielovu skupinu, USP, sezonnost, ..."
          />
        </label>

        <label>
          Brandové termíny / názvy:
          <input
            type="text"
            value={formData.brandTerms}
            onChange={(e) => setField("brandTerms", e.target.value)}
            placeholder="napr. nazov firmy, znacky, skratky, domena…"
          />
        </label>

        <label>
          Hlavné produkty / služby:
          <textarea
            value={formData.servicesOffered}
            onChange={(e) => setField("servicesOffered", e.target.value)}
            placeholder="napr. e-shop s modou, servis aut, zdravotnicke zariadenie,..."
          />
        </label>

        <label>
          Čo klient určite neposkytuje:
          <textarea
            value={formData.servicesNotOffered}
            onChange={(e) => setField("servicesNotOffered", e.target.value)}
            placeholder="napr. klient nerobi vyrobu, nepredava pouzite produkty,..."
          />
        </label>

        <label>
          Primárne cieľové kľúčové slová:
          <textarea
            value={formData.primaryKeywords}
            onChange={(e) => setField("primaryKeywords", e.target.value)}
            placeholder="napr. repasovane notebooky, autodiely, stomatolog bratislava,..."
          />
        </label>

        <label>
          Súvisiace služby / kategórie:
          <textarea
            value={formData.adjacentServices}
            onChange={(e) => setField("adjacentServices", e.target.value)}
            placeholder="napr. doplnkovy sortiment v e-shope, montaze produktov,..."
          />
        </label>

        <label>
          Cenové pozicionovanie:
          <input
            type="text"
            value={formData.pricePositioning}
            onChange={(e) => setField("pricePositioning", e.target.value)}
            placeholder="‘budget’, ‘mid-range’, ‘premium’…"
          />
        </label>

        <label>
          Lokality, kde klient pôsobí:
          <textarea
            value={formData.locationsServed}
            onChange={(e) => setField("locationsServed", e.target.value)}
            placeholder="napr. cele Slovensko, Bratislava, SK / CZ / HU"
          />
        </label>

        <label>
          Názov primárnej konverzie (odporúčané):
          <input
            type="text"
            value={formData.primaryConversion}
            onChange={(e) => setField("primaryConversion", e.target.value)}
            placeholder="napr. Objednavka - G Ads, Nakup, Odoslanie formulara z webu, ..."
          />
        </label>
        <p className="hint-text">
          Zadaj presný názov z Google Ads (stĺpec <code>segments.conversion_action_name</code>). AI sa na ňu pri
          audite zameria ako na hlavnú.
        </p>

        <label>
          Max. počet riadkov na list (limit pre čítanie dát):
          <input
            type="number"
            min={50}
            value={formData.maxRowsPerSheet}
            onChange={(e) => setField("maxRowsPerSheet", e.target.value)}
          />
        </label>
        <p className="hint-text">
          Odporúčané 150 - 300. Limituje počet riadkov načítaných z každého listu (campaign, keywords, search_terms,
          ...).
        </p>
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
          {loading ? "Generujem ..." : "Vygenerovať audit"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
