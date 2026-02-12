import Link from "next/link";
import type { Route } from "next";

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
  }
] as const satisfies ReadonlyArray<{
  title: string;
  desc: string;
  href: Route;
  badge: string;
  isAi?: boolean;
}>;

export default function DashboardPage() {
  return (
    <section className="dashboard-shell">
      <div className="hero-block">
        <p className="hero-kicker">Agenturne AI studio</p>
        <h1>Spustaj nastroje pre kampane z jedneho miesta</h1>
        <p>
          Vyber si nastroj, priprav brief a generuj vystupy pre Google Ads a Meta kampane.
          Dashboard je navrhnuty pre rychlu internu produkciu v agenture.
        </p>
      </div>

      <div className="tool-grid">
        {toolCards.map((tool) => (
          <Link key={tool.href} href={tool.href} className="tool-tile">
            <div className="tool-badges">
              <span className={getBadgeClass(tool.badge)}>{tool.badge}</span>
              {tool.isAi ? <span className="tool-badge tool-badge-ai">AI</span> : null}
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
