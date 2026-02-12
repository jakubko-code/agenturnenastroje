import { AuditGoogleAdsForm } from "@/components/audit-google-ads-form";

export default function AuditGoogleAdsPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Audit Google Ads účtu
        </h1>
        <p>
          Tento nástroj analyzuje exportované dáta z Google Ads (kampane, kľúčové slová, vyhľadávacie výrazy, reklamy,
          assety, landing pages a ďalšie) a vytvára z nich hĺbkový audit. Audit sumarizuje stav účtu, odhaľuje
          najväčšie slabiny aj príležitosti a navrhuje konkrétne kroky na zlepšenie výkonu. Výstup je koncipovaný tak,
          aby bol prehľadný a aby ho bolo možno použiť pri interných analýzach.
        </p>
        <p>
          Nástroj funguje na základe URL Google Sheetu, ktorý si vygeneruješ pomocou nášho Google Ads Full Data Export
          skriptu. Vďaka tomu dokáže rýchlo pripraviť hlboký pohľad na akýkoľvek účet - bez potreby manuálneho
          vyhodnocovania metrík.{" "}
          <span className="page-head-highlight">
            Je potrebný výstup (report) zo scriptu{" "}
            <a href="/google-ads-scripts#full-data-export-script" className="inline-link">
              Full_Data_Export
            </a>
            .
          </span>
        </p>
      </div>
      <AuditGoogleAdsForm />
    </section>
  );
}
