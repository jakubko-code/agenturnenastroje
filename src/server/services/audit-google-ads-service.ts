import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { buildAuditPrompt, AuditBusinessContext } from "@/server/services/audit-google-ads-prompt";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";
import { estimateUsdCost } from "@/server/services/usage-pricing";

type AuditGoogleAdsFormData = {
  sheetUrl: string;
  language?: string;
  maxRowsPerSheet?: number;
  businessContext?: AuditBusinessContext;
};

const EXPECTED_SHEETS = [
  "campaign",
  "search_is",
  "keywords",
  "search_terms",
  "pmax_search_terms",
  "shopping_search_terms",
  "ads",
  "ads_search_display",
  "ads_pmax_shopping",
  "rsa_assets",
  "landing_pages",
  "campaign_device_network",
  "campaign_geo",
  "conversion_actions",
  "quality_score_keywords",
  "ad_to_lp_map"
] as const;

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

async function loadSheetRows(sheetId: string, sheetName: string): Promise<string[][] | null> {
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

  return null;
}

async function readAuditSheetData(sheetUrl: string, maxRowsPerSheet: number): Promise<string> {
  const sheetId = parseSheetId(sheetUrl);
  let out = "";

  for (const name of EXPECTED_SHEETS) {
    const rows = await loadSheetRows(sheetId, name);
    if (!rows || rows.length < 2) continue;

    const rowsToRead = Math.min(rows.length, maxRowsPerSheet);
    out += `=== LIST: ${name} (max ${rowsToRead} riadkov) ===\n`;
    for (const row of rows.slice(0, rowsToRead)) {
      out += `${row.join(" | ")}\n`;
    }
    out += "\n";
  }

  if (!out) {
    return "(Export je prázdny alebo žiadny z očakávaných listov neobsahuje dáta.)";
  }

  return out;
}

function normalizeAuditText(rawText: string): string {
  return rawText
    .replace(/```(?:markdown|md|text)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function generateGoogleAdsAudit(args: {
  userId: string;
  model: Provider;
  formData: AuditGoogleAdsFormData;
}): Promise<{ generatedText: string }> {
  const maxRowsPerSheet = args.formData.maxRowsPerSheet ?? 200;

  try {
    const sheetDataText = await readAuditSheetData(args.formData.sheetUrl, maxRowsPerSheet);
    const prompt = buildAuditPrompt(sheetDataText, args.formData.businessContext);
    const key = await resolveProviderApiKeyForUser(args.userId, args.model);

    const aiResult =
      args.model === "openai"
        ? await callOpenAiApi(key, prompt)
        : args.model === "gemini"
          ? await callGeminiApi(key, prompt)
          : await callClaudeApi(key, prompt);
    const cleanedText = normalizeAuditText(aiResult.text);

    await insertToolRun({
      userId: args.userId,
      toolName: "audit_google_ads",
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
      toolName: "audit_google_ads",
      provider: args.model,
      model: args.model,
      inputJson: args.formData,
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
