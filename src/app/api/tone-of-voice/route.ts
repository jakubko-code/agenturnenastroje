import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { generateToneOfVoiceManual } from "@/server/services/tone-of-voice-service";

const RequestSchema = z.object({
  model: z.enum(["openai", "gemini", "claude"]),
  formData: z.object({
    brandName: z.string().trim().min(1),
    industry: z.string().trim().min(1),
    values: z.string().optional().default(""),
    mission: z.string().optional().default(""),
    benefits: z.string().optional().default(""),
    personality: z.string().optional().default(""),
    audience: z.string().optional().default(""),
    triggers: z.string().optional().default(""),
    webTexts: z.string().optional().default(""),
    socialTexts: z.string().optional().default(""),
    newsletterTexts: z.string().optional().default(""),
    channels: z.string().optional().default(""),
    competitors: z.string().optional().default(""),
    competitorNotes: z.string().optional().default("")
  })
});

export async function POST(req: Request) {
  let userId: string | undefined;
  let model: "openai" | "gemini" | "claude" | undefined;

  try {
    const user = await requireSessionUser();
    userId = user.id;
    requireRole(user, ["admin", "editor"]);

    const rate = checkRateLimit(`tone-of-voice:post:${user.id}`, 10, 60_000);
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

    const f = parsed.data.formData;
    if (!f.webTexts.trim() && !f.socialTexts.trim() && !f.newsletterTexts.trim()) {
      return NextResponse.json(
        {
          error: {
            code: "bad_request",
            message: "Vloz aspon nejake ukazky komunikacie (web, socialne siete alebo newslettery)."
          }
        },
        { status: 400 }
      );
    }
    model = parsed.data.model;

    const result = await generateToneOfVoiceManual({
      userId: user.id,
      model: parsed.data.model,
      formData: parsed.data.formData
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "tool.tone_of_voice_generated",
      entityType: "tool_run",
      metadata: { model: parsed.data.model, status: "success" }
    });

    return NextResponse.json({ generatedText: result.generatedText });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error.";
    if (userId) {
      await recordAuditEvent({
        actorUserId: userId,
        eventType: "tool.tone_of_voice_generation_failed",
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
