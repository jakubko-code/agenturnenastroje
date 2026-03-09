import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { listActiveClients, createClient } from "@/server/repos/creative-client-repo";

const CreateClientSchema = z.object({
  name: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  defaultStyle: z.string().trim().min(1),
  defaultLighting: z.string().trim().min(1),
  defaultColorGrading: z.string().trim().min(1),
  defaultAspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]),
  brandNotes: z.string().optional().default("")
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin", "editor", "viewer"]);

    const clients = await listActiveClients();
    return NextResponse.json({ clients });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin"]);

    const parsed = CreateClientSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Neplatné údaje klienta." } },
        { status: 400 }
      );
    }

    const client = await createClient({ ...parsed.data, createdBy: user.id });
    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chyba servera.";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { code: "unauthorized", message: "Vyžaduje sa prihlásenie." } }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ error: { code: "forbidden", message: "Iba admin môže vytvárať klientov." } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: "server_error", message } }, { status: 500 });
  }
}
