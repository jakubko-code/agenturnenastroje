import { NextResponse } from "next/server";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { listAdCreativeHistory } from "@/server/services/ad-creative-service";

export async function GET() {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin", "editor", "viewer"]);

    const runs = await listAdCreativeHistory(user.id, 20);

    const items = runs.map((run) => ({
      id: run.id,
      clientName: run.client.name,
      brief: run.brief,
      platform: run.platform,
      style: run.style,
      imageUrl: `/api/ad-creative/outputs/${run.imagePath}`,
      promptJson: run.promptJson,
      isWinner: run.isWinner,
      createdAt: run.createdAt.toISOString()
    }));

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
