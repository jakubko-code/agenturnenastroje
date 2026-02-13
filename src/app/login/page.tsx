import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="center-wrap">
      <section className="card login-card">
        <h1>Vivantina - interné nástroje</h1>
        <p>Prihlásenie je povolené iba cez firemný Google účet.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button className="btn" type="submit">
            Prihlásiť sa Google účtom
          </button>
        </form>
      </section>
    </main>
  );
}
