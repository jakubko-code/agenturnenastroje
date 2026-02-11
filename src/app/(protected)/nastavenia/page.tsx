import { SettingsForm } from "@/components/settings-form";
import { AdminUsersManager } from "@/components/admin-users-manager";
import { requireSessionUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireSessionUser();

  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Nastavenia</h1>
        <p>Sprava API klucov a administracie pristupov na jednom mieste.</p>
      </div>

      <section className="card">
        <h2 className="section-title">API kluce</h2>
        <p className="section-subtitle">Tato sekcia zapisuje agenturne provider kluce (admin only).</p>
        <SettingsForm />
      </section>

      {user.role === "admin" ? (
        <section className="card">
          <h2 className="section-title">Admin - roly pouzivatelov</h2>
          <p className="section-subtitle">Sprava rol: admin, editor, viewer.</p>
          <AdminUsersManager />
        </section>
      ) : null}
    </section>
  );
}
