import { RestrictedPage } from "@prisma/client";
import { listUserPageAccesses } from "@/server/repos/page-access-repo";

export const REPORTING_PAGES: RestrictedPage[] = ["reporting_google_ads", "reporting_meta_ads"];

export type ReportingPageAccess = {
  reportingGoogleAds: boolean;
  reportingMetaAds: boolean;
};

export async function getReportingPageAccess(userId: string): Promise<ReportingPageAccess> {
  const rows = await listUserPageAccesses(userId);
  const pageSet = new Set(rows.map((row) => row.page));

  return {
    reportingGoogleAds: pageSet.has("reporting_google_ads"),
    reportingMetaAds: pageSet.has("reporting_meta_ads")
  };
}

export async function hasRestrictedPageAccess(userId: string, page: RestrictedPage): Promise<boolean> {
  const rows = await listUserPageAccesses(userId);
  return rows.some((row) => row.page === page);
}
