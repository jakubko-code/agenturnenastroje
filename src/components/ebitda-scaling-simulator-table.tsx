"use client";

import { useMemo, useState } from "react";

const MAX_ROWS = 10;

type Currency = "EUR" | "CZK" | "HUF";

function parseNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatMoney(value: number, currency: Currency): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("sk-SK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function mktBgColor(value: number): string {
  if (!Number.isFinite(value)) return "#ffffff";
  const cap = 6000;
  const t = Math.max(-1, Math.min(1, value / cap));
  const red = { r: 229, g: 57, b: 53 };
  const mid = { r: 240, g: 219, b: 79 };
  const green = { r: 139, g: 195, b: 74 };
  const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
  const [c1, c2, k] = t < 0 ? [red, mid, t + 1] : [mid, green, t];
  return `rgba(${lerp(c1.r, c2.r, k)},${lerp(c1.g, c2.g, k)},${lerp(c1.b, c2.b, k)},0.75)`;
}

function niceRound(value: number): number {
  if (!Number.isFinite(value)) return value;
  const abs = Math.abs(value);
  let step = 500;
  if (abs < 50) step = 1;
  else if (abs < 200) step = 5;
  else if (abs < 1000) step = 10;
  else if (abs < 5000) step = 50;
  else if (abs < 20000) step = 100;
  return Math.max(1, Math.round(value / step) * step);
}

function generateOrders(minOrders: number, maxOrders: number, maxRows: number): number[] {
  const minVal = Math.max(1, Math.round(minOrders));
  const maxVal = Math.max(minVal, Math.round(maxOrders));
  const rows = Math.max(2, Math.min(MAX_ROWS, Math.round(maxRows || MAX_ROWS)));

  if (maxVal / minVal < 1.3) {
    const out: number[] = [];
    const step = (maxVal - minVal) / (rows - 1);
    for (let i = 0; i < rows; i += 1) out.push(niceRound(minVal + step * i));
    out[0] = minVal;
    out[out.length - 1] = maxVal;
    return [...new Set(out)].sort((a, b) => a - b);
  }

  const ratio = Math.pow(maxVal / minVal, 1 / (rows - 1));
  const out: number[] = [];
  for (let i = 0; i < rows; i += 1) out.push(niceRound(minVal * Math.pow(ratio, i)));
  out[0] = minVal;
  out[out.length - 1] = maxVal;

  let uniq = [...new Set(out)].sort((a, b) => a - b);
  while (uniq.length < Math.min(rows, MAX_ROWS)) {
    const need = Math.min(rows, MAX_ROWS) - uniq.length;
    const add: number[] = [];
    for (let i = 1; i <= need; i += 1) {
      add.push(niceRound(minVal + (maxVal - minVal) * (i / (need + 1))));
    }
    uniq = [...new Set([...uniq, ...add])].sort((a, b) => a - b);
    if (uniq.length >= 2) break;
  }

  if (uniq.length > MAX_ROWS) {
    const first = uniq[0];
    const last = uniq[uniq.length - 1];
    const mid = uniq.slice(1, -1);
    const keep = MAX_ROWS - 2;
    const sampled: number[] = [];
    for (let i = 0; i < keep; i += 1) {
      const idx = Math.round((i * (mid.length - 1)) / Math.max(1, keep - 1));
      sampled.push(mid[idx]);
    }
    uniq = [...new Set([first, ...sampled, last])].sort((a, b) => a - b);
  }

  if (uniq[0] !== minVal) uniq[0] = minVal;
  if (uniq[uniq.length - 1] !== maxVal) uniq[uniq.length - 1] = maxVal;
  return uniq;
}

export function EbitdaScalingSimulatorTable() {
  const [aov, setAov] = useState("30");
  const [opex, setOpex] = useState("5000");
  const [minOrders, setMinOrders] = useState("100");
  const [maxOrders, setMaxOrders] = useState("3000");
  const [cod, setCod] = useState("4.50");
  const [margin, setMargin] = useState("50");
  const [profitPct, setProfitPct] = useState("5");
  const [currency, setCurrency] = useState<Currency>("EUR");

  const [opexOverride, setOpexOverride] = useState<Record<string, number>>({});
  const [opexDraft, setOpexDraft] = useState<Record<string, string>>({});

  const currencySuffix = currency === "EUR" ? "€" : currency === "CZK" ? "Kč" : "Ft";

  const rows = useMemo(() => {
    const aovNum = parseNumber(aov);
    const baseOpex = parseNumber(opex);
    const codNum = parseNumber(cod);
    const marginNum = parseNumber(margin) / 100;
    const profitNum = parseNumber(profitPct) / 100;
    const min = clampInt(parseNumber(minOrders), 1, 1_000_000);
    const max = clampInt(parseNumber(maxOrders), 1, 1_000_000);
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const ordersList = generateOrders(lo, hi, MAX_ROWS);

    return ordersList.map((orders) => {
      const revenue = aovNum * orders;
      const cogs = revenue * (1 - marginNum);
      const codTotal = codNum * orders;
      const cm2 = revenue - cogs - codTotal;
      const profitTargetEur = revenue * profitNum;
      const rowOpex = Number.isFinite(opexOverride[String(orders)]) ? opexOverride[String(orders)] : baseOpex;
      const mktBudget = cm2 - rowOpex - profitTargetEur;
      const mer = revenue > 0 ? mktBudget / revenue : NaN;
      const cm3 = cm2 - mktBudget;
      const ebitda = cm3 - rowOpex;

      return {
        orders,
        revenue,
        cm2,
        mktBudget,
        mer,
        cm3,
        ebitda
      };
    });
  }, [aov, opex, minOrders, maxOrders, cod, margin, profitPct, opexOverride]);

  function applyOverride(order: number) {
    const key = String(order);
    const value = opexDraft[key] ?? "";
    setOpexOverride((prev) => {
      const next = { ...prev };
      if (!value.trim()) {
        delete next[key];
        return next;
      }
      const num = Number(value);
      if (Number.isFinite(num)) next[key] = num;
      else delete next[key];
      return next;
    });
  }

  return (
    <div className="tool-stack">
      <section className="card ecom-card">
        <h2 className="section-title text-red">Nastavenia</h2>
        <div className="scaling-grid">
          <label className="scaling-field">
            <span className="scaling-label">
              AOV <span className="scaling-tag">na obj.</span>
            </span>
            <div className="ecom-input-wrap">
              <input type="number" value={aov} step={0.01} onChange={(e) => setAov(e.target.value)} />
              <span>{currencySuffix}</span>
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">
              OPEX <span className="scaling-tag">mesačne</span>
            </span>
            <div className="ecom-input-wrap">
              <input type="number" value={opex} step={1} onChange={(e) => setOpex(e.target.value)} />
              <span>{currencySuffix}</span>
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">Min orders</span>
            <div className="ecom-input-wrap">
              <input type="number" value={minOrders} step={1} onChange={(e) => setMinOrders(e.target.value)} />
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">Max orders</span>
            <div className="ecom-input-wrap">
              <input type="number" value={maxOrders} step={1} onChange={(e) => setMaxOrders(e.target.value)} />
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">
              COD <span className="scaling-tag">netto/obj.</span>
            </span>
            <div className="ecom-input-wrap">
              <input type="number" value={cod} step={0.01} onChange={(e) => setCod(e.target.value)} />
              <span>{currencySuffix}</span>
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">Hrubá marža</span>
            <div className="ecom-input-wrap">
              <input type="number" value={margin} step={0.01} onChange={(e) => setMargin(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">Profit-first</span>
            <div className="ecom-input-wrap">
              <input type="number" value={profitPct} step={0.01} onChange={(e) => setProfitPct(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <label className="scaling-field">
            <span className="scaling-label">Mena</span>
            <div className="ecom-input-wrap scaling-select-wrap">
              <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                <option value="EUR">EUR (€)</option>
                <option value="CZK">CZK (Kč)</option>
                <option value="HUF">HUF (Ft)</option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="card ecom-card scaling-table-wrap">
        <p className="hint-text scaling-hint scaling-hint-left">
          Tabuľka zobrazuje max. <b>10 riadkov</b>. Stĺpec <b>OPEX increase</b> slúži na manuálnu úpravu fixných
          nákladov pre konkrétny riadok.
        </p>
        <table className="scaling-table">
          <thead>
            <tr>
              <th>Orders</th>
              <th>Revenue</th>
              <th>CM2</th>
              <th>Mkt Budget</th>
              <th>MER</th>
              <th>CM3</th>
              <th>EBITDA</th>
              <th>
                OPEX
                <br />
                increase
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = String(row.orders);
              const displayValue = opexDraft[key] ?? (Number.isFinite(opexOverride[key]) ? String(opexOverride[key]) : "");

              return (
                <tr key={row.orders}>
                  <td className="center strong">{row.orders.toLocaleString("sk-SK")}</td>
                  <td>{formatMoney(row.revenue, currency)}</td>
                  <td className="col-cm2">{formatMoney(row.cm2, currency)}</td>
                  <td className="col-mkt" style={{ background: mktBgColor(row.mktBudget) }}>
                    {formatMoney(row.mktBudget, currency)}
                  </td>
                  <td>{formatPercent(row.mer)}</td>
                  <td className="col-cm3">{formatMoney(row.cm3, currency)}</td>
                  <td className="col-ebitda">{formatMoney(row.ebitda, currency)}</td>
                  <td className="col-opexinc">
                    <input
                      type="number"
                      className="cellInput"
                      step={1}
                      value={displayValue}
                      onChange={(e) => setOpexDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                      onBlur={() => applyOverride(row.orders)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyOverride(row.orders);
                        }
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card ecom-note">
        <p>
          <b>Logika (Profit-first varianta):</b>
        </p>
        <p>
          Revenue = Orders × AOV · COGS = Revenue × (1 − marža) · COD total = Orders × COD · CM2 = Revenue − COGS − COD
          total
        </p>
        <p>
          Profit target (€) = Revenue × Profit% · Mkt Budget = CM2 − OPEX(row) − Profit target · MER = Mkt Budget /
          Revenue
        </p>
        <p>CM3 = CM2 − Mkt Budget · EBITDA = CM3 − OPEX(row)</p>
      </section>
    </div>
  );
}
