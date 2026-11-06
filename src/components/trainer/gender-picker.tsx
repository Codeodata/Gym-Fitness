"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Gender = "chica" | "chico";

const OPTIONS: { id: Gender; label: string; color: string }[] = [
  { id: "chica", label: "Mujer", color: "#f472b6" },
  { id: "chico", label: "Hombre", color: "#60a5fa" },
];

export function GenderPicker({ clientId, current }: { clientId: string; current: Gender | null }) {
  const [selected, setSelected] = useState<Gender | null>(current);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function pick(gender: Gender) {
    if (saving) return;
    setSelected(gender);
    setSaving(true);
    await fetch("/api/trainer/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, gender }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Género
        </h2>
        {saved && (
          <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--success)" }}>
            <Check className="h-3.5 w-3.5" /> Guardado
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={saving}
              className="h-12 rounded-2xl text-sm font-extrabold cursor-pointer"
              style={{
                background: active ? `${opt.color}22` : "var(--bg-hover)",
                border: `2px solid ${active ? opt.color : "var(--border)"}`,
                color: active ? opt.color : "var(--text-2)",
                opacity: saving ? 0.6 : 1,
                touchAction: "manipulation",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {!selected && (
        <p className="text-xs mt-3" style={{ color: "var(--text-3)" }}>
          Elegí el género para agruparlo en Alumnos y Rutinas.
        </p>
      )}
    </div>
  );
}
