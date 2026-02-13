import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ScrollBorderToggle } from "@/components/scroll-border-toggle";
import { TopNav } from "@/components/top-nav";
import { UserMenu } from "@/components/user-menu";
import { getReportingPageAccess } from "@/server/services/page-access-service";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userLabel = session?.user?.name || session?.user?.email || "U";
  const userInitial = userLabel.trim().charAt(0).toUpperCase();
  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  if (!session?.user?.id) {
    redirect("/login");
  }

  const reportingAccess = await getReportingPageAccess(session.user.id);

  return (
    <div className="app-shell">
      <ScrollBorderToggle />
      <header className="topbar">
        <Link href="/dashboard" className="brand-mark">
          <img src="/logo.png" alt="" className="brand-logo" />
          <span>Interné nástroje</span>
        </Link>

        <TopNav reportingAccess={reportingAccess} />

        <div className="topbar-right">
          <span className="user-pill">{session.user.email}</span>
          {session.user.image ? (
            <img src={session.user.image} alt="Profilova fotka" className="user-avatar" />
          ) : (
            <span className="user-avatar user-avatar-fallback" aria-hidden="true">
              {userInitial}
            </span>
          )}
          <UserMenu signOutAction={signOutAction} />
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
