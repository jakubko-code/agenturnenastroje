import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { getProviderStatusForUser, saveAgencyProviderKeys } from "@/server/services/settings-service";

const SettingsSchema = z.object({
  openaiApiKey: z.string().trim().optional(),
  geminiApiKey: z.string().trim().optional(),
  claudeApiKey: z.string().trim().optional()
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const rate = checkRateLimit(`settings:get:${user.id}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "rate_limited",
            message: "Too many requests. Try again in a moment."
          }
        },
        { status: 429 }
      );
    }

    const keys = await getProviderStatusForUser(user.id);

    return NextResponse.json({ keys, scope: "agency_or_user" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }

    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin"]);
    const rate = checkRateLimit(`settings:post:${user.id}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "rate_limited",
            message: "Too many requests. Try again in a moment."
          }
        },
        { status: 429 }
      );
    }

    const parsed = SettingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Invalid payload." } },
        { status: 400 }
      );
    }

    await saveAgencyProviderKeys(user.id, parsed.data);
    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "settings.provider_keys_updated",
      entityType: "provider_settings",
      metadata: {
        openaiUpdated: typeof parsed.data.openaiApiKey !== "undefined",
        geminiUpdated: typeof parsed.data.geminiApiKey !== "undefined",
        claudeUpdated: typeof parsed.data.claudeApiKey !== "undefined"
      }
    });
    const keys = await getProviderStatusForUser(user.id);
    return NextResponse.json({ saved: true, keys });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Admin role required." } }, { status: 403 });
    }

    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
