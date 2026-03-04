import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hasRestrictedPageAccess } from "@/server/services/page-access-service";
import { upsertAccountConfig } from "@/server/services/reporting-google-ads-live-service";

export const runtime = "nodejs";

const RequestSchema = z.object({
  customer_id: z.string().trim().min(3),
  account_name: z.string().trim().default(""),
  owner: z.string().trim().default(""),
  active: z.enum(["TRUE", "FALSE"]).default("TRUE"),
  monthly_budget: z.number().min(0),
  kpi_type: z.enum(["ROAS", "CPA", "CONV"]),
  kpi_target: z.number().min(0),
  min_spend_for_eval: z.number().min(0).optional(),
  min_clicks_for_eval: z.number().min(0).optional()
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const canAccess = await hasRestrictedPageAccess(user.id, "reporting_google_ads");
    if (!canAccess) {
      return NextResponse.json({ error: { code: "forbidden", message: "Access denied." } }, { status: 403 });
    }

    const rate = checkRateLimit(`reporting-gads-config:post:${user.id}`, 30, 60_000);
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

    const result = await upsertAccountConfig(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "save_failed", message } }, { status: 500 });
  }
}
