import { RsaForm } from "@/components/rsa-form";

export default function RsaPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>RSA reklamy</h1>
        <p>Vypln brief a vygeneruj texty cez vybrany model.</p>
      </div>
      <RsaForm />
    </section>
  );
}
