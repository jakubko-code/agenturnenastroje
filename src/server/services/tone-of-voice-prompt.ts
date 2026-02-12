export type ToneOfVoiceFormData = {
  brandName: string;
  industry: string;
  values?: string;
  mission?: string;
  benefits?: string;
  personality?: string;
  audience?: string;
  triggers?: string;
  webTexts?: string;
  socialTexts?: string;
  newsletterTexts?: string;
  channels?: string;
  competitors?: string;
  competitorNotes?: string;
};

export function buildToneOfVoicePrompt(d: ToneOfVoiceFormData): string {
  return `
Si skúsený slovenský marketér a brand manažér.
Tvojou úlohou je vytvoriť **detailný Tone-of-Voice manuál značky**, ktorý vychádza z analýzy jej aktuálnej komunikácie,
osobnosti, cieľovej skupiny a najlepších marketingových postupov.

Cieľom je pripraviť **praktický a konkrétny dokument**, ktorý presne definuje jazyk, tón, štýl a zásady komunikácie značky —
tak, aby bol použiteľný pre copywriterov, marketérov aj pre AI generovanie textov.

---

### 1️⃣ Základné informácie o značke:

- **Názov značky:** ${d.brandName || "neuvedené"}
- **Oblasť pôsobenia:** ${d.industry || "neuvedené"}
- **Hodnoty značky:** ${d.values || "neuvedené"}
- **Misia značky:** ${d.mission || "neuvedené"}
- **Kľúčové benefity produktov/služieb:** ${d.benefits || "neuvedené"}
- **Osobnosť značky (brand personality):** ${d.personality || "neuvedené"}

---

### 2️⃣ Cieľová skupina:

- **Popis cieľovej skupiny:** ${d.audience || "neuvedené"}
- **Emočné spúšťače a rozhodovacie motívy:** ${d.triggers || "neuvedené"}

---

### 3️⃣ Analýza aktuálnej komunikácie:

Na základe nižšie uvedených textov zanalyzuj štýl, jazyk, rytmus a tón komunikácie značky.

- **Texty z webu:** ${d.webTexts || "neuvedené"}
- **Texty zo sociálnych sietí:** ${d.socialTexts || "neuvedené"}
- **Texty z newsletterov alebo blogu:** ${d.newsletterTexts || "neuvedené"}
- **Prioritné komunikačné kanály:** ${d.channels || "neuvedené"}

---

### 4️⃣ Analýza konkurencie (voliteľné):

- **Konkurenti:** ${d.competitors || "neuvedené"}
- **Poznámky – čo sa na ich komunikácii páči alebo nepáči:** ${d.competitorNotes || "neuvedené"}

Na základe týchto informácií popíš, **ako sa môže značka komunikačne odlíšiť** od konkurencie a ktoré prvky jej štýlu by mala rozvíjať,
aby bola rozpoznateľná a autentická.

---

## 🧭 Pokyny pre spracovanie:

- Ak niektorá informácia chýba, urob kvalifikovaný odhad na základe trhu a bežných vzorcov správania zákazníkov v danej kategórii.  
- Nikdy nepíš, že informácie chýbajú – vytvor odporúčanie, akoby si mal všetky dáta.  
- Píš výlučne v **slovenskom jazyku**.  
- Buď **konkrétny** a používaj **reálne frázy, slová a príklady**, nie abstraktné definície.  
- Celý výstup vráť ako **čistý HTML obsah** (bez <html> a <body>), vhodný na vloženie do <div>.  
- Nepoužívaj Markdown ani code bloky. Povolené HTML značky:  
  <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>

---

## 🧩 Štruktúra výstupu Tone-of-Voice manuálu:

### 1. <h2>Rýchle zhrnutie a „cheat sheet“</h2>
- Stručné body (3–7), ktoré vysvetľujú hlavné zásady komunikácie značky.
- Krátky prehľad, ako písať texty v štýle značky.
- <h3>AI verzia tone-of-voice (pre prompty)</h3>
  <p>V 3–5 vetách zhrň, ako by mal AI model komunikovať v štýle tejto značky (formálnosť, tón, slovník, prístup k zákazníkovi).</p>

---

### 2. <h2>Základné charakteristiky tone-of-voice</h2>
- Uveď 3–5 hlavných prídavných mien (napr. priateľský, odborný, energický, spoľahlivý).
- Pri každom pridaj krátke vysvetlenie, ako sa prejavuje v texte.
- Popíš úroveň formálnosti (tykanie vs. vykanie) a zdôvodni, prečo je vhodná pre túto značku.

---

### 3. <h2>Detailný štýl komunikácie</h2>
<h3>Ako hovoríme</h3>
<ul>
<li>Uveď typické frázy, obraty, slovné spojenia, rytmus a používané slovesá.</li>
<li>Popíš, či je štýl viac inšpiratívny, edukatívny, priamy, empatický alebo iný.</li>
<li>Zdôrazni, aké emócie a hodnoty texty vyvolávajú.</li>
</ul>

<h3>Ako nehovoríme</h3>
<ul>
<li>Vymenuj veci, ktorým sa značka vyhýba – prílišná formálnosť, korporátne frázy, generické slogany, prehnané sľuby, technický žargón.</li>
</ul>

---

### 4. <h2>Príklady použitia v praxi</h2>
<h3>Headline / titulky</h3>
- 3–5 konkrétnych príkladov.
<h3>CTA (výzvy k akcii)</h3>
- 5–10 vhodných CTA fráz.
<h3>Príspevky na sociálne siete</h3>
- 2–3 ukážky krátkych postov (produktové, brandové, edukačné).

---

### 5. <h2>Odporúčania pre jednotlivé komunikačné kanály</h2>
<h3>Facebook / Instagram</h3>
- Tón, dĺžka textov, použitie emoji, storytelling, pomer medzi emóciou a informáciou.
<h3>LinkedIn</h3>
- Ako zachovať profesionálny, ale stále autentický tón.
<h3>PPC reklamy</h3>
- Ako prispôsobiť tón krátkym textom (Google Ads, Meta Ads), zdôrazniť benefity a využiť CTA.

---

### 6. <h2>Čomu sa vyhnúť</h2>
<ul>
<li>Prílišné sľuby a superlatívy bez dôkazov.</li>
<li>Nejednotné oslovovanie alebo štýl naprieč kanálmi.</li>
<li>Prehnané používanie emoji alebo slang v profesionálnych formátoch.</li>
<li>Nejasné posolstvá, ktoré rozmazávajú identitu značky.</li>
</ul>

---

### 7. <h2>Praktické odporúčania pre tím</h2>
<ul>
<li>Tipy pre copywriterov, ako si udržať konzistentný tón komunikácie.</li>
<li>Odporúčania pre marketérov, ako aplikovať tone-of-voice naprieč kanálmi.</li>
<li>Najčastejšie chyby pri aplikácii tone-of-voice v praxi.</li>
<li>Krátky návod, ako tento TOV použiť v AI promptoch (napr. „Použi tone-of-voice značky X: [stručný opis štýlu]“).</li>
</ul>

---

## 🎯 Cieľ:
Vytvor komplexný, štruktúrovaný a profesionálny **Tone-of-Voice manuál**, 
ktorý bude jasne použiteľný pre každého, kto tvorí obsah alebo reklamy pre túto značku.
`;
}
