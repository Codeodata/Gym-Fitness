"use client";

import { useState, useMemo } from "react";
import { Dumbbell, CheckCircle, Clock, PlayCircle, Moon } from "lucide-react";
import type { Plan, PlanDay, PlanExercise, Exercise, PlanAssignment } from "@/lib/db/schema";
import { VideoModal } from "./video-modal";

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

const WEEK_DAYS = [1, 2, 3, 4, 5, 6]; // Mon–Sat

type FullExercise = PlanExercise & { exercise: Exercise };
type FullDay = PlanDay & { planExercises: FullExercise[] };
type FullPlan = Plan & { planDays: FullDay[] };

type Props = { plan: FullPlan; assignment: PlanAssignment; clientId: string };
type LogEntry = { sets: string; reps: string; weight: string; notes: string };

type DayPanelProps = {
  day: FullDay;
  dow: number;
  isToday: boolean;
  isSuccess: boolean;
  logging: boolean;
  logEntries: Record<string, LogEntry>;
  updateEntry: (id: string, field: keyof LogEntry, val: string) => void;
  logSession: (day: FullDay) => void;
  setActiveVideo: (v: { url: string; title: string; poster?: string } | null) => void;
};

function DayPanel({ day, dow, isToday, isSuccess, logging, logEntries, updateEntry, logSession, setActiveVideo }: DayPanelProps) {
  const muscleGroups = [...new Set(day.planExercises.map((pe) => pe.exercise.muscleGroup))];
  const dayLabel = day.name || `Día ${day.dayNumber}`;

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
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-panel)" }}>

      {/* Day header */}
      <div className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--border)", background: isToday ? "var(--accent-soft)" : "transparent" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isToday ? "var(--accent)" : "var(--bg-hover)" }}>
          <Dumbbell className="h-5 w-5" style={{ color: isToday ? "var(--accent-fg)" : "var(--text-3)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold text-base leading-none"
              style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {DOW_FULL[dow]} — {dayLabel}
            </p>
            {isToday && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                HOY
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            {day.planExercises.length} ejercicios
          </p>
        </div>
      </div>

      {/* Muscle group chips */}
      {muscleGroups.length > 0 && (
        <div className="px-5 py-2.5 flex gap-1.5 flex-wrap"
          style={{ borderBottom: "1px solid var(--border)" }}>
          {muscleGroups.map((mg) => {
            const col = MG_COLOR[mg] ?? "var(--accent)";
            return (
              <span key={mg} className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: `${col}20`, color: col }}>
                {MG_LABEL[mg] ?? mg}
              </span>
            );
          })}
        </div>
      )}

      {/* Exercise list */}
      <div className="px-5 pb-5 flex flex-col gap-5 pt-4">
        {day.planExercises.map((pe) => {
          const mgColor = MG_COLOR[pe.exercise.muscleGroup] ?? "var(--accent)";
          return (
            <div key={pe.id}>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${mgColor}1f` }}>
                  <Dumbbell className="h-4 w-4" style={{ color: mgColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                      {pe.exercise.name}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: `${mgColor}1f`, color: mgColor }}>
                      {MG_LABEL[pe.exercise.muscleGroup] ?? pe.exercise.muscleGroup}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm font-extrabold tabular-nums"
                      style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {pe.sets} × {pe.reps}
                    </span>
                    {pe.weightKg && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        {pe.weightKg} kg
                      </span>
                    )}
                  </div>
                  {pe.notes && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{pe.notes}</p>
                  )}
                  {pe.exercise.videoUrl && (
                    <button
                      onClick={() => setActiveVideo({
                        url: pe.exercise.videoUrl!,
                        title: pe.exercise.name,
                        poster: pe.exercise.imageUrl ?? undefined,
                      })}
                      className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)", cursor: "pointer", touchAction: "manipulation" }}
                    >
                      <PlayCircle className="h-3.5 w-3.5" /> Ver video
                    </button>
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
          );
        })}

        <button
          onClick={() => logSession(day)}
          disabled={logging}
          className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-1"
          style={{
            background: isSuccess ? "var(--success)" : logging ? "var(--bg-hover)" : "var(--accent)",
            color: isSuccess ? "#fff" : logging ? "var(--text-3)" : "var(--accent-fg)",
            cursor: logging ? "default" : "pointer",
            touchAction: "manipulation",
          }}
        >
          {isSuccess ? (
            <><CheckCircle className="h-4 w-4" /> ¡Sesión guardada!</>
          ) : logging ? (
            <><Clock className="h-4 w-4" /> Guardando…</>
          ) : (
            "✓ Registrar sesión"
          )}
        </button>
      </div>
    </div>
  );
}

export function PlanView({ plan, assignment }: Props) {
  const scheduleMap = useMemo<Record<string, number>>(() => {
    if (!assignment.daySchedule) return {};
    try {
      const arr = JSON.parse(assignment.daySchedule) as { planDayId: string; dayOfWeek: number }[];
      return Object.fromEntries(arr.map((e) => [e.planDayId, e.dayOfWeek]));
    } catch {
      return {};
    }
  }, [assignment.daySchedule]);

  // Build: dayOfWeek -> planDay
  const dowToDay = useMemo<Record<number, FullDay>>(() => {
    const map: Record<number, FullDay> = {};
    for (const day of plan.planDays) {
      const dow = scheduleMap[day.id] ?? day.dayOfWeek ?? null;
      if (dow !== null) map[dow] = day;
    }
    return map;
  }, [plan.planDays, scheduleMap]);

  const todayDow = new Date().getDay(); // 0=Sun, 1=Mon…6=Sat

  // Initial selection: today if has training, else first training day
  const firstTrainingDow = WEEK_DAYS.find((d) => dowToDay[d]) ?? null;
  const initialDow = dowToDay[todayDow] ? todayDow : firstTrainingDow;

  const [selectedDow, setSelectedDow] = useState<number | null>(initialDow ?? null);
  const [logEntries, setLogEntries] = useState<Record<string, LogEntry>>({});
  const [logging, setLogging] = useState(false);
  const [loggedDay, setLoggedDay] = useState<string | null>(null);
  const [successDay, setSuccessDay] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string; poster?: string } | null>(null);

  // Days with no DOW mapping (shown as a fallback list)
  const unscheduledDays = plan.planDays.filter((d) => {
    const dow = scheduleMap[d.id] ?? d.dayOfWeek ?? null;
    return dow === null;
  });

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

  const selectedDay = selectedDow !== null ? (dowToDay[selectedDow] ?? null) : null;
  const isRestDay = selectedDow !== null && !dowToDay[selectedDow];

  return (
    <div className="max-w-2xl mx-auto">

      {/* Plan header */}
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
              style={{ background: "var(--bg-panel)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
              {plan.durationWeeks} semanas
            </span>
          )}
        </div>
        {assignment.trainerNotes && (
          <div className="mt-4 p-4 rounded-xl text-sm"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
            <strong>Nota del entrenador:</strong> {assignment.trainerNotes}
          </div>
        )}
      </div>

      {/* ── Week strip ──────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden mb-5"
        style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
        <div className="grid grid-cols-6">
          {WEEK_DAYS.map((dow, i) => {
            const day = dowToDay[dow];
            const isToday = dow === todayDow;
            const isSel = selectedDow === dow;
            const hasTraining = !!day;
            return (
              <button
                key={dow}
                onClick={() => setSelectedDow(isSel ? null : dow)}
                className="flex flex-col items-center gap-1.5 py-3.5 px-1 transition-all"
                style={{
                  borderRight: i < 5 ? "1px solid var(--border)" : "none",
                  borderTop: `3px solid ${isSel || (isToday && hasTraining) ? "var(--accent)" : "transparent"}`,
                  background: isSel ? "var(--accent-soft)" : "transparent",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: isSel ? "var(--accent)" : isToday ? "var(--accent)" : "var(--text-3)" }}>
                  {DOW_LETTER[dow]}
                </span>

                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{
                    background: hasTraining
                      ? isSel
                        ? "var(--accent)"
                        : isToday
                          ? "var(--accent-soft)"
                          : "var(--bg-hover)"
                      : "transparent",
                  }}>
                  {hasTraining
                    ? <Dumbbell className="h-3.5 w-3.5"
                        style={{ color: isSel ? "var(--accent-fg)" : isToday ? "var(--accent)" : "var(--text-3)" }} />
                    : <Moon className="h-3 w-3" style={{ color: "var(--text-3)", opacity: 0.25 }} />
                  }
                </div>

                <span className="text-[9px] font-extrabold"
                  style={{ color: isToday ? "var(--accent)" : "transparent", lineHeight: 1 }}>
                  HOY
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected day content ─────────────────────────────── */}
      {selectedDow === null && (
        <div className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ border: "2px dashed var(--border)", background: "var(--bg-panel)" }}>
          <Dumbbell className="h-8 w-8" style={{ color: "var(--text-3)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-3)" }}>
            Tocá un día para ver tu rutina
          </p>
        </div>
      )}

      {isRestDay && selectedDow !== null && (
        <div className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
          <Moon className="h-8 w-8" style={{ color: "var(--text-3)" }} />
          <p className="font-extrabold text-base" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {DOW_FULL[selectedDow]} — Descanso
          </p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Sin entrenamiento programado. Aprovechá a recuperarte.
          </p>
        </div>
      )}

      {selectedDay && selectedDow !== null && (
        <DayPanel
          day={selectedDay}
          dow={selectedDow}
          isToday={selectedDow === todayDow}
          isSuccess={successDay === selectedDay.id}
          logging={logging && loggedDay === selectedDay.id}
          logEntries={logEntries}
          updateEntry={updateEntry}
          logSession={logSession}
          setActiveVideo={setActiveVideo}
        />
      )}

      {/* Fallback: unscheduled days (no DOW) */}
      {unscheduledDays.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-xs font-extrabold uppercase tracking-wider"
            style={{ color: "var(--text-3)" }}>
            Días sin día específico asignado
          </p>
          {unscheduledDays.map((day) => (
            <div key={day.id} className="rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                {day.dayNumber}
              </span>
              <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                {day.name || `Día ${day.dayNumber}`}
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>
                {day.planExercises.length} ej.
              </span>
            </div>
          ))}
        </div>
      )}

      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}
