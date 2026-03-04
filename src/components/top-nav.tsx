"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type MenuKey = "google" | "meta" | "guides" | "ecommerce" | "brand" | "reporting";

type TopNavProps = {
  reportingAccess: {
    reportingGoogleAds: boolean;
    reportingMetaAds: boolean;
  };
};

export function TopNav({ reportingAccess }: TopNavProps) {
  const pathname = usePathname();

  const isGoogleActive = ["/rsa", "/sts-insights", "/audit-google-ads-uctu", "/kalkulacka-potencialu-kampane"].includes(pathname);
  const isMetaActive = ["/meta-universal", "/meta-texty-pre-produkty", "/meta-ads-library-scraper"].includes(pathname);
  const isGuidesActive = ["/navody", "/google-ads-scripts", "/markdown-konvertor"].includes(pathname);
  const isEcommerceActive = ["/kalkulacka-ziskovosti-reklamy", "/ebitda-break-even-kalkulacka", "/ebitda-scaling-simulator"].includes(pathname);
  const isBrandActive = ["/detailny-popis-cielovej-skupiny", "/tvorba-tone-of-voice"].includes(pathname);
  const isReportingActive =
    (reportingAccess.reportingGoogleAds && pathname === "/reporting-google-ads") ||
    (reportingAccess.reportingMetaAds && pathname === "/reporting-meta-ads");
  const canSeeReportingRoot = reportingAccess.reportingGoogleAds || reportingAccess.reportingMetaAds;

  function defaultOpen(): MenuKey | null {
    if (isGoogleActive) return "google";
    if (isMetaActive) return "meta";
    if (isGuidesActive) return "guides";
    if (isEcommerceActive) return "ecommerce";
    if (isBrandActive) return "brand";
    if (isReportingActive) return "reporting";
    return null;
  }

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(defaultOpen);

  useEffect(() => {
    setOpenMenu(defaultOpen());
  }, [pathname]);

  function toggleMenu(menu: MenuKey) {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  }

  return (
    <nav className="side-nav" aria-label="Hlavna navigacia">
      <Link href="/dashboard" className={pathname === "/dashboard" ? "side-link is-active" : "side-link"}>
        Dashboard
      </Link>

      <div className="side-group">
        <button
          type="button"
          className={isBrandActive || openMenu === "brand" ? "side-trigger is-active" : "side-trigger"}
          onClick={() => toggleMenu("brand")}
          aria-expanded={openMenu === "brand"}
        >
          Brand & Stratégia <span className={openMenu === "brand" ? "side-arrow is-open" : "side-arrow"}>▾</span>
        </button>
        {openMenu === "brand" && (
          <div className="side-submenu">
            <Link href="/detailny-popis-cielovej-skupiny" className={pathname === "/detailny-popis-cielovej-skupiny" ? "is-active" : ""}>
              Detailný popis cieľovej skupiny
            </Link>
            <Link href="/tvorba-tone-of-voice" className={pathname === "/tvorba-tone-of-voice" ? "is-active" : ""}>
              Tvorba Tone-of-voice
            </Link>
          </div>
        )}
      </div>

      <div className="side-group">
        <button
          type="button"
          className={isGoogleActive || openMenu === "google" ? "side-trigger is-active" : "side-trigger"}
          onClick={() => toggleMenu("google")}
          aria-expanded={openMenu === "google"}
        >
          Google Ads <span className={openMenu === "google" ? "side-arrow is-open" : "side-arrow"}>▾</span>
        </button>
        {openMenu === "google" && (
          <div className="side-submenu">
            <Link href="/rsa" className={pathname === "/rsa" ? "is-active" : ""}>
              Tvorba RSA reklám
            </Link>
            <Link href="/sts-insights" className={pathname === "/sts-insights" ? "is-active" : ""}>
              Insights zo search terms
            </Link>
            <Link href="/audit-google-ads-uctu" className={pathname === "/audit-google-ads-uctu" ? "is-active" : ""}>
              Audit Google Ads účtu
            </Link>
            <Link href="/kalkulacka-potencialu-kampane" className={pathname === "/kalkulacka-potencialu-kampane" ? "is-active" : ""}>
              Kalkulačka potenciálu kampane
            </Link>
          </div>
        )}
      </div>

      <div className="side-group">
        <button
          type="button"
          className={isMetaActive || openMenu === "meta" ? "side-trigger is-active" : "side-trigger"}
          onClick={() => toggleMenu("meta")}
          aria-expanded={openMenu === "meta"}
        >
          Meta Ads <span className={openMenu === "meta" ? "side-arrow is-open" : "side-arrow"}>▾</span>
        </button>
        {openMenu === "meta" && (
          <div className="side-submenu">
            <Link href="/meta-universal" className={pathname === "/meta-universal" ? "is-active" : ""}>
              Univerzálne Meta texty
            </Link>
            <Link href="/meta-texty-pre-produkty" className={pathname === "/meta-texty-pre-produkty" ? "is-active" : ""}>
              Produktové Meta texty
            </Link>
            <Link href="/meta-ads-library-scraper" className={pathname === "/meta-ads-library-scraper" ? "is-active" : ""}>
              Meta Ads scraper + AI analýza
            </Link>
          </div>
        )}
      </div>

      <div className="side-group">
        <button
          type="button"
          className={isEcommerceActive || openMenu === "ecommerce" ? "side-trigger is-active" : "side-trigger"}
          onClick={() => toggleMenu("ecommerce")}
          aria-expanded={openMenu === "ecommerce"}
        >
          Ecommerce <span className={openMenu === "ecommerce" ? "side-arrow is-open" : "side-arrow"}>▾</span>
        </button>
        {openMenu === "ecommerce" && (
          <div className="side-submenu">
            <Link href="/kalkulacka-ziskovosti-reklamy" className={pathname === "/kalkulacka-ziskovosti-reklamy" ? "is-active" : ""}>
              Kalkulačka ziskovosti reklamy
            </Link>
            <Link href="/ebitda-break-even-kalkulacka" className={pathname === "/ebitda-break-even-kalkulacka" ? "is-active" : ""}>
              EBITDA Break-Even kalkulačka
            </Link>
            <Link href="/ebitda-scaling-simulator" className={pathname === "/ebitda-scaling-simulator" ? "is-active" : ""}>
              EBITDA Scaling simulator
            </Link>
          </div>
        )}
      </div>

      <div className="side-divider" />

      {canSeeReportingRoot && (
        <div className="side-group">
          <button
            type="button"
            className={isReportingActive || openMenu === "reporting" ? "side-trigger reporting-root is-active" : "side-trigger reporting-root"}
            onClick={() => toggleMenu("reporting")}
            aria-expanded={openMenu === "reporting"}
          >
            Reporting <span className={openMenu === "reporting" ? "side-arrow is-open" : "side-arrow"}>▾</span>
          </button>
          {openMenu === "reporting" && (
            <div className="side-submenu">
              {reportingAccess.reportingGoogleAds && (
                <Link href="/reporting-google-ads" className={pathname === "/reporting-google-ads" ? "reporting-link is-active" : "reporting-link"}>
                  Reporting Google Ads
                </Link>
              )}
              {reportingAccess.reportingMetaAds && (
                <Link href="/reporting-meta-ads" className={pathname === "/reporting-meta-ads" ? "reporting-link is-active" : "reporting-link"}>
                  Reporting Meta Ads
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="side-group">
        <button
          type="button"
          className={isGuidesActive || openMenu === "guides" ? "side-trigger is-active" : "side-trigger"}
          onClick={() => toggleMenu("guides")}
          aria-expanded={openMenu === "guides"}
        >
          Návody & Scripty <span className={openMenu === "guides" ? "side-arrow is-open" : "side-arrow"}>▾</span>
        </button>
        {openMenu === "guides" && (
          <div className="side-submenu">
            <Link href="/navody" className={pathname === "/navody" ? "is-active" : ""}>
              Návody
            </Link>
            <Link href="/google-ads-scripts" className={pathname === "/google-ads-scripts" ? "is-active" : ""}>
              Google Ads Scripts
            </Link>
            <Link href="/markdown-konvertor" className={pathname === "/markdown-konvertor" ? "is-active" : ""}>
              Markdown konvertor
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
