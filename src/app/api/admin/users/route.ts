import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { listUsersForAdmin, updateUserRole } from "@/server/repos/admin-user-repo";
import { recordAuditEvent } from "@/server/services/audit-service";

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"])
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin"]);

    const rate = checkRateLimit(`admin-users:get:${user.id}`, 60, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests. Try again in a moment." } },
        { status: 429 }
      );
    }

    const users = await listUsersForAdmin();
    return NextResponse.json({ users });
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

export async function PATCH(req: Request) {
  try {
    const user = await requireSessionUser();
    requireRole(user, ["admin"]);

    const rate = checkRateLimit(`admin-users:patch:${user.id}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests. Try again in a moment." } },
        { status: 429 }
      );
    }

    const parsed = UpdateRoleSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Invalid payload." } },
        { status: 400 }
      );
    }

    if (parsed.data.userId === user.id && parsed.data.role !== "admin") {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Cannot remove admin role from currently logged-in admin." } },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserRole(parsed.data.userId, parsed.data.role as UserRole);

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "admin.user_role_updated",
      entityType: "user",
      entityId: parsed.data.userId,
      metadata: { role: parsed.data.role }
    });

    return NextResponse.json({ user: updatedUser });
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
