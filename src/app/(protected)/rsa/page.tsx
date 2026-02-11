import { RsaForm } from "@/components/rsa-form";

export default function RsaPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Generovanie RSA reklám pre Google Ads (AI)</h1>
        <p>
          Tento nástroj na základe detailného zadania generuje kompletnú a diverzifikovanú sadu 15 nadpisov a 5
          popisov pre responzívne reklamy vo vyhľadávaní (RSA). Jeho cieľom je maximalizovať relevanciu a mieru
          prekliku (CTR) tým, že pokrýva široké spektrum osvedčených copywritingových prístupov od priameho cielenia
          na kľúčové slová až po emocionálne apely a budovanie dôvery.{" "}
          <span className="page-head-highlight">Nástroj je vhodný na tvorbu textov pre eshopy a služby.</span>
        </p>
      </div>
      <RsaForm />
    </section>
  );
}
