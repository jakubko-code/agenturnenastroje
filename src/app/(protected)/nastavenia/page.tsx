import { SettingsForm } from "@/components/settings-form";
import { ApifySettingsForm } from "@/components/apify-settings-form";
import { AdminUsersManager } from "@/components/admin-users-manager";
import { requireSessionUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireSessionUser();

  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Nastavenia</h1>
        <p>Správa API klúčov a používateľov.</p>
      </div>

      <section className="card">
        <h2 className="section-title">API kľúče</h2>
        <p className="section-subtitle">Táto sekcia zapisuje agentúrne provider kľúče (iba admin)</p>
        <SettingsForm canEdit={user.role === "admin"} />
      </section>

      <section className="card">
        <h2 className="section-title">Apify API kľúč (používateľský)</h2>
        <p className="section-subtitle">Tento kľúč sa používa pre Meta Ads scraper a je viazaný na tvoj účet.</p>
        <ApifySettingsForm />
      </section>

      {user.role === "admin" ? (
        <section className="card">
          <h2 className="section-title users-section-title">Správa používateľov</h2>
          <AdminUsersManager />
        </section>
      ) : null}
    </section>
  );
}
