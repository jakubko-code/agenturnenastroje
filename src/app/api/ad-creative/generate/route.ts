import { NextResponse } from "next/server";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { generateAdCreative } from "@/server/services/ad-creative-service";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  let userId: string | undefined;
  try {
    const user = await requireSessionUser();
    userId = user.id;
    requireRole(user, ["admin", "editor"]);

    const rate = checkRateLimit(`ad-creative:generate:${user.id}`, 6, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Príliš veľa požiadaviek. Skúste o chvíľu." } },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const brief = formData.get("brief");
    const clientId = formData.get("clientId");
    const platform = formData.get("platform");
    const referenceImageFile = formData.get("referenceImage");

    if (!brief || typeof brief !== "string" || brief.trim().length < 5) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Brief je povinný (min. 5 znakov)." } },
        { status: 400 }
      );
    }
    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Klient je povinný." } },
        { status: 400 }
      );
    }
    const validPlatforms = ["facebook", "instagram", "stories", "carousel"];
    if (!platform || typeof platform !== "string" || !validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Platforma musí byť jedna z: facebook, instagram, stories, carousel." } },
        { status: 400 }
      );
    }

    let referenceImageBuffer: Buffer | undefined;
    let referenceImageMimeType: string | undefined;
    if (referenceImageFile && referenceImageFile instanceof File) {
      if (referenceImageFile.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: { code: "bad_request", message: "Referenčný obrázok nesmie presiahnuť 10 MB." } },
          { status: 400 }
        );
      }
      referenceImageBuffer = Buffer.from(await referenceImageFile.arrayBuffer());
      referenceImageMimeType = referenceImageFile.type || "image/jpeg";
    }

    const result = await generateAdCreative({
      userId: user.id,
      clientId,
      brief: brief.trim(),
      platform,
      referenceImageBuffer,
      referenceImageMimeType
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "tool.ad_creative_generated",
      entityType: "ad_creative_run",
      entityId: result.runId,
      metadata: { clientId, platform, status: "success" }
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznáma chyba servera.";

    if (userId) {
      await recordAuditEvent({
        actorUserId: userId,
        eventType: "tool.ad_creative_generation_failed",
        metadata: { status: "error", message }
      });
    }

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Nemáte oprávnenie." } }, { status: 403 });
    }
    if (message.includes("API key is not configured")) {
      return NextResponse.json({ error: { code: "provider_not_configured", message } }, { status: 503 });
    }
    if (message.startsWith("PROHIBITED_CONTENT")) {
      return NextResponse.json({ error: { code: "prohibited_content", message } }, { status: 422 });
    }

    return NextResponse.json({ error: { code: "generation_failed", message } }, { status: 500 });
  }
}
