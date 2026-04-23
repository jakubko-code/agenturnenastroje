import { MetaAdsLibraryScraperForm } from "@/components/meta-ads-library-scraper-form";

export default function MetaAdsLibraryScraperPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Meta Ads library scraper + AI analýza
        </h1>
        <p>
          Nástroj slúži na analýzu aktívnych reklám konkurencie z Meta Ads Library. Stačí vložiť URL stránky
          z <strong>facebook.com/ads/library</strong> (s nastavenými filtrami), doplniť biznis kontext a nástroj
          automaticky stiahne reklamné dáta cez Apify, normalizuje ich a vygeneruje prehľadnú AI analýzu
          v slovenčine - vrátane použitých copywritingových prístupov, vizuálnych vzorov, CTA a odporúčaní
          pre vlastné kampane.
        </p>
        <p className="page-head-highlight">
          Pred použitím si nezabudni pridať vlastný Apify API kľúč v{" "}
          <a href="/nastavenia" style={{ color: "inherit", textDecoration: "underline" }}>Nastaveniach</a>.
        </p>
      </div>
      <MetaAdsLibraryScraperForm />
    </section>
  );
}
