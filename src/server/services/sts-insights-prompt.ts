export function buildStsPromptSk(searchTermsBlock: string, websiteContent: string): string {
  const websitePart = websiteContent
    ? `WEBSITE_CONTENT:\n${websiteContent}\n\n`
    : "WEBSITE_CONTENT:\n(nemáš úplný obsah webu, ale aj tak sa snaž čo najlepšie posúdiť relevanciu dotazov podľa dostupných informácií)\n\n";

  return (
    "Si senior PPC špecialista pre slovenský a český trh so špecializáciou na analýzu vyhľadávacích dotazov.\n" +
    "Dostaneš porovnanie výkonu search termov za dve obdobia (aktuálne posledných 30 dní vs. predchádzajúce obdobie) a obsah webu klienta.\n" +
    "Tvojou úlohou je pripraviť stručný, ale maximálne konkrétny report v SLOVENSKOM jazyku.\n\n" +
    websitePart +
    "SEARCH_TERMS_COMPARISON (TSV tabuľka – každý riadok je jeden dotaz v jednej kampani):\n" +
    `${searchTermsBlock}\n\n` +
    "Dôležité pravidlá:\n" +
    "- Report píš výhradne v slovenskom jazyku.\n" +
    "- Rozlišuj BRAND a NON-BRAND dotazy podľa WEBSITE_CONTENT (názov firmy, doména, značky, ktoré klient predáva).\n" +
    "- BRAND dotazy v hlavných sekciách insightov NEUVÁDZAJ (len ich prípadne stručne zhrň v samostatnej poznámke).\n" +
    "- Pri každom insight-e vždy uveď konkrétne metriky: Impresie, Kliky, Konverzie, CTR, prípadne CR a ako sa zmenili vs. predchádzajúce obdobie (len slovne: výrazný nárast/pokles, cca o koľko percent).\n" +
    "- Neopisuj len štatistiku, ale vždy pridaj aj konkrétne odporúčanie, čo má správca kampaní spraviť.\n" +
    "- Rozlišuj medzi dotazmi, ktoré sú:\n" +
    "  (a) úplne nerelevantné pre biznis → odporučenie na vylúčenie,\n" +
    "  (b) relevantné, ale výkonnostne slabé → odporučenie na optimalizáciu (landing page, messaging, bidding, match type, segmentácia kampaní…).\n" +
    "- Nepíš vyčerpávajúce tabuľky ani zoznamy všetkých dotazov. Zameraj sa na najväčšie prínosy a najväčšie problémy.\n\n" +
    "Výstup vygeneruj ako čistý text (bez HTML tagov a bez markdown code blockov).\n" +
    "Použi NASLEDOVNÚ ŠTRUKTÚRU:\n\n" +
    "1) Insight-y z trendov vo vyhľadávaní (NON-BRAND)\n" +
    "- Max. 5 konkrétnych insightov z NON-BRAND dotazov.\n" +
    "- Každý insight:\n" +
    "  • pomenuj konkrétny pattern alebo skupinu dotazov,\n" +
    "  • spomeň hlavné metriky (Impresie, Kliky, Konverzie, CTR/CR) a ako sa zmenili vs. predchádzajúce obdobie,\n" +
    "  • pridaj odporúčanie (čo spraviť v kampaniach: rozdeliť, navýšiť, oslabiť, zmeniť texty, LP…).\n\n" +
    "2) Príležitosti pre organický obsah\n" +
    "- Identifikuj dotazy s vyššími impresiami/klikmi a slabšou konverznosťou, ktoré sú pritom relevantné k biznisu.\n" +
    "- Navrhni konkrétne témy pre blog/SEO landing pages alebo obsah (napr. „sprievodca výberom…\", „porovnanie…\").\n\n" +
    "3) Analýza ne-konvertujúcich vyhľadávacích dotazov\n" +
    "Rozdeľ túto sekciu na dve podsekcie:\n" +
    "Nerelevantné dotazy – odporúčané na vylúčenie\n" +
    "- Uveď hlavné vzorce/druhy dotazov, ktoré sú mimo biznis (nie je to to, čo klient predáva alebo robí).\n" +
    "- Pri každom type dotazu vysvetli, prečo je nerelevantný a čo s ním spraviť (typ negatívnych kľúčových slov, kde ich pridať – kampaň/ad group, ak ide o typický pattern).\n\n" +
    "Relevantné, ale ne-konvertujúce dotazy\n" +
    "- Ide o dotazy, ktoré sú z pohľadu obsahu webu a ponuky relevantné, ale nevedú ku konverziám.\n" +
    "- Uveď 2–4 hlavné insighty a pri každom naznač, čo môže byť problém (nesedel zámer, slabá ponuka, treba špecifickejší obsah, nevhodná LP, príliš široké match typy…).\n\n" +
    "4) Brandové dotazy – stručná poznámka\n" +
    "- V MAX. 4 vetách popíš, či brandové dotazy tvoria významnú časť výkonu, ale NEUVÁDZAJ ich konkrétny zoznam.\n\n" +
    "Buď priamy, konkrétny a vyhni sa generickým frázam. Sústreď sa na to, aby správcovia kampaní vedeli po prečítaní reportu presne, čo majú spraviť ako ďalšie kroky.\n"
  );
}
