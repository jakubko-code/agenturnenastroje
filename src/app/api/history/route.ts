import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { listRecentRuns } from "@/server/repos/tool-run-repo";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const rate = checkRateLimit(`history:get:${user.id}`, 60, 60_000);
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

    const rows = await listRecentRuns(user.id, 30);

    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }

    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
