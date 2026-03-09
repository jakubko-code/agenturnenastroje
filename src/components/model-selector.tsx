"use client";

import { useEffect, useState } from "react";

type Provider = "gemini" | "openai" | "claude";

const MODELS: { id: Provider; label: string }[] = [
  { id: "gemini", label: "Gemini 3 PRO Preview" },
  { id: "openai", label: "ChatGPT 5.2" },
  { id: "claude", label: "Claude Sonnet 4.5" }
];

type Props = {
  value: Provider;
  onChange: (model: Provider) => void;
};

export function ModelSelector({ value, onChange }: Props) {
  const [available, setAvailable] = useState<Record<Provider, boolean>>({
    gemini: true,
    openai: true,
    claude: true
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.keys) {
          const keys: Record<Provider, boolean> = data.keys;
          setAvailable(keys);
          // ak aktuálne zvolený model nie je dostupný, prepneme na prvý dostupný
          if (!keys[value]) {
            const first = MODELS.find((m) => keys[m.id]);
            if (first) onChange(first.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const visible = MODELS.filter((m) => available[m.id]);

  if (visible.length === 0) return null;

  return (
    <>
      <label>Zvol si model:</label>
      <div className="model-button-group">
        {visible.map((m) => (
          <button
            key={m.id}
            type="button"
            className={value === m.id ? "model-btn is-selected" : "model-btn"}
            onClick={() => onChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </>
  );
}
