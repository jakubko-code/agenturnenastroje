import { RestrictedPage } from "@prisma/client";
import { db } from "@/lib/db";

export async function listUserPageAccesses(userId: string) {
  return db.userPageAccess.findMany({
    where: { userId },
    select: {
      page: true
    }
  });
}

export async function setUserPageAccess(userId: string, page: RestrictedPage, allowed: boolean) {
  if (allowed) {
    return db.userPageAccess.upsert({
      where: {
        userId_page: {
          userId,
          page
        }
      },
      create: {
        userId,
        page
      },
      update: {
        page
      },
      select: {
        id: true,
        userId: true,
        page: true,
        updatedAt: true
      }
    });
  }

  await db.userPageAccess.deleteMany({
    where: {
      userId,
      page
    }
  });

  return null;
}
