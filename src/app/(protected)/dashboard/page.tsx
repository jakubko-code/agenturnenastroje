import Link from "next/link";
import type { Route } from "next";

const toolCards = [
  {
    title: "RSA reklamy",
    desc: "Tvorba 15 nadpisov a 5 popisov pre Google Ads RSA.",
    href: "/rsa",
    badge: "Google Ads"
  },
  {
    title: "STS insighty",
    desc: "Insights zo search terms s odporucaniami pre dalsie kroky v kampaniach.",
    href: "/sts-insights",
    badge: "Google Ads"
  },
  {
    title: "Audit Google Ads účtu",
    desc: "Hľbkový audit Google Ads účtu z Full Data Export reportu.",
    href: "/audit-google-ads-uctu",
    badge: "Google Ads"
  },
  {
    title: "Meta Universal",
    desc: "3 varianty primary textov pre B2B/B2C/sluzby a lokalny biznis.",
    href: "/meta-universal",
    badge: "Meta Ads"
  },
  {
    title: "Produktové Meta texty",
    desc: "3 originálne varianty produktových reklamných textov pre Meta Ads.",
    href: "/meta-texty-pre-produkty",
    badge: "Meta Ads"
  },
  {
    title: "Detailný popis cieľovej skupiny",
    desc: "AI nastroj pre detailny strategicky popis cielovej skupiny.",
    href: "/detailny-popis-cielovej-skupiny",
    badge: "Brand & Stratégia"
  },
  {
    title: "Tvorba Tone-of-voice",
    desc: "AI nastroj pre vytvorenie tone-of-voice manualu znacky.",
    href: "/tvorba-tone-of-voice",
    badge: "Brand & Stratégia"
  },
  {
    title: "Kalkulačka ziskovosti reklamy",
    desc: "Porovnanie scenarov investicie do reklamy a ziskovosti.",
    href: "/kalkulacka-ziskovosti-reklamy",
    badge: "Ecommerce"
  },
  {
    title: "EBITDA Break-Even kalkulačka",
    desc: "Rychle vyhodnotenie CM2, EBITDA, break-even MER a udrzatelneho ad spendu.",
    href: "/ebitda-break-even-kalkulacka",
    badge: "Ecommerce"
  }
] as const satisfies ReadonlyArray<{
  title: string;
  desc: string;
  href: Route;
  badge: string;
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
            <span className="tool-badge">{tool.badge}</span>
            <h3>{tool.title}</h3>
            <p>{tool.desc}</p>
            <span className="tool-cta">Otvorit nastroj</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
