import { AudienceDefinitionForm } from "@/components/audience-definition-form";

export default function AudienceDescriptionPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>
          <span className="page-head-ai">(AI)</span> Detailný popis cieľovej skupiny
        </h1>
        <p>
          Tento nástroj slúži na analýzu značky a jej trhového prostredia, na základe ktorej automaticky generuje
          detailný strategický dokument definujúci primárnu a sekundárnu cieľovú skupinu vrátane konkrétnych
          príkladov zákazníckych persón.{" "}
          <span className="page-head-highlight">
            Čím detailnejšie odpovede vyplníš, tým presnejší a použiteľnejší bude výstup.
          </span>
        </p>
      </div>
      <AudienceDefinitionForm />
    </section>
  );
}
