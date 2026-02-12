import { StsInsightsForm } from "@/components/sts-insights-form";

export default function StsInsightsPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Insights zo search terms
        </h1>
        <p>
          Nástroj analyzuje výkon hľadaných výrazov (search + shopping + pmax) za posledných 30 dní vs.
          predchádzajúce obdobie a vygeneruje report s odporúčaniami na optimalizáciu a vylúčenie nerelevantných
          výrazov.{" "}
          <span className="page-head-highlight">
            Je potrebný výstup (report) zo scriptu{" "}
            <a href="/google-ads-scripts#search-terms-script" className="inline-link">
              Search_Terms_Script
            </a>
            .
          </span>
        </p>
      </div>
      <StsInsightsForm />
    </section>
  );
}
