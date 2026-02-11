export type MetaUniversalFormData = {
  businessType?: string;
  campaignGoal?: string;
  offer: string;
  targetAudience: string;
  toneOfVoice: string;
  url?: string;
  notes?: string;
};

export function buildMetaUniversalPrompt(data: MetaUniversalFormData): string {
  const businessType = data.businessType || "neuvedene";
  const campaignGoal = data.campaignGoal || "neuvedene";
  const offer = data.offer || "neuvedene";
  const targetAudience = data.targetAudience || "neuvedene";
  const toneOfVoice = data.toneOfVoice || "neuvedene";
  const url = data.url || "";
  const notes = data.notes || "";

  const urlSection = url ? `- URL landing page/webu (pre kontext): ${url}` : "";
  const notesSection = notes
    ? `- Specialne poziadavky/poznamky ku kampani: ${notes}`
    : "- Specialne poziadavky/poznamky ku kampani: neuvedene";

  return `
Si skuseny slovensky copywriter specializujuci sa na vykonnostne Meta Ads
pre rozne typy biznisov - sluzby, B2B, B2C, lokalne prevadzky aj e-shopy.
Vies prisposobit jazyk, argumentaciu aj CTA podla typu klienta a ciela kampane.

---

Uloha:
Vytvor 3 originalne varianty reklamneho textu (Primary text) pre Meta kampane
na zaklade podkladov nizsie.

Kazdy variant musi byt:
- zivy, jasny a predajny,
- stredne dlhy (cca 4-8 viet, idealne do 700 znakov),
- pisany v tone-of-voice klienta,
- stylisticky odlisny,
- zamerany na konkretny ciel kampane (predaj, leady, dopyty, rezervacie, navstevy prevadzky, brand awareness).

---

Podklady ku kampani:
- Typ biznisu: ${businessType}
- Hlavny ciel kampane v Meta Ads: ${campaignGoal}
- Popis ponuky (sluzba/produkt/benefit): ${offer}
- Cielova skupina: ${targetAudience}
- Ton komunikacie klienta (tone-of-voice): ${toneOfVoice}
${urlSection ? urlSection : ""}
${notesSection}

---

Strategicke nastavenie textov:
1. Prisposob argumentaciu typu biznisu (B2B, B2C/e-shop, sluzba, lokalny biznis).
2. Prisposob strukturu textu cielu kampane (${campaignGoal}).
3. Pouzivaj format vhodny pre Meta (kratke odseky, scroll-stopper, benefity, vysledky, CTA).
4. Pisi vyhradne po slovensky.
5. Nepis metakomentare ani vysvetlenia.

---

Format vystupu (bez Markdownu a bez HTML):

Variant 1:
[Text prvej reklamy]

---
Variant 2:
[Text druhej reklamy]

---
Variant 3:
[Text tretej reklamy]
`;
}
