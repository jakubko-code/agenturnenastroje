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
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      let allowed = false;
      if (allowedEmails.size > 0 && allowedEmails.has(email)) {
        allowed = true;
      } else if (allowedDomain && email.endsWith(`@${allowedDomain}`)) {
        allowed = true;
      }

      if (!allowed) {
        await recordAuditEvent({
          eventType: "auth.sign_in_denied",
          metadata: { email, allowedDomain }
        });
        return false;
      }

      // Persist fresh OAuth tokens on every sign-in (PrismaAdapter only calls
      // linkAccount on first login; subsequent logins leave old tokens in the DB).
      if (account && user.id) {
        await db.account.updateMany({
          where: { userId: user.id, provider: account.provider },
          data: {
            access_token: account.access_token,
            refresh_token: account.refresh_token ?? undefined,
            expires_at: account.expires_at ?? undefined,
            scope: account.scope ?? undefined
          }
        });
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: "admin" | "editor" | "viewer" }).role ?? "editor";
        session.user.name = user.name ?? session.user.name;
        session.user.email = user.email ?? session.user.email;
        session.user.image = user.image ?? session.user.image;
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
