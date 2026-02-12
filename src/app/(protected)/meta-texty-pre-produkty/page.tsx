import { MetaProductForm } from "@/components/meta-product-form";

export default function MetaProductTextsPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Generovanie produktových reklamných textov pre META Ads
        </h1>
        <p>
          Cieľom tohto nástroja je originálne, konzistentne a pútavo generovať tri unikátne varianty cielených
          reklamných textov pre Meta Ads na základe detailného zadania o cieľovej skupine, tóne komunikácie a
          produkte.{" "}
          <span className="page-head-highlight">
            Odporúčam používať iba na generovanie produktových reklamných textov.
          </span>
        </p>
      </div>

      <MetaProductForm />
    </section>
  );
}
