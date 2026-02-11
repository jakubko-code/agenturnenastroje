import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <section className="card">
      <h1>Nastavenia API klucov</h1>
      <p>Tato stranka zapisuje agenturne provider kluce (admin only).</p>
      <SettingsForm />
    </section>
  );
}
