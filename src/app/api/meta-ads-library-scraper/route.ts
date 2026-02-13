import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { generateMetaAdsLibraryAudit } from "@/server/services/meta-ads-library-scraper-service";

const MetaUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      if (!(url.hostname.includes("facebook.com") || url.hostname.includes("fb.com"))) {
        return false;
      }
      return url.searchParams.has("view_all_page_id");
    } catch {
      return false;
    }
  }, "URL musí byť Meta Ads Library odkaz s parametrom view_all_page_id.");

const RequestSchema = z.object({
  model: z.enum(["openai", "gemini", "claude"]),
  formData: z.object({
    metaAdsLibraryUrls: z.array(MetaUrlSchema).min(1).max(3),
    biznisKontext: z.string().trim().min(1, "Biznis kontext je povinný.").max(8000),
    count: z.number().int().min(10).max(500).optional().default(100),
    activeStatus: z.enum(["active", "inactive", "all"]).optional().default("active")
  })
});

function resolveCountryCodeFromMetaUrls(metaUrls: string[]): string {
  for (const metaUrl of metaUrls) {
    try {
      const parsed = new URL(metaUrl);
      const fromUrl = parsed.searchParams.get("country")?.trim().toUpperCase();
      if (!fromUrl) continue;
      if (fromUrl === "ALL") return "ALL";
      if (/^[A-Z]{2,3}$/.test(fromUrl)) return fromUrl;
    } catch {
      // ignore and continue
    }
  }
  return "ALL";
}

export async function POST(req: Request) {
  let userId: string | undefined;
  let model: "openai" | "gemini" | "claude" | undefined;

  try {
    const user = await requireSessionUser();
    userId = user.id;
    requireRole(user, ["admin", "editor"]);

    const rate = checkRateLimit(`meta-ads-library-scraper:post:${user.id}`, 5, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests. Try again in a moment." } },
        { status: 429 }
      );
    }

    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: parsed.error.issues[0]?.message ?? "Invalid request body."
          }
        },
        { status: 400 }
      );
    }

    model = parsed.data.model;

    const result = await generateMetaAdsLibraryAudit({
      userId: user.id,
      model: parsed.data.model,
      formData: {
        ...parsed.data.formData,
        countryCode: resolveCountryCodeFromMetaUrls(parsed.data.formData.metaAdsLibraryUrls)
      }
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "tool.meta_ads_library_scraper_generated",
      entityType: "tool_run",
      metadata: {
        model: parsed.data.model,
        status: "success",
        normalizedAdsCount: result.normalizedAdsCount,
        fromCache: result.fromCache
      }
    });

    return NextResponse.json({
      generatedText: result.generatedText,
      normalizedAdsCount: result.normalizedAdsCount,
      fromCache: result.fromCache
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";

    if (userId) {
      await recordAuditEvent({
        actorUserId: userId,
        eventType: "tool.meta_ads_library_scraper_failed",
        entityType: "tool_run",
        metadata: { model, status: "error", message }
      });
    }

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Editor or admin role required." } }, { status: 403 });
    }
    if (message.includes("API key is not configured")) {
      return NextResponse.json({ error: { code: "provider_not_configured", message } }, { status: 503 });
    }
    if (message.includes("APIFY token is not configured")) {
      return NextResponse.json(
        { error: { code: "apify_not_configured", message: "APIFY token nie je nakonfigurovaný." } },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: { code: "generation_failed", message } }, { status: 500 });
  }
}
