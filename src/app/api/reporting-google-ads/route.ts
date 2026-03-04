import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hasRestrictedPageAccess } from "@/server/services/page-access-service";
import { getAccountsTable } from "@/server/services/reporting-google-ads-live-service";

export const runtime = "nodejs";

const RequestSchema = z.object({
  period: z.enum(["DAY", "WEEK", "MONTH"]).default("WEEK")
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const canAccess = await hasRestrictedPageAccess(user.id, "reporting_google_ads");
    if (!canAccess) {
      return NextResponse.json({ error: { code: "forbidden", message: "Access denied." } }, { status: 403 });
    }

    const rate = checkRateLimit(`reporting-gads:post:${user.id}`, 20, 60_000);
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

    const data = await getAccountsTable({ period: parsed.data.period, activeOnly: true });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "load_failed", message } }, { status: 500 });
  }
}
