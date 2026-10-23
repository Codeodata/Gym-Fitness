"use client";

import { useState, useEffect } from "react";
import { Plus, X, Flame, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

const DAYS = [
  { label: "Lunes",     short: "Lun", dow: 1 },
  { label: "Martes",    short: "Mar", dow: 2 },
  { label: "Miércoles", short: "Mié", dow: 3 },
  { label: "Jueves",    short: "Jue", dow: 4 },
  { label: "Viernes",   short: "Vie", dow: 5 },
];

const CAT: Record<string, { color: string; bg: string; border: string }> = {
  musculación:   { color: "#84cc16",  bg: "rgba(132,204,22,0.10)",  border: "rgba(132,204,22,0.30)"  },
  calentamiento: { color: "#fb923c",  bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.30)"  },
  funcional:     { color: "#60a5fa",  bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.30)"  },
};

const DAY_ACCENT: Record<number, { color: string; bg: string }> = {
  1: { color: "#60a5fa",  bg: "rgba(96,165,250,0.10)"  },
  2: { color: "#c084fc",  bg: "rgba(192,132,252,0.10)" },
  3: { color: "#fb923c",  bg: "rgba(251,146,60,0.10)"  },
  4: { color: "#f472b6",  bg: "rgba(244,114,182,0.10)" },
  5: { color: "#4ade80",  bg: "rgba(74,222,128,0.10)"  },
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
      const flat = library.flatMap((p) =>
        p.days.map((d) => ({ ...d, planName: p.name, planCategory: p.category }))
      );
      const planDay = flat.find((d) => d.id === planDayId);
      if (planDay) {
        setBlocks((prev) => [
          ...prev,
          { ...data.block, planDayName: planDay.name, planName: planDay.planName, planCategory: planDay.planCategory },
        ]);
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
      next.has(planId) ? next.delete(planId) : next.add(planId);
      return next;
    });
  }

  const blocksForDay = (dow: number) =>
    blocks.filter((b) => b.dayOfWeek === dow).sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>

      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>
          Semana del alumno
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          Hacé clic en un día para agregar bloques de rutina
        </p>
      </div>

      {/* 5-column grid */}
      <div className="grid grid-cols-5" style={{ borderBottom: activeDow !== null ? "1px solid var(--border)" : "none" }}>
        {DAYS.map(({ label, short, dow }, colIdx) => {
          const dayBlocks = blocksForDay(dow);
          const isActive = activeDow === dow;
          const da = DAY_ACCENT[dow]!;

          return (
            <div
              key={dow}
              className="flex flex-col"
              style={{
                borderRight: colIdx < 4 ? "1px solid var(--border)" : "none",
                borderTop: `3px solid ${isActive ? da.color : "transparent"}`,
                background: isActive ? da.bg : "transparent",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              {/* Day header button */}
              <button
                onClick={() => setActiveDow(isActive ? null : dow)}
                className="w-full px-2 py-3 text-center cursor-pointer"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span
                  className="text-xs font-extrabold uppercase tracking-wider block"
                  style={{ color: isActive ? da.color : "var(--text-3)" }}
                >
                  {short}
                </span>
                <span
                  className="text-[10px] hidden sm:block mt-0.5"
                  style={{ color: isActive ? da.color : "var(--text-3)", opacity: 0.7 }}
                >
                  {label}
                </span>
                {dayBlocks.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold mt-1.5"
                    style={{ background: da.color, color: "#000" }}
                  >
                    {dayBlocks.length}
                  </span>
                )}
              </button>

              {/* Blocks list */}
              <div className="flex flex-col gap-2 p-2 flex-1">
                {dayBlocks.map((block) => {
                  const cat = CAT[block.planCategory] ?? CAT.musculación!;
                  return (
                    <div
                      key={block.id}
                      className="rounded-xl p-2.5 flex flex-col gap-1 group relative"
                      style={{
                        background: cat.bg,
                        border: `1px solid ${cat.border}`,
                      }}
                    >
                      {/* Category icon */}
                      <div className="flex items-center gap-1.5">
                        {block.planCategory === "calentamiento"
                          ? <Flame className="h-3 w-3 shrink-0" style={{ color: cat.color }} />
                          : <Dumbbell className="h-3 w-3 shrink-0" style={{ color: cat.color }} />}
                        <span
                          className="text-[9px] font-extrabold uppercase tracking-wider truncate"
                          style={{ color: cat.color }}
                        >
                          {block.planCategory}
                        </span>
                      </div>
                      {/* Block name */}
                      <p
                        className="text-[11px] font-extrabold leading-tight"
                        style={{ color: "var(--text)" }}
                      >
                        {block.planDayName ?? block.planName}
                      </p>
                      {/* Plan name (only if different) */}
                      {block.planDayName && (
                        <p
                          className="text-[10px] leading-tight truncate"
                          style={{ color: "var(--text-3)" }}
                        >
                          {block.planName}
                        </p>
                      )}
                      {/* Remove button — always visible */}
                      <button
                        onClick={() => removeBlock(block.id)}
                        disabled={loadingBlock === block.id}
                        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-lg cursor-pointer"
                        style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444" }}
                      >
                        {loadingBlock === block.id
                          ? <span className="text-[9px]">…</span>
                          : <X className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}

                {/* Add button */}
                <button
                  onClick={() => setActiveDow(isActive ? null : dow)}
                  className="w-full flex items-center justify-center rounded-xl cursor-pointer transition-colors mt-auto"
                  style={{
                    height: 34,
                    border: `1.5px dashed ${isActive ? da.color : "var(--border)"}`,
                    color: isActive ? da.color : "var(--text-3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = da.color;
                    e.currentTarget.style.color = da.color;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-3)";
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Library panel */}
      {activeDow !== null && (
        <div className="p-5" style={{ background: "var(--bg)" }}>
          <p className="text-xs font-extrabold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
            Agregar bloque a{" "}
            <span style={{ color: DAY_ACCENT[activeDow]?.color }}>
              {DAYS.find((d) => d.dow === activeDow)?.label}
            </span>
          </p>

          <div className="flex flex-col gap-2">
            {library.map((plan) => {
              const cat = CAT[plan.category] ?? CAT.musculación!;
              const expanded = expandedPlans.has(plan.id);
              return (
                <div
                  key={plan.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <button
                    onClick={() => togglePlan(plan.id)}
                    className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
                    style={{ background: "var(--bg-panel)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
                      >
                        {plan.category === "calentamiento"
                          ? <Flame className="h-3.5 w-3.5" style={{ color: cat.color }} />
                          : <Dumbbell className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                          {plan.name}
                        </span>
                        <span
                          className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          {plan.category}
                        </span>
                      </div>
                    </div>
                    {expanded
                      ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                      : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />}
                  </button>

                  {expanded && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {plan.days.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => addBlock(day.id)}
                          disabled={loadingBlock === day.id}
                          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left transition-colors"
                          style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-panel)"; }}
                        >
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                              {day.name ?? `Día ${day.dayNumber}`}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                              {day.exerciseCount} ejercicio{day.exerciseCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div
                            className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0"
                            style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
                          >
                            {loadingBlock === day.id
                              ? <span className="text-[10px]" style={{ color: cat.color }}>…</span>
                              : <Plus className="h-4 w-4" style={{ color: cat.color }} />}
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
