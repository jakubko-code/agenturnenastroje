"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MenuKey = "google" | "meta" | "guides" | "ecommerce" | "brand" | "reporting";

type TopNavProps = {
  reportingAccess: {
    reportingGoogleAds: boolean;
    reportingMetaAds: boolean;
  };
};

export function TopNav({ reportingAccess }: TopNavProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!navRef.current) return;
      const target = event.target as Node;
      if (!navRef.current.contains(target)) {
        setOpenMenu(null);
      }
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const isGoogleActive =
    pathname === "/rsa" ||
    pathname === "/sts-insights" ||
    pathname === "/audit-google-ads-uctu" ||
    pathname === "/kalkulacka-potencialu-kampane";
  const isMetaActive = pathname === "/meta-universal" || pathname === "/meta-texty-pre-produkty";
  const isGuidesActive = pathname === "/navody" || pathname === "/google-ads-scripts";
  const isEcommerceActive =
    pathname === "/kalkulacka-ziskovosti-reklamy" ||
    pathname === "/ebitda-break-even-kalkulacka" ||
    pathname === "/ebitda-scaling-simulator";
  const isBrandActive = pathname === "/detailny-popis-cielovej-skupiny" || pathname === "/tvorba-tone-of-voice";
  const isReportingActive =
    (reportingAccess.reportingGoogleAds && pathname === "/reporting-google-ads") ||
    (reportingAccess.reportingMetaAds && pathname === "/reporting-meta-ads");
  const canSeeReportingRoot = reportingAccess.reportingGoogleAds || reportingAccess.reportingMetaAds;

  function toggleMenu(menu: MenuKey) {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  }

  return (
    <nav ref={navRef} className="top-nav" aria-label="Hlavna navigacia">
      <Link href="/dashboard" className={pathname === "/dashboard" ? "top-link is-active" : "top-link"}>
        Dashboard
      </Link>

      <div className="menu-group">
        <button
          type="button"
          className={isBrandActive || openMenu === "brand" ? "menu-trigger is-active" : "menu-trigger"}
          onClick={() => toggleMenu("brand")}
          aria-expanded={openMenu === "brand"}
          aria-haspopup="menu"
        >
          Brand & Stratégia <span className="menu-arrow">▾</span>
        </button>

        {openMenu === "brand" ? (
          <div className="menu-dropdown" role="menu">
            <Link
              href="/detailny-popis-cielovej-skupiny"
              role="menuitem"
              className={pathname === "/detailny-popis-cielovej-skupiny" ? "is-active" : ""}
            >
              Detailný popis cieľovej skupiny
            </Link>
            <Link
              href="/tvorba-tone-of-voice"
              role="menuitem"
              className={pathname === "/tvorba-tone-of-voice" ? "is-active" : ""}
            >
              Tvorba Tone-of-voice
            </Link>
          </div>
        ) : null}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className={isGoogleActive || openMenu === "google" ? "menu-trigger is-active" : "menu-trigger"}
          onClick={() => toggleMenu("google")}
          aria-expanded={openMenu === "google"}
          aria-haspopup="menu"
        >
          Google Ads <span className="menu-arrow">▾</span>
        </button>

        {openMenu === "google" ? (
          <div className="menu-dropdown" role="menu">
            <Link href="/rsa" role="menuitem" className={pathname === "/rsa" ? "is-active" : ""}>
              Tvorba RSA reklám
            </Link>
            <Link href="/sts-insights" role="menuitem" className={pathname === "/sts-insights" ? "is-active" : ""}>
              Insights zo search terms
            </Link>
            <Link
              href="/audit-google-ads-uctu"
              role="menuitem"
              className={pathname === "/audit-google-ads-uctu" ? "is-active" : ""}
            >
              Audit Google Ads účtu
            </Link>
            <Link
              href="/kalkulacka-potencialu-kampane"
              role="menuitem"
              className={pathname === "/kalkulacka-potencialu-kampane" ? "is-active" : ""}
            >
              Kalkulačka potenciálu kampane
            </Link>
          </div>
        ) : null}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className={isMetaActive || openMenu === "meta" ? "menu-trigger is-active" : "menu-trigger"}
          onClick={() => toggleMenu("meta")}
          aria-expanded={openMenu === "meta"}
          aria-haspopup="menu"
        >
          Meta Ads <span className="menu-arrow">▾</span>
        </button>

        {openMenu === "meta" ? (
          <div className="menu-dropdown" role="menu">
            <Link href="/meta-universal" role="menuitem" className={pathname === "/meta-universal" ? "is-active" : ""}>
              Univerzálne Meta texty
            </Link>
            <Link
              href="/meta-texty-pre-produkty"
              role="menuitem"
              className={pathname === "/meta-texty-pre-produkty" ? "is-active" : ""}
            >
              Produktové Meta texty
            </Link>
          </div>
        ) : null}
      </div>

      <div className="menu-group">
        <button
          type="button"
          className={isEcommerceActive || openMenu === "ecommerce" ? "menu-trigger is-active" : "menu-trigger"}
          onClick={() => toggleMenu("ecommerce")}
          aria-expanded={openMenu === "ecommerce"}
          aria-haspopup="menu"
        >
          Ecommerce <span className="menu-arrow">▾</span>
        </button>

        {openMenu === "ecommerce" ? (
          <div className="menu-dropdown" role="menu">
            <Link
              href="/kalkulacka-ziskovosti-reklamy"
              role="menuitem"
              className={pathname === "/kalkulacka-ziskovosti-reklamy" ? "is-active" : ""}
            >
              Kalkulačka ziskovosti reklamy
            </Link>
            <Link
              href="/ebitda-break-even-kalkulacka"
              role="menuitem"
              className={pathname === "/ebitda-break-even-kalkulacka" ? "is-active" : ""}
            >
              EBITDA Break-Even kalkulačka
            </Link>
            <Link
              href="/ebitda-scaling-simulator"
              role="menuitem"
              className={pathname === "/ebitda-scaling-simulator" ? "is-active" : ""}
            >
              EBITDA Scaling simulator
            </Link>
          </div>
        ) : null}
      </div>

      {canSeeReportingRoot ? (
        <div className="menu-group">
          <button
            type="button"
            className={
              isReportingActive || openMenu === "reporting"
                ? "menu-trigger reporting-root is-active"
                : "menu-trigger reporting-root"
            }
            onClick={() => toggleMenu("reporting")}
            aria-expanded={openMenu === "reporting"}
            aria-haspopup="menu"
          >
            Reporting <span className="menu-arrow">▾</span>
          </button>

          {openMenu === "reporting" ? (
            <div className="menu-dropdown" role="menu">
              {reportingAccess.reportingGoogleAds ? (
                <Link
                  href="/reporting-google-ads"
                  role="menuitem"
                  className={pathname === "/reporting-google-ads" ? "reporting-link is-active" : "reporting-link"}
                >
                  Reporting Google Ads
                </Link>
              ) : null}
              {reportingAccess.reportingMetaAds ? (
                <Link
                  href="/reporting-meta-ads"
                  role="menuitem"
                  className={pathname === "/reporting-meta-ads" ? "reporting-link is-active" : "reporting-link"}
                >
                  Reporting Meta Ads
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="menu-group">
        <button
          type="button"
          className={isGuidesActive || openMenu === "guides" ? "menu-trigger is-active" : "menu-trigger"}
          onClick={() => toggleMenu("guides")}
          aria-expanded={openMenu === "guides"}
          aria-haspopup="menu"
        >
          Návody & Scripty <span className="menu-arrow">▾</span>
        </button>

        {openMenu === "guides" ? (
          <div className="menu-dropdown" role="menu">
            <Link href="/navody" role="menuitem" className={pathname === "/navody" ? "is-active" : ""}>
              Návody
            </Link>
            <Link
              href="/google-ads-scripts"
              role="menuitem"
              className={pathname === "/google-ads-scripts" ? "is-active" : ""}
            >
              Google Ads Scripts
            </Link>
          </div>
        ) : null}
      </div>

    </nav>
  );
}
