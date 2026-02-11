import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { TopNav } from "@/components/top-nav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          <span>agenturne nastroje</span>
        </div>

        <TopNav />

        <div className="topbar-right">
          <span className="user-pill">{session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn btn-secondary">
              Odhlasit
            </button>
          </form>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
