type AuditBusinessContext = {
  businessDesc?: string;
  brand_terms?: string;
  services_offered?: string;
  services_not_offered?: string;
  primary_service_keywords?: string;
  adjacent_services_offered?: string;
  price_positioning?: string;
  locations_served?: string;
  primary_conversion_name?: string;
};

function buildAuditBusinessContextBlock(ctx?: AuditBusinessContext): string {
  const safe = ctx ?? {};

  function line(label: string, key: keyof AuditBusinessContext): string {
    const value = safe[key];
    if (!value || String(value).trim() === "") return "";
    return `- ${label}: ${String(value).trim()}\n`;
  }

  let out = "";
  out += line("Stručný popis biznisu", "businessDesc");
  out += line("Brandové termíny", "brand_terms");
  out += line("Poskytované služby / produkty", "services_offered");
  out += line("Čo jednoznačne neposkytujete", "services_not_offered");
  out += line("Primárne kľúčové slová", "primary_service_keywords");
  out += line("Súvisiace služby / kategórie", "adjacent_services_offered");
  out += line("Cenové pozicionovanie", "price_positioning");
  out += line("Lokality, kde pôsobíte", "locations_served");
  out += line("Primárna konverzná akcia (na ktorú sa má audit zamerať)", "primary_conversion_name");

  if (!out) {
    out = "(Neboli zadané žiadne doplňujúce biznis informácie.)\n";
  }

  return out;
}

export function buildAuditPrompt(sheetDataText: string, businessContext?: AuditBusinessContext): string {
  const ctxBlock = buildAuditBusinessContextBlock(businessContext);

  return (
    "Si senior Google Ads stratég a analytik výkonnostných kampaní.\n" +
    "Tvojou úlohou je pripraviť profesionálny, odborný HĹBKOVÝ AUDIT Google Ads účtu\n" +
    "v SLOVENČINE. Audit je určený pre PPC špecialistu alebo marketingového stratéga, nie pre klienta.\n\n" +
    "Tento audit musí:\n" +
    "- byť zameraný na VÝKON a EFEKTIVITU kampaní (náklady, výsledky, plytvanie, príležitosti),\n" +
    "- pomenovať kľúčové príčiny úspechu aj problémy v štruktúre a optimalizácii účtu,\n" +
    "- vychádzať VÝHRADNE z poskytnutých dát (NEVYMÝŠĽAJ SI, NEODHADUJ ČÍSLA),\n" +
    "- formulovať zistenia analyticky, s dôrazom na konkrétne metriky a biznisový dopad.\n\n" +
    "Ak nejaké údaje v exporte nie sú dostupné, NAPÍŠ PRESNE: \"nie je dostupné v exporte\".\n\n" +
    "==================================================\n" +
    "VSTUPNÝ BIZNIS KONTEXT (OD POUŽÍVATEĽA NÁSTROJA)\n" +
    "==================================================\n\n" +
    ctxBlock +
    "\n" +
    "==================================================\n" +
    "DÁTA Z GOOGLE SHEET (EXPORT Z GOOGLE ADS)\n" +
    "==================================================\n\n" +
    "Export obsahuje viaceré listy, napríklad:\n" +
    "- campaign (výkon kampaní, mena účtu v customer.currency_code)\n" +
    "- search_is (impression share a straty)\n" +
    "- keywords (výkon kľúčových slov)\n" +
    "- search_terms (search kampane)\n" +
    "- pmax_search_terms (výrazy z PMax kampaní)\n" +
    "- shopping_search_terms (výrazy zo Shopping kampaní)\n" +
    "- ads, ads_search_display, ads_pmax_shopping (reklamy podľa typu)\n" +
    "- rsa_assets (asset-level dáta pre RSA reklamy)\n" +
    "- landing_pages (výkon landing page URL)\n" +
    "- campaign_device_network (výkon podľa zariadenia a siete)\n" +
    "- campaign_geo (výkon podľa geolokácie)\n" +
    "- conversion_actions (prehľad konverzných akcií a ich výkonu)\n" +
    "- quality_score_keywords (Quality Score kľúčových slov)\n" +
    "- ad_to_lp_map (prepojenie reklama → landing page)\n\n" +
    "Dáta v jednotlivých listoch sú už zoradené zostupne podľa najrelevantnejších metrík.\n" +
    "- Väčšina listov je zoradená podľa **metrics.cost_micros** (najvyšší spend hore),\n" +
    "- niektoré podľa **metrics.impressions** (viditeľnosť),\n" +
    "- a niektoré podľa **metrics.conversions_value** (hodnota konverzií).\n" +
    "Takže prvé riadky predstavujú najdôležitejšie položky z pohľadu výkonu a rozpočtu.\n\n" +
    "Všetky finančné metriky interpretuj v mene uvedenej v customer.currency_code.\n" +
    "Neprevádzaj na inú menu.\n\n" +
    "--- DÁTA ZO SHEETU (RAW PREHĽAD) ---\n\n" +
    sheetDataText +
    "\n" +
    "==================================================\n" +
    "PRAVIDLÁ PRE INTERPRETÁCIU A KONVERZNÉ AKCIE\n" +
    "==================================================\n\n" +
    "1) Typ biznisu a cieľ\n" +
    "- Z kombinácie listov campaign, search_terms, landing_pages a biznis kontextu odhadni typ biznisu:\n" +
    "  - e-shop / ecommerce (nákupy, objednávky),\n" +
    "  - lead-gen (dopyty, formuláre, kontakt),\n" +
    "  - lokálny biznis (prevádzka, pobočky),\n" +
    "  - iné (ak nie je jasné).\n" +
    "- Jasne pomenuj, čo je pravdepodobný hlavný cieľ účtu (nákup, dopyt, rezervácia, atď.).\n\n" +
    "2) Konverzné akcie (list conversion_actions)\n" +
    "- Pracuj hlavne so stĺpcami:\n" +
    "  - segments.conversion_action_name,\n" +
    "  - segments.conversion_action_category,\n" +
    "  - metrics.conversions, metrics.conversions_value, all_conversions.\n" +
    "- Za HLAVNÚ konverznú akciu považuj takú, ktorej názov obsahuje slová ako:\n" +
    "  \"nákup\", \"objednávka\", \"purchase\", \"lead\", \"dopyt\", \"formulár\", \"registrácia\".\n" +
    "- Mäkké konverzie (mikrokonverzie) sú tie, kde názov obsahuje slová ako:\n" +
    "  \"scroll\", \"klik\", \"klik na tel.\", \"zobrazenie stránky\", \"page view\".\n" +
    "- V audite vždy:\n" +
    "  - pomenuj hlavnú konverziu podľa názvu,\n" +
    "  - zvyšné konverzie označ ako doplnkové / mikrokonverzie,\n" +
    "  - upozorni, ak je príliš veľa nepodstatných konverzií alebo duplicít.\n\n" +
    "2a) Ak bol v biznis kontexte zadaný názov primárnej konverzie, analyzuj výkon účtu najmä z pohľadu tejto akcie.\n" +
    "- Použi ju ako referenciu pre metriky CPA, CVR a ROAS.\n" +
    "- Ak sa táto konverzia v dátach nenachádza, upozorni na to v audite vetou: \"Uvedená primárna konverzia nebola nájdená v exporte.\".\n\n" +
    "3) NESMIEŠ:\n" +
    "- vymýšľať si konkrétne čísla, ktoré nie sú v exporte,\n" +
    "- tvrdiť veci, ktoré nie je možné z dát vyčítať.\n\n" +
    "==================================================\n" +
    "ŠTRUKTÚRA AUDITU – POVINNÉ SEKCIE\n" +
    "==================================================\n\n" +
    "Celý audit píš v slovenčine. Použi nadpisy (začínajúce znakom #) a krátke, prehľadné odseky.\n" +
    "Dôležité zistenia formuluj priamo a jasne bez dodatočného vizuálneho zvýrazňovania.\n\n" +
    "Použi túto štruktúru:\n\n" +
    "# Google Ads Audit Report – [Názov klienta z campaign.customer.descriptive_name]\n\n" +
    "**Critical Insights (Top 5):**\n" +
    "- Vypíš 5 najdôležitejších zistení z celého účtu.\n" +
    "- Každý bod musí obsahovať:\n" +
    "  - čo sa deje (pattern / anomália),\n" +
    "  - konkrétne metriky (napr. CPA, CVR, ROAS, Impression Share),\n" +
    "  - dopad na biznis (plytvanie, priestor na škálovanie, riziko pre brand).\n\n" +
    "## 1. Executive Summary (posledných ~30 dní)\n" +
    "- Stručne zhrň:\n" +
    "  - ako efektívne účet pracuje s rozpočtom (na úrovni hlavnej konverzie),\n" +
    "  - najväčší únik peňazí,\n" +
    "  - najväčšiu príležitosť na rast,\n" +
    "  - či sú dáta dostatočne kvalitné (ak sú problémy, stručne ich spomeň).\n\n" +
    "## 2. Prehľad účtu & základné metriky\n" +
    "- Na úrovni účtu a hlavných kampaní popíš:\n" +
    "  - spend, impressions, clicks, CTR, priemerná CPC,\n" +
    "  - konverzie, konverzný pomer (CVR), CPA,\n" +
    "  - ak je k dispozícii hodnota konverzií, spomeň aj základ ROAS.\n" +
    "- Identifikuj a zhodnoť použité bidovacie stratégie (stĺpec campaign.bidding_strategy_type). Sú v súlade s cieľmi kampaní (napr. tROAS pre e-shop, Max. konverzie pre lead-gen)? Upozorni na prípadné nezhody.\n" +
    "- Ak dáta o hodnote chýbajú, explicitne uveď, že ROAS \"nie je dostupné v exporte\".\n\n" +
    "## 3. Impression Share & stratené príležitosti\n" +
    "- Z listov campaign a search_is zhodnoť:\n" +
    "  - search_impression_share (celková viditeľnosť),\n" +
    "  - search_absolute_top_impression_share (podiel zobrazení na prvej pozícii),\n" +
    "  - search_budget_lost_impression_share (strata kvôli rozpočtu),\n" +
    "  - search_rank_lost_impression_share (strata kvôli rankingu).\n" +
    "- Pomenuj kampane, ktoré sú lídrami vo svojej kategórii, a tie, ktoré majú najväčší potenciál na zlepšenie pozície.\n\n" +
    "## 4. Brand vs Non-Brand výkon\n" +
    "- Na základe názvov kampaní a výrazov v search terms odhadni brand vs non-brand.\n" +
    "- Porovnaj CPA, CVR a Impression Share.\n\n" +
    "## 5. Keywords: víťazi a plytvanie\n" +
    "- Z listu keywords identifikuj víťazné a plytvané kľúčové slová.\n\n" +
    "## 6. Search terms (Search, PMax, Shopping)\n" +
    "- Kombinuj search_terms, pmax_search_terms a shopping_search_terms.\n\n" +
    "## 7. RSA assets & reklamné texty\n" +
    "- Z listu rsa_assets a ads vyber najlepšie a najslabšie assety, navrhni nové texty.\n\n" +
    "## 8. Landing pages\n" +
    "- Z landing_pages porovnaj výkon rôznych typov stránok.\n\n" +
    "## 9. Zariadenia & geolokácie\n" +
    "- Z campaign_device_network a campaign_geo popíš rozdiely vo výkone.\n\n" +
    "## 10. Štruktúra účtu & kvalita dát\n" +
    "- Z quality_score_keywords a ostatných listov zhodnoť QS a prípadné anomálie.\n" +
    "- Zhodnoť rolu a výkon Performance Max kampaní. Existuje riziko kanibalizácie brandových alebo úspešných search kampaní? Analyzuj pmax_search_terms a porovnaj ich s výrazmi v štandardných search kampaniach.\n\n" +
    "## 11. Conversion tracking – inventár\n" +
    "- Z conversion_actions vytvor prehľad konverzií, hlavná vs mikrokonverzie.\n\n" +
    "## 12. Priority Action Plan (Top 5)\n" +
    "- Vypíš max 5 najdôležitejších odporúčaní. Ku každému priraď označenie priority a stručne popíš OČAKÁVANÝ DOPAD (napr. \"Zvýšenie ROAS o 20 %\", \"Zníženie plytvania o 150 EUR/mesiac\", \"Zachytenie o 30 % viac relevantných zobrazení\").\n" +
    "  - ✅ Quick Win,\n" +
    "  - 🛠 Strednodobé opatrenie,\n" +
    "  - 📈 Dlhodobá príležitosť.\n\n" +
    "==================================================\n" +
    "ŠTÝL VÝSTUPU\n" +
    "==================================================\n\n" +
    "- Použi čisté nadpisy (napr. # Nadpis, ## Podnadpis) a krátke odseky.\n" +
    "- Píš VÝHRADNE čistý text. NEPOUŽÍVAJ žiadne hviezdičky (*) na zvýraznenie textu ani na vytváranie zoznamov.\n" +
    "- Nepíš žiadny kód, JSON ani HTML – len text a prípadne jednoduché tabuľky.\n" +
    "- Vyhýbaj sa akémukoľvek vizuálnemu formátovaniu okrem nadpisov.\n" +
    "- Píš analyticky, prehľadne a odborne – audit je určený pre PPC špecialistu alebo marketingového stratéga.\n" +
    "- Môžeš používať odborné pojmy (CPA, CVR, IS, QS, ROAS), ale text musí zostať čitateľný a zrozumiteľný.\n" +
    "- Vyhýbaj sa zbytočným vysvetleniam základných pojmov, sústreď sa na interpretáciu dát a odporúčania.\n\n" +
    "Ak sa text nevmestí do jedného výstupu, ukonči vetou:\n" +
    "\"Audit je dlhší, pokračovanie nižšie.\" a generuj zvyšok v ďalšom výstupe.\n\n" +
    "- Ak audit presahuje tvoj výstupný limit, rozdeľ ho na viac častí, ale nikdy nič neskracuj ani neukončuj v strede vety.\n" +
    "Teraz, na základe vyššie uvedených dát a pravidiel, vygeneruj kompletný audit podľa tejto štruktúry.\n"
  );
}

export type { AuditBusinessContext };
