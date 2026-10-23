"use client";

import { useEffect, useState } from "react";
import { Flame, Dumbbell, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";

type Exercise = {
  id: string;
  section: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  notes: string | null;
  exerciseName: string;
  muscleGroup: string;
};

type Block = {
  id: string;
  planDayName: string | null;
  planName: string;
  planCategory: string;
  exercises: Exercise[];
};

const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const CAT_COLOR: Record<string, string> = {
  musculación:   "var(--accent)",
  calentamiento: "var(--c-orange, #fb923c)",
  funcional:     "#60a5fa",
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

function BlockCard({ block }: { block: Block }) {
  const [open, setOpen] = useState(false);
  const warmup = block.exercises.filter((e) => e.section === "warmup");
  const main = block.exercises.filter((e) => e.section === "main");
  const color = CAT_COLOR[block.planCategory] ?? "var(--accent)";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}30`, background: "var(--bg-panel)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left"
        style={{ background: `${color}08` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}15` }}>
            {block.planCategory === "calentamiento"
              ? <Flame className="h-4 w-4" style={{ color }} />
              : <Dumbbell className="h-4 w-4" style={{ color }} />}
          </div>
          <div>
            <p className="font-extrabold text-sm" style={{ color: "var(--text)" }}>
              {block.planDayName ?? block.planName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {block.planName} · {block.exercises.length} ejercicios
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
          : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />}
      </button>

      {open && (
        <div className="px-5 pb-4 flex flex-col gap-3 pt-3" style={{ borderTop: `1px solid ${color}20` }}>
          {warmup.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: "var(--c-orange, #fb923c)" }}>
                <Flame className="h-3 w-3" />
                Entrada en calor
              </p>
              <div className="flex flex-col gap-1.5">
                {warmup.map((ex) => (
                  <ExerciseRow key={ex.id} ex={ex} />
                ))}
              </div>
            </div>
          )}
          {main.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
                Ejercicios
              </p>
              <div className="flex flex-col gap-1.5">
                {main.map((ex) => (
                  <ExerciseRow key={ex.id} ex={ex} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ ex }: { ex: Exercise }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{ex.exerciseName}</p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>{MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
          {ex.sets}×{ex.reps}
        </span>
        {ex.restSeconds && ex.restSeconds > 0 && (
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{ex.restSeconds}s</span>
        )}
      </div>
    </div>
  );
}

type SingleExercise = {
  id: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  exerciseName: string;
  muscleGroup: string;
};

export function TodayRoutine() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [singles, setSingles] = useState<SingleExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const jsDay = new Date().getDay();
  const isWeekend = jsDay === 0 || jsDay === 6;
  const todayName = DAY_NAMES[jsDay] ?? "";

  useEffect(() => {
    fetch("/api/client/today-routine")
      .then((r) => r.json())
      .then((d) => { setBlocks(d.blocks ?? []); setSingles(d.singleExercises ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando rutina…</p>
    </div>
  );

  if (isWeekend) return (
    <div className="rounded-2xl p-6 flex flex-col items-center gap-2 text-center"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <CalendarDays className="h-8 w-8" style={{ color: "var(--text-3)" }} />
      <p className="font-bold text-sm" style={{ color: "var(--text)" }}>¡Fin de semana!</p>
      <p className="text-xs" style={{ color: "var(--text-3)" }}>Descansá, el lunes arrancamos de nuevo.</p>
    </div>
  );

  const total = blocks.length + singles.length;

  if (total === 0) return (
    <div className="rounded-2xl p-6 flex flex-col items-center gap-2 text-center"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <Dumbbell className="h-8 w-8" style={{ color: "var(--text-3)" }} />
      <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Sin rutina para hoy</p>
      <p className="text-xs" style={{ color: "var(--text-3)" }}>
        Tu entrenadora todavía no cargó la rutina del {todayName}.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Rutina de hoy · {todayName}
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full font-bold"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          {total} elemento{total !== 1 ? "s" : ""}
        </span>
      </div>

      {blocks.map((block) => (
        <BlockCard key={block.id} block={block} />
      ))}

      {singles.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "var(--text-3)" }}>
              <Dumbbell className="h-3 w-3" />
              Ejercicios sueltos
            </p>
          </div>
          <div className="px-5 py-3 flex flex-col gap-1.5">
            {singles.map(ex => (
              <ExerciseRow key={ex.id} ex={{ ...ex, section: "main", notes: null }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
