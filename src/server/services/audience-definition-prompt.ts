export type AudienceDefinitionFormData = {
  brandName: string;
  productInfo?: string;
  market?: string;
  problems?: string;
  benefits?: string;
  customers?: string;
  competitors?: string;
};

export function buildAudienceDefinitionPrompt(data: AudienceDefinitionFormData): string {
  return `
Cieľ: zostaviť detailný popis cieľovej skupiny pre vybranú značku vrátane 1–3 príkladov zákazníckych persón.

### Základné informácie o značke:
- Názov značky: ${data.brandName || "neuvedené"}
- Stručný popis produktov/služieb: ${data.productInfo || "neuvedené"}
- Trh: ${data.market || "neuvedené"}

### Detailné informácie o produktoch/službách a ich benefitoch:
- Problémy alebo potreby zákazníkov, ktoré produkty/služby riešia: ${data.problems || "neuvedené"}
- Hlavné benefity produktov alebo služieb: ${data.benefits || "neuvedené"}

### Stávajúci zákazníci a ich charakteristiky:
- Popis typických zákazníkov: ${data.customers || "neuvedené"}

### Konkurencia:
- Hlavní konkurenti klienta sú: ${data.competitors || "neuvedené"}
- Tvoja úloha je analyzovať týchto konkurentov a definovať, ako sa na trhu vzájomne vymedzujú. Ak sú zadané URL, prejdi ich weby. Zváž aj recenzie ich produktov online, komunikáciu na blogoch, fórach a v skupinách.
- Stručne popíš, ako sa značka môže voči konkurencii vymedziť (napr. cenovo, kvalitou, pozicioningom).

---

## Pokyny pre spracovanie

Ak je niektorá informácia uvedená ako "neuvedené", urob kvalifikovaný odhad na základe bežných trhových vzorcov a dostupných údajov o podobných značkách.  
V texte nikdy neuvádzaj, že ide o odhad alebo chýbajúcu informáciu.

---

## Štruktúra výstupu, ktorú máš pripraviť

Výstup musí byť napísaný v slovenskom jazyku a obsahovať nasledovné hlavné sekcie v tomto poradí:

1. **Analýza konkurencie a pozicioning značky**
2. **Demografické charakteristiky**
3. **Psychografia a životný štýl**
4. **Hlavné motivátory nákupného rozhodovania**
5. **Doporučený štýl komunikácie s cieľovou skupinou**
6. **Príklady zákazníckych persón**
7. *(voliteľné)* **Odporúčané marketingové kanály a touchpointy** – kde a ako najlepšie zasiahnuť cieľovú skupinu (online, offline, obsahové formáty, tone of voice)

Každá sekcia musí byť vecná, písaná v profesionálnom, no čitateľnom štýle.  
Vyhýbaj sa zbytočne všeobecným frázam – odpovede musia pôsobiť ako reálna strategická analýza.

---

## Požiadavky na formát výstupu

Výstup mi vráť ako **čistý HTML kód**, vhodný na vloženie do jedného <div> na webovej stránke.

Dodrž tieto pravidlá:

- Nepoužívaj žiadny Markdown, hviezdičky (*) ani mriežky (#).
- Nepoužívaj code bloky ani trojité apostrofy ( \`\`\` ).
- Nepoužívaj <html>, <head> ani <body> – len vnútro (obsah) vhodné na vloženie do <div>.

Používaj iba tieto HTML značky:
- <h2> pre hlavné sekcie (napr. Demografické charakteristiky, Psychografia a životný štýl, Motivátory, Štýl komunikácie, Persóny)
- <h3> pre podsekcie (napr. jednotlivé persóny)
- <p> pre odstavce
- <ul> a <li> pre odrážky
- <strong> pre zvýraznenie dôležitých častí
- <br> len ak je to nevyhnutné pre prehľadnosť textu

Každá sekcia by mala mať jasný a oddelený nadpis pomocou <h2>.  
Výstup nesmie obsahovať žiadne vysvetlenia, komentáre, meta poznámky ani dodatočné inštrukcie.  
Vráť len čistý HTML obsah pripravený na zobrazenie.
`;
}
