"use client";

import { useState } from "react";

type Model = "openai" | "gemini" | "claude";

type ResponseShape = {
  generatedText?: string;
  error?: { code: string; message: string };
};

export function AudienceDefinitionForm() {
  const [model, setModel] = useState<Model>("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    brandName: "",
    productInfo: "",
    market: "",
    problems: "",
    benefits: "",
    customers: "",
    competitors: ""
  });

  function setField(name: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    if (!formData.brandName.trim()) {
      setError("Prosim, vypln aspon Nazov znacky.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/audience-definition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          formData: {
            brandName: formData.brandName.trim(),
            productInfo: formData.productInfo.trim(),
            market: formData.market.trim(),
            problems: formData.problems.trim(),
            benefits: formData.benefits.trim(),
            customers: formData.customers.trim(),
            competitors: formData.competitors.trim()
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
            placeholder="napr. 1Autodiely, Gastma, Medante"
          />
        </label>

        <label>
          Stručný popis produktov alebo služieb:
          <input
            type="text"
            value={formData.productInfo}
            onChange={(e) => setField("productInfo", e.target.value)}
            placeholder="napr. predaj športového oblečenia, výživové doplnky, marketingové služby, účtovníctvo..."
          />
        </label>

        <label>
          Trh, na ktorom pôsobíte:
          <input
            type="text"
            value={formData.market}
            onChange={(e) => setField("market", e.target.value)}
            placeholder="napr. Slovensko, Česko, stredná Európa, online e-shop pre EÚ..."
          />
        </label>

        <h3>Detailné informácie a benefity</h3>

        <label>
          Aké problémy alebo potreby riešite pre zákazníkov?
          <textarea
            value={formData.problems}
            onChange={(e) => setField("problems", e.target.value)}
            placeholder="napr. chýbajú im kvalitné turistické topánky, hľadajú zdravší životný štýl, chcú šetriť čas pri varení..."
          />
        </label>

        <label>
          Aké sú hlavné benefity vašich produktov alebo služieb?
          <textarea
            value={formData.benefits}
            onChange={(e) => setField("benefits", e.target.value)}
            placeholder="napr. vysoká kvalita, rýchle doručenie, individuálny prístup, ekologické materiály, dlhá životnosť..."
          />
        </label>

        <h3>Stávajúci zákazníci</h3>

        <label>
          Popíšte typických zákazníkov:
          <textarea
            value={formData.customers}
            onChange={(e) => setField("customers", e.target.value)}
            placeholder="napr. muži a ženy vo veku 30–50 rokov, pracujú v kancelárii, športujú vo voľnom čase, majú rodinu, preferujú kvalitu pred cenou..."
          />
        </label>

        <h3>Konkurencia</h3>

        <label>
          Zadajte 2–5 hlavných konkurentov (URL oddelené čiarkou):
          <textarea
            value={formData.competitors}
            onChange={(e) => setField("competitors", e.target.value)}
            placeholder="napr. https://www.decathlon.sk, https://www.sportisimo.sk, https://www.trekkershop.sk"
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
          {loading ? "Analyzujem ..." : "Analyzovať a definovať cieľovku"}
        </button>
      </section>

      {error ? <p className="error-box">{error}</p> : null}
      {result ? <div className="result-box audience-html-output" dangerouslySetInnerHTML={{ __html: result }} /> : null}
    </form>
  );
}
