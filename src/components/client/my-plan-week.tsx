"use client";

import { useEffect, useState } from "react";
import { Flame, Dumbbell, PlayCircle, CalendarDays } from "lucide-react";
import { VideoModal, type ActiveVideo } from "./video-modal";

const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const CAT_COLOR: Record<string, string> = {
  musculación: "var(--accent)",
  calentamiento: "var(--c-orange, #fb923c)",
  funcional: "#60a5fa",
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

type Ex = {
  id: string;
  name: string;
  muscleGroup: string;
  section: string;
  sets: number;
  reps: string;
  weightKg: string | null;
  restSeconds: number | null;
  notes: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
};

type Block = {
  id: string;
  planDayName: string | null;
  planName: string;
  planCategory: string;
  exercises: Ex[];
};

type Day = { dow: number; blocks: Block[]; singles: Ex[] };

function ExerciseRow({ ex, onPlay }: { ex: Ex; onPlay: (v: ActiveVideo) => void }) {
  const hasVideo = !!ex.videoUrl;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{ex.name}</p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
        </p>
        {ex.notes && (
          <p className="text-xs italic mt-0.5 leading-tight" style={{ color: "var(--text-3)" }}>{ex.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
          {ex.sets}×{ex.reps}
        </span>
        {ex.restSeconds && ex.restSeconds > 0 ? (
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{ex.restSeconds}s</span>
        ) : null}
        {hasVideo && (
          <button
            onClick={() => onPlay({ url: ex.videoUrl!, title: ex.name, poster: ex.imageUrl ?? undefined })}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", cursor: "pointer" }}
          >
            <PlayCircle className="h-3.5 w-3.5" /> Ver video
          </button>
        )}
      </div>
    </div>
  );
}

function BlockCard({ block, onPlay }: { block: Block; onPlay: (v: ActiveVideo) => void }) {
  const warmup = block.exercises.filter((e) => e.section === "warmup");
  const main = block.exercises.filter((e) => e.section !== "warmup");
  const color = CAT_COLOR[block.planCategory] ?? "var(--accent)";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}30`, background: "var(--bg-panel)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ background: `${color}08`, borderBottom: `1px solid ${color}20` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          {block.planCategory === "calentamiento"
            ? <Flame className="h-4 w-4" style={{ color }} />
            : <Dumbbell className="h-4 w-4" style={{ color }} />}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm truncate" style={{ color: "var(--text)" }}>
            {block.planDayName ?? block.planName}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
            {block.planName} · {block.exercises.length} ejercicio{block.exercises.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="px-5 py-3 flex flex-col gap-3">
        {warmup.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
              style={{ color: "var(--c-orange, #fb923c)" }}>
              <Flame className="h-3 w-3" /> Entrada en calor
            </p>
            <div className="flex flex-col gap-1.5">
              {warmup.map((ex) => <ExerciseRow key={ex.id} ex={ex} onPlay={onPlay} />)}
            </div>
          </div>
        )}
        {main.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
              Ejercicios
            </p>
            <div className="flex flex-col gap-1.5">
              {main.map((ex) => <ExerciseRow key={ex.id} ex={ex} onPlay={onPlay} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MyPlanWeek() {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<ActiveVideo | null>(null);

  const jsDay = new Date().getDay();
  const todayDow = jsDay === 0 || jsDay === 6 ? null : jsDay;

  useEffect(() => {
    fetch("/api/client/week-plan")
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl p-6 flex items-center justify-center"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando tu plan…</p>
    </div>
  );

  if (days.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--bg-panel)" }}>
        <Dumbbell className="h-7 w-7" style={{ color: "var(--text-3)" }} />
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Sin plan asignado</h2>
        <p className="text-sm mt-2" style={{ color: "var(--text-2)" }}>
          Tu entrenadora todavía no te cargó la rutina. Pronto vas a tener tu semana lista.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>Mi Plan</h1>
        <span className="text-xs px-2.5 py-1 rounded-full font-bold"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          {days.length} día{days.length !== 1 ? "s" : ""} de entrenamiento
        </span>
      </div>

      {days.map((day) => {
        const isToday = day.dow === todayDow;
        return (
          <div key={day.dow} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: isToday ? "var(--accent)" : "var(--text-3)" }} />
              <h2 className="text-sm font-extrabold uppercase tracking-widest"
                style={{ color: isToday ? "var(--accent)" : "var(--text-3)" }}>
                {DAY_NAMES[day.dow]}
              </h2>
              {isToday && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                  style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                  HOY
                </span>
              )}
            </div>

            {day.blocks.map((block) => (
              <BlockCard key={block.id} block={block} onPlay={setVideo} />
            ))}

            {day.singles.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
                <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: "var(--text-3)" }}>
                    <Dumbbell className="h-3 w-3" /> Ejercicios sueltos
                  </p>
                </div>
                <div className="px-5 py-3 flex flex-col gap-1.5">
                  {day.singles.map((ex) => <ExerciseRow key={ex.id} ex={ex} onPlay={setVideo} />)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <VideoModal video={video} onClose={() => setVideo(null)} />
    </div>
  );
}
