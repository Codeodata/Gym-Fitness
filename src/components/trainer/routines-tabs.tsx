"use client";

import { useState, type ReactNode } from "react";
import { ClipboardList, Users } from "lucide-react";

const TABS = [
  { id: "plantillas", label: "Plantillas", icon: ClipboardList },
  { id: "alumnos", label: "Por alumno", icon: Users },
] as const;

export function RoutinesTabs({ templates, byClient }: { templates: ReactNode; byClient: ReactNode }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("plantillas");

  return (
    <>
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" role="tablist"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const sel = tab === id;
          return (
            <button key={id} type="button" role="tab" aria-selected={sel} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors"
              style={{
                background: sel ? "var(--accent)" : "transparent",
                color: sel ? "var(--accent-fg)" : "var(--text-3)",
                touchAction: "manipulation",
              }}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
      <div hidden={tab !== "plantillas"}>{templates}</div>
      <div hidden={tab !== "alumnos"}>{byClient}</div>
    </>
  );
}
