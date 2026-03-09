import { auth } from "@/auth";
import { AdCreativeForm } from "@/components/ad-creative-form";

export default async function AdCreativePage() {
  const session = await auth();
  const role = (session?.user?.role ?? "viewer") as "admin" | "editor" | "viewer";

  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Generátor reklamných kreatív
        </h1>
        <p>
          Zadaj krátky textový brief a nástroj ho automaticky skonvertuje na štruktúrovaný prompt pomocou{" "}
          <strong>Claude</strong>, ktorý následne pošle do <strong>Gemini</strong> na vygenerovanie obrázka.
          Výsledky sú ukladané v histórii a môžeš označiť najlepšie kreatívy ako Winners.{" "}
          <span className="page-head-highlight">Funguje pre Facebook, Instagram, Stories aj Carousel.</span>
        </p>
      </div>
      <AdCreativeForm userRole={role} />
    </section>
  );
}
