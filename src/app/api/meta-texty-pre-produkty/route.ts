import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { generateMetaProductTexts } from "@/server/services/meta-product-service";

const RequestSchema = z.object({
  model: z.enum(["openai", "gemini", "claude"]),
  formData: z.object({
    toneOfVoice: z.string().trim().min(1),
    targetAudience: z.string().trim().min(1),
    productDescription: z.string().trim().min(1),
    productUrl: z.string().optional().default("")
  })
});

export async function POST(req: Request) {
  let userId: string | undefined;
  let model: "openai" | "gemini" | "claude" | undefined;

  try {
    const user = await requireSessionUser();
    userId = user.id;
    requireRole(user, ["admin", "editor"]);

    const rate = checkRateLimit(`meta-product-texts:post:${user.id}`, 12, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests. Try again in a moment." } },
        { status: 429 }
      );
    }

    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "bad_request", message: "Invalid request body." } }, { status: 400 });
    }
    model = parsed.data.model;

    const result = await generateMetaProductTexts({
      userId: user.id,
      model: parsed.data.model,
      formData: parsed.data.formData
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "tool.meta_product_texts_generated",
      entityType: "tool_run",
      metadata: { model: parsed.data.model, status: "success" }
    });

    return NextResponse.json({ generatedText: result.generatedText });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error.";
    if (userId) {
      await recordAuditEvent({
        actorUserId: userId,
        eventType: "tool.meta_product_texts_generation_failed",
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

    return NextResponse.json({ error: { code: "generation_failed", message } }, { status: 500 });
  }
}
