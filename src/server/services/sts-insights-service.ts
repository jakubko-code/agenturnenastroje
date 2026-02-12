import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { buildStsPromptSk } from "@/server/services/sts-insights-prompt";
import { estimateUsdCost } from "@/server/services/usage-pricing";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";

type StsInsightsFormData = {
  sheetUrl: string;
  websiteUrl?: string;
  businessDesc?: string;
  minImpr?: number;
  maxRows?: number;
  language?: string;
};

function parseSheetId(sheetUrl: string): string {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match?.[1]) {
    throw new Error("Neplatna URL Google Sheetu.");
  }
  return match[1];
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
    if (char === "\r") {
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }
  return rows;
}

async function loadStsSheetRows(sheetUrl: string): Promise<string[][]> {
  const sheetId = parseSheetId(sheetUrl);
  const candidates = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=STS_Search_Terms`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=STS_Search_Terms`
  ];

  for (const url of candidates) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) continue;
    const text = await response.text();
    const rows = parseCsv(text);
    if (rows.length >= 2) return rows;
  }

  throw new Error(
    "Nepodarilo sa nacitat list 'STS_Search_Terms'. Over URL, zdielanie/publikovanie sheetu a nazov listu."
  );
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeStsOutput(rawText: string): string {
  let text = rawText
    .replace(/```(?:html|markdown|md|text)?/gi, "")
    .replace(/```/g, "")
    .trim();

  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/h2>/gi, "\n")
      .replace(/<\/h3>/gi, "\n")
      .replace(/<h2[^>]*>/gi, "\n")
      .replace(/<h3[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
  }

  text = decodeEntities(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function toNum(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(",", ".").replace("%", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function colIndex(headersMap: Record<string, number>, ...names: string[]): number {
  for (const name of names) {
    const idx = headersMap[name.toLowerCase()];
    if (typeof idx === "number") return idx;
  }
  return -1;
}

function buildSearchTermsBlock(rows: string[][], minImpr: number, maxRows: number): string {
  const headers = rows[0] ?? [];
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[String(h).trim().toLowerCase()] = i;
  });

  const idxSearchTerm = colIndex(headerMap, "search term / category", "search term", "Search Term");
  const idxCampName = colIndex(headerMap, "campaign name");
  const idxAdGroup = colIndex(headerMap, "ad group name");
  const idxType = colIndex(headerMap, "campaign type");
  const idxImprNow = colIndex(headerMap, "impr (current)", "impressions (current)");
  const idxImprPrev = colIndex(headerMap, "impr (previous)", "impressions (previous)");
  const idxClicksNow = colIndex(headerMap, "clicks (current)");
  const idxClicksPrev = colIndex(headerMap, "clicks (previous)");
  const idxConvNow = colIndex(headerMap, "conv (current)", "conversions (current)");
  const idxConvPrev = colIndex(headerMap, "conv (previous)", "conversions (previous)");
  const idxValNow = colIndex(headerMap, "conv value (current)", "conversion value (current)");
  const idxValPrev = colIndex(headerMap, "conv value (previous)", "conversion value (previous)");
  const idxCtrNow = colIndex(headerMap, "ctr (current)");
  const idxCtrPrev = colIndex(headerMap, "ctr (previous)");
  const idxCrNow = colIndex(headerMap, "cr (current)", "conversion rate (current)");
  const idxCrPrev = colIndex(headerMap, "cr (previous)", "conversion rate (previous)");

  if (idxSearchTerm === -1 || idxCampName === -1 || idxImprNow === -1) {
    throw new Error(
      "Neviem najst klucove stlpce v STS_Search_Terms. Skontroluj prosim hlavicky (Search Term, Campaign Name, Impr...)."
    );
  }

  const bodyRows = rows.slice(1);
  const filteredRows: string[][] = [];
  for (const row of bodyRows) {
    const imprNow = toNum(row[idxImprNow]);
    if (minImpr > 0 && imprNow < minImpr) continue;
    filteredRows.push(row);
    if (filteredRows.length >= maxRows) break;
  }

  if (filteredRows.length === 0) {
    throw new Error("Po aplikovani filtra (min. impresie / max. riadky) neostal ziaden search term na analyzu.");
  }

  const lines: string[] = [];
  lines.push(
    [
      "SearchTerm",
      "CampaignType",
      "CampaignName",
      "AdGroupName",
      "Impr_current",
      "Impr_previous",
      "Clicks_current",
      "Clicks_previous",
      "Conv_current",
      "Conv_previous",
      "ConvValue_current",
      "ConvValue_previous",
      "CTR_current",
      "CTR_previous",
      "CR_current",
      "CR_previous"
    ].join("\t")
  );

  for (const row of filteredRows) {
    const imprNow = toNum(row[idxImprNow]);
    const imprPrev = toNum(row[idxImprPrev]);
    const clicksNow = toNum(row[idxClicksNow]);
    const clicksPrev = toNum(row[idxClicksPrev]);
    const convNow = toNum(row[idxConvNow]);
    const convPrev = toNum(row[idxConvPrev]);
    const valNow = toNum(row[idxValNow]);
    const valPrev = toNum(row[idxValPrev]);
    const ctrNow = idxCtrNow >= 0 ? toNum(row[idxCtrNow]) : imprNow > 0 ? clicksNow / imprNow : 0;
    const ctrPrev = idxCtrPrev >= 0 ? toNum(row[idxCtrPrev]) : imprPrev > 0 ? clicksPrev / imprPrev : 0;
    const crNow = idxCrNow >= 0 ? toNum(row[idxCrNow]) : clicksNow > 0 ? convNow / clicksNow : 0;
    const crPrev = idxCrPrev >= 0 ? toNum(row[idxCrPrev]) : clicksPrev > 0 ? convPrev / clicksPrev : 0;

    lines.push(
      [
        row[idxSearchTerm] ?? "",
        idxType >= 0 ? row[idxType] ?? "" : "",
        row[idxCampName] ?? "",
        idxAdGroup >= 0 ? row[idxAdGroup] ?? "" : "",
        imprNow,
        imprPrev,
        clicksNow,
        clicksPrev,
        convNow,
        convPrev,
        valNow,
        valPrev,
        ctrNow,
        ctrPrev,
        crNow,
        crPrev
      ].join("\t")
    );
  }

  return lines.join("\n");
}

export async function generateStsInsights(args: {
  userId: string;
  model: Provider;
  formData: StsInsightsFormData;
}): Promise<{ generatedText: string }> {
  const minImpr = args.formData.minImpr ?? 0;
  const maxRows = args.formData.maxRows ?? 300;

  try {
    const rows = await loadStsSheetRows(args.formData.sheetUrl);
    const searchTermsBlock = buildSearchTermsBlock(rows, minImpr, maxRows);

    let websiteContent = "";
    if (args.formData.websiteUrl) {
      try {
        const response = await fetch(args.formData.websiteUrl, { redirect: "follow" });
        if (response.ok) {
          const html = await response.text();
          websiteContent = extractTextFromHtml(html).slice(0, 12000);
        }
      } catch {
        // Optional context only
      }
    }

    if (!websiteContent && args.formData.businessDesc) {
      websiteContent = args.formData.businessDesc;
    } else if (websiteContent && args.formData.businessDesc) {
      websiteContent = `${args.formData.businessDesc}\n\nDoplňujúci obsah z webu:\n${websiteContent}`;
    }

    const prompt = buildStsPromptSk(searchTermsBlock, websiteContent);
    const key = await resolveProviderApiKeyForUser(args.userId, args.model);

    const aiResult =
      args.model === "openai"
        ? await callOpenAiApi(key, prompt)
        : args.model === "gemini"
          ? await callGeminiApi(key, prompt)
          : await callClaudeApi(key, prompt);
    const cleanedText = normalizeStsOutput(aiResult.text);

    await insertToolRun({
      userId: args.userId,
      toolName: "sts_insights",
      provider: args.model,
      model: aiResult.model,
      inputJson: args.formData,
      outputText: cleanedText,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      totalTokens: aiResult.usage.totalTokens,
      estimatedCostUsd: estimateUsdCost(args.model, aiResult.usage),
      status: "success"
    });

    return { generatedText: cleanedText };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";

    await insertToolRun({
      userId: args.userId,
      toolName: "sts_insights",
      provider: args.model,
      model: args.model,
      inputJson: args.formData,
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
