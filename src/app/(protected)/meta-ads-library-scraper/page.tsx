import { MetaAdsLibraryScraperForm } from "@/components/meta-ads-library-scraper-form";

export default function MetaAdsLibraryScraperPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Meta Ads library scraper + AI analýza
        </h1>
        <p>
          Vlož celú URL adresu z Meta Ads Library, doplň biznis kontext a nástroj stiahne reklamné dáta cez Apify,
          normalizuje ich a vygeneruje analýzu reklám v slovenčine.
        </p>
      </div>
      <MetaAdsLibraryScraperForm />
    </section>
  );
}
