"use client";

import { useMemo, useState } from "react";

type ScenarioResult = {
  revenue: number;
  grossProfit: number;
  netProfitExclAds: number;
  netProfitAfterAds: number;
  investment: number;
};

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toFixed2(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
}

function formatCurrency(value: number): string {
  return value.toLocaleString("sk-SK", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatProfit(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatCurrency(value)}`;
}

function computeScenario(investment: number, roas: number, fixedCosts: number, marginPercent: number): ScenarioResult {
  const marginDecimal = marginPercent / 100;
  const revenue = investment * roas;
  const grossProfit = revenue * marginDecimal;
  const netProfitExclAds = grossProfit - fixedCosts;
  const netProfitAfterAds = netProfitExclAds - investment;

  return {
    revenue,
    grossProfit,
    netProfitExclAds,
    netProfitAfterAds,
    investment
  };
}

export function EcommerceProfitCalculator() {
  const [fixedCosts, setFixedCosts] = useState("600");
  const [margin, setMargin] = useState("50");
  const [markup, setMarkup] = useState("100");

  const [investmentA, setInvestmentA] = useState("1000");
  const [roasA, setRoasA] = useState("5.0");
  const [pnoA, setPnoA] = useState("20.00");

  const [investmentB, setInvestmentB] = useState("3000");
  const [roasB, setRoasB] = useState("3.5");
  const [pnoB, setPnoB] = useState("28.57");

  function onMarginChange(value: string) {
    const marginNum = parseNumber(value);
    const markupNum = marginNum >= 100 ? 0 : (marginNum / (100 - marginNum)) * 100;
    setMargin(value);
    setMarkup(toFixed2(markupNum));
  }

  function onMarkupChange(value: string) {
    const markupNum = parseNumber(value);
    const marginNum = markupNum <= -100 ? 0 : (markupNum / (100 + markupNum)) * 100;
    setMarkup(value);
    setMargin(toFixed2(marginNum));
  }

  function onRoasAChange(value: string) {
    const roasNum = parseNumber(value);
    const pnoNum = roasNum === 0 ? 0 : 100 / roasNum;
    setRoasA(value);
    setPnoA(toFixed2(pnoNum));
  }

  function onPnoAChange(value: string) {
    const pnoNum = parseNumber(value);
    const roasNum = pnoNum === 0 ? 0 : 100 / pnoNum;
    setPnoA(value);
    setRoasA(toFixed2(roasNum));
  }

  function onRoasBChange(value: string) {
    const roasNum = parseNumber(value);
    const pnoNum = roasNum === 0 ? 0 : 100 / roasNum;
    setRoasB(value);
    setPnoB(toFixed2(pnoNum));
  }

  function onPnoBChange(value: string) {
    const pnoNum = parseNumber(value);
    const roasNum = pnoNum === 0 ? 0 : 100 / pnoNum;
    setPnoB(value);
    setRoasB(toFixed2(roasNum));
  }

  const marginPercent = parseNumber(margin);
  const fixedCostsNum = parseNumber(fixedCosts);

  const scenarioA = useMemo(
    () => computeScenario(parseNumber(investmentA), parseNumber(roasA), fixedCostsNum, marginPercent),
    [investmentA, roasA, fixedCostsNum, marginPercent]
  );

  const scenarioB = useMemo(
    () => computeScenario(parseNumber(investmentB), parseNumber(roasB), fixedCostsNum, marginPercent),
    [investmentB, roasB, fixedCostsNum, marginPercent]
  );

  return (
    <div className="tool-stack">
      <section className="card ecom-note">
        <p>
          Zadaj fixné náklady a maržu/prirážku. Polia Hrubá marža a Obchodná prirážka sú naviazané. Napr. 50% marža =
          100% prirážka a naopak.
        </p>
        <p>
          Napr. ak kupujem tovar za 10 € a predávam za 20.00 €, marža je 50.00 % a obchodná prirážka 100.00 %.
        </p>
      </section>

      <div className="ecom-grid">
        <section className="card ecom-card">
          <h2 className="section-title text-red">Nastavenia</h2>

          <label className="ecom-form-group">
            Agentúrne fee
            <div className="ecom-input-wrap">
              <input type="number" value={fixedCosts} onChange={(e) => setFixedCosts(e.target.value)} />
              <span>€</span>
            </div>
          </label>

          <label className="ecom-form-group">
            Hrubá marža
            <div className="ecom-input-wrap">
              <input type="number" value={margin} onChange={(e) => onMarginChange(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <label className="ecom-form-group">
            Obchodná prirážka
            <div className="ecom-input-wrap">
              <input type="number" value={markup} onChange={(e) => onMarkupChange(e.target.value)} />
              <span>%</span>
            </div>
          </label>
        </section>

        <section className="card ecom-card">
          <h2 className="section-title text-blue">Scenár A</h2>

          <label className="ecom-form-group">
            Investícia do reklamy
            <div className="ecom-input-wrap">
              <input type="number" value={investmentA} onChange={(e) => setInvestmentA(e.target.value)} />
              <span>€</span>
            </div>
          </label>

          <label className="ecom-form-group">
            ROAS
            <div className="ecom-input-wrap">
              <input type="number" step="0.1" value={roasA} onChange={(e) => onRoasAChange(e.target.value)} />
            </div>
          </label>

          <label className="ecom-form-group">
            PNO (Podiel nákladov na obrate)
            <div className="ecom-input-wrap">
              <input type="number" step="0.1" value={pnoA} onChange={(e) => onPnoAChange(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <div className="ecom-summary">
            <div className="ecom-row">
              <span>Tržby</span>
              <span className="value">{formatCurrency(scenarioA.revenue)}</span>
            </div>
            <div className="ecom-row">
              <span>Hrubá marža</span>
              <span className="value">{formatCurrency(scenarioA.grossProfit)}</span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk (bez reklamy)</span>
              <span className={scenarioA.netProfitExclAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioA.netProfitExclAds)}
              </span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk po reklame</span>
              <span className={scenarioA.netProfitAfterAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioA.netProfitAfterAds)}
              </span>
            </div>
          </div>

          <div className="ecom-table">
            <div className="ecom-row">
              <span>Tržby</span>
              <span className="value">{formatCurrency(scenarioA.revenue)}</span>
            </div>
            <div className="ecom-row">
              <span>Hrubá marža ({marginPercent.toFixed(2)} %)</span>
              <span className="value">{formatCurrency(scenarioA.grossProfit)}</span>
            </div>
            <div className="ecom-row">
              <span>Fixné náklady</span>
              <span className="value">{formatCurrency(fixedCostsNum)}</span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk (bez reklamy)</span>
              <span className={scenarioA.netProfitExclAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioA.netProfitExclAds)}
              </span>
            </div>
            <div className="ecom-row">
              <span>Náklady na reklamu</span>
              <span className="value">{formatCurrency(scenarioA.investment)}</span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk po reklame</span>
              <span className={scenarioA.netProfitAfterAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioA.netProfitAfterAds)}
              </span>
            </div>
          </div>
        </section>

        <section className="card ecom-card">
          <h2 className="section-title text-blue">Scenár B</h2>

          <label className="ecom-form-group">
            Investícia do reklamy
            <div className="ecom-input-wrap">
              <input type="number" value={investmentB} onChange={(e) => setInvestmentB(e.target.value)} />
              <span>€</span>
            </div>
          </label>

          <label className="ecom-form-group">
            ROAS
            <div className="ecom-input-wrap">
              <input type="number" step="0.1" value={roasB} onChange={(e) => onRoasBChange(e.target.value)} />
            </div>
          </label>

          <label className="ecom-form-group">
            PNO (Podiel nákladov na obrate)
            <div className="ecom-input-wrap">
              <input type="number" step="0.1" value={pnoB} onChange={(e) => onPnoBChange(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <div className="ecom-summary">
            <div className="ecom-row">
              <span>Tržby</span>
              <span className="value">{formatCurrency(scenarioB.revenue)}</span>
            </div>
            <div className="ecom-row">
              <span>Hrubá marža</span>
              <span className="value">{formatCurrency(scenarioB.grossProfit)}</span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk (bez reklamy)</span>
              <span className={scenarioB.netProfitExclAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioB.netProfitExclAds)}
              </span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk po reklame</span>
              <span className={scenarioB.netProfitAfterAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioB.netProfitAfterAds)}
              </span>
            </div>
          </div>

          <div className="ecom-table">
            <div className="ecom-row">
              <span>Tržby</span>
              <span className="value">{formatCurrency(scenarioB.revenue)}</span>
            </div>
            <div className="ecom-row">
              <span>Hrubá marža ({marginPercent.toFixed(2)} %)</span>
              <span className="value">{formatCurrency(scenarioB.grossProfit)}</span>
            </div>
            <div className="ecom-row">
              <span>Fixné náklady</span>
              <span className="value">{formatCurrency(fixedCostsNum)}</span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk (bez reklamy)</span>
              <span className={scenarioB.netProfitExclAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioB.netProfitExclAds)}
              </span>
            </div>
            <div className="ecom-row">
              <span>Náklady na reklamu</span>
              <span className="value">{formatCurrency(scenarioB.investment)}</span>
            </div>
            <div className="ecom-row">
              <span>Čistý zisk po reklame</span>
              <span className={scenarioB.netProfitAfterAds >= 0 ? "value positive" : "value negative"}>
                {formatProfit(scenarioB.netProfitAfterAds)}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="card ecom-note">
        <p>
          Použité vzorce: Tržby = Investícia x ROAS. Hrubá marža = Tržby x (Marža/100). Čistý zisk (bez reklamy) =
          Hrubá marža - Fixné náklady. Čistý zisk po reklame = Hrubá marža - Fixné náklady - Investícia.
        </p>
      </section>
    </div>
  );
}
