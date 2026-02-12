"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

function getBadgeClass(badge: string): string {
  if (badge === "Google Ads") return "tool-badge tool-badge-google";
  if (badge === "Meta Ads") return "tool-badge tool-badge-meta";
  if (badge === "Ecommerce") return "tool-badge tool-badge-ecommerce";
  if (badge === "Brand & Stratégia") return "tool-badge tool-badge-brand";
  return "tool-badge";
}

const toolCards = [
  {
    title: "Tvorba RSA reklám",
    desc: "Tvorba 15 nadpisov a 5 popisov pre Google Ads RSA.",
    href: "/rsa",
    badge: "Google Ads",
    isAi: true
  },
  {
    title: "Insights zo search terms",
    desc: "Insights zo search terms s odporúčaniami pre ďalšie kroky v kampaniach.",
    href: "/sts-insights",
    badge: "Google Ads",
    isAi: true
  },
  {
    title: "Audit Google Ads účtu",
    desc: "Hĺbkový audit Google Ads účtu z Full Data Export reportu.",
    href: "/audit-google-ads-uctu",
    badge: "Google Ads",
    isAi: true
  },
  {
    title: "Univerzálne Meta texty",
    desc: "3 varianty hlavných textov pre B2B/B2C/služby či lokálny biznis.",
    href: "/meta-universal",
    badge: "Meta Ads",
    isAi: true
  },
  {
    title: "Produktové Meta texty",
    desc: "3 originálne varianty produktových reklamných textov pre Meta Ads.",
    href: "/meta-texty-pre-produkty",
    badge: "Meta Ads",
    isAi: true
  },
  {
    title: "Detailný popis cieľovej skupiny",
    desc: "AI nástroj pre detailný strategický popis cieľovej skupiny.",
    href: "/detailny-popis-cielovej-skupiny",
    badge: "Brand & Stratégia",
    isAi: true
  },
  {
    title: "Tvorba Tone-of-voice",
    desc: "AI nástroj pre vytvorenie tone-of-voice manuálu značky.",
    href: "/tvorba-tone-of-voice",
    badge: "Brand & Stratégia",
    isAi: true
  },
  {
    title: "Kalkulačka ziskovosti reklamy",
    desc: "Porovnanie scenárov investície do reklamy a ziskovosti.",
    href: "/kalkulacka-ziskovosti-reklamy",
    badge: "Ecommerce"
  },
  {
    title: "EBITDA Break-Even kalkulačka",
    desc: "Rýchle vyhodnotenie CM2, EBITDA, break-even MER a udržateľného ad spendu.",
    href: "/ebitda-break-even-kalkulacka",
    badge: "Ecommerce"
  },
  {
    title: "Kalkulačka potenciálu kampane",
    desc: "Rýchly odhad klikov, nákladov, objednávok, tržby, ROAS a CPA pred spustením kampaní.",
    href: "/kalkulacka-potencialu-kampane",
    badge: "Ecommerce"
  },
  {
    title: "EBITDA Scaling simulator",
    desc: "Simulácia škálovania objednávok, marketingového rozpočtu, CM3 a EBITDA.",
    href: "/ebitda-scaling-simulator",
    badge: "Ecommerce"
  }
] as const satisfies ReadonlyArray<{
  title: string;
  desc: string;
  href: Route;
  badge: string;
  isAi?: boolean;
}>;

export default function DashboardPage() {
  const [activeBadge, setActiveBadge] = useState<string>("Všetky");
  const [query, setQuery] = useState("");

  const badgeFilters = useMemo(() => {
    const unique = Array.from(new Set(toolCards.map((tool) => tool.badge)));
    return ["Všetky", "AI", ...unique];
  }, []);

  const filteredTools = useMemo(() => {
    const byBadge =
      activeBadge === "Všetky"
        ? toolCards
        : activeBadge === "AI"
          ? toolCards.filter((tool) => "isAi" in tool && tool.isAi)
          : toolCards.filter((tool) => tool.badge === activeBadge);
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return byBadge;

    return byBadge.filter((tool) =>
      [tool.title, tool.desc, tool.badge, "isAi" in tool && tool.isAi ? "ai" : ""].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [activeBadge, query]);

  return (
    <section className="dashboard-shell">
      <div className="hero-block">
        <h1>Praktické AI a analytické nástroje pre Google Ads, Meta Ads, Ecommerce, ...</h1>
        <p>
          Vyber si nástroj podľa typu práce, vyplň vstupy a získaj použiteľný výstup. Od tvorby textov cez audit až po
          ekonomické kalkulačky na plánovanie výkonu.
        </p>
      </div>

      <div className="dashboard-tools-controls">
        <div className="dashboard-search-wrap">
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Vyhľadať nástroj..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chip-group dashboard-filter-group">
          {badgeFilters.map((badge) => (
            <button
              key={badge}
              type="button"
              className={activeBadge === badge ? "chip-btn is-selected" : "chip-btn"}
              onClick={() => setActiveBadge(badge)}
            >
              {badge}
            </button>
          ))}
        </div>
      </div>

      <div className="tool-grid">
        {filteredTools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="tool-tile">
            <div className="tool-badges">
              <span className={getBadgeClass(tool.badge)}>{tool.badge}</span>
              {"isAi" in tool && tool.isAi ? <span className="tool-badge tool-badge-ai">AI</span> : null}
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.desc}</p>
            <span className="tool-cta">Otvoriť nástroj</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
