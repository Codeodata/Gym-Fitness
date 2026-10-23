"use client";

import { useState, useEffect } from "react";
import { Plus, X, Flame, ChevronDown, ChevronUp } from "lucide-react";

const DAYS = [
  { label: "Lunes",     short: "Lun", dow: 1 },
  { label: "Martes",    short: "Mar", dow: 2 },
  { label: "Miércoles", short: "Mié", dow: 3 },
  { label: "Jueves",    short: "Jue", dow: 4 },
  { label: "Viernes",   short: "Vie", dow: 5 },
];

const CAT_COLOR: Record<string, string> = {
  musculación:   "var(--accent)",
  calentamiento: "var(--c-orange)",
  funcional:     "var(--c-blue)",
};
const CAT_BG: Record<string, string> = {
  musculación:   "var(--accent-soft)",
  calentamiento: "rgba(251,146,60,0.12)",
  funcional:     "rgba(96,165,250,0.12)",
};

type Block = {
  id: string;
  dayOfWeek: number;
  orderIndex: number;
  planDayId: string;
  planDayName: string | null;
  planName: string;
  planCategory: string;
};

type LibraryDay = {
  id: string;
  name: string | null;
  dayNumber: number;
  exerciseCount: number;
};

type LibraryPlan = {
  id: string;
  name: string;
  category: string;
  days: LibraryDay[];
};

export function WeeklyScheduleBuilder({ clientId }: { clientId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [library, setLibrary] = useState<LibraryPlan[]>([]);
  const [activeDow, setActiveDow] = useState<number | null>(null);
  const [loadingBlock, setLoadingBlock] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/trainer/weekly-schedule?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => setBlocks(d.blocks ?? []));
    fetch("/api/trainer/plan-library")
      .then((r) => r.json())
      .then((d) => setLibrary(d.library ?? []));
  }, [clientId]);

  async function addBlock(planDayId: string) {
    if (!activeDow) return;
    setLoadingBlock(planDayId);
    try {
      const res = await fetch("/api/trainer/weekly-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dayOfWeek: activeDow, planDayId }),
      });
      const data = await res.json() as { block: Block };
      const planDay = library.flatMap((p) => p.days.map((d) => ({ ...d, planName: p.name, planCategory: p.category }))).find((d) => d.id === planDayId);
      if (planDay) {
        setBlocks((prev) => [...prev, {
          ...data.block,
          planDayName: planDay.name,
          planName: planDay.planName,
          planCategory: planDay.planCategory,
        }]);
      }
    } finally {
      setLoadingBlock(null);
    }
  }

  async function removeBlock(blockId: string) {
    setLoadingBlock(blockId);
    try {
      await fetch(`/api/trainer/weekly-schedule/${blockId}`, { method: "DELETE" });
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } finally {
      setLoadingBlock(null);
    }
  }

  function togglePlan(planId: string) {
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  }

  const blocksForDay = (dow: number) => blocks.filter((b) => b.dayOfWeek === dow).sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>
          Semana del alumno
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          Hacé click en un día para agregar bloques de rutina
        </p>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-5 divide-x" style={{ borderBottom: "1px solid var(--border)", "--tw-divide-opacity": 1 } as React.CSSProperties}>
        {DAYS.map(({ label, short, dow }) => {
          const dayBlocks = blocksForDay(dow);
          const isActive = activeDow === dow;
          return (
            <div key={dow} className="flex flex-col" style={{ minHeight: 120 }}>
              {/* Day header */}
              <button
                onClick={() => setActiveDow(isActive ? null : dow)}
                className="w-full px-2 py-2.5 text-center flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                style={{
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: isActive ? "var(--accent)" : "var(--text-3)" }}>
                  {short}
                </span>
                <span className="hidden sm:block text-[10px]" style={{ color: "var(--text-3)" }}>{label}</span>
                {dayBlocks.length > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold mt-0.5"
                    style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                    {dayBlocks.length}
                  </span>
                )}
              </button>

              {/* Blocks */}
              <div className="flex-1 p-1.5 flex flex-col gap-1">
                {dayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-lg px-2 py-1.5 flex items-start justify-between gap-1 group"
                    style={{
                      background: CAT_BG[block.planCategory] ?? "var(--bg-hover)",
                      border: `1px solid ${CAT_COLOR[block.planCategory] ?? "var(--border)"}20`,
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold truncate leading-tight" style={{ color: CAT_COLOR[block.planCategory] ?? "var(--text)" }}>
                        {block.planDayName ?? block.planName}
                      </p>
                      <p className="text-[9px] truncate leading-tight mt-0.5" style={{ color: "var(--text-3)" }}>
                        {block.planName}
                      </p>
                    </div>
                    <button
                      onClick={() => removeBlock(block.id)}
                      disabled={loadingBlock === block.id}
                      className="w-4 h-4 flex items-center justify-center rounded shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--destructive)" }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add button */}
                <button
                  onClick={() => setActiveDow(isActive ? null : dow)}
                  className="w-full flex items-center justify-center rounded-lg cursor-pointer transition-all mt-auto"
                  style={{
                    height: 28,
                    border: `1px dashed ${isActive ? "var(--accent)" : "var(--border-strong)"}`,
                    color: isActive ? "var(--accent)" : "var(--text-3)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "var(--border-strong)";
                      e.currentTarget.style.color = "var(--text-3)";
                    }
                  }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Library panel */}
      {activeDow !== null && (
        <div className="p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
            Agregar bloque a {DAYS.find((d) => d.dow === activeDow)?.label}
          </p>

          <div className="flex flex-col gap-2">
            {library.map((plan) => {
              const expanded = expandedPlans.has(plan.id);
              return (
                <div key={plan.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => togglePlan(plan.id)}
                    className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    <div className="flex items-center gap-2">
                      {plan.category === "calentamiento" && <Flame className="h-3.5 w-3.5" style={{ color: "var(--c-orange)" }} />}
                      <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{plan.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: CAT_BG[plan.category] ?? "var(--bg)", color: CAT_COLOR[plan.category] ?? "var(--text-3)" }}>
                        {plan.category}
                      </span>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-3)" }} />}
                  </button>

                  {expanded && (
                    <div className="flex flex-col divide-y" style={{ borderTop: "1px solid var(--border)" }}>
                      {plan.days.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => addBlock(day.id)}
                          disabled={loadingBlock === day.id}
                          className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer text-left transition-all"
                          style={{ background: "var(--bg-panel)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-panel)"; }}
                        >
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                              {day.name ?? `Día ${day.dayNumber}`}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-3)" }}>
                              {day.exerciseCount} ejercicio{day.exerciseCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: CAT_BG[plan.category] ?? "var(--bg-hover)" }}>
                            <Plus className="h-4 w-4" style={{ color: CAT_COLOR[plan.category] ?? "var(--accent)" }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
