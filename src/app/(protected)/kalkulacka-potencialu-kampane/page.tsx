import { CampaignPotentialCalculator } from "@/components/campaign-potential-calculator";

export default function KalkulackaPotencialuKampanePage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Kalkulačka potenciálu kampane</h1>
        <p>
          Táto kalkulačka slúži na rýchly kvantitatívny odhad výkonu výkonnostných kampaní ešte pred ich spustením. Na
          základe základných vstupných metrík ti umožní modelovať očakávané náklady, počet objednávok, tržby aj
          celkovú efektivitu investície.
        </p>
        <p>
          Funguje na jednoduchom princípe: zadáš mesačný objem hľadanosti, predpokladané CTR, priemerné CPC, konverzný
          pomer (CVR) a priemernú hodnotu objednávky (AOV). Na základe týchto údajov okamžite vypočíta odhad počtu
          klikov, očakávané náklady, počet konverzií, predpokladané tržby, ako aj ukazovatele ROAS a CPA.
        </p>
        <p>
          Je vhodná na prípravu mediálnych plánov, odhad potrebného rozpočtu, validáciu ekonomiky kampane alebo rýchlu
          orientáciu v potenciáli nového segmentu. Model pracuje so zadanými predpokladmi, preto platí, že čím
          realistickejšie vstupy použiješ, tým relevantnejší bude výsledok.
        </p>
      </div>
      <CampaignPotentialCalculator />
    </section>
  );
}
