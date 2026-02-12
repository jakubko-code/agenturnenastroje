import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { generateStsInsights } from "@/server/services/sts-insights-service";

const RequestSchema = z.object({
  model: z.enum(["openai", "gemini", "claude"]),
  formData: z.object({
    sheetUrl: z.string().trim().url(),
    websiteUrl: z.string().trim().optional().default(""),
    businessDesc: z.string().optional().default(""),
    minImpr: z.number().int().min(0).optional().default(0),
    maxRows: z.number().int().min(50).max(2000).optional().default(300),
    language: z.string().optional().default("sk")
  })
});

export async function POST(req: Request) {
  let userId: string | undefined;
  let model: "openai" | "gemini" | "claude" | undefined;

  try {
    const user = await requireSessionUser();
    userId = user.id;
    requireRole(user, ["admin", "editor"]);
    const rate = checkRateLimit(`sts-insights:post:${user.id}`, 8, 60_000);
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

    const result = await generateStsInsights({
      userId: user.id,
      model: parsed.data.model,
      formData: parsed.data.formData
    });

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "tool.sts_insights_generated",
      entityType: "tool_run",
      metadata: { model: parsed.data.model, status: "success" }
    });

    return NextResponse.json({ generatedText: result.generatedText });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error.";
    if (userId) {
      await recordAuditEvent({
        actorUserId: userId,
        eventType: "tool.sts_insights_generation_failed",
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
