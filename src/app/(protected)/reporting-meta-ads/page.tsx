import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth";
import { hasRestrictedPageAccess } from "@/server/services/page-access-service";

export default async function ReportingMetaAdsPage() {
  const user = await requireSessionUser();
  const canAccess = await hasRestrictedPageAccess(user.id, "reporting_meta_ads");

  if (!canAccess) {
    redirect("/dashboard");
  }

  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Reporting Meta Ads</h1>
      </div>
    </section>
  );
}
