"use client";

import { useMemo, useState } from "react";

type Currency = "EUR" | "CZK";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number, currency: Currency): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function formatMoney2(value: number, currency: Currency): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number): string {
  const normalized = Number.isFinite(value) ? value : 0;
  return `${normalized.toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function CampaignPotentialCalculator() {
  const [currency, setCurrency] = useState<Currency>("EUR");

  const [volume, setVolume] = useState("1000");
  const [ctr, setCtr] = useState("10");
  const [cpc, setCpc] = useState("5");
  const [cvr, setCvr] = useState("2");
  const [aov, setAov] = useState("1200");
  const [margin, setMargin] = useState("30");

  const metrics = useMemo(() => {
    const volumeNum = parseNumber(volume);
    const ctrNum = parseNumber(ctr) / 100;
    const cpcNum = parseNumber(cpc);
    const cvrNum = parseNumber(cvr) / 100;
    const aovNum = parseNumber(aov);
    const marginNum = parseNumber(margin) / 100;

    const clicks = volumeNum * ctrNum;
    const conversions = clicks * cvrNum;
    const costs = clicks * cpcNum;
    const revenue = conversions * aovNum;
    const grossProfit = revenue * marginNum;
    const profit = grossProfit - costs;
    const pno = revenue > 0 ? (costs / revenue) * 100 : 0;
    const cpa = conversions > 0 ? costs / conversions : 0;

    return {
      conversions: Math.round(conversions),
      revenue,
      costs,
      pno,
      cpa,
      profit
    };
  }, [volume, ctr, cpc, cvr, aov, margin]);

  const currencyUnit = currency;

  return (
    <div className="tool-stack">
      <section className="card ecom-card">
        <div className="forecast-topbar">
          <div className="model-button-group forecast-currency-buttons" role="group" aria-label="Mena">
            <button
              type="button"
              className={currency === "EUR" ? "model-btn is-selected" : "model-btn"}
              onClick={() => setCurrency("EUR")}
            >
              EUR (€)
            </button>
            <button
              type="button"
              className={currency === "CZK" ? "model-btn is-selected" : "model-btn"}
              onClick={() => setCurrency("CZK")}
            >
              CZK (Kč)
            </button>
          </div>
        </div>

        <div className="forecast-inputs-grid">
          <section className="forecast-card">
          <h3 className="forecast-card-head">Search Volume</h3>
          <label className="forecast-field">
            <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} min={0} step={1} />
          </label>
          <input
            className="forecast-range"
            type="range"
            min={0}
            max={200000}
            step={10}
            value={clamp(parseNumber(volume), 0, 200000)}
            onChange={(e) => setVolume(e.target.value)}
          />
          </section>

          <section className="forecast-card">
          <h3 className="forecast-card-head">CTR</h3>
          <label className="forecast-field with-unit">
            <input type="number" value={ctr} onChange={(e) => setCtr(e.target.value)} min={0} max={100} step={0.1} />
            <span>%</span>
          </label>
          <input
            className="forecast-range"
            type="range"
            min={0}
            max={50}
            step={0.1}
            value={clamp(parseNumber(ctr), 0, 50)}
            onChange={(e) => setCtr(e.target.value)}
          />
          </section>

          <section className="forecast-card">
          <h3 className="forecast-card-head">CPC</h3>
          <label className="forecast-field with-unit">
            <input type="number" value={cpc} onChange={(e) => setCpc(e.target.value)} min={0} step={0.01} />
            <span>{currencyUnit}</span>
          </label>
          <input
            className="forecast-range"
            type="range"
            min={0}
            max={500}
            step={0.1}
            value={clamp(parseNumber(cpc), 0, 500)}
            onChange={(e) => setCpc(e.target.value)}
          />
          </section>

          <section className="forecast-card">
          <h3 className="forecast-card-head">CVR</h3>
          <label className="forecast-field with-unit">
            <input type="number" value={cvr} onChange={(e) => setCvr(e.target.value)} min={0} max={100} step={0.1} />
            <span>%</span>
          </label>
          <input
            className="forecast-range"
            type="range"
            min={0}
            max={20}
            step={0.1}
            value={clamp(parseNumber(cvr), 0, 20)}
            onChange={(e) => setCvr(e.target.value)}
          />
          </section>

          <section className="forecast-card">
          <h3 className="forecast-card-head">AOV</h3>
          <label className="forecast-field with-unit">
            <input type="number" value={aov} onChange={(e) => setAov(e.target.value)} min={0} step={1} />
            <span>{currencyUnit}</span>
          </label>
          <input
            className="forecast-range"
            type="range"
            min={0}
            max={200000}
            step={10}
            value={clamp(parseNumber(aov), 0, 200000)}
            onChange={(e) => setAov(e.target.value)}
          />
          </section>

          <section className="forecast-card">
          <h3 className="forecast-card-head">Margin (Optional)</h3>
          <label className="forecast-field with-unit">
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
            <span>%</span>
          </label>
          <input
            className="forecast-range"
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={clamp(parseNumber(margin), 0, 100)}
            onChange={(e) => setMargin(e.target.value)}
          />
          </section>
        </div>

        <section className="forecast-results">
          <h2>Predikcia výsledkov</h2>
          <div className="forecast-results-grid">
            <div className="forecast-card forecast-result-card">
              <p className="forecast-result-head">Konverzie</p>
              <p className="forecast-result-val">{metrics.conversions.toLocaleString("sk-SK")}</p>
            </div>
            <div className="forecast-card forecast-result-card">
              <p className="forecast-result-head">Tržby</p>
              <p className="forecast-result-val">{formatMoney(metrics.revenue, currency)}</p>
            </div>
            <div className="forecast-card forecast-result-card">
              <p className="forecast-result-head">Náklady</p>
              <p className="forecast-result-val">{formatMoney(metrics.costs, currency)}</p>
            </div>
            <div className="forecast-card forecast-result-card">
              <p className="forecast-result-head">PNO</p>
              <p className="forecast-result-val">{formatPercent(metrics.pno)}</p>
            </div>
            <div className="forecast-card forecast-result-card">
              <p className="forecast-result-head">CPA</p>
              <p className="forecast-result-val">{formatMoney2(metrics.cpa, currency)}</p>
            </div>
            <div className="forecast-card forecast-result-card">
              <p className="forecast-result-head">Zisk</p>
              <p className={metrics.profit >= 0 ? "forecast-result-val positive" : "forecast-result-val negative"}>
                {formatMoney2(metrics.profit, currency)}
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
