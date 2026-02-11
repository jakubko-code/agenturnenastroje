"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MenuKey = "google" | "meta";

export function TopNav() {
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

  const isGoogleActive = pathname === "/rsa";
  const isMetaActive = pathname === "/meta-universal";

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
              RSA reklamy
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
              Meta Universal
            </Link>
          </div>
        ) : null}
      </div>

      <Link href="/nastavenia" className={pathname === "/nastavenia" ? "top-link is-active" : "top-link"}>
        Nastavenia
      </Link>
      <Link href="/historia" className={pathname === "/historia" ? "top-link is-active" : "top-link"}>
        Historia
      </Link>
    </nav>
  );
}
