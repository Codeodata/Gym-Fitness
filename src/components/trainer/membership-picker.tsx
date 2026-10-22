"use client";

import { useState } from "react";
import { Calendar, Zap, Infinity, Check } from "lucide-react";

type MembershipType = "2dias" | "3dias" | "pase_libre";

const OPTIONS: { id: MembershipType; label: string; sub: string; icon: typeof Calendar }[] = [
  { id: "2dias",      label: "2 días/sem",  sub: "2 turnos fijos",   icon: Calendar  },
  { id: "3dias",      label: "3 días/sem",  sub: "3 turnos fijos",   icon: Zap       },
  { id: "pase_libre", label: "Pase libre",  sub: "Sin límite",       icon: Infinity  },
];

export function MembershipPicker({
  clientId,
  current,
}: {
  clientId: string;
  current: MembershipType | null;
}) {
  const [selected, setSelected] = useState<MembershipType | null>(current);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function pick(type: MembershipType) {
    if (saving) return;
    setSelected(type);
    setSaving(true);
    await fetch("/api/trainer/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, membershipType: type }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Plan de asistencia
        </h2>
        {saved && (
          <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--success)" }}>
            <Check className="h-3.5 w-3.5" /> Guardado
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={saving}
              className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl text-center cursor-pointer"
              style={{
                background: active ? "var(--accent-soft)" : "var(--bg-hover)",
                border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                opacity: saving ? 0.6 : 1,
                touchAction: "manipulation",
              }}
            >
              <Icon className="h-5 w-5" style={{ color: active ? "var(--accent)" : "var(--text-3)" }} />
              <p className="text-xs font-extrabold leading-tight" style={{ color: active ? "var(--accent)" : "var(--text)" }}>
                {opt.label}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--text-3)" }}>{opt.sub}</p>
            </button>
          );
        })}
      </div>
      {!selected && (
        <p className="text-xs mt-3" style={{ color: "var(--text-3)" }}>
          Elegí el plan de asistencia para este alumno.
        </p>
      )}
    </div>
  );
}
