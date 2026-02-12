"use client";

import { useMemo, useState } from "react";

type Metrics = {
  revenue: number;
  cogs: number;
  codTotal: number;
  cm2: number;
  maxAdNoProfit: number;
  profitTargetEur: number;
  maxAd: number;
  breakEvenMer: number;
  cm3: number | null;
  ebitda: number | null;
  merActual: number | null;
};

function parseRequired(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptional(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("sk-SK", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatPercentFromDecimal(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function EbitdaBreakEvenCalculator() {
  const [aov, setAov] = useState("45");
  const [margin, setMargin] = useState("35");
  const [cod, setCod] = useState("3");
  const [opex, setOpex] = useState("3000");
  const [profitTarget, setProfitTarget] = useState("0");
  const [orders, setOrders] = useState("300");
  const [adspend, setAdspend] = useState("");

  const data = useMemo<Metrics>(() => {
    const aovNum = parseRequired(aov);
    const marginPct = parseRequired(margin);
    const marginDecimal = marginPct / 100;
    const codPerOrder = parseRequired(cod);
    const opexNum = parseRequired(opex);
    const profitTargetPct = parseRequired(profitTarget);
    const profitTargetDecimal = profitTargetPct / 100;
    const ordersNum = parseRequired(orders);
    const adspendNum = parseOptional(adspend);

    const revenue = aovNum * ordersNum;
    const cogs = revenue * (1 - marginDecimal);
    const codTotal = codPerOrder * ordersNum;
    const cm2 = revenue - cogs - codTotal;
    const maxAdNoProfit = cm2 - opexNum;
    const profitTargetEur = revenue * profitTargetDecimal;
    const maxAd = maxAdNoProfit - profitTargetEur;
    const breakEvenMer = revenue > 0 ? maxAd / revenue : 0;
    const cm3 = adspendNum === null ? null : cm2 - adspendNum;
    const ebitda = cm3 === null ? null : cm3 - opexNum;
    const merActual = adspendNum === null ? null : revenue > 0 ? adspendNum / revenue : 0;

    return {
      revenue,
      cogs,
      codTotal,
      cm2,
      maxAdNoProfit,
      profitTargetEur,
      maxAd,
      breakEvenMer,
      cm3,
      ebitda,
      merActual
    };
  }, [aov, margin, cod, opex, profitTarget, orders, adspend]);

  const statusText =
    data.merActual === null
      ? "Zadaj Ad spend pre porovnanie"
      : data.merActual > data.breakEvenMer
        ? "V strate (MER nad break-even)"
        : data.merActual < data.breakEvenMer
          ? "V zisku (MER pod break-even)"
          : "Na nule (MER = break-even)";

  const statusClass =
    data.merActual === null ? "" : data.merActual > data.breakEvenMer ? "value negative" : data.merActual < data.breakEvenMer ? "value positive" : "value";

  return (
    <div className="tool-stack">
      <section className="card ecom-note">
        <p>
          Zadaj vstupy pre e-shop a kalkulačka vypočíta <span className="ebitda-note-highlight">CM2</span>, maximálny{" "}
          <span className="ebitda-note-highlight">Ad spend</span> pri ktorom si na nule, a{" "}
          <span className="ebitda-note-highlight">break-even MER</span>. Navyše si môžeš nastaviť cieľový{" "}
          <span className="ebitda-note-highlight">Profit</span> (profit-first) - tým sa zníži maximálny udržateľný ad
          spend. Voliteľne zadaj reálny Ad spend pre výpočet <span className="ebitda-note-highlight">CM3</span> a{" "}
          <span className="ebitda-note-highlight">EBITDA</span>.
        </p>
      </section>

      <div className="ebitda-grid">
        <section className="card ecom-card">
          <h2 className="section-title text-red">Nastavenia</h2>

          <label className="ecom-form-group">
            AOV (priemerná hodnota objednávky)
            <div className="ecom-input-wrap">
              <input type="number" step="0.01" value={aov} onChange={(e) => setAov(e.target.value)} />
              <span>€</span>
            </div>
          </label>

          <label className="ecom-form-group">
            Hrubá marža
            <div className="ecom-input-wrap">
              <input type="number" step="0.01" value={margin} onChange={(e) => setMargin(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <label className="ecom-form-group">
            Net delivery cost / objednávku
            <div className="ecom-input-wrap">
              <input type="number" step="0.01" value={cod} onChange={(e) => setCod(e.target.value)} />
              <span>€</span>
            </div>
          </label>

          <label className="ecom-form-group">
            OPEX (fixné náklady / mesiac)
            <div className="ecom-input-wrap">
              <input type="number" step="0.01" value={opex} onChange={(e) => setOpex(e.target.value)} />
              <span>€</span>
            </div>
          </label>

          <label className="ecom-form-group">
            Cieľový profit (profit-first)
            <div className="ecom-input-wrap">
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
              />
              <span>%</span>
            </div>
          </label>

          <label className="ecom-form-group">
            Počet objednávok
            <div className="ecom-input-wrap">
              <input type="number" step="1" value={orders} onChange={(e) => setOrders(e.target.value)} />
            </div>
          </label>

          <label className="ecom-form-group">
            Reálny Ad spend (voliteľné, na kontrolu)
            <div className="ecom-input-wrap">
              <input
                type="number"
                step="0.01"
                placeholder="napr. 3000"
                value={adspend}
                onChange={(e) => setAdspend(e.target.value)}
              />
              <span>€</span>
            </div>
          </label>

        </section>

        <section className="card ecom-card">
          <h2 className="section-title text-blue">Výsledky</h2>

          <div className="ecom-summary">
            <div className="ecom-row">
              <span>Revenue</span>
              <span className="value">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="ecom-row">
              <span>CM2</span>
              <span className={data.cm2 >= 0 ? "value positive" : "value negative"}>{formatCurrency(data.cm2)}</span>
            </div>
            <div className="ecom-row">
              <span>Cieľový profit</span>
              <span className="value">{formatCurrency(data.profitTargetEur)}</span>
            </div>
            <div className="ecom-row">
              <span>Max ad spend (break-even)</span>
              <span className={data.maxAd >= 0 ? "value positive" : "value negative"}>{formatCurrency(data.maxAd)}</span>
            </div>
            <div className="ecom-row">
              <span>Break-even MER</span>
              <span className="value">{formatPercentFromDecimal(data.breakEvenMer)}</span>
            </div>
          </div>

          <div className="ecom-table">
            <div className="ecom-row">
              <span>COGS</span>
              <span className="value">{formatCurrency(data.cogs)}</span>
            </div>
            <div className="ecom-row">
              <span>Net delivery cost (spolu)</span>
              <span className="value">{formatCurrency(data.codTotal)}</span>
            </div>
            <div className="ecom-row">
              <span>Max ad spend bez cieľového profitu</span>
              <span className="value">{formatCurrency(data.maxAdNoProfit)}</span>
            </div>
            <div className="ecom-row">
              <span>CM3 (ak zadáš Ad spend)</span>
              <span className="value">{formatCurrency(data.cm3)}</span>
            </div>
            <div className="ecom-row">
              <span>EBITDA (ak zadáš Ad spend)</span>
              <span className="value">{formatCurrency(data.ebitda)}</span>
            </div>
            <div className="ecom-row">
              <span>MER z tvojho Ad spend</span>
              <span className="value">{formatPercentFromDecimal(data.merActual)}</span>
            </div>
            <div className="ecom-row">
              <span>Stav vs. break-even</span>
              <span className={statusClass}>{statusText}</span>
            </div>
          </div>

        </section>
      </div>

      <section className="card ecom-note">
        <p>
          Ak je Max ad spend záporný, pri tomto objeme objednávok si v strate aj pri nulovej reklame (resp. aj po
          odrátaní cieľového profitu).
        </p>
        <p className="ebitda-note-gap">
          Definície:
          <br />
          <span>
            Revenue = obrat z tovaru (bez DPH a bez dopravy). Net delivery cost = (náklady na dopravu a dobierku)
            mínus čo vyberieš od zákazníka za dopravu.
          </span>
        </p>
        <p className="ebitda-note-gap">
          Vzorce:
          <br />
          <span>
            Revenue = AOV × objednávky, COGS = Revenue × (1 − marža), CM2 = Revenue − COGS − (COD × objednávky),
            Cieľový profit = Revenue × (profit %), Max Ad (bez profitu) = CM2 − OPEX, Max Ad (s profit-first) = CM2 −
            OPEX − Cieľový profit, Break-even MER = Max Ad / Revenue, CM3 = CM2 − Ad spend, EBITDA = CM3 − OPEX.
          </span>
        </p>
      </section>
    </div>
  );
}
