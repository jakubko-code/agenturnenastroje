import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { updateClient, deactivateClient } from "@/server/repos/creative-client-repo";

const UpdateClientSchema = z.object({
  name: z.string().trim().min(1).optional(),
  industry: z.string().trim().min(1).optional(),
  defaultStyle: z.string().trim().min(1).optional(),
  defaultLighting: z.string().trim().min(1).optional(),
  defaultColorGrading: z.string().trim().min(1).optional(),
  defaultAspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]).optional(),
  brandNotes: z.string().optional()
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin"]);
    const { id } = await params;

    const parsed = UpdateClientSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Neplatné údaje." } },
        { status: 400 }
      );
    }

    const client = await updateClient(id, parsed.data);
    return NextResponse.json({ client });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Iba admin môže upravovať klientov." } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin"]);
    const { id } = await params;

    await deactivateClient(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Iba admin môže mazať klientov." } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
