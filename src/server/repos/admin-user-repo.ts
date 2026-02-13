import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function listUsersForAdmin() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      pageAccesses: {
        select: {
          page: true
        }
      }
    }
  });

  return users.map((user) => {
    const pageSet = new Set(user.pageAccesses.map((row) => row.page));
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      pageAccess: {
        reportingGoogleAds: pageSet.has("reporting_google_ads"),
        reportingMetaAds: pageSet.has("reporting_meta_ads")
      }
    };
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  return db.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      role: true,
      updatedAt: true
    }
  });
}
