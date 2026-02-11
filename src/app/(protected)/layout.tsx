import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ScrollBorderToggle } from "@/components/scroll-border-toggle";
import { TopNav } from "@/components/top-nav";
import { UserMenu } from "@/components/user-menu";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <ScrollBorderToggle />
      <header className="topbar">
        <Link href="/dashboard" className="brand-mark">
          <img src="/logo.png" alt="" className="brand-logo" />
          <span>Interné nástroje</span>
        </Link>

        <TopNav />

        <div className="topbar-right">
          <span className="user-pill">{session.user.email}</span>
          <UserMenu signOutAction={signOutAction} />
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
