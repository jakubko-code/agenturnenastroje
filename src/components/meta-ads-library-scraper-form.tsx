"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  normalizedAdsCount?: number;
  fromCache?: boolean;
  error?: { code: string; message: string };
};

export function MetaAdsLibraryScraperForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [metaInfo, setMetaInfo] = useState<{ normalizedAdsCount: number; fromCache: boolean } | null>(null);

  const [formData, setFormData] = useState({
    metaAdsLibraryUrl1: "",
    metaAdsLibraryUrl2: "",
    metaAdsLibraryUrl3: "",
    biznisKontext: "",
    count: "100",
    activeStatus: "active"
  });

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateMetaAdsUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const isMetaHost = parsed.hostname.includes("facebook.com") || parsed.hostname.includes("fb.com");
      if (!isMetaHost) return "URL musí smerovať na facebook.com ads library.";
      if (!parsed.searchParams.get("view_all_page_id")) {
        return "V URL chýba parameter view_all_page_id.";
      }
      return null;
    } catch {
      return "Zadaj platnú URL Meta Ads Library.";
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");
    setMetaInfo(null);

    const metaAdsLibraryUrls = [formData.metaAdsLibraryUrl1, formData.metaAdsLibraryUrl2, formData.metaAdsLibraryUrl3]
      .map((item) => item.trim())
      .filter(Boolean);
    const biznisKontext = formData.biznisKontext.trim();

    if (metaAdsLibraryUrls.length < 1 || metaAdsLibraryUrls.length > 3) {
      setError("Zadaj 1 až 3 URL z Meta Ads Library.");
      return;
    }

    for (let index = 0; index < metaAdsLibraryUrls.length; index += 1) {
      const urlError = validateMetaAdsUrl(metaAdsLibraryUrls[index]);
      if (urlError) {
        setError(`URL #${index + 1}: ${urlError}`);
        return;
      }
    }

    if (!biznisKontext) {
      setError("Vyplň biznis kontext, aby mala AI relevantný základ pre audit.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/meta-ads-library-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          formData: {
            metaAdsLibraryUrls,
            biznisKontext,
            count: Number(formData.count) || 100,
            activeStatus: formData.activeStatus
          }
        })
      });

      const data = (await response.json()) as ResponseShape;
      if (!response.ok) {
        setError(data.error?.message ?? "Neznáma chyba.");
        return;
      }

      setResult(data.generatedText ?? "");
      setMetaInfo({
        normalizedAdsCount: data.normalizedAdsCount ?? 0,
        fromCache: data.fromCache ?? false
      });
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
          URL Meta Ads Library #1: <span className="required-mark">*</span>
          <input
            type="text"
            value={formData.metaAdsLibraryUrl1}
            onChange={(e) => setField("metaAdsLibraryUrl1", e.target.value)}
            placeholder="https://www.facebook.com/ads/library/?...&view_all_page_id=123"
          />
        </label>
        <label>
          URL Meta Ads Library #2:
          <input
            type="text"
            value={formData.metaAdsLibraryUrl2}
            onChange={(e) => setField("metaAdsLibraryUrl2", e.target.value)}
            placeholder="https://www.facebook.com/ads/library/?...&view_all_page_id=456"
          />
        </label>
        <label>
          URL Meta Ads Library #3:
          <input
            type="text"
            value={formData.metaAdsLibraryUrl3}
            onChange={(e) => setField("metaAdsLibraryUrl3", e.target.value)}
            placeholder="https://www.facebook.com/ads/library/?...&view_all_page_id=789"
          />
        </label>

        <label>
          Biznis kontext pre AI audit: <span className="required-mark">*</span>
          <textarea
            value={formData.biznisKontext}
            onChange={(e) => setField("biznisKontext", e.target.value)}
            placeholder="Napíš stručný kontext: čo konkurencia predáva, aké služby ponúka, komu ich ponúka, ..."
          />
        </label>

        <label>
          Počet reklám na stiahnutie:
          <input
            type="number"
            min={10}
            max={500}
            value={formData.count}
            onChange={(e) => setField("count", e.target.value)}
          />
        </label>

        <label>
          Aktívny stav:
          <select value={formData.activeStatus} onChange={(e) => setField("activeStatus", e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="all">all</option>
          </select>
        </label>

      </section>

      <section className="card generation-card">
        <label>Zvoľ si model:</label>
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
          {loading ? "Generujem ..." : "Generuj analýzu"}
        </button>
      </section>

      {metaInfo ? (
        <p className="hint-text">
          Načítané normalizované reklamy: {metaInfo.normalizedAdsCount}. {metaInfo.fromCache ? "Výsledok bol načítaný z cache." : "Výsledok je čerstvo vygenerovaný."}
        </p>
      ) : null}

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <pre className="result-box">{result}</pre> : null}
    </form>
  );
}
