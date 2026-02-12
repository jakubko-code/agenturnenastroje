import { EbitdaBreakEvenCalculator } from "@/components/ebitda-break-even-calculator";

export default function EbitdaBreakEvenKalkulackaPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>EBITDA Break-Even kalkulačka</h1>
        <p>
          Táto kalkulačka slúži na rýchle vyhodnotenie finančného zdravia e-shopu a určenie, či a koľko si môže firma
          dovoliť investovať do reklamy bez toho, aby išla do straty. Na základe marže, nákladov a objemu objednávok
          vypočíta CM2, CM3, EBITDA, maximálny udržateľný ad spend a break-even MER. Je to kľúčový podklad pre
          rozhodovanie, či má zmysel škálovať kampane, optimalizovať ich, alebo najprv riešiť problémy v ekonomike
          jednotlivých objednávok a nákladov.
        </p>
      </div>

      <EbitdaBreakEvenCalculator />

      <section className="card ecom-guide">
        <p>
          <strong>EBITDA / Break-Even kalkulačka</strong>
        </p>
        <p>
          <strong>Na čo je tento nástroj:</strong>
        </p>
        <p>
          Táto kalkulačka slúži na rýchle posúdenie, či e-shop zarába a koľko si môže dovoliť minúť na reklamu.
        </p>
        <p>Pomáha odpovedať na otázky:</p>
        <p>Zarába e-shop pri súčasnom objeme objednávok?</p>
        <p>Koľko je maximálny ad spend, aby bol klient aspoň na nule?</p>
        <p>Aké MER / PNO je ešte udržateľné?</p>
        <p>Má vôbec zmysel škálovať marketing pri aktuálnej marži a fixoch?</p>
        <p>
          Toto je biznis kalkulačka, nie biddingový nástroj. Je to východiskový rámec pred nastavovaním kampaní.
        </p>

        <p>
          <strong>1) Čo presne kalkulačka počíta (logika)</strong>
        </p>
        <p>Kalkulačka pracuje s touto postupnosťou:</p>
        <p>Revenue − COGS − COD = CM2</p>
        <p>CM2 − Ad spend = CM3</p>
        <p>CM3 − OPEX = EBITDA</p>
        <p>A z toho odvádza:</p>
        <p>maximálny ad spend</p>
        <p>break-even MER</p>

        <p>
          <strong>2) Vstupy - čo znamenajú a ako ich získať</strong>
        </p>
        <p>
          <strong>2.1 Revenue (obrat)</strong>
        </p>
        <p>Definícia:</p>
        <p>obrat z tovaru</p>
        <p>bez DPH</p>
        <p>bez dopravy (ak je účtovaná zvlášť)</p>
        <p>Ako získať:</p>
        <p>z e-shopu / GA4 / účtovníctva</p>
        <p>ideálne za rovnaké obdobie ako OPEX</p>
        <p>Poznámka:</p>
        <p>Ak kalkulačka pracuje s AOV a počtom objednávok:</p>
        <p>Revenue = AOV × počet objednávok</p>

        <p>
          <strong>2.2 COGS (Cost of Goods Sold)</strong>
        </p>
        <p>Definícia:</p>
        <p>nákupné ceny tovarov</p>
        <p>priamo závislé od počtu objednávok</p>
        <p>Ako získať:</p>
        <p>z maržových reportov</p>
        <p>alebo približne z priemernej marže</p>
        <p>Príklad:</p>
        <p>marža 50 % → COGS = 50 % z Revenue</p>

        <p>
          <strong>2.3 COD (Cost of Delivery - netto)</strong>
        </p>
        <p>Definícia:</p>
        <p>náklady na dopravu + dobierky</p>
        <p>mínus to, čo zaplatí zákazník za dopravu</p>
        <p>Prečo je to dôležité:</p>
        <p>e-shopy na doprave často strácajú maržu</p>
        <p>marketing môže vyzerať ziskovo, ale logistika to „zožerie“</p>
        <p>Ako získať:</p>
        <p>priemer na objednávku × počet objednávok</p>

        <p>
          <strong>2.4 OPEX (fixné náklady)</strong>
        </p>
        <p>Definícia:</p>
        <p>mzdy</p>
        <p>sklad</p>
        <p>softvéry</p>
        <p>réžia</p>
        <p>všetko, čo nezávisí od počtu objednávok</p>
        <p>Ako získať:</p>
        <p>mesačný OPEX z Výkazu ziskov a strát</p>
        <p>ak riešime kratšie obdobie, pomerná časť</p>
        <p>Dôležité:</p>
        <p>OPEX je mimo priameho vplyvu marketingu, ale:</p>
        <p>rozhoduje, či firma prežije</p>
        <p>určuje, či má zmysel škálovať</p>

        <p>
          <strong>3) Medzivýpočty - ako ich čítať</strong>
        </p>
        <p>
          <strong>3.1 CM2 (Contribution Margin 2)</strong>
        </p>
        <p>CM2 = Revenue − COGS − COD</p>
        <p>Význam:</p>
        <p>koľko peňazí ostáva pred marketingom</p>
        <p>odpoveď na otázku: Má e-shop zdravú jednotkovú ekonomiku?</p>
        <p>Ak je CM2 nízka alebo záporná:</p>
        <p>problém nie je marketing</p>
        <p>problém je marža / logistika / pricing</p>

        <p>
          <strong>3.2 CM3 (Contribution Margin 3)</strong>
        </p>
        <p>CM3 = CM2 − Ad spend</p>
        <p>Význam:</p>
        <p>marketingový výsledok</p>
        <p>odpoveď na otázku: Zarábame na zákazníkovi po zaplatení reklamy?</p>
        <p>CM3 je najčistejší KPI marketingu.</p>

        <p>
          <strong>3.3 EBITDA</strong>
        </p>
        <p>EBITDA = CM3 − OPEX</p>
        <p>Význam:</p>
        <p>prevádzkový výsledok firmy</p>
        <p>hranica, kde marketing končí svoju zodpovednosť</p>
        <p>EBITDA:</p>
        <p>≠ čistý zisk</p>
        <p>≠ cashflow</p>
        <p>= „prežil by biznis bez investícií, úverov a daní?“</p>

        <p>
          <strong>4) Maximálny ad spend (kľúčový výstup)</strong>
        </p>
        <p>Vzorec:</p>
        <p>Max ad spend = CM2 − OPEX</p>
        <p>Význam:</p>
        <p>koľko môže firma minúť na reklamu, aby bola na nule</p>
        <p>nad touto hranicou ide do straty</p>
        <p>Ak vyjde záporné číslo:</p>
        <p>firma je v strate aj bez reklamy</p>
        <p>marketing to nezachráni</p>

        <p>
          <strong>5) Break-even MER / PNO</strong>
        </p>
        <p>
          <strong>5.1 MER</strong>
        </p>
        <p>MER = Ad spend / Revenue</p>
        <p>
          <strong>5.2 Break-even MER</strong>
        </p>
        <p>Break-even MER = Max ad spend / Revenue</p>
        <p>Interpretácia:</p>
        <p>toto je maximálne MER, pri ktorom je firma na nule</p>
        <p>ak je reálne MER vyššie → firma je v strate</p>
        <p>ak je nižšie → firma je v zisku</p>
        <p>Toto je tvrdý mantinel pre performance kampane.</p>

        <p>
          <strong>6) Praktický workflow</strong>
        </p>
        <p>
          <strong>Krok 1 - Vyplň základné čísla</strong>
        </p>
        <p>AOV</p>
        <p>počet objednávok</p>
        <p>maržu</p>
        <p>COD</p>
        <p>OPEX</p>
        <p>
          <strong>Krok 2 - Skontroluj CM2</strong>
        </p>
        <p>Otázky:</p>
        <p>Je CM2 kladná?</p>
        <p>Má dostatočný „headroom“ na marketing?</p>
        <p>Ak nie:</p>
        <p>problém rieš s klientom na úrovni pricingu / logistiky</p>
        <p>
          <strong>Krok 3 - Pozri max ad spend</strong>
        </p>
        <p>porovnaj s reálnym spendom</p>
        <p>ak klient míňa viac než max → ide do straty</p>
        <p>
          <strong>Krok 4 - Porovnaj break-even MER s realitou</strong>
        </p>
        <p>ak reálne MER &gt; break-even MER → škálovanie nedáva zmysel</p>
        <p>ak reálne MER &lt; break-even MER → existuje priestor na rast</p>
        <p>
          <strong>Krok 5 - Rozhodni, čo ďalej</strong>
        </p>
        <p>škálovať (ak je priestor)</p>
        <p>optimalizovať efektivitu (ak sme blízko break-even)</p>
        <p>zastaviť / spomaliť (ak je firma v strate)</p>

        <p>
          <strong>7) Najčastejšie chyby</strong>
        </p>
        <p>Riešiť kampane bez pohľadu na CM2</p>
        <p>Marketing nemôže opraviť zlú maržu.</p>
        <p>Ignorovať COD</p>
        <p>Doprava často rozhoduje o tom, či marketing „vychádza“.</p>
        <p>Brať EBITDA ako „čo ostane majiteľovi“</p>
        <p>EBITDA je hranica marketingu, nie cash na účte.</p>
        <p>Škálovať len podľa ROAS</p>
        <p>ROAS bez kontextu EBITDA je nebezpečný.</p>

        <p>
          <strong>8) Ako to vysvetliť klientovi (jednoduchá formulácia)</strong>
        </p>
        <p>
          „Najprv si musíme spočítať, koľko peňazí ostáva po tovare a doprave. Z toho vieme určiť, koľko môže ísť na
          reklamu. Až potom má zmysel riešiť optimalizáciu kampaní. Ak tieto čísla nesedia, marketing to nevyrieši.“
        </p>

        <p>
          <strong>9) Vzťah k Profit Curve simulátoru</strong>
        </p>
        <p>EBITDA kalkulačka → určuje či a koľko môže marketing míňať</p>
        <p>Profit Curve simulátor → rieši ako nastaviť tROAS v PMax, aby bol CM3 čo najvyšší</p>
        <p>Používajte ich v tomto poradí:</p>
        <p>EBITDA kalkulačka</p>
        <p>Profit Curve simulátor</p>
      </section>
    </section>
  );
}
