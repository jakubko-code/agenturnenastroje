import { db } from "@/lib/db";
import { uploadImageToDrive } from "@/lib/google-drive";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";
import {
  AD_CREATIVE_SYSTEM_PROMPT,
  buildAdCreativeUserMessage,
  type AdCreativePromptJson,
  type ClientDefaults
} from "@/server/services/ad-creative-prompt";

const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image-preview";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
// Estimated cost per 1K image generation
const COST_PER_IMAGE_USD = 0.07;

// ─── Types ───────────────────────────────────────────────────────────────────

export type GenerateAdCreativeArgs = {
  userId: string;
  clientId: string;
  brief: string;
  platform: string;
  referenceImageBuffer?: Buffer;
  referenceImageMimeType?: string;
};

export type GenerateAdCreativeResult = {
  runId: string;
  imageUrl: string;
  promptJson: AdCreativePromptJson;
  costEstimate: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFilename(style: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const safeStyle = style.replace(/[^a-z0-9-]/gi, "-");
  return `${ts}_${safeStyle}.png`;
}

// ─── Claude: brief → JSON prompt ─────────────────────────────────────────────

async function buildPromptWithClaude(
  claudeKey: string,
  brief: string,
  client: ClientDefaults,
  platform: string,
  hasReferenceImage: boolean
): Promise<AdCreativePromptJson> {
  const userMessage = buildAdCreativeUserMessage(brief, client, platform, hasReferenceImage);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: AD_CREATIVE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Claude returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Claude API error (${response.status}).`);
  }

  const block = (data?.content ?? []).find((item: any) => item?.type === "text");
  if (!block?.text) throw new Error("Claude returned an empty response.");

  // Strip markdown code fences if Claude wraps the JSON (```json ... ``` or ``` ... ```)
  const stripped = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(stripped) as AdCreativePromptJson;
  } catch {
    throw new Error("Claude returned invalid JSON prompt. Raw: " + stripped.slice(0, 200));
  }
}

// ─── Gemini: JSON prompt → image ─────────────────────────────────────────────

async function generateImageWithGemini(
  geminiKey: string,
  promptJson: AdCreativePromptJson,
  referenceImageBuffer?: Buffer,
  referenceImageMimeType?: string
): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${geminiKey}`;

  const aspectRatio = promptJson.settings?.aspect_ratio ?? "1:1";
  const aspectLabel: Record<string, string> = {
    "1:1": "square (1:1) composition",
    "4:5": "portrait (4:5) composition",
    "9:16": "vertical (9:16) composition",
    "16:9": "landscape (16:9) composition"
  };
  const aspectHint = aspectLabel[aspectRatio] ?? `${aspectRatio} composition`;
  const promptText = `${promptJson.prompt} -- Important: compose this image as a ${aspectHint}, do not add letterboxing or pillarboxing.`;

  const textPart = { text: promptText };
  const parts: any[] = [];

  if (referenceImageBuffer && referenceImageMimeType) {
    parts.push({
      inlineData: {
        mimeType: referenceImageMimeType,
        data: referenceImageBuffer.toString("base64")
      }
    });
  }
  parts.push(textPart);

  const body: any = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"]
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    const geminiError = data?.error?.message ?? `Gemini API error (${response.status}).`;
    if (geminiError.includes("PROHIBITED_CONTENT") || geminiError.includes("SAFETY")) {
      throw new Error("PROHIBITED_CONTENT: Gemini odmietol generovať obrázok kvôli bezpečnostným pravidlám. Upravte brief.");
    }
    throw new Error(geminiError);
  }

  // Find the image part in the response
  const candidates = data?.candidates ?? [];
  for (const candidate of candidates) {
    for (const part of candidate?.content?.parts ?? []) {
      if (part?.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  throw new Error("Gemini nevrátil žiadny obrázok. Skúste iný brief.");
}

// ─── Main service function ────────────────────────────────────────────────────

export async function generateAdCreative(args: GenerateAdCreativeArgs): Promise<GenerateAdCreativeResult> {
  const { userId, clientId, brief, platform, referenceImageBuffer, referenceImageMimeType } = args;

  // 1. Load client from DB
  const client = await db.creativeClient.findFirst({
    where: { id: clientId, isActive: true }
  });
  if (!client) throw new Error("Klient nebol nájdený.");

  const clientDefaults: ClientDefaults = {
    name: client.name,
    industry: client.industry,
    defaultStyle: client.defaultStyle,
    defaultLighting: client.defaultLighting,
    defaultColorGrading: client.defaultColorGrading,
    defaultAspectRatio: client.defaultAspectRatio,
    brandNotes: client.brandNotes
  };

  // 2. Get API keys
  const [claudeKey, geminiKey] = await Promise.all([
    resolveProviderApiKeyForUser(userId, "claude"),
    resolveProviderApiKeyForUser(userId, "gemini")
  ]);

  // 3. Claude: brief → JSON prompt
  const promptJson = await buildPromptWithClaude(
    claudeKey,
    brief,
    clientDefaults,
    platform,
    !!referenceImageBuffer
  );

  // 4. Gemini: JSON prompt → image
  const imageBuffer = await generateImageWithGemini(geminiKey, promptJson, referenceImageBuffer, referenceImageMimeType);

  // 5. Upload image to Google Drive
  const style = promptJson.settings?.style ?? "generated";
  const filename = buildFilename(style);

  const driveFileId = await uploadImageToDrive(userId, imageBuffer, filename, client.name);

  // 6. Save run to DB (imagePath = "drive:{fileId}")
  const run = await db.adCreativeRun.create({
    data: {
      userId,
      clientId,
      brief,
      platform,
      promptJson: promptJson as object,
      imagePath: `drive:${driveFileId}`,
      style,
      status: "success"
    }
  });

  const imageUrl = `/api/ad-creative/outputs/drive:${driveFileId}`;

  return {
    runId: run.id,
    imageUrl,
    promptJson,
    costEstimate: COST_PER_IMAGE_USD
  };
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function listAdCreativeHistory(userId: string, limit = 20) {
  return db.adCreativeRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { client: { select: { name: true } } }
  });
}

export async function markRunAsWinner(runId: string, userId: string): Promise<void> {
  const run = await db.adCreativeRun.findFirst({ where: { id: runId, userId } });
  if (!run) throw new Error("Run nebol nájdený alebo nemáte oprávnenie.");
  await db.adCreativeRun.update({ where: { id: runId }, data: { isWinner: !run.isWinner } });
}
