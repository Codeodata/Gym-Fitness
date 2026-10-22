"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  daysPerWeek: number;
  durationWeeks: number | null;
  dayCount: number;
};

type Category = "todas" | "musculación" | "funcional" | "calentamiento";

const CATEGORY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  musculación:   { color: "var(--c-lime)",   bg: "var(--c-lime-bg)",   label: "Musculación"   },
  funcional:     { color: "var(--c-blue)",   bg: "var(--c-blue-bg)",   label: "Funcional"     },
  calentamiento: { color: "var(--c-orange)", bg: "var(--c-orange-bg)", label: "Calentamiento" },
};

const FILTERS: { id: Category; label: string }[] = [
  { id: "todas",         label: "Todas"         },
  { id: "musculación",   label: "Musculación"   },
  { id: "funcional",     label: "Funcional"     },
  { id: "calentamiento", label: "Calentamiento" },
];

export function PlansGrid({ plans }: { plans: Plan[] }) {
  const [active, setActive] = useState<Category>("todas");

  const filtered = active === "todas" ? plans : plans.filter((p) => p.category === active);

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const count = f.id === "todas" ? plans.length : plans.filter((p) => p.category === f.id).length;
          const sel = active === f.id;
          const style = f.id !== "todas" ? CATEGORY_STYLE[f.id] : null;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              style={{
                background: sel ? (style?.bg ?? "var(--accent-soft)") : "var(--bg-panel)",
                border: `1px solid ${sel ? (style?.color ?? "var(--accent)") : "var(--border)"}`,
                color: sel ? (style?.color ?? "var(--accent)") : "var(--text-3)",
                touchAction: "manipulation",
              }}
            >
              {f.label}
              <span
                className="text-[10px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-md"
                style={{
                  background: sel ? (style?.color ?? "var(--accent)") : "var(--bg-hover)",
                  color: sel ? (f.id !== "todas" ? "#000" : "var(--accent-fg)") : "var(--text-3)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <ClipboardList className="h-8 w-8" style={{ color: "var(--text-3)" }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            No hay planes en esta categoría
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => {
            const cat = CATEGORY_STYLE[plan.category] ?? CATEGORY_STYLE["musculación"]!;
            return (
              <Link
                key={plan.id}
                href={`/trainer/plans/${plan.id}`}
                className="plan-card rounded-2xl p-5 flex flex-col gap-3 group"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              >
                {/* Category badge */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0"
                    style={{ background: cat.bg, color: cat.color }}
                  >
                    {cat.label}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-lg font-semibold shrink-0"
                    style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
                  >
                    {plan.daysPerWeek === 5 ? "Pase libre" : `${plan.daysPerWeek}d/sem`}
                  </span>
                </div>

                {/* Name */}
                <h2
                  className="font-extrabold text-base leading-tight"
                  style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {plan.name}
                </h2>

                {plan.description && (
                  <p className="text-sm line-clamp-2" style={{ color: "var(--text-3)" }}>
                    {plan.description}
                  </p>
                )}

                {/* Footer */}
                <div
                  className="flex items-center gap-4 mt-auto pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {plan.dayCount} día{plan.dayCount !== 1 ? "s" : ""}
                  </span>
                  {plan.durationWeeks && (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {plan.durationWeeks} sem
                    </span>
                  )}
                  <span
                    className="ml-auto text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: cat.color }}
                  >
                    Ver →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
