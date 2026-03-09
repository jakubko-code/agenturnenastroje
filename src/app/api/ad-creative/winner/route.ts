import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { markRunAsWinner } from "@/server/services/ad-creative-service";

const Schema = z.object({ runId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin", "editor"]);

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "runId je povinný." } },
        { status: 400 }
      );
    }

    await markRunAsWinner(parsed.data.runId, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Nemáte oprávnenie." } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
