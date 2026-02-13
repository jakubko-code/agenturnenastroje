import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { hasRestrictedPageAccess } from "@/server/services/page-access-service";

export default async function ReportingGoogleAdsPage() {
  const user = await requireSessionUser();
  const canAccess = await hasRestrictedPageAccess(user.id, "reporting_google_ads");

  if (!canAccess) {
    redirect("/dashboard");
  }

  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Reporting Google Ads</h1>
        <p>Táto stránka je zatiaľ vo vývoji.</p>
      </div>
    </section>
  );
}
