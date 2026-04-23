import { NavodyAccordion } from "@/components/navody-accordion";

export default function NavodyPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Návody</h1>
        <p>Postupy a nastavenia potrebné pre správne fungovanie nástrojov.</p>
      </div>
      <NavodyAccordion />
    </section>
  );
}
