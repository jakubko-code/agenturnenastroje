"use client";

import { useState } from "react";

type NavodItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

const navody: NavodItem[] = [
  {
    id: "apify-api",
    title: "Ako nastaviť Apify API kľúč",
    content: (
      <div className="navod-body">
        <p>
          Apify API kľúč je potrebný pre nástroj <strong>Meta Ads Library scraper</strong>. Každý používateľ
          si nastavuje vlastný kľúč - náklady za scrapovanie idú na tvoj Apify účet.
        </p>

        <h3>1. Registrácia</h3>
        <ol>
          <li>Prejdi na <strong>apify.com</strong> a klikni na <strong>Get started</strong></li>
          <li>Zvoľ <strong>Continue with Google</strong> a dokonči registráciu</li>
        </ol>
        <p className="navod-note">
          Po registrácii získaš <strong>5 $ kredit zadarmo</strong>, ktorý sa každý mesiac obnovuje.
          Pre naše potreby to nateraz úplne stačí - nie je potrebný žiadny platený plán.
        </p>

        <h3>2. Získaj API token</h3>
        <ol>
          <li>Po prihlásení ťa to presmeruje do <strong>Apify Console</strong></li>
          <li>V ľavom menu dole klikni na <strong>Settings</strong></li>
          <li>Prejdi na záložku <strong>API & Integrations</strong></li>
          <li>Klikni na <strong>Create a new token</strong> a skopíruj vygenerovaný token</li>
        </ol>

        <h3>3. Vlož token do aplikácie</h3>
        <ol>
          <li>Prejdi do <a href="/nastavenia">Nastavení</a></li>
          <li>Nájdi sekciu <strong>Apify API kľúč (používateľský)</strong></li>
          <li>Vlož skopírovaný token a klikni <strong>Uložiť</strong></li>
        </ol>
      </div>
    )
  }
];

export function NavodyAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="script-accordion">
      {navody.map((navod) => (
        <div key={navod.id}>
          <button
            type="button"
            className={openId === navod.id ? "script-accordion-header is-open" : "script-accordion-header"}
            onClick={() => toggle(navod.id)}
          >
            {navod.title}
            <span className={openId === navod.id ? "history-arrow is-open" : "history-arrow"}>▾</span>
          </button>
          {openId === navod.id ? (
            <div className="script-accordion-body">{navod.content}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
