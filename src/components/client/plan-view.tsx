"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Dumbbell, CheckCircle, Clock } from "lucide-react";
import type { Plan, PlanDay, PlanExercise, Exercise, PlanAssignment } from "@/lib/db/schema";

const DOW_FULL = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DOW_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type FullExercise = PlanExercise & { exercise: Exercise };
type FullDay = PlanDay & { planExercises: FullExercise[] };
type FullPlan = Plan & { planDays: FullDay[] };

type Props = {
  plan: FullPlan;
  assignment: PlanAssignment;
  clientId: string;
};

type LogEntry = { sets: string; reps: string; weight: string; notes: string };

export function PlanView({ plan, assignment }: Props) {
  const [openDay, setOpenDay] = useState<string | null>(plan.planDays[0]?.id ?? null);
  const [logEntries, setLogEntries] = useState<Record<string, LogEntry>>({});
  const [logging, setLogging] = useState(false);
  const [loggedDay, setLoggedDay] = useState<string | null>(null);
  const [successDay, setSuccessDay] = useState<string | null>(null);

  const scheduleMap = useMemo<Record<string, number>>(() => {
    if (!assignment.daySchedule) return {};
    try {
      const arr = JSON.parse(assignment.daySchedule) as { planDayId: string; dayOfWeek: number }[];
      return Object.fromEntries(arr.map((e) => [e.planDayId, e.dayOfWeek]));
    } catch {
      return {};
    }
  }, [assignment.daySchedule]);

  function updateEntry(planExerciseId: string, field: keyof LogEntry, value: string) {
    setLogEntries((prev) => ({
      ...prev,
      [planExerciseId]: { ...prev[planExerciseId] ?? { sets: "", reps: "", weight: "", notes: "" }, [field]: value },
    }));
  }

  async function logSession(day: FullDay) {
    setLogging(true);
    setLoggedDay(day.id);
    try {
      const exercises = day.planExercises.map((pe) => ({
        planExerciseId: pe.id,
        setsDone: logEntries[pe.id]?.sets ? Number(logEntries[pe.id]!.sets) : pe.sets,
        repsDone: logEntries[pe.id]?.reps || pe.reps,
        weightKg: logEntries[pe.id]?.weight || null,
        notes: logEntries[pe.id]?.notes || null,
      }));
      await fetch("/api/client/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: assignment.id, planDayId: day.id, exercises }),
      });
      setSuccessDay(day.id);
      setTimeout(() => setSuccessDay(null), 3000);
    } finally {
      setLogging(false);
      setLoggedDay(null);
    }
  }

  const inputStyle = {
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{plan.name}</h1>
        {plan.description && (
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{plan.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            {plan.daysPerWeek} días/semana
          </span>
          {plan.durationWeeks && (
            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold"
              style={{ background: "var(--bg-panel)", color: "var(--text-3)" }}>
              {plan.durationWeeks} semanas
            </span>
          )}
        </div>
        {assignment.trainerNotes && (
          <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
            <strong>Nota del entrenador:</strong> {assignment.trainerNotes}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {plan.planDays.map((day) => {
          const isOpen = openDay === day.id;
          const isSuccess = successDay === day.id;
          const dow = scheduleMap[day.id] ?? day.dayOfWeek ?? null;
          const dowShort = dow ? DOW_SHORT[dow] : null;
          const dowFull = dow ? DOW_FULL[dow] : null;
          const dayLabel = dowFull
            ? `${dowFull} — ${day.name || `Día ${day.dayNumber}`}`
            : day.name || `Día ${day.dayNumber}`;

          return (
            <div key={day.id} className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${isOpen ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-panel)" }}>
              {/* Day header */}
              <button
                onClick={() => setOpenDay(isOpen ? null : day.id)}
                className="w-full flex items-center justify-between px-5 py-4"
                style={{ cursor: "pointer", touchAction: "manipulation" }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{ background: isOpen ? "var(--accent)" : "var(--bg-hover)", color: isOpen ? "var(--accent-fg)" : "var(--text-3)" }}>
                    {day.dayNumber}
                  </span>
                  <div className="flex flex-col items-start">
                    {dowShort && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: isOpen ? "var(--accent)" : "var(--text-3)", opacity: 0.7 }}>
                        {dowShort}
                      </span>
                    )}
                    <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                      {dayLabel}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {day.planExercises.length} ejercicios
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                )}
              </button>

              {/* Day content */}
              {isOpen && (
                <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex flex-col gap-4 pt-4">
                    {day.planExercises.map((pe) => (
                      <div key={pe.id}>
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: "var(--bg-hover)" }}>
                            <Dumbbell className="h-4 w-4" style={{ color: "var(--accent)" }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                              {pe.exercise.name}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                                {pe.sets} series × {pe.reps} reps
                              </span>
                              {pe.weightKg && (
                                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                                  {pe.weightKg} kg
                                </span>
                              )}
                            </div>
                            {pe.notes && (
                              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{pe.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Log inputs */}
                        <div className="ml-11 grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: "var(--text-3)" }}>Series</label>
                            <input
                              type="number" min="1"
                              placeholder={String(pe.sets)}
                              value={logEntries[pe.id]?.sets ?? ""}
                              onChange={(e) => updateEntry(pe.id, "sets", e.target.value)}
                              style={inputStyle}
                              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                          </div>
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: "var(--text-3)" }}>Reps</label>
                            <input
                              placeholder={pe.reps}
                              value={logEntries[pe.id]?.reps ?? ""}
                              onChange={(e) => updateEntry(pe.id, "reps", e.target.value)}
                              style={inputStyle}
                              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                          </div>
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: "var(--text-3)" }}>Peso (kg)</label>
                            <input
                              type="number" step="0.5"
                              placeholder={pe.weightKg ?? "—"}
                              value={logEntries[pe.id]?.weight ?? ""}
                              onChange={(e) => updateEntry(pe.id, "weight", e.target.value)}
                              style={inputStyle}
                              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => logSession(day)}
                      disabled={logging && loggedDay === day.id}
                      className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
                      style={{
                        background: isSuccess ? "var(--success)" : logging && loggedDay === day.id ? "var(--bg-hover)" : "var(--accent)",
                        color: isSuccess ? "#fff" : logging && loggedDay === day.id ? "var(--text-3)" : "var(--accent-fg)",
                        cursor: logging && loggedDay === day.id ? "default" : "pointer",
                        touchAction: "manipulation",
                      }}
                    >
                      {isSuccess ? (
                        <><CheckCircle className="h-4 w-4" /> ¡Sesión guardada!</>
                      ) : logging && loggedDay === day.id ? (
                        <><Clock className="h-4 w-4" /> Guardando…</>
                      ) : (
                        "✓ Registrar sesión"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
