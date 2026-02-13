import crypto from "node:crypto";
import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { buildMetaAdsLibraryScraperPrompt } from "@/server/services/meta-ads-library-scraper-prompt";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";
import { resolveApifyTokenForUser } from "@/server/services/user-integration-secret-service";
import { estimateUsdCost } from "@/server/services/usage-pricing";

type MetaAdsLibraryScraperFormData = {
  metaAdsLibraryUrls: string[];
  biznisKontext: string;
  count: number;
  activeStatus: "active" | "inactive" | "all";
  countryCode: string;
};

type PayerBeneficiary = {
  payer: string | null;
  beneficiary: string | null;
};

type LocationAudienceItem = {
  name: string | null;
  num_obfuscated: number | null;
  type: string | null;
  excluded: boolean | null;
};

type AgeAudience = {
  min: number | null;
  max: number | null;
};

type AgeGenderBreakdown = {
  age_range: string | null;
  male: number | null;
  female: number | null;
  unknown: number | null;
};

type ReachBreakdownByCountry = {
  country: string | null;
  age_gender_breakdowns: AgeGenderBreakdown[];
};

type NormalizedMetaAd = {
  page_name: string | null;
  ad_creation_time: string | null;
  ad_creative_bodies: string[];
  ad_creative_link_titles: string[];
  ad_creative_link_captions: string[];
  ad_creative_link_descriptions: string[];
  target_locations: string[];
  target_ages: string[];
  target_gender: string | null;
  publisher_platforms: string[];
  snapshot_image_urls: string[];
  snapshot_video_urls: string[];
  snapshot_url: string | null;
  call_to_action: string | null;
  raw_id: string | null;
  payer_beneficiary_data: PayerBeneficiary[];
  targets_eu: boolean | null;
  has_violating_payer_beneficiary: boolean | null;
  is_ad_taken_down: boolean | null;
  location_audience: LocationAudienceItem[];
  gender_audience: string | null;
  age_audience: AgeAudience | null;
  eu_total_reach: number | null;
  age_country_gender_reach_breakdown: ReachBreakdownByCountry[];
};

type CacheEntry = {
  expiresAt: number;
  value: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheStore = new Map<string, CacheEntry>();
const APIFY_ACTOR_ID = "XtaWFhbtfxyzqrFmd";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAiError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("overloaded") ||
    normalized.includes("rate limit") ||
    normalized.includes("429") ||
    normalized.includes("529") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("timeout")
  );
}

async function callAiWithRetry(args: { model: Provider; apiKey: string; prompt: string }) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return args.model === "openai"
        ? await callOpenAiApi(args.apiKey, args.prompt)
        : args.model === "gemini"
          ? await callGeminiApi(args.apiKey, args.prompt)
          : await callClaudeApi(args.apiKey, args.prompt);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown AI error.");
      lastError = err;
      if (!isRetryableAiError(err.message) || attempt === 3) {
        throw err;
      }
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }

  throw lastError ?? new Error("AI call failed.");
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function firstNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function firstBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function extractStringFieldFromArray(items: unknown, field: string): string[] {
  if (!Array.isArray(items)) return [];
  const out: string[] = [];
  for (const item of items) {
    const obj = getObject(item);
    if (!obj) continue;
    const value = firstString(obj[field]);
    if (value) out.push(value);
  }
  return out;
}

function mapPayerBeneficiary(value: unknown): PayerBeneficiary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const obj = getObject(item);
      if (!obj) return null;
      return {
        payer: firstString(obj.payer),
        beneficiary: firstString(obj.beneficiary)
      };
    })
    .filter((item): item is PayerBeneficiary => Boolean(item));
}

function mapLocationAudience(value: unknown): LocationAudienceItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const obj = getObject(item);
      if (!obj) return null;
      return {
        name: firstString(obj.name),
        num_obfuscated: firstNumber(obj.num_obfuscated),
        type: firstString(obj.type),
        excluded: firstBoolean(obj.excluded)
      };
    })
    .filter((item): item is LocationAudienceItem => Boolean(item));
}

function mapAgeAudience(value: unknown): AgeAudience | null {
  const obj = getObject(value);
  if (!obj) return null;
  return {
    min: firstNumber(obj.min),
    max: firstNumber(obj.max)
  };
}

function mapReachBreakdown(value: unknown): ReachBreakdownByCountry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const obj = getObject(item);
      if (!obj) return null;
      const rawBreakdowns = Array.isArray(obj.age_gender_breakdowns) ? obj.age_gender_breakdowns : [];
      const breakdowns = rawBreakdowns
        .map((entry) => {
          const b = getObject(entry);
          if (!b) return null;
          return {
            age_range: firstString(b.age_range),
            male: firstNumber(b.male),
            female: firstNumber(b.female),
            unknown: firstNumber(b.unknown)
          };
        })
        .filter((entry): entry is AgeGenderBreakdown => Boolean(entry));

      return {
        country: firstString(obj.country),
        age_gender_breakdowns: breakdowns
      };
    })
    .filter((item): item is ReachBreakdownByCountry => Boolean(item));
}

function normalizeMetaAdsItems(items: unknown[]): NormalizedMetaAd[] {
  const normalized: NormalizedMetaAd[] = items.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const snapshot = getObject(row.snapshot) ?? {};
    const cards = Array.isArray(snapshot.cards) ? snapshot.cards : [];

    const pageName =
      firstString(row.page_name) ??
      firstString(snapshot.page_name) ??
      firstString(row.pageName) ??
      firstString(row.pageTitle) ??
      firstString(row.page_name_from_source);

    const adCreationTime =
      firstString(row.ad_creation_time) ??
      firstString(row.start_date_formatted) ??
      firstString(row.end_date_formatted) ??
      firstString(row.adCreationTime) ??
      firstString(row.creation_time);

    const bodies = dedupeStrings([
      ...toArray(row.ad_creative_bodies),
      ...toArray(row.adCreativeBodies),
      ...toArray(row.body),
      ...toArray(row.text),
      ...toArray((getObject(snapshot.body) ?? {}).text),
      ...extractStringFieldFromArray(cards, "body")
    ]);

    const linkTitles = dedupeStrings([
      ...toArray(row.ad_creative_link_titles),
      ...toArray(row.adCreativeLinkTitles),
      ...toArray(row.link_titles),
      ...toArray(row.headline),
      ...toArray(snapshot.title),
      ...extractStringFieldFromArray(cards, "title")
    ]);

    const linkCaptions = dedupeStrings([
      ...toArray(row.ad_creative_link_captions),
      ...toArray(row.adCreativeLinkCaptions),
      ...toArray(row.link_captions),
      ...toArray(snapshot.caption),
      ...extractStringFieldFromArray(cards, "caption")
    ]);

    const linkDescriptions = dedupeStrings([
      ...toArray(row.ad_creative_link_descriptions),
      ...toArray(row.adCreativeLinkDescriptions),
      ...toArray(row.link_descriptions),
      ...toArray(snapshot.link_description),
      ...extractStringFieldFromArray(cards, "link_description")
    ]);

    const targetLocations = dedupeStrings([
      ...toArray(row.target_locations),
      ...toArray(row.targetLocations),
      ...toArray(row.targeting_locations)
    ]);

    const targetAges = dedupeStrings([
      ...toArray(row.target_ages),
      ...toArray(row.targetAges),
      ...toArray(row.age_range)
    ]);

    const targetGender =
      firstString(row.target_gender) ?? firstString(row.targetGender) ?? firstString(row.gender);

    const publisherPlatforms = dedupeStrings([
      ...toArray(row.publisher_platforms),
      ...toArray(row.publisherPlatforms),
      ...toArray(row.platforms),
      ...toArray(row.publisher_platform)
    ]);

    const snapshotImageUrls = dedupeStrings([
      ...toArray(row.snapshot_image_urls),
      ...toArray(row.snapshotImageUrls),
      ...toArray(row.images),
      ...toArray(snapshot.images),
      ...extractStringFieldFromArray(cards, "original_image_url"),
      ...extractStringFieldFromArray(cards, "resized_image_url"),
      ...extractStringFieldFromArray(cards, "watermarked_resized_image_url"),
      ...extractStringFieldFromArray(cards, "video_preview_image_url")
    ]);

    const snapshotVideoUrls = dedupeStrings([
      ...toArray(row.snapshot_video_urls),
      ...toArray(row.snapshotVideoUrls),
      ...toArray(row.videos),
      ...toArray(snapshot.videos),
      ...extractStringFieldFromArray(cards, "video_hd_url"),
      ...extractStringFieldFromArray(cards, "video_sd_url"),
      ...extractStringFieldFromArray(cards, "watermarked_video_hd_url"),
      ...extractStringFieldFromArray(cards, "watermarked_video_sd_url")
    ]);

    const snapshotUrl =
      firstString(row.snapshot_url) ??
      firstString(row.snapshotUrl) ??
      firstString(row.ad_snapshot_url) ??
      firstString(row.ad_library_url) ??
      firstString(row.url);
    const callToAction =
      firstString(row.call_to_action) ??
      firstString(row.callToAction) ??
      firstString(snapshot.cta_text) ??
      firstString(snapshot.cta_type) ??
      extractStringFieldFromArray(cards, "cta_text")[0] ??
      extractStringFieldFromArray(cards, "cta_type")[0] ??
      null;
    const rawId = firstString(row.id) ?? firstString(row.ad_archive_id) ?? firstString(row.adArchiveId);
    const payerBeneficiaryData = mapPayerBeneficiary(row.payer_beneficiary_data);
    const targetsEu = firstBoolean(row.targets_eu);
    const hasViolatingPayerBeneficiary = firstBoolean(row.has_violating_payer_beneficiary);
    const isAdTakenDown = firstBoolean(row.is_ad_taken_down);
    const locationAudience = mapLocationAudience(row.location_audience);
    const genderAudience = firstString(row.gender_audience);
    const ageAudience = mapAgeAudience(row.age_audience);
    const euTotalReach = firstNumber(row.eu_total_reach);
    const ageCountryGenderReachBreakdown = mapReachBreakdown(row.age_country_gender_reach_breakdown);

    return {
      page_name: pageName,
      ad_creation_time: adCreationTime,
      ad_creative_bodies: bodies,
      ad_creative_link_titles: linkTitles,
      ad_creative_link_captions: linkCaptions,
      ad_creative_link_descriptions: linkDescriptions,
      target_locations: targetLocations,
      target_ages: targetAges,
      target_gender: targetGender,
      publisher_platforms: publisherPlatforms,
      snapshot_image_urls: snapshotImageUrls,
      snapshot_video_urls: snapshotVideoUrls,
      snapshot_url: snapshotUrl,
      call_to_action: callToAction,
      raw_id: rawId,
      payer_beneficiary_data: payerBeneficiaryData,
      targets_eu: targetsEu,
      has_violating_payer_beneficiary: hasViolatingPayerBeneficiary,
      is_ad_taken_down: isAdTakenDown,
      location_audience: locationAudience,
      gender_audience: genderAudience,
      age_audience: ageAudience,
      eu_total_reach: euTotalReach,
      age_country_gender_reach_breakdown: ageCountryGenderReachBreakdown
    };
  });

  const seen = new Set<string>();
  const deduped: NormalizedMetaAd[] = [];

  for (const ad of normalized) {
    const fingerprint = [
      ad.page_name ?? "",
      ad.ad_creation_time ?? "",
      ad.raw_id ?? "",
      ad.ad_creative_bodies[0] ?? "",
      ad.ad_creative_link_titles[0] ?? "",
      ad.snapshot_url ?? ""
    ]
      .join("||")
      .toLowerCase();

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      deduped.push(ad);
    }
  }

  return deduped;
}

function getNormalizedFieldCoverage(items: NormalizedMetaAd[]) {
  return {
    withPayerBeneficiaryData: items.filter((item) => item.payer_beneficiary_data.length > 0).length,
    withTargetsEu: items.filter((item) => item.targets_eu !== null).length,
    withHasViolatingPayerBeneficiary: items.filter((item) => item.has_violating_payer_beneficiary !== null).length,
    withIsAdTakenDown: items.filter((item) => item.is_ad_taken_down !== null).length,
    withLocationAudience: items.filter((item) => item.location_audience.length > 0).length,
    withGenderAudience: items.filter((item) => Boolean(item.gender_audience)).length,
    withAgeAudience: items.filter((item) => item.age_audience !== null).length,
    withEuTotalReach: items.filter((item) => item.eu_total_reach !== null).length,
    withAgeCountryGenderReachBreakdown: items.filter((item) => item.age_country_gender_reach_breakdown.length > 0).length
  };
}

function buildApifyInput(urls: string[], formData: MetaAdsLibraryScraperFormData): Array<Record<string, unknown>> {
  const normalizedUrls = urls.map((url) => new URL(url).toString());
  const urlObjects = normalizedUrls.map((url) => ({ url }));
  const common = {
    count: formData.count,
    activeStatus: formData.activeStatus,
    countryCode: formData.countryCode,
    sortBy: "relevancy_desc",
    scrapeAdDetails: true
  };

  // Actor inputs differ across versions. Try known-compatible URL field variants.
  return [
    { ...common, urls: normalizedUrls },
    { ...common, urls: urlObjects },
    { ...common, startUrls: urlObjects },
    { ...common, startUrls: normalizedUrls },
    { ...common, adLibraryUrls: normalizedUrls },
    { ...common, adLibraryUrls: urlObjects }
  ];
}

async function callApifyActorWithRetry(inputVariants: Array<Record<string, unknown>>, token: string): Promise<unknown[]> {
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  let lastError: Error | null = null;
  for (const input of inputVariants) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input),
          cache: "no-store"
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Apify request failed (${response.status}): ${body.slice(0, 500)}`);
        }

        const data = (await response.json()) as unknown;
        if (!Array.isArray(data)) {
          throw new Error("Apify response is not an array.");
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown Apify error.");
        if (attempt < 3) {
          await sleep(500 * 2 ** (attempt - 1));
        }
      }
    }
  }

  throw new Error(lastError?.message ?? "Apify request failed.");
}

function cleanAuditText(rawText: string): string {
  return rawText
    .replace(/```(?:markdown|md|text)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

function getCacheKey(args: { userId: string; model: Provider; formData: MetaAdsLibraryScraperFormData }): string {
  const stable = JSON.stringify({
    userId: args.userId,
    model: args.model,
      formData: {
        metaAdsLibraryUrls: args.formData.metaAdsLibraryUrls,
        biznisKontext: args.formData.biznisKontext,
        count: args.formData.count,
        activeStatus: args.formData.activeStatus,
        countryCode: args.formData.countryCode
      }
    });

  return crypto.createHash("sha256").update(stable).digest("hex");
}

function getCachedAudit(cacheKey: string): string | null {
  const cached = cacheStore.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt < Date.now()) {
    cacheStore.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function setCachedAudit(cacheKey: string, value: string) {
  cacheStore.set(cacheKey, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

export async function generateMetaAdsLibraryAudit(args: {
  userId: string;
  model: Provider;
  formData: MetaAdsLibraryScraperFormData;
}): Promise<{ generatedText: string; normalizedAdsCount: number; fromCache: boolean }> {
  const cacheKey = getCacheKey(args);
  const cached = getCachedAudit(cacheKey);

  if (cached) {
    await insertToolRun({
      userId: args.userId,
      toolName: "meta_ads_library_scraper",
      provider: args.model,
      model: args.model,
      inputJson: { ...args.formData, cacheKey },
      outputText: cached,
      status: "success"
    });

    return { generatedText: cached, normalizedAdsCount: 0, fromCache: true };
  }

  try {
    const apifyToken = await resolveApifyTokenForUser(args.userId);
    const apifyInputVariants = buildApifyInput(args.formData.metaAdsLibraryUrls, args.formData);
    const apifyItems = await callApifyActorWithRetry(apifyInputVariants, apifyToken);
    const normalizedAds = normalizeMetaAdsItems(apifyItems);
    const fieldCoverage = getNormalizedFieldCoverage(normalizedAds);
    const normalizedJson = JSON.stringify(normalizedAds, null, 2);

    const prompt = buildMetaAdsLibraryScraperPrompt({
      biznisKontext: args.formData.biznisKontext,
      jsonExport: normalizedJson
    });

    const key = await resolveProviderApiKeyForUser(args.userId, args.model);

    const aiResult = await callAiWithRetry({
      model: args.model,
      apiKey: key,
      prompt
    });

    const cleanedText = cleanAuditText(aiResult.text);

    await insertToolRun({
      userId: args.userId,
      toolName: "meta_ads_library_scraper",
      provider: args.model,
      model: aiResult.model,
      inputJson: { ...args.formData, cacheKey, normalizedAdsCount: normalizedAds.length, fieldCoverage },
      outputText: cleanedText,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      totalTokens: aiResult.usage.totalTokens,
      estimatedCostUsd: estimateUsdCost(args.model, aiResult.usage),
      status: "success"
    });

    setCachedAudit(cacheKey, cleanedText);

    return {
      generatedText: cleanedText,
      normalizedAdsCount: normalizedAds.length,
      fromCache: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";

    await insertToolRun({
      userId: args.userId,
      toolName: "meta_ads_library_scraper",
      provider: args.model,
      model: args.model,
      inputJson: { ...args.formData, cacheKey },
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
