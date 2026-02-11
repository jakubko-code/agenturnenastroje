import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function listUsersForAdmin() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
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
