"use client";

import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";

const DOW_FULL = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DOW_LETTER = ["", "L", "M", "X", "J", "V", "S"];

const MG_COLOR: Record<string, string> = {
  chest: "var(--c-red)", back: "var(--c-blue)", shoulders: "var(--c-purple)",
  arms: "var(--c-orange)", legs: "var(--c-green)", core: "var(--c-yellow)",
  cardio: "var(--c-pink)", full_body: "var(--c-lime)",
};
const MG_LABEL: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  weightKg: string | null;
  section: string;
};

type PlanDay = {
  id: string;
  name: string | null;
  dayNumber: number;
  dow: number | null;
  exercises: Exercise[];
};

export function WeekPlan() {
  const [days, setDays] = useState<PlanDay[]>([]);
  const [loading, setLoading] = useState(true);

  const todayDow = (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();

  useEffect(() => {
    fetch("/api/client/week-plan")
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl p-5 text-center"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando…</p>
    </div>
  );

  if (days.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {days.map((day) => {
        const isToday = day.dow !== null && day.dow === todayDow;
        const dayTitle = day.name || `Día ${day.dayNumber}`;
        const muscleGroups = [...new Set(day.exercises.map((e) => e.muscleGroup))];

        return (
          <div key={day.id} className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
              background: "var(--bg-panel)",
            }}>

            {/* Header: letter badge + day name + chips + HOY */}
            <div className="px-4 py-3 flex items-center gap-3"
              style={{
                borderBottom: "1px solid var(--border)",
                background: isToday ? "var(--accent-soft)" : "transparent",
              }}>

              {/* Letter badge */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: isToday ? "var(--accent)" : "var(--bg-hover)" }}>
                {day.dow !== null
                  ? <span className="text-sm font-extrabold leading-none"
                      style={{ color: isToday ? "var(--accent-fg)" : "var(--text-3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {DOW_LETTER[day.dow]}
                    </span>
                  : <Dumbbell className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
                }
              </div>

              {/* Name + chips */}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm leading-tight"
                  style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {day.dow !== null ? DOW_FULL[day.dow] : dayTitle}
                  {day.dow !== null && day.name ? <span className="font-normal" style={{ color: "var(--text-3)" }}> · {day.name}</span> : null}
                </p>
                {muscleGroups.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {muscleGroups.map((mg) => {
                      const col = MG_COLOR[mg] ?? "var(--accent)";
                      return (
                        <span key={mg} className="text-[10px] font-semibold px-1.5 py-px rounded"
                          style={{ background: `${col}18`, color: col }}>
                          {MG_LABEL[mg] ?? mg}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {isToday && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                  HOY
                </span>
              )}
            </div>

            {/* Exercise rows — compact single-line */}
            <div className="px-4 py-2">
              {day.exercises.map((ex, i) => {
                const col = MG_COLOR[ex.muscleGroup] ?? "var(--accent)";
                return (
                  <div key={ex.id} className="flex items-center gap-2 py-1.5"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                    {/* Colored dot */}
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col }} />
                    {/* Exercise name */}
                    <p className="flex-1 text-sm truncate" style={{ color: "var(--text)" }}>{ex.name}</p>
                    {/* Metrics */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold tabular-nums"
                        style={{ color: "var(--text-2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {ex.sets}×{ex.reps}
                      </span>
                      {ex.weightKg && (
                        <span className="text-[11px] font-semibold tabular-nums"
                          style={{ color: "var(--accent)" }}>
                          {ex.weightKg}kg
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
