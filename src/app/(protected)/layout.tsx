import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
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
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link href="/dashboard" className="brand-mark">
            <img src="/logo.png" alt="" className="brand-logo" />
            <span>Interné nástroje</span>
          </Link>
        </div>

        <TopNav reportingAccess={reportingAccess} />

        <div className="sidebar-footer">
          <UserMenu
            signOutAction={signOutAction}
            userInitial={userInitial}
            userName={userLabel}
            userEmail={session.user.email}
            userImage={session.user.image}
          />
        </div>
      </aside>

      <main className="page-content">{children}</main>
    </div>
  );
}
