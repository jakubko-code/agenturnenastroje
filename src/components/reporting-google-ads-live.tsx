"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import styles from "./reporting-google-ads-live.module.css";

type Period = "DAY" | "WEEK" | "MONTH";
type Status = "OK" | "WARNING" | "PROBLEM";

type Row = {
  customer_id: string;
  account_name: string;
  owner: string;
  cost: number;
  clicks: number;
  conversions: number;
  conversion_value: number;
  prev_cost: number;
  prev_conversions: number;
  prev_conversion_value: number;
  monthly_budget: number;
  spend_mtd: number;
  expected_mtd: number;
  currency_code: string;
  kpi_type: "ROAS" | "CPA" | "CONV";
  kpi_target: number;
  kpi_value: number | null;
  rec_context: string;
  rec_summary: string;
  rec_tip: string;
  rec_kpi_note: string;
};

type ApiResult = {
  asof: string;
  first_date: string;
  period: Period;
  range: { from: string; to: string };
  prev_range: { from: string; to: string };
  rows: Row[];
  error?: { code: string; message: string };
};

type RowEditState = {
  monthlyBudget: string;
  owner: string;
  kpiType: "ROAS" | "CPA" | "CONV";
  kpiTargetInput: string;
};

const CZK_PER_EUR = 24.257;
const HUF_PER_EUR = 382.15;

function toDigits(v: string): string {
  return String(v || "").replace(/\D/g, "");
}

function toHyphenId(digits: string): string {
  const d = toDigits(digits);
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}

function fmtInt(n: number): string {
  return Number(n || 0).toLocaleString("sk-SK");
}

function fmtAmount(amount: number, currency: string): string {
  const c = (currency || "EUR").toUpperCase();
  const n = Number(amount || 0);
  const num = n.toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return c === "EUR" ? `${num} €` : `${num} ${c}`;
}

function toEur(amount: number, currency: string): number {
  const c = (currency || "EUR").toUpperCase();
  const n = Number(amount || 0);
  if (c === "CZK") return n / CZK_PER_EUR;
  if (c === "HUF") return n / HUF_PER_EUR;
  return n;
}

function fmtDateSK(isoDateStr: string): string {
  const s = String(isoDateStr || "");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  return `${m[3]}. ${m[2]}. ${m[1]}`;
}

function trendClassBySign(deltaPct: number | null): string {
  if (deltaPct === null || !Number.isFinite(deltaPct)) return styles.mid;
  if (Math.abs(deltaPct) < 1) return styles.mid;
  return deltaPct > 0 ? styles.good : styles.bad;
}

function trendClassForCpa(deltaPct: number | null): string {
  if (deltaPct === null || !Number.isFinite(deltaPct)) return styles.mid;
  if (Math.abs(deltaPct) < 1) return styles.mid;
  return deltaPct < 0 ? styles.good : styles.bad;
}

function pctChange(cur: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

function evalRow(r: Row): { pacingPct: number; paceSev: Status; kpiSev: Status; kpiDeltaPct: number | null; overall: Status } {
  const pacingPct = r.expected_mtd > 0 ? (r.spend_mtd / r.expected_mtd) * 100 : 0;
  let paceSev: Status = "OK";
  const paceDelta = pacingPct - 100;
  if (Math.abs(paceDelta) >= 25) paceSev = "PROBLEM";
  else if (Math.abs(paceDelta) >= 15) paceSev = "WARNING";

  let kpiSev: Status = "OK";
  let kpiDeltaPct: number | null = null;
  const t = r.kpi_target || 0;
  const v = r.kpi_value || 0;
  if (r.kpi_type === "ROAS") {
    kpiDeltaPct = t > 0 ? ((v - t) / t) * 100 : null;
    if (t > 0) {
      if (v < t * 0.9) kpiSev = "PROBLEM";
      else if (v < t) kpiSev = "WARNING";
    }
  } else if (r.kpi_type === "CPA") {
    kpiDeltaPct = t > 0 ? ((v - t) / t) * 100 : null;
    if (t > 0) {
      if (v > t * 1.1) kpiSev = "PROBLEM";
      else if (v > t) kpiSev = "WARNING";
    }
  } else {
    kpiDeltaPct = t > 0 ? ((v - t) / t) * 100 : null;
    if (t > 0) {
      if (v < t * 0.8) kpiSev = "PROBLEM";
      else if (v < t) kpiSev = "WARNING";
    }
  }

  const rank = { OK: 0, WARNING: 1, PROBLEM: 2 };
  const overall = rank[paceSev] >= rank[kpiSev] ? paceSev : kpiSev;
  return { pacingPct, paceSev, kpiSev, kpiDeltaPct, overall };
}

function badgeClass(status: Status): string {
  if (status === "OK") return `${styles.statusDot} ${styles.ok}`;
  if (status === "WARNING") return `${styles.statusDot} ${styles.warn}`;
  return `${styles.statusDot} ${styles.bad}`;
}

export function ReportingGoogleAdsLive() {
  const [period, setPeriod] = useState<Period>("WEEK");
  const [owner, setOwner] = useState("ALL");
  const [status, setStatus] = useState<"ALL" | Status>("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editById, setEditById] = useState<Record<string, RowEditState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<ApiResult | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reporting-google-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period })
      });
      const json = (await res.json()) as ApiResult;
      if (!res.ok) {
        setError(json.error?.message ?? "Chyba pri načítaní dát.");
        return;
      }
      setData(json);
    } catch {
      setError("Chyba pri načítaní dát.");
    } finally {
      setLoading(false);
    }
  }

  function getRowEdit(r: Row): RowEditState {
    const existing = editById[r.customer_id];
    if (existing) return existing;
    return {
      monthlyBudget: String(r.monthly_budget ?? 0),
      owner: r.owner || "",
      kpiType: r.kpi_type,
      kpiTargetInput: String(r.kpi_type === "ROAS" ? Math.round((r.kpi_target || 0) * 100) : r.kpi_target || 0)
    };
  }

  function setRowEdit(customerId: string, patch: Partial<RowEditState>) {
    setEditById((prev) => {
      const base = prev[customerId] ?? {
        monthlyBudget: "0",
        owner: "",
        kpiType: "ROAS" as const,
        kpiTargetInput: "0"
      };
      return { ...prev, [customerId]: { ...base, ...patch } };
    });
  }

  async function saveRow(r: Row) {
    const edit = getRowEdit(r);
    const monthlyBudget = Number(edit.monthlyBudget || 0);
    const kpiTargetRaw = Number(edit.kpiTargetInput || 0);
    const kpiTarget = edit.kpiType === "ROAS" ? kpiTargetRaw / 100 : kpiTargetRaw;

    setSavingId(r.customer_id);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/reporting-google-ads/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: r.customer_id,
          account_name: r.account_name,
          owner: edit.owner,
          active: "TRUE",
          monthly_budget: monthlyBudget,
          kpi_type: edit.kpiType,
          kpi_target: kpiTarget
        })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message ?? "Nepodarilo sa uložiť konfiguráciu.");
        return;
      }
      setNotice(`Účet ${toHyphenId(r.customer_id)} bol uložený.`);
      await load();
      setOpenId(null);
    } catch {
      setError("Nepodarilo sa uložiť konfiguráciu.");
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const rows = data?.rows ?? [];
  const enriched = useMemo(() => rows.map((r) => ({ r, e: evalRow(r) })), [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rank = { PROBLEM: 2, WARNING: 1, OK: 0 };
    return enriched
      .filter(({ r, e }) => {
        const matchesQ = !query || r.account_name.toLowerCase().includes(query) || toHyphenId(r.customer_id).includes(query);
        const matchesOwner = owner === "ALL" || (r.owner || "") === owner;
        const matchesStatus = status === "ALL" || status === e.overall;
        return matchesQ && matchesOwner && matchesStatus;
      })
      .sort((a, b) => rank[b.e.overall] - rank[a.e.overall] || b.r.cost - a.r.cost);
  }, [enriched, owner, q, status]);

  const counts = useMemo(() => {
    let ok = 0;
    let warn = 0;
    let bad = 0;
    filtered.forEach(({ e }) => {
      if (e.overall === "OK") ok += 1;
      else if (e.overall === "WARNING") warn += 1;
      else bad += 1;
    });
    return { ok, warn, bad };
  }, [filtered]);

  const kpi = useMemo(() => {
    const sumCost = filtered.reduce((s, x) => s + toEur(x.r.cost || 0, x.r.currency_code), 0);
    const sumVal = filtered.reduce((s, x) => s + toEur(x.r.conversion_value || 0, x.r.currency_code), 0);
    const sumConv = filtered.reduce((s, x) => s + (x.r.conversions || 0), 0);

    const sumPrevCost = filtered.reduce((s, x) => s + toEur(x.r.prev_cost || 0, x.r.currency_code), 0);
    const sumPrevVal = filtered.reduce((s, x) => s + toEur(x.r.prev_conversion_value || 0, x.r.currency_code), 0);
    const sumPrevConv = filtered.reduce((s, x) => s + (x.r.prev_conversions || 0), 0);

    const cpa = sumConv > 0 ? sumCost / sumConv : null;
    const cpaPrev = sumPrevConv > 0 ? sumPrevCost / sumPrevConv : null;
    const roas = sumCost > 0 ? sumVal / sumCost : null;
    const roasPrev = sumPrevCost > 0 ? sumPrevVal / sumPrevCost : null;

    return {
      sumCost,
      sumVal,
      sumConv,
      cpa,
      roas,
      spendPct: pctChange(sumCost, sumPrevCost),
      convPct: pctChange(sumConv, sumPrevConv),
      valuePct: pctChange(sumVal, sumPrevVal),
      cpaPct: cpa !== null && cpaPrev !== null ? pctChange(cpa, cpaPrev) : null,
      roasPp: roas !== null && roasPrev !== null ? (roas - roasPrev) * 100 : null
    };
  }, [filtered]);

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <div className={styles.rangeInfo}>
          <span className={styles.rangeLabel}>Obdobie:</span>
          <span className={styles.rangeValue}>
            {data ? `${fmtDateSK(data.range.from)} - ${fmtDateSK(data.range.to)}` : "—"}
            {data ? (
              <span className={styles.vsLabel}>
                vs. {fmtDateSK(data.prev_range.from)} - {fmtDateSK(data.prev_range.to)}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.field}>
          <label>Obdobie</label>
          <div className={styles.seg}>
            <button className={period === "DAY" ? styles.active : ""} onClick={() => setPeriod("DAY")} type="button">
              Včerajší deň
            </button>
            <button className={period === "WEEK" ? styles.active : ""} onClick={() => setPeriod("WEEK")} type="button">
              Posledných 7 dní
            </button>
            <button className={period === "MONTH" ? styles.active : ""} onClick={() => setPeriod("MONTH")} type="button">
              Tento mesiac
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label>PPC Špecialista</label>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="ALL">Všetci</option>
            <option value="Pali">Pali</option>
            <option value="Adrián">Adrián</option>
            <option value="Mário">Mário</option>
            <option value="Viktor">Viktor</option>
            <option value="Ľubo">Ľubo</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Stav účtu</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "ALL" | Status)}>
            <option value="ALL">Všetky</option>
            <option value="OK">V poriadku</option>
            <option value="WARNING">Pozor</option>
            <option value="PROBLEM">Problém</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.ghost}`}
            onClick={() => {
              setOwner("ALL");
              setStatus("ALL");
              setQ("");
              setPeriod("WEEK");
            }}
          >
            Reset filtrov
          </button>
          <button type="button" className={styles.btn} onClick={load}>
            Obnoviť
          </button>
        </div>
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiTitle}>Náklady</div>
            <div className={`${styles.trend} ${styles.mid}`}>
              {kpi.spendPct === null ? "—" : `${kpi.spendPct > 0 ? "+" : ""}${kpi.spendPct.toFixed(0)}%`}
            </div>
          </div>
          <div className={styles.kpiValue}>{fmtAmount(kpi.sumCost, "EUR")}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiTitle}>Počet konverzií</div>
            <div className={`${styles.trend} ${trendClassBySign(kpi.convPct)}`}>
              {kpi.convPct === null ? "—" : `${kpi.convPct > 0 ? "+" : ""}${kpi.convPct.toFixed(0)}%`}
            </div>
          </div>
          <div className={styles.kpiValue}>{fmtInt(Math.round(kpi.sumConv))}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiTitle}>Priemerné CPA</div>
            <div className={`${styles.trend} ${trendClassForCpa(kpi.cpaPct)}`}>
              {kpi.cpaPct === null ? "—" : `${kpi.cpaPct > 0 ? "+" : ""}${kpi.cpaPct.toFixed(0)}%`}
            </div>
          </div>
          <div className={styles.kpiValue}>{kpi.cpa === null ? "—" : fmtAmount(kpi.cpa, "EUR")}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiTitle}>Hodnota konverzií</div>
            <div className={`${styles.trend} ${trendClassBySign(kpi.valuePct)}`}>
              {kpi.valuePct === null ? "—" : `${kpi.valuePct > 0 ? "+" : ""}${kpi.valuePct.toFixed(0)}%`}
            </div>
          </div>
          <div className={styles.kpiValue}>{fmtAmount(kpi.sumVal, "EUR")}</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiHead}>
            <div className={styles.kpiTitle}>Priemerný ROAS</div>
            <div className={`${styles.trend} ${trendClassBySign(kpi.roasPp)}`}>
              {kpi.roasPp === null ? "—" : `${kpi.roasPp > 0 ? "+" : ""}${kpi.roasPp.toFixed(0)} p.p.`}
            </div>
          </div>
          <div className={styles.kpiValue}>{kpi.roas === null ? "—" : `${Math.round(kpi.roas * 100)} %`}</div>
        </div>
      </div>

      <div className={styles.middleRow}>
        <div className={styles.searchBox}>
          <input placeholder="Hľadať účet / ID..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className={styles.statusRow}>
          <div className={styles.statusItem}>
            <span className={`${styles.dot} ${styles.ok}`} />
            <span>V poriadku:</span>
            <strong>{counts.ok}</strong>
          </div>
          <div className={styles.statusItem}>
            <span className={`${styles.dot} ${styles.warn}`} />
            <span>Pozor:</span>
            <strong>{counts.warn}</strong>
          </div>
          <div className={styles.statusItem}>
            <span className={`${styles.dot} ${styles.bad}`} />
            <span>Problém:</span>
            <strong>{counts.bad}</strong>
          </div>
        </div>
      </div>

      {error ? <p className="error-box">{error}</p> : null}
      {notice ? <p className="hint-text">{notice}</p> : null}
      {loading ? (
        <div className={styles.loadingOverlay} role="status" aria-live="polite" aria-label="Načítavam dáta">
          <span className={styles.loader} />
        </div>
      ) : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Účet</th>
            <th>PPC špecialista</th>
            <th>Čerpanie rozpočtu (MTD)</th>
            <th>Hlavné KPI</th>
            <th>Odchýlka</th>
            <th>Stav</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ r, e }) => {
            const open = openId === r.customer_id;
            const delta =
              e.kpiDeltaPct === null
                ? "—"
                : `${e.kpiDeltaPct > 0 ? "+" : ""}${e.kpiDeltaPct.toFixed(0)}%`;
            const deltaClass =
              e.kpiDeltaPct === null
                ? styles.deltaMid
                : r.kpi_type === "CPA"
                  ? e.kpiDeltaPct > 10
                    ? styles.deltaBad
                    : styles.deltaGood
                  : e.kpiDeltaPct < -10
                    ? styles.deltaBad
                    : styles.deltaGood;
            const toggleOpen = () => {
              if (!open) {
                setOpenId(r.customer_id);
                const rowEdit = getRowEdit(r);
                setEditById((prev) => ({ ...prev, [r.customer_id]: rowEdit }));
              } else {
                setOpenId(null);
              }
            };

            return (
              <Fragment key={r.customer_id}>
                <tr
                  className={`${styles.rowClickable} ${open ? styles.rowOpen : ""}`}
                  onClick={(ev) => {
                    const target = ev.target as HTMLElement;
                    if (target.closest("button, input, select, a, label")) return;
                    toggleOpen();
                  }}
                >
                  <td>
                    <div className={styles.accName}>{r.account_name}</div>
                    <div className={styles.accId}>{toHyphenId(r.customer_id)}</div>
                  </td>
                  <td>
                    <div className={styles.ownerCell}>{r.owner || "—"}</div>
                  </td>
                  <td>
                    <div className={styles.pacingTop}>
                      <span>{fmtAmount(r.spend_mtd, r.currency_code)}</span>
                      <span>z {fmtAmount(r.monthly_budget, r.currency_code)}</span>
                    </div>
                    <div className={styles.bar}>
                      <div
                        className={`${styles.fill} ${
                          e.paceSev === "OK" ? styles.ok : e.paceSev === "WARNING" ? styles.warn : styles.bad
                        }`}
                        style={{ width: `${Math.max(0, Math.min(120, e.pacingPct))}%` }}
                      />
                    </div>
                    <div className={styles.pacingSub}>
                      <span>Plán k dnešnému dňu: {fmtAmount(r.expected_mtd, r.currency_code)}</span>
                      <span>{e.pacingPct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.kpiMain}>
                      {r.kpi_type}:{" "}
                      <strong className={styles.kpiMainValue}>
                        {r.kpi_type === "ROAS"
                          ? `${Math.round((r.kpi_value || 0) * 100)} %`
                          : r.kpi_type === "CPA"
                            ? fmtAmount(r.kpi_value || 0, r.currency_code)
                            : fmtInt(Math.round(r.kpi_value || 0))}
                      </strong>
                    </div>
                    <div className={styles.kpiTargetLine}>
                      Cieľ:{" "}
                      {r.kpi_type === "ROAS"
                        ? `${Math.round((r.kpi_target || 0) * 100)} %`
                        : r.kpi_type === "CPA"
                          ? fmtAmount(r.kpi_target || 0, r.currency_code)
                          : fmtInt(Math.round(r.kpi_target || 0))}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.delta} ${deltaClass}`}>{delta}</span>
                  </td>
                  <td>
                    <span className={badgeClass(e.overall)} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.expBtn} ${open ? styles.expBtnOpen : ""}`}
                      onClick={toggleOpen}
                      aria-label="Rozbaliť detail"
                    >
                      <svg
                        className={`${styles.expIcon} ${open ? styles.expIconOpen : ""}`}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
                {open ? (
                  <tr className={styles.detailRowOpen}>
                    <td colSpan={7} className={styles.detailCell}>
                      <div className={styles.detailGrid}>
                        <div className={styles.dCard}>
                          <div className={styles.dTitle}>Nastavenia</div>
                          <div className={styles.dField}>
                            <label>Rozpočet ({r.currency_code})</label>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              value={getRowEdit(r).monthlyBudget}
                              onChange={(e) => setRowEdit(r.customer_id, { monthlyBudget: e.target.value })}
                            />
                          </div>
                          <div className={styles.dField}>
                            <label>PPC špecialista</label>
                            <select
                              value={getRowEdit(r).owner}
                              onChange={(e) => setRowEdit(r.customer_id, { owner: e.target.value })}
                            >
                              <option value="">—</option>
                              <option value="Pali">Pali</option>
                              <option value="Adrián">Adrián</option>
                              <option value="Mário">Mário</option>
                              <option value="Viktor">Viktor</option>
                              <option value="Ľubo">Ľubo</option>
                            </select>
                          </div>
                          <div className={styles.dField}>
                            <label>Hlavné KPI</label>
                            <select
                              value={getRowEdit(r).kpiType}
                              onChange={(e) =>
                                setRowEdit(r.customer_id, {
                                  kpiType: e.target.value as "ROAS" | "CPA" | "CONV"
                                })
                              }
                            >
                              <option value="ROAS">ROAS</option>
                              <option value="CPA">CPA</option>
                              <option value="CONV">Konverzie</option>
                            </select>
                          </div>
                          <div className={styles.dField}>
                            <label>
                              Cieľ KPI {getRowEdit(r).kpiType === "ROAS" ? "(%)" : getRowEdit(r).kpiType === "CPA" ? `(${r.currency_code})` : "(počet)"}
                            </label>
                            <input
                              type="number"
                              step={getRowEdit(r).kpiType === "ROAS" ? "1" : "0.01"}
                              min={0}
                              value={getRowEdit(r).kpiTargetInput}
                              onChange={(e) => setRowEdit(r.customer_id, { kpiTargetInput: e.target.value })}
                            />
                          </div>
                          <div className={styles.dActions}>
                            <button
                              type="button"
                              className={styles.btn}
                              onClick={() => saveRow(r)}
                              disabled={savingId === r.customer_id}
                            >
                              {savingId === r.customer_id ? "Ukladám..." : "Uložiť"}
                            </button>
                          </div>
                        </div>

                        <div className={styles.dCard}>
                          <div className={styles.dTitle}>Výkon</div>
                          <div>Náklady: {fmtAmount(r.cost, r.currency_code)}</div>
                          <div>Kliknutia: {fmtInt(r.clicks)}</div>
                          <div>Konverzie: {fmtInt(Math.round(r.conversions))}</div>
                          <div>Hodnota konv.: {fmtAmount(r.conversion_value, r.currency_code)}</div>
                        </div>
                        <div className={styles.dCard}>
                          <div className={styles.dTitle}>Odporúčania / tipy</div>
                          <div className={styles.recRow}>
                            <strong>Stav:</strong>
                            <span>{r.rec_summary || "—"}</span>
                          </div>
                          {r.rec_tip ? (
                            <div className={styles.recRow}>
                              <strong>Tip:</strong>
                              <span>{r.rec_tip}</span>
                            </div>
                          ) : null}
                          {r.rec_kpi_note ? (
                            <div className={styles.recRow}>
                              <strong>Pozn.:</strong>
                              <span>{r.rec_kpi_note}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {!loading && filtered.length === 0 ? <div className={styles.empty}>Žiadne účty nevyhovujú filtru.</div> : null}

      {data ? (
        <div className={styles.footerInfo}>
          História dát od: <b>{fmtDateSK(data.first_date)}</b> • Posledné stiahnutie: <b>{fmtDateSK(data.asof)}</b> •
          Zobrazených účtov: <b>{filtered.length}</b>
        </div>
      ) : null}
    </div>
  );
}
