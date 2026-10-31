"use client";

import { useState, useMemo } from "react";
import { PlayCircle, Search, Dumbbell } from "lucide-react";
import { VideoModal } from "./video-modal";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  description: string | null;
  difficulty: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
};

const MUSCLE_GROUPS = [
  { value: "chest", label: "Pecho" },
  { value: "back", label: "Espalda" },
  { value: "shoulders", label: "Hombros" },
  { value: "arms", label: "Brazos" },
  { value: "legs", label: "Piernas" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Cuerpo completo" },
] as const;

const MG_LABEL: Record<string, string> = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.value, g.label]));

const MG_COLOR: Record<string, string> = {
  chest: "var(--c-red)", back: "var(--c-blue)", shoulders: "var(--c-purple)",
  arms: "var(--c-orange)", legs: "var(--c-green)", core: "var(--c-yellow)",
  cardio: "var(--c-pink)", full_body: "var(--c-lime)",
};

const DIFF_LABEL: Record<string, string> = {
  beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado",
};

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string; poster?: string } | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (group === "all" || e.muscleGroup === group) &&
        (needle === "" || e.name.toLowerCase().includes(needle)),
    );
  }, [exercises, q, group]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Biblioteca de ejercicios</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          {exercises.length} ejercicios con video explicativo
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicio…"
          className="w-full text-sm"
          style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)",
            borderRadius: "12px", padding: "10px 12px 10px 38px", outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Muscle filter chips */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <Chip active={group === "all"} onClick={() => setGroup("all")} color="var(--accent)">
          Todos ({exercises.length})
        </Chip>
        {MUSCLE_GROUPS.map((g) => {
          const count = exercises.filter((e) => e.muscleGroup === g.value).length;
          if (count === 0) return null;
          return (
            <Chip key={g.value} active={group === g.value} onClick={() => setGroup(g.value)} color={MG_COLOR[g.value]}>
              {g.label} ({count})
            </Chip>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => {
          const color = MG_COLOR[ex.muscleGroup] ?? "var(--accent)";
          return (
            <div key={ex.id} className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
              <div className="h-1" style={{ background: color }} />
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}1f` }}>
                    <Dumbbell className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-snug" style={{ color: "var(--text)" }}>{ex.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[11px] font-bold" style={{ color }}>
                        {MG_LABEL[ex.muscleGroup] ?? ex.muscleGroup}
                      </span>
                      {ex.difficulty && (
                        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          · {DIFF_LABEL[ex.difficulty] ?? ex.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {ex.description && (
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-3)" }}>{ex.description}</p>
                )}

                {ex.videoUrl ? (
                  <button
                    onClick={() => setActiveVideo({ url: ex.videoUrl!, title: ex.name, poster: ex.imageUrl ?? undefined })}
                    className="mt-auto flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)", cursor: "pointer", touchAction: "manipulation" }}
                  >
                    <PlayCircle className="h-4 w-4" /> Ver video
                  </button>
                ) : (
                  <span className="mt-auto text-center py-2 text-xs" style={{ color: "var(--text-3)" }}>Sin video</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-3)" }}>
          <Dumbbell className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No se encontraron ejercicios.</p>
        </div>
      )}

      {/* Video modal */}
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
      style={{
        background: active ? color : "var(--bg-panel)",
        color: active ? "#0a0a0a" : "var(--text-3)",
        border: `1px solid ${active ? color : "var(--border)"}`,
        touchAction: "manipulation",
      }}
    >
      {children}
    </button>
  );
}
