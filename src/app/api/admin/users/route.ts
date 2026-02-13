import { RestrictedPage, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { listUsersForAdmin, updateUserRole } from "@/server/repos/admin-user-repo";
import { setUserPageAccess } from "@/server/repos/page-access-repo";
import { recordAuditEvent } from "@/server/services/audit-service";

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"])
});

const UpdatePageAccessSchema = z.object({
  userId: z.string().min(1),
  page: z.enum(["reporting_google_ads", "reporting_meta_ads"]),
  allowed: z.boolean()
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

    const payload = await req.json();
    const roleParsed = UpdateRoleSchema.safeParse(payload);
    const pageParsed = UpdatePageAccessSchema.safeParse(payload);

    if (!roleParsed.success && !pageParsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Invalid payload." } },
        { status: 400 }
      );
    }

    if (roleParsed.success) {
      if (roleParsed.data.userId === user.id && roleParsed.data.role !== "admin") {
        return NextResponse.json(
          { error: { code: "bad_request", message: "Cannot remove admin role from currently logged-in admin." } },
          { status: 400 }
        );
      }

      const updatedUser = await updateUserRole(roleParsed.data.userId, roleParsed.data.role as UserRole);

      await recordAuditEvent({
        actorUserId: user.id,
        eventType: "admin.user_role_updated",
        entityType: "user",
        entityId: roleParsed.data.userId,
        metadata: { role: roleParsed.data.role }
      });

      return NextResponse.json({ user: updatedUser });
    }

    if (!pageParsed.success) {
      return NextResponse.json(
        { error: { code: "bad_request", message: "Invalid payload." } },
        { status: 400 }
      );
    }

    const page = pageParsed.data.page as RestrictedPage;
    const result = await setUserPageAccess(pageParsed.data.userId, page, pageParsed.data.allowed);

    await recordAuditEvent({
      actorUserId: user.id,
      eventType: "admin.user_page_access_updated",
      entityType: "user",
      entityId: pageParsed.data.userId,
      metadata: { page, allowed: pageParsed.data.allowed }
    });

    return NextResponse.json({
      access: {
        userId: pageParsed.data.userId,
        page,
        allowed: pageParsed.data.allowed,
        updatedAt: result?.updatedAt ?? new Date().toISOString()
      }
    });
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
