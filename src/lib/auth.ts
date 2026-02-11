import { auth } from "@/auth";
import { SessionUser, AppRole } from "@/types/auth";

export async function requireSessionUser(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role
  };
}

export function requireRole(user: SessionUser, allowed: AppRole[]): void {
  if (!allowed.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
}
