import { EcommerceProfitCalculator } from "@/components/ecommerce-profit-calculator";

export default function ProfitabilityCalculatorPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Kalkulačka ziskovosti reklamy</h1>
        <p>
          Hlavným cieľom kalkulačky je odpovedať na kľúčovú otázku: "Koľko mi reálne zostane peňazí (aký budem mať
          čistý zisk) pri rôznych scenároch výdavkov na reklamu?" Pomáha ti to pochopiť, že vysoké ROAS (alebo nízke
          PNO) a vysoké tržby automaticky neznamenajú vysoký zisk, pretože do hry vstupujú aj reálne firemné náklady.
        </p>
      </div>
      <EcommerceProfitCalculator />
      <section className="card ecom-guide">
        <p>Kalkulačka funguje v 3 krokoch:</p>

        <ol>
          <li>
            <strong>Nastavenie základu (Časť "Nastavenia")</strong>
            <p>Sem zadáj dve najdôležitejšie čísla, ktoré definujú firmu:</p>
            <p>
              Fixné náklady: Koľko peňazí je nutné mesačne zaplatiť bez ohľadu na to, či sa niečo predá (napr. nájom,
              platy, softvér, energie, ...).
            </p>
            <p>
              Hrubá marža / Prirážka: Koľko percent z predajnej ceny reálne zostane po odrátaní nákladov na nákup
              tovaru. Toto číslo definuje základnú profitabilitu produktov.
            </p>
          </li>

          <li>
            <strong>Modelovanie situácie (Bloky "Scenár A" a "Scenár B")</strong>
            <p>Tu si už modeluješ konkrétnu marketingovú aktivitu. Zaujímajú ťa tri veci:</p>
            <p>Investícia do reklamy: Koľko peňazí sa plánuje investovať do reklamy.</p>
            <p>
              ROAS alebo PNO: Akú efektivitu reklamy očakávaš. Tieto dve polia sú prepojené a slúžia pre tých, ktorí
              plánujú rôznymi spôsobmi:
            </p>
            <p>ROAS: Hovorí, koľko € v tržbách získaš za 1 € reklamy.</p>
            <p>PNO: Hovorí, koľko percent z tržieb ťa stála reklama.</p>
            <p>Keď vyplníš jedno pole, druhé sa automaticky prepočíta.</p>
          </li>

          <li>
            <strong>Okamžitá odpoveď (Výsledky)</strong>
            <p>Kalkulačka ti okamžite prepočíta celý reťazec a ukáže ti to najdôležitejšie:</p>
            <p>Vypočíta Tržby (Investícia × ROAS).</p>
            <p>
              Z tržieb vypočíta Hrubú maržu (pomocou tvojho % z nastavení). Toto sú peniaze, ktoré sa reálne zarobili z
              predaja.
            </p>
            <p>Od hrubej marže odráta Fixné náklady (zistíš, či sa vôbec pokryl chod firmy).</p>
            <p>Nakoniec odráta aj samotné Náklady na reklamu (investíciu).</p>
            <p>Výsledkom je finálne číslo: Čistý zisk po reklame.</p>
          </li>
        </ol>

        <p>
          <strong>Na čo je to dobré?</strong>
        </p>
        <p>Vďaka dvom scenárom (A a B) vedľa seba môžeš okamžite porovnávať situácie ako:</p>
        <p>"Čo sa mi oplatí viac? Investovať 1000 € s vysokým ROAS 5.0 (PNO 20 %)?" (Scenár A)</p>
        <p>
          "...alebo môžem investovať viac (3000 €), aj keď mi ROAS klesne na 3.5 (PNO stúpne na 28,57 %)?" (Scenár B)
        </p>
        <p>
          Kalkulačka ti hneď ukáže, ktorý scenár na konci mesiaca prinesie viac peňazí do vrecka (vyšší čistý zisk), a
          pomôže ti tak robiť lepšie rozhodnutia o marketingovom rozpočte.
        </p>
      </section>
    </section>
  );
}
