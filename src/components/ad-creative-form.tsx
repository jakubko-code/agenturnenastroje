"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  id: string;
  name: string;
  industry: string;
  defaultStyle: string;
  defaultLighting: string;
  defaultColorGrading: string;
  defaultAspectRatio: string;
  brandNotes: string | null;
};

type HistoryItem = {
  id: string;
  clientName: string;
  brief: string;
  platform: string;
  style: string;
  imageUrl: string;
  promptJson: unknown;
  isWinner: boolean;
  createdAt: string;
};

type GenerateResult = {
  runId: string;
  imageUrl: string;
  promptJson: unknown;
  costEstimate: number;
};

const PLATFORMS = [
  { value: "facebook", label: "Facebook Feed (4:5)" },
  { value: "instagram", label: "Instagram Feed (1:1)" },
  { value: "stories", label: "Stories (9:16)" },
  { value: "carousel", label: "Carousel (1:1)" }
];

const STYLE_OPTIONS = [
  "ugc-selfie",
  "studio-product-hero",
  "lifestyle-in-context",
  "flat-lay",
  "before-after",
  "editorial-beauty",
  "unboxing-moment"
];

const LIGHTING_OPTIONS = ["ring-light", "natural-window", "golden-hour", "studio-softbox", "bathroom-vanity", "overhead-natural"];
const COLOR_OPTIONS = ["warm", "cool", "neutral", "muted", "vibrant", "cinematic"];
const ASPECT_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

// ─── Client modal (admin only) ────────────────────────────────────────────────

type ClientModalProps = {
  client?: Client;
  onClose: () => void;
  onSaved: () => void;
};

function ClientModal({ client, onClose, onSaved }: ClientModalProps) {
  const [form, setForm] = useState({
    name: client?.name ?? "",
    industry: client?.industry ?? "",
    defaultStyle: client?.defaultStyle ?? "ugc-selfie",
    defaultLighting: client?.defaultLighting ?? "natural-window",
    defaultColorGrading: client?.defaultColorGrading ?? "warm",
    defaultAspectRatio: client?.defaultAspectRatio ?? "4:5",
    brandNotes: client?.brandNotes ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const url = client ? `/api/ad-creative/clients/${client.id}` : "/api/ad-creative/clients";
      const method = client ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Chyba ukladania.");
        return;
      }
      onSaved();
    } catch {
      setError("Volanie API zlyhalo.");
    } finally {
      setSaving(false);
    }
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="card ac-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px" }}>{client ? "Upraviť klienta" : "Nový klient"}</h3>
        <div className="stack">
          <label>
            Názov klienta
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="napr. Skincare Brand" />
          </label>
          <label>
            Odvetvie
            <input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="napr. skincare, food, fashion" />
          </label>
          <label>
            Preferovaný štýl
            <select value={form.defaultStyle} onChange={(e) => set("defaultStyle", e.target.value)}>
              {STYLE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Osvetlenie
            <select value={form.defaultLighting} onChange={(e) => set("defaultLighting", e.target.value)}>
              {LIGHTING_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Color grading
            <select value={form.defaultColorGrading} onChange={(e) => set("defaultColorGrading", e.target.value)}>
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Pomer strán
            <select value={form.defaultAspectRatio} onChange={(e) => set("defaultAspectRatio", e.target.value)}>
              {ASPECT_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            Brand notes
            <textarea
              value={form.brandNotes}
              onChange={(e) => set("brandNotes", e.target.value)}
              placeholder="Poznámky o značke, štýle a vizuálnych preferenciách..."
              style={{ minHeight: 80 }}
            />
          </label>
        </div>
        {error && <p className="error-box" style={{ marginTop: 12 }}>{error}</p>}
        <div className="button-row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Zrušiť</button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

type DetailModalProps = {
  item: HistoryItem;
  onClose: () => void;
  onToggleWinner: (id: string) => void;
};

function DetailModal({ item, onClose, onToggleWinner }: DetailModalProps) {
  const [toggling, setToggling] = useState(false);

  async function handleToggleWinner() {
    setToggling(true);
    await onToggleWinner(item.id);
    setToggling(false);
  }

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="card ac-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ac-detail-inner">
          <div className="ac-detail-image">
            <img src={item.imageUrl} alt={item.brief} style={{ width: "100%", borderRadius: 10 }} />
          </div>
          <div className="ac-detail-meta">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 500 }}>{item.clientName}</p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#5f6368" }}>{item.platform} · {item.style}</p>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#5f6368" }}>
                  {new Date(item.createdAt).toLocaleString("sk-SK")}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 13, padding: "8px 14px" }}
                onClick={onClose}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}><strong>Brief:</strong> {item.brief}</p>
            <button
              className="btn"
              style={{ marginBottom: 16, background: item.isWinner ? "#f59e0b" : undefined }}
              onClick={handleToggleWinner}
              disabled={toggling}
            >
              {item.isWinner ? "★ Winner (zrušiť)" : "☆ Označiť ako Winner"}
            </button>
            <details>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 500, userSelect: "none" }}>
                JSON prompt
              </summary>
              <pre className="result-box" style={{ fontSize: 11, marginTop: 8, overflow: "auto", maxHeight: 300 }}>
                {JSON.stringify(item.promptJson, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type AdCreativeFormProps = {
  userRole: "admin" | "editor" | "viewer";
};

export function AdCreativeForm({ userRole }: AdCreativeFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [brief, setBrief] = useState("");
  const [refImageFile, setRefImageFile] = useState<File | null>(null);
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null);
  const [showPromptJson, setShowPromptJson] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClients();
    loadHistory();
  }, []);

  async function loadClients() {
    try {
      const res = await fetch("/api/ad-creative/clients");
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
        if (data.clients.length > 0 && !clientId) setClientId(data.clients[0].id);
      }
    } catch {
      // non-blocking
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/ad-creative/history");
      const data = await res.json();
      if (data.items) setHistory(data.items);
    } catch {
      // non-blocking
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setRefImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setRefImagePreview(url);
    } else {
      setRefImagePreview(null);
    }
  }

  function removeRefImage() {
    setRefImageFile(null);
    setRefImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLastResult(null);
    setShowPromptJson(false);

    if (!brief.trim()) {
      setError("Brief je povinný.");
      return;
    }
    if (!clientId) {
      setError("Vyberte klienta.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("brief", brief.trim());
      fd.append("clientId", clientId);
      fd.append("platform", platform);
      if (refImageFile) fd.append("referenceImage", refImageFile);

      const res = await fetch("/api/ad-creative/generate", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Generovanie zlyhalo.");
        return;
      }

      setLastResult(data as GenerateResult);
      loadHistory();
    } catch {
      setError("Volanie API zlyhalo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleWinner(runId: string) {
    const res = await fetch("/api/ad-creative/winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId })
    });
    if (res.ok) {
      await loadHistory();
      if (selectedItem?.id === runId) {
        setSelectedItem((prev) => prev ? { ...prev, isWinner: !prev.isWinner } : null);
      }
    }
  }

  function handleClientSaved() {
    setShowClientModal(false);
    setEditClient(undefined);
    loadClients();
  }

  return (
    <div className="ac-layout">
      {/* ── Left panel ── */}
      <div className="card ac-panel-left">
        <form onSubmit={handleGenerate} className="stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nová kreatíva</h3>
            {userRole === "admin" && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => { setEditClient(undefined); setShowClientModal(true); }}
              >
                + Klient
              </button>
            )}
          </div>

          <label>
            Klient
            <div style={{ display: "flex", gap: 6 }}>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{ flex: 1 }}
                required
              >
                <option value="">— vybrať klienta —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {userRole === "admin" && clientId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: "6px 10px", flexShrink: 0 }}
                  onClick={() => {
                    const c = clients.find((cl) => cl.id === clientId);
                    if (c) { setEditClient(c); setShowClientModal(true); }
                  }}
                >
                  Editovať
                </button>
              )}
            </div>
          </label>

          <label>
            Platforma
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <label>
            Creative brief <span className="required-mark">*</span>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Opíš čo chceš vygenerovať... napr. žena 30+ nanáša sérum, UGC štýl, kúpeľňa"
              style={{ minHeight: 110 }}
              required
            />
          </label>

          <label style={{ cursor: "pointer" }}>
            Referenčný obrázok produktu (voliteľné)
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", textAlign: "center" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {refImageFile ? "Zmeniť obrázok" : "Nahrať obrázok"}
            </button>
          </label>

          {refImagePreview && (
            <div style={{ position: "relative" }}>
              <img src={refImagePreview} alt="preview" style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover" }} />
              <button
                type="button"
                onClick={removeRefImage}
                style={{
                  position: "absolute", top: 6, right: 6,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  border: "none", borderRadius: "50%", width: 24, height: 24,
                  cursor: "pointer", fontSize: 12, lineHeight: "24px", textAlign: "center", padding: 0
                }}
              >
                ✕
              </button>
            </div>
          )}

          {error && <p className="error-box">{error}</p>}

          <button className="btn" type="submit" disabled={loading || userRole === "viewer"} style={{ width: "100%" }}>
            {loading ? "Generujem kreatívu..." : "Generovať kreatívu"}
          </button>

          {userRole === "viewer" && (
            <p className="hint-text" style={{ textAlign: "center" }}>Viewer nemôže generovať kreatívy.</p>
          )}
        </form>

        {lastResult && (
          <div style={{ marginTop: 16 }}>
            <p className="ok-box" style={{ marginBottom: 10 }}>
              Kreatíva vygenerovaná! Odhadovaná cena: <strong>${lastResult.costEstimate.toFixed(2)}</strong>
            </p>
            <details open={showPromptJson}>
              <summary
                style={{ cursor: "pointer", fontSize: 13, fontWeight: 500, userSelect: "none" }}
                onClick={() => setShowPromptJson((v) => !v)}
              >
                Zobraziť JSON prompt
              </summary>
              <pre className="result-box" style={{ fontSize: 11, marginTop: 8, overflow: "auto", maxHeight: 250 }}>
                {JSON.stringify(lastResult.promptJson, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="ac-panel-right">
        {/* Latest image */}
        {lastResult && (
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Posledná vygenerovaná kreatíva</h3>
            <img
              src={lastResult.imageUrl}
              alt="generated"
              style={{ width: "100%", borderRadius: 10, display: "block" }}
            />
            <a
              href={lastResult.imageUrl}
              download
              className="btn btn-secondary"
              style={{ display: "inline-block", marginTop: 10, fontSize: 13, padding: "8px 14px", textDecoration: "none" }}
            >
              Stiahnuť obrázok
            </a>
          </div>
        )}

        {/* History grid */}
        <div className="card">
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>História kreatív</h3>
          {history.length === 0 ? (
            <p className="hint-text">Zatiaľ žiadne vygenerované kreatívy.</p>
          ) : (
            <div className="ac-history-grid">
              {history.map((item) => (
                <button
                  key={item.id}
                  className="ac-history-item"
                  onClick={() => setSelectedItem(item)}
                  title={item.brief}
                >
                  <img src={item.imageUrl} alt={item.brief} />
                  {item.isWinner && <span className="ac-winner-badge">★</span>}
                  <div className="ac-history-label">
                    <span>{item.clientName}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("sk-SK")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showClientModal && (
        <ClientModal
          client={editClient}
          onClose={() => { setShowClientModal(false); setEditClient(undefined); }}
          onSaved={handleClientSaved}
        />
      )}

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onToggleWinner={handleToggleWinner}
        />
      )}
    </div>
  );
}
