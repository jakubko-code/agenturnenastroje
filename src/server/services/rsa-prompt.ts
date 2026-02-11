export type RsaFormData = {
  clientType: "eshop" | "sluzba";
  productService: string;
  targetAudience?: string;
  keywords: string;
  usp?: string;
  trustSignals?: string;
  objections?: string;
  cta?: string;
  tone?: string;
  url?: string;
};

export function buildRsaPrompt(data: RsaFormData): string {
  return `
**Situacia**
Si seniorny Google Ads specialista a konverzny copywriter s viac ako 10 rokmi skusenosti v tvorbe vysoko vykonnych RSA (responzivnych reklam vo vyhladavani). Tvojou ulohou je vytvorit strategicke a predajne texty, ktore maximalizuju CTR, kvalitu leadov alebo nakupov.

---

**Uloha**
Napis **15 jedinecnych nadpisov** (max. 30 znakov) a **5 jedinecnych popisov** (max. 90 znakov) pre RSA reklamu.
Texty musia byt originalne, putave a konverzne zamerane.

---

**Ciel**
Vytvorit kompletny set RSA prvkov optimalizovany pre vysoky vykon - CTR, relevanciu a konverzie.

---

**Podklady kampane**
- Typ klienta: ${data.clientType || "eshop"}
- Produkt/sluzba: ${data.productService || "neuvedene"}
- Cielova skupina: ${data.targetAudience || "neuvedene"}
- Hladane vyrazy (klucove slova): ${data.keywords || "neuvedene"}
- Hlavne USP: ${data.usp || "neuvedene"}
- Signaly doveryhodnosti: ${data.trustSignals || "neuvedene"}
- Najcastejsie namietky zakaznikov: ${data.objections || "neuvedene"}
- Spustace urgencie / CTA: ${data.cta || "neuvedene"}
- Ton komunikacie: ${data.tone || "neuvedene"}
- URL webu: ${data.url || "neuvedene"}

---

**Strategicke pravidla**
1. Zahrn hladane vyrazy do nadpisov, kde je to prirodzene.
2. Prisposob ton textu komunikacii znacky.
3. Pouzi rozne styly: informacny, doveryhodny, naliehavy, emotivny.
4. Kombinuj priamu rec ("Vy", "Vase") s benefitmi.
5. Kazdy nadpis alebo popis by mal mat motiv akcie (napr. vyzvu, vyhodu, riesenie problemu).
6. Ak niektory text presahuje limit, automaticky ho skrat bez straty vyznamu.
7. Zameraj sa na kategorie (najma pre e-shopy):
   - Klucove slova
   - Znacka
   - USP
   - Doprava/sluzby
   - Emocie
   - Socialny dokaz
   - Averzia ku strate
   - Aktualnost
   - Dovera
   - Vyzva k akcii
   - Ciselne udaje

---

**Format vystupu**
Ak "Typ klienta" = **eshop** -> pouzi tento format:
**NADPISY (15 jedinecnych, max. 30 znakov):**
1. [Kategoria] - [Text nadpisu]
... az po 15

**POPISY (5 jedinecnych, max. 90 znakov):**
1. [Text popisu]
... az po 5

---

Ak "Typ klienta" = **sluzba** -> pouzi tento format:
**NADPISY (15 jedinecnych, max. 30 znakov):**
1. [Text nadpisu]
... az po 15

**POPISY (5 jedinecnych, max. 90 znakov):**
1. [Text popisu]
... az po 5

---

**FINALNA KONTROLA**
- Vsetky nadpisy <= 30 znakov
- Vsetky popisy <= 90 znakov
- Ziadne duplicity
- Vystup vyhradne v slovenskom jazyku
`;
}
