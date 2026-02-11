import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/server/services/audit-service";

const allowedDomain = process.env.ALLOWED_DOMAIN?.trim().toLowerCase();
const allowedEmails = new Set(
  (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      if (allowedEmails.size > 0 && allowedEmails.has(email)) {
        return true;
      }

      if (allowedDomain) {
        return email.endsWith(`@${allowedDomain}`);
      }

      await recordAuditEvent({
        eventType: "auth.sign_in_denied",
        metadata: { email, allowedDomain }
      });

      return false;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: "admin" | "editor" | "viewer" }).role ?? "editor";
      }
      return session;
    }
  },
  events: {
    async signIn(message) {
      await recordAuditEvent({
        actorUserId: message.user.id,
        eventType: "auth.sign_in_success",
        metadata: { email: message.user.email }
      });
    },
    async signOut(message) {
      const tokenUser =
        "token" in message && message.token
          ? (message.token as { sub?: string; email?: string })
          : undefined;
      const sessionUser =
        "session" in message && message.session
          ? (message.session as { user?: { email?: string } })
          : undefined;

      await recordAuditEvent({
        actorUserId: tokenUser?.sub,
        eventType: "auth.sign_out",
        metadata: { email: tokenUser?.email ?? sessionUser?.user?.email }
      });
    }
  },
  pages: {
    signIn: "/login"
  }
});
