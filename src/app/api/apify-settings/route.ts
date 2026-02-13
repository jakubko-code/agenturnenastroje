import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { recordAuditEvent } from "@/server/services/audit-service";
import { getApifyStatusForUser, saveApifyKeyForUser } from "@/server/services/user-integration-secret-service";

const ApifySettingsSchema = z.object({
  apifyApiKey: z.string().trim().min(1)
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const rate = checkRateLimit(`apify-settings:get:${user.id}`, 40, 60_000);
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

    const keys = await getApifyStatusForUser(user.id);
    return NextResponse.json({ keys, scope: "user" });
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
    const rate = checkRateLimit(`apify-settings:post:${user.id}`, 20, 60_000);
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

    const parsed = ApifySettingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "bad_request", message: "Invalid payload." } }, { status: 400 });
    }

    await saveApifyKeyForUser(user.id, parsed.data.apifyApiKey);

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "settings.apify_key_updated",
      entityType: "user_integration_secret",
      metadata: { provider: "apify" }
    });

    const keys = await getApifyStatusForUser(user.id);
    return NextResponse.json({ saved: true, keys });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }

    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
