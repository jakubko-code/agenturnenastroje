import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  redirect("/rsa");

  return (
    <main>
      <Link href="/rsa">Open app</Link>
    </main>
  );
}
