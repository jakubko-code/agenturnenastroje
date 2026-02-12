import { MetaUniversalForm } from "@/components/meta-universal-form";

export default function MetaUniversalPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Generovanie reklamných textov pre META Ads
        </h1>
        <p>
          Tento nástroj slúži na rýchle a efektívne vytváranie reklamných textov (Primary Text) pre kampane na
          platforme Meta. Jeho hlavnou výhodou je univerzálnosť. Je navrhnutý tak, aby dokázal generovať relevantné a
          pútavé texty pre akýkoľvek typ ponuky, či už ide o e-shop, B2C/B2B službu alebo lokálny biznis.
        </p>
        <p>
          Na základe tebou zadaného briefu, ktorý zahŕňa popis ponuky, cieľovej skupiny a tónu komunikácie, AI
          vytvorí tri odlišné varianty textu pripravené na okamžité použitie. Každý variant využíva iný kreatívny
          prístup (napr. emocionálny, racionálny, praktický) a je optimalizovaný na maximálnu mieru prekliku a
          konverzie vďaka vizuálnemu formátovaniu pomocou emoji a prehľadných odsekov.{" "}
          <span className="page-head-highlight">
            Čím detailnejšie odpovede vyplníš, tým presnejší a použiteľnejší bude výstup.
          </span>
        </p>
      </div>
      <MetaUniversalForm />
    </section>
  );
}
