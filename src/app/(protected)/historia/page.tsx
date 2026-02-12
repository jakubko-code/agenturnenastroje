import { HistoryTable } from "@/components/history-table";

export default function HistoriaPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>História generovania</h1>
        <p>
          Na tejto stránke nájdeš kompletnú históriu všetkých zadaní, ktoré si vytvoril pomocou našich AI nástrojov.
          Tento zoznam slúži ako tvoj osobný archív, ktorý ti umožňuje kedykoľvek sa vrátiť k predchádzajúcim vstupom
          a výstupom, analyzovať ich alebo ich znovu použiť.
        </p>
      </div>
      <HistoryTable />
    </section>
  );
}
