type Period = "DAY" | "WEEK" | "MONTH";

type GetAccountsTableArgs = {
  period: Period;
  activeOnly?: boolean;
};

type RowOut = {
  customer_id: string;
  account_name: string;
  owner: string;
  active: boolean;
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
  pacing_pct: number | null;
  currency_code: string;
  kpi_type: "ROAS" | "CPA" | "CONV";
  kpi_target: number;
  kpi_value: number | null;
  kpi_delta_pct: number | null;
  status: "OK" | "WARNING" | "PROBLEM";
  rec_context: string;
  rec_summary: string;
  rec_tip: string;
  rec_kpi_note: string;
};

type GetAccountsTableResult = {
  asof: string;
  first_date: string;
  period: Period;
  range: { from: string; to: string };
  prev_range: { from: string; to: string };
  owners: string[];
  owners_detected: string[];
  rows: RowOut[];
};

type UpsertAccountConfigArgs = {
  customer_id: string;
  account_name: string;
  owner: string;
  active: "TRUE" | "FALSE";
  monthly_budget: number;
  kpi_type: "ROAS" | "CPA" | "CONV";
  kpi_target: number;
  min_spend_for_eval?: number;
  min_clicks_for_eval?: number;
};

const SPREADSHEET_ID =
  process.env.REPORTING_GADS_SPREADSHEET_ID ?? "19uOvrY9tMflciEUhEntCIDooE3I2E62VmRjaxt9u_NY";
const TAB_STATS = "daily_account_stats";
const TAB_CONFIG = "accounts_config";
const OWNER_OPTIONS = ["Pali", "Adrián", "Mário", "Viktor", "Ľubo"];

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

function base64Url(input: string | Buffer): string {
  const base64 = Buffer.from(input).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = process.env.REPORTING_GADS_SERVICE_ACCOUNT_EMAIL ?? "";
  const privateKeyRaw = process.env.REPORTING_GADS_PRIVATE_KEY ?? "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Chýba SERVICE ACCOUNT konfigurácia pre zápis do Google Sheetu.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const crypto = await import("node:crypto");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!tokenRes.ok) {
    throw new Error("Nepodarilo sa získať Google access token pre zápis.");
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Google token response je neplatná.");
  }
  return tokenJson.access_token;
}

async function sheetsGetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Nepodarilo sa načítať config sheet cez API.");
  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

async function sheetsUpdateValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][]
): Promise<void> {
  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });
  if (!res.ok) throw new Error("Nepodarilo sa uložiť zmeny do existujúceho riadku.");
}

async function sheetsAppendValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][]
): Promise<void> {
  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });
  if (!res.ok) throw new Error("Nepodarilo sa pridať nový riadok do configu.");
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

async function loadSheetRows(sheetId: string, sheetName: string): Promise<string[][]> {
  const encodedSheetName = encodeURIComponent(sheetName);
  const candidates = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodedSheetName}`
  ];

  for (const url of candidates) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) continue;
    const text = await response.text();
    const rows = parseCsv(text);
    if (rows.length > 0) return rows;
  }

  throw new Error(`Nepodarilo sa načítať sheet '${sheetName}'.`);
}

function arrayToObj(values: string[][]): Array<Record<string, string>> {
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h || "").trim());
  const out: Array<Record<string, string>> = [];
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i];
    if (!row[0] && !row[1]) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c += 1) obj[headers[c]] = String(row[c] ?? "");
    out.push(obj);
  }
  return out;
}

function digits(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

function num(v: unknown, def = 0): number {
  if (v === null || typeof v === "undefined") return def;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const raw = String(v).trim();
  if (!raw) return def;

  const noSpace = raw.replace(/\s/g, "");
  if (/^-?\d+,\d+$/.test(noSpace)) {
    const parsed = Number(noSpace.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : def;
  }

  const parsed = Number(noSpace.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : def;
}

function int(v: unknown): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function round2(x: number): number {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100;
}

function fastDateFmt(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${m < 10 ? `0${m}` : m}-${day < 10 ? `0${day}` : day}`;
}

function normalizeDateStr(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmyDot = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmyDot) {
    const dd = dmyDot[1].padStart(2, "0");
    const mm = dmyDot[2].padStart(2, "0");
    return `${dmyDot[3]}-${mm}-${dd}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    // Google exporty typicky m/d/yyyy
    const mm = slash[1].padStart(2, "0");
    const dd = slash[2].padStart(2, "0");
    return `${slash[3]}-${mm}-${dd}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return fastDateFmt(parsed);
  return "";
}

function addDaysStr(dateStr: string, days: number): string {
  const parts = String(dateStr).split("-");
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  dt.setDate(dt.getDate() + days);
  return fastDateFmt(dt);
}

function getRange(period: Period, lastDay: Date): { fromStr: string; toStrExclusive: string } {
  const lastStr = fastDateFmt(lastDay);
  if (period === "DAY") return { fromStr: lastStr, toStrExclusive: addDaysStr(lastStr, 1) };
  if (period === "WEEK") {
    const from = new Date(lastDay.getTime() - 6 * 24 * 3600 * 1000);
    return { fromStr: fastDateFmt(from), toStrExclusive: addDaysStr(lastStr, 1) };
  }
  const from = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
  return { fromStr: fastDateFmt(from), toStrExclusive: addDaysStr(lastStr, 1) };
}

function getPrevRange(
  period: Period,
  fromStr: string,
  _toStrExclusive: string,
  lastDay: Date
): { prevFromStr: string; prevToStrExclusive: string } {
  if (period === "DAY") {
    const p = addDaysStr(fromStr, -1);
    return { prevFromStr: p, prevToStrExclusive: addDaysStr(p, 1) };
  }
  if (period === "WEEK") {
    return { prevFromStr: addDaysStr(fromStr, -7), prevToStrExclusive: fromStr };
  }

  const dom = lastDay.getDate();
  const pmFirst = new Date(lastDay.getFullYear(), lastDay.getMonth() - 1, 1);
  const daysInPm = new Date(pmFirst.getFullYear(), pmFirst.getMonth() + 1, 0).getDate();
  const endDom = Math.min(dom, daysInPm);
  const pmEnd = new Date(pmFirst.getFullYear(), pmFirst.getMonth(), endDom);
  return { prevFromStr: fastDateFmt(pmFirst), prevToStrExclusive: addDaysStr(fastDateFmt(pmEnd), 1) };
}

function initAgg() {
  return {
    cost: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    conversion_value: 0,
    account_name: "",
    currency_code: ""
  };
}

function addRow(agg: ReturnType<typeof initAgg>, r: Record<string, string>) {
  agg.account_name = agg.account_name || String(r.account_name || "");
  agg.currency_code = agg.currency_code || String(r.currency_code || "");
  agg.cost += num(r.cost);
  agg.impressions += int(r.impressions);
  agg.clicks += int(r.clicks);
  agg.conversions += num(r.conversions);
  agg.conversion_value += num(r.conversion_value);
}

function computeKpi(kpiType: "ROAS" | "CPA" | "CONV", agg: ReturnType<typeof initAgg>): number | null {
  if (kpiType === "ROAS") return agg.cost > 0 ? agg.conversion_value / agg.cost : null;
  if (kpiType === "CPA") return agg.conversions > 0 ? agg.cost / agg.conversions : null;
  return agg.conversions;
}

function computeStatus(p: {
  pacingPct: number | null;
  kpiType: "ROAS" | "CPA" | "CONV";
  kpiValue: number | null;
  kpiTarget: number;
  minSpend: number;
  minClicks: number;
  periodCost: number;
  periodClicks: number;
}): "OK" | "WARNING" | "PROBLEM" {
  const enough = p.periodCost >= p.minSpend || p.periodClicks >= p.minClicks;

  let budgetSev: "OK" | "WARNING" | "PROBLEM" = "OK";
  if (p.pacingPct !== null) {
    const d = Math.abs(p.pacingPct - 100);
    if (d >= 25) budgetSev = "PROBLEM";
    else if (d >= 15) budgetSev = "WARNING";
  }

  let kpiSev: "OK" | "WARNING" | "PROBLEM" = "OK";
  if (enough && p.kpiTarget > 0 && p.kpiValue !== null) {
    const val = p.kpiValue;
    const tgt = p.kpiTarget;
    if (p.kpiType === "ROAS") {
      if (val < tgt * 0.9) kpiSev = "PROBLEM";
      else if (val < tgt) kpiSev = "WARNING";
    } else if (p.kpiType === "CPA") {
      if (val > tgt * 1.1) kpiSev = "PROBLEM";
      else if (val > tgt) kpiSev = "WARNING";
    } else {
      if (val < tgt * 0.8) kpiSev = "PROBLEM";
      else if (val < tgt) kpiSev = "WARNING";
    }
  }

  const rank = { OK: 0, WARNING: 1, PROBLEM: 2 };
  return rank[budgetSev] >= rank[kpiSev] ? budgetSev : kpiSev;
}

function kpiNoteByType(kpiType: "ROAS" | "CPA" | "CONV"): string {
  if (kpiType === "ROAS") return "Pre ROAS: sleduj kvalitu trafficu a reálnu maržu.";
  if (kpiType === "CPA") return "Pre CPA: sleduj kvalitu leadov a konverzný pomer.";
  return "Pre Konverzie: sleduj celkový objem a cenu za preklik.";
}

function pickScenario(
  paceSev: "OK" | "WARNING" | "PROBLEM",
  kpiSev: "OK" | "WARNING" | "PROBLEM",
  pacingPct: number | null
): keyof typeof REC_BANK {
  const kpiBad = kpiSev === "WARNING" || kpiSev === "PROBLEM";
  const paceBad = paceSev === "WARNING" || paceSev === "PROBLEM";
  const isFast = pacingPct !== null ? pacingPct > 115 : false;
  const isSlow = pacingPct !== null ? pacingPct < 85 : false;

  if (paceBad && isFast && kpiBad) return "CRITICAL";
  if (paceBad && isSlow && kpiBad) return "STAGNATION";
  if (!paceBad && kpiBad) return "WARNING";
  if (paceBad && isFast && !kpiBad) return "OPPORTUNITY";
  if (paceBad && isSlow && !kpiBad) return "GROWTH";
  if (!paceBad && !kpiBad) return "MAINTENANCE";
  if (paceBad && kpiBad) return "WARNING";
  if (paceBad && !kpiBad) return "GROWTH";
  return "MAINTENANCE";
}

const REC_BANK = {
  CRITICAL: {
    summary:
      "Kritický stav: Rozpočet sa míňa agresívne a výsledky sú pod cieľom. Okamžite obmedz neefektívne výdavky.",
    generic: [
      "Vylúč nerelevantné search terms a drahé broad match kľúčové slová.",
      "Identifikuj kampane s vysokým spendom a 0 konverziami a pozastav ich.",
      "Zníž bidy na mobilných zariadeniach, ak majú horší výkon."
    ]
  },
  STAGNATION: {
    summary:
      "Účet stagnuje: Rozpočet sa nečerpá a KPI je slabé. Reklamy pravdepodobne prehrávajú aukcie kvôli prísnym nastaveniam.",
    generic: [
      "Skontroluj Quality Score kľúčových slov. Nízke QS predražuje kliky a blokuje zobrazenia.",
      "Skontroluj, či nemáš zamietnuté reklamy alebo produkty v Merchant Center.",
      "Skontroluj, či kampane neblokuje príliš prísna bid stratégia."
    ]
  },
  WARNING: {
    summary: "Rozpočet sa míňa podľa plánu no neplníme ciele. Problém je v efektivite, nie v objeme.",
    generic: [
      "Pracuj na zvýšení CTR (lepšie texty) a CR (lepšia landing page).",
      "Pozri Auction Insights a konkurenciu v aukcii.",
      "Prejdi vyhľadávacie dopyty a pridaj negatívne kľúčové slová."
    ]
  },
  OPPORTUNITY: {
    summary: "Výkon je super, ale rozpočet dochádza. Hrozí predčasné vypnutie reklám.",
    generic: [
      "Ak je možnosť, navýš budget v top kampaniach.",
      "Ak budget navýšiť nevieš, zúž cielenie na najvýkonnejšie segmenty.",
      "Skontroluj Impression Share Lost (Budget)."
    ]
  },
  GROWTH: {
    summary: "Výsledky sú výborné, no máme nevyčerpaný rozpočet. Priestor na rast.",
    generic: [
      "Uvoľni bid limity (nižší tROAS / vyšší tCPA).",
      "Rozšír dopyty (broad + kvalitné negatíva).",
      "Otestuj nové kreatívy a publika."
    ]
  },
  MAINTENANCE: {
    summary: "Účet beží stabilne podľa plánu. Udržiavací režim.",
    generic: [
      "Priebežne testuj nové varianty reklám.",
      "Kontroluj kvalitu dopytov a search terms.",
      "Sleduj vývoj trendov KPI týždeň na týždeň."
    ]
  }
} as const;

function getRecommendation(args: {
  paceSev: "OK" | "WARNING" | "PROBLEM";
  kpiSev: "OK" | "WARNING" | "PROBLEM";
  kpiType: "ROAS" | "CPA" | "CONV";
  period: Period;
  pacingPct: number | null;
}) {
  if (args.period === "DAY") {
    return {
      contextLine: "Rozpočet: MTD · Výkon: posledný deň",
      summary: "Denné dáta môžu byť kolísavé. Odporúčania sú primárne určené pre týždeň/mesiac.",
      tip: "",
      kpiNote: kpiNoteByType(args.kpiType)
    };
  }
  const scenario = pickScenario(args.paceSev, args.kpiSev, args.pacingPct);
  const bank = REC_BANK[scenario];
  return {
    contextLine: args.period === "WEEK" ? "Rozpočet: MTD · Výkon: posledných 7 dní" : "Rozpočet: MTD · Výkon: MTD",
    summary: bank.summary,
    tip: bank.generic[0] ?? "",
    kpiNote: kpiNoteByType(args.kpiType)
  };
}

export async function getAccountsTable(args: GetAccountsTableArgs): Promise<GetAccountsTableResult> {
  const period = args.period;
  const statsVals = await loadSheetRows(SPREADSHEET_ID, TAB_STATS);
  const cfgVals = await loadSheetRows(SPREADSHEET_ID, TAB_CONFIG);

  const stats = arrayToObj(statsVals);
  const cfg = arrayToObj(cfgVals);
  if (!stats.length) throw new Error("Stats sheet je prázdny.");

  let firstDataDate = "9999-99-99";
  for (const r of stats) {
    const d = normalizeDateStr(r.date);
    if (d && d < firstDataDate) firstDataDate = d;
  }
  if (firstDataDate === "9999-99-99") firstDataDate = "";

  const cfgById = new Map<string, Record<string, string>>();
  cfg.forEach((c) => {
    const cid = digits(c.customer_id);
    if (cid) cfgById.set(cid, c);
  });

  const today = new Date();
  const lastDay = new Date(today.getTime() - 24 * 3600 * 1000);
  const asofStr = fastDateFmt(lastDay);

  const { fromStr, toStrExclusive } = getRange(period, lastDay);
  const { prevFromStr, prevToStrExclusive } = getPrevRange(period, fromStr, toStrExclusive, lastDay);
  const monthFromStr = fastDateFmt(new Date(lastDay.getFullYear(), lastDay.getMonth(), 1));
  const monthToStrExclusive = addDaysStr(asofStr, 1);

  const rangeObj = { from: fromStr, to: addDaysStr(toStrExclusive, -1) };
  const prevRangeObj = { from: prevFromStr, to: addDaysStr(prevToStrExclusive, -1) };

  const aggPeriod = new Map<string, ReturnType<typeof initAgg>>();
  const aggPrevPeriod = new Map<string, ReturnType<typeof initAgg>>();
  const aggMtd = new Map<string, ReturnType<typeof initAgg>>();

  for (const r of stats) {
    const d = normalizeDateStr(r.date);
    const cid = digits(r.customer_id);
    if (!cid || !d) continue;

    if (d >= fromStr && d < toStrExclusive) {
      const a = aggPeriod.get(cid) ?? initAgg();
      addRow(a, r);
      aggPeriod.set(cid, a);
    }
    if (d >= prevFromStr && d < prevToStrExclusive) {
      const p = aggPrevPeriod.get(cid) ?? initAgg();
      addRow(p, r);
      aggPrevPeriod.set(cid, p);
    }
    if (d >= monthFromStr && d < monthToStrExclusive) {
      const m = aggMtd.get(cid) ?? initAgg();
      addRow(m, r);
      aggMtd.set(cid, m);
    }
  }

  const builtRows: RowOut[] = [];
  const ownersSet = new Set<string>();

  for (const [cid, a] of aggPeriod.entries()) {
    const c = cfgById.get(cid) ?? {};
    const owner = String(c.owner || "").trim();
    if (owner) ownersSet.add(owner);

    const active = String(c.active || "TRUE").toUpperCase() !== "FALSE";
    if (args.activeOnly && !active) continue;

    const mtd = aggMtd.get(cid) ?? initAgg();
    const monthlyBudget = num(c.monthly_budget);
    const daysInMonth = new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, 0).getDate();
    const dayOfMonth = lastDay.getDate();
    const expectedMtd = monthlyBudget > 0 ? monthlyBudget * (dayOfMonth / daysInMonth) : 0;
    const pacingPct = expectedMtd > 0 ? (mtd.cost / expectedMtd) * 100 : null;

    const kpiType = (String(c.kpi_type || "ROAS").toUpperCase() as "ROAS" | "CPA" | "CONV") || "ROAS";
    const kpiTarget = num(c.kpi_target);
    const kpiValue = computeKpi(kpiType, a);
    const kpiDeltaPct = kpiTarget > 0 && kpiValue !== null ? ((kpiValue - kpiTarget) / kpiTarget) * 100 : null;

    const status = computeStatus({
      pacingPct,
      kpiType,
      kpiValue,
      kpiTarget,
      minSpend: num(c.min_spend_for_eval, 10),
      minClicks: num(c.min_clicks_for_eval, 30),
      periodCost: a.cost,
      periodClicks: a.clicks
    });

    let paceSev: "OK" | "WARNING" | "PROBLEM" = "OK";
    if (pacingPct !== null) {
      const delta = Math.abs(pacingPct - 100);
      if (delta >= 25) paceSev = "PROBLEM";
      else if (delta >= 15) paceSev = "WARNING";
    }

    let kpiSev: "OK" | "WARNING" | "PROBLEM" = "OK";
    if (kpiTarget > 0 && kpiValue !== null) {
      if (kpiType === "ROAS") {
        if (kpiValue < kpiTarget * 0.9) kpiSev = "PROBLEM";
        else if (kpiValue < kpiTarget) kpiSev = "WARNING";
      } else if (kpiType === "CPA") {
        if (kpiValue > kpiTarget * 1.1) kpiSev = "PROBLEM";
        else if (kpiValue > kpiTarget) kpiSev = "WARNING";
      } else {
        if (kpiValue < kpiTarget * 0.8) kpiSev = "PROBLEM";
        else if (kpiValue < kpiTarget) kpiSev = "WARNING";
      }
    }

    const rec = getRecommendation({ paceSev, kpiSev, kpiType, period, pacingPct });
    const prev = aggPrevPeriod.get(cid) ?? initAgg();

    builtRows.push({
      customer_id: String(cid),
      account_name: String(c.account_name || a.account_name || ""),
      owner,
      active,
      cost: round2(a.cost),
      clicks: a.clicks,
      conversions: round2(a.conversions),
      conversion_value: round2(a.conversion_value),
      prev_cost: round2(prev.cost),
      prev_conversions: round2(prev.conversions),
      prev_conversion_value: round2(prev.conversion_value),
      monthly_budget: monthlyBudget,
      spend_mtd: round2(mtd.cost),
      expected_mtd: round2(expectedMtd),
      pacing_pct: pacingPct === null ? null : round2(pacingPct),
      currency_code: String(a.currency_code || prev.currency_code || "EUR"),
      kpi_type: kpiType,
      kpi_target: kpiTarget,
      kpi_value: kpiValue === null ? null : round2(kpiValue),
      kpi_delta_pct: kpiDeltaPct === null ? null : round2(kpiDeltaPct),
      status,
      rec_context: rec.contextLine,
      rec_summary: rec.summary,
      rec_tip: rec.tip,
      rec_kpi_note: rec.kpiNote
    });
  }

  const rank = { PROBLEM: 2, WARNING: 1, OK: 0 };
  builtRows.sort((x, y) => rank[y.status] - rank[x.status] || y.cost - x.cost);

  return {
    asof: asofStr,
    first_date: firstDataDate,
    period,
    range: rangeObj,
    prev_range: prevRangeObj,
    owners: OWNER_OPTIONS,
    owners_detected: Array.from(ownersSet).sort(),
    rows: builtRows
  };
}

export async function upsertAccountConfig(args: UpsertAccountConfigArgs): Promise<{ ok: true }> {
  const cid = digits(args.customer_id);
  if (!cid) throw new Error("Chýba customer_id.");
  if (args.owner && !OWNER_OPTIONS.includes(args.owner)) {
    throw new Error("Neplatný PPC špecialista.");
  }

  const token = await getGoogleAccessToken();
  const headerRange = `${TAB_CONFIG}!A1:ZZ1`;
  const dataRange = `${TAB_CONFIG}!A2:ZZ`;

  const headerRows = await sheetsGetValues(token, SPREADSHEET_ID, headerRange);
  if (!headerRows.length) throw new Error("Config sheet nemá hlavičku.");
  const headers = headerRows[0].map((h) => String(h || "").trim());
  const idxCustomer = headers.indexOf("customer_id");
  if (idxCustomer === -1) throw new Error("Config sheet neobsahuje stĺpec customer_id.");

  const dataRows = await sheetsGetValues(token, SPREADSHEET_ID, dataRange);
  const nowIso = new Date().toISOString();

  const rowObj: Record<string, string | number | boolean> = {
    customer_id: cid,
    account_name: args.account_name ?? "",
    owner: args.owner ?? "",
    active: args.active ?? "TRUE",
    monthly_budget: args.monthly_budget ?? 0,
    kpi_type: args.kpi_type ?? "ROAS",
    kpi_target: args.kpi_target ?? 0,
    min_spend_for_eval: args.min_spend_for_eval ?? 10,
    min_clicks_for_eval: args.min_clicks_for_eval ?? 30,
    updated_at: nowIso,
    updated_by: "webapp"
  };

  let existingRowIndex = -1;
  for (let i = 0; i < dataRows.length; i += 1) {
    if (digits(dataRows[i][idxCustomer] ?? "") === cid) {
      existingRowIndex = i;
      break;
    }
  }

  if (existingRowIndex >= 0) {
    const existing = dataRows[existingRowIndex];
    const merged = headers.map((h, i) => {
      if (Object.prototype.hasOwnProperty.call(rowObj, h)) return rowObj[h];
      return existing[i] ?? "";
    });
    const rowNumber = existingRowIndex + 2;
    await sheetsUpdateValues(token, SPREADSHEET_ID, `${TAB_CONFIG}!A${rowNumber}:ZZ${rowNumber}`, [merged]);
    return { ok: true };
  }

  const newRow = headers.map((h) => (Object.prototype.hasOwnProperty.call(rowObj, h) ? rowObj[h] : ""));
  await sheetsAppendValues(token, SPREADSHEET_ID, `${TAB_CONFIG}!A:ZZ`, [newRow]);
  return { ok: true };
}
