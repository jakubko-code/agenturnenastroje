import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <nav>
          <Link href="/rsa">RSA</Link>
          <Link href="/meta-universal">Meta Universal</Link>
          <Link href="/nastavenia">Nastavenia</Link>
          <Link href="/historia">Historia</Link>
        </nav>
        <div className="topbar-right">
          <span>{session.user.email}</span>
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
