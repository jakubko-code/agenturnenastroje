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
        <h1>Agenturne AI nastroje</h1>
        <p>Prihlasenie je povolene iba cez firemny Google ucet.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button className="btn" type="submit">
            Prihlasit cez Google
          </button>
        </form>
      </section>
    </main>
  );
}
