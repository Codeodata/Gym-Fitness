"use client";

import { useMemo, useState } from "react";
import { Play, Search, Video } from "lucide-react";
import { VideoModal } from "./video-modal";

// Biblioteca de solo lectura para el alumno (ejercicios o estiramientos).
// Misma vista compacta que la del profe: una fila por movimiento, buscador,
// chips de músculo en una fila deslizable.

export type Movement = {
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

const DIFF: Record<string, { label: string; cls: string }> = {
  beginner: { label: "Principiante", cls: "badge-beginner" },
  intermediate: { label: "Intermedio", cls: "badge-intermediate" },
  advanced: { label: "Avanzado", cls: "badge-advanced" },
};

const COPY = {
  ejercicios: { title: "Ejercicios", singular: "ejercicio", plural: "ejercicios" },
  estiramientos: { title: "Estiramientos", singular: "estiramiento", plural: "estiramientos" },
} as const;

type Kind = keyof typeof COPY;

export function MovementLibrary({ exercises, stretches, initialKind = "ejercicios" }: {
  exercises: Movement[];
  stretches: Movement[];
  initialKind?: Kind;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const copy = COPY[kind];
  const items = kind === "estiramientos" ? stretches : exercises;
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string; poster?: string } | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(
      (e) => (group === "all" || e.muscleGroup === group) && (!term || e.name.toLowerCase().includes(term)),
    );
  }, [items, q, group]);

  const open = (ex: Movement) =>
    ex.videoUrl && setActiveVideo({ url: ex.videoUrl, title: ex.name, poster: ex.imageUrl ?? undefined });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-extrabold" style={{ color: "var(--text)" }}>Ejercicios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Tocá un {copy.singular} para ver el video explicativo.
          </p>
        </div>
        <div className="inline-flex p-1 rounded-xl" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          {([
            { id: "ejercicios", label: "Ejercicios", n: exercises.length },
            { id: "estiramientos", label: "Estiramientos", n: stretches.length },
          ] as const).map((t) => {
            const active = kind === t.id;
            return (
              <button key={t.id} type="button" onClick={() => { setKind(t.id); setGroup("all"); }}
                className="px-3.5 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-colors"
                style={{ background: active ? "var(--bg-hover)" : "transparent", color: active ? "var(--text)" : "var(--text-3)", touchAction: "manipulation" }}>
                {t.label} <span className="tabular-nums font-semibold" style={{ color: "var(--text-3)" }}>{t.n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${copy.singular}…`}
          className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
      </div>

      <div className="flex gap-1 overflow-x-auto mb-4 pb-0.5"
        style={{ scrollbarWidth: "none", maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)", WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)" }}>
        {[{ value: "all", label: "Todos" }, ...MUSCLE_GROUPS].map((g) => {
          const count = g.value === "all" ? items.length : items.filter((e) => e.muscleGroup === g.value).length;
          if (count === 0) return null;
          const sel = group === g.value;
          return (
            <button key={g.value} type="button" onClick={() => setGroup(g.value)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
              style={{
                background: sel ? "var(--accent)" : "var(--bg-panel)",
                color: sel ? "var(--accent-fg)" : "var(--text-3)",
                border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                touchAction: "manipulation",
              }}>
              {g.label} <span className="tabular-nums font-semibold" style={{ opacity: 0.75 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          {filtered.map((ex, idx) => {
            const diff = ex.difficulty ? DIFF[ex.difficulty] : null;
            return (
              <button key={ex.id} type="button" onClick={() => open(ex)} disabled={!ex.videoUrl}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left cursor-pointer disabled:cursor-default transition-colors enabled:hover:bg-[var(--bg-hover)]"
                style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none", touchAction: "manipulation" }}>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold truncate" style={{ color: "var(--text)" }}>{ex.name}</span>
                  <span className="block text-xs truncate" style={{ color: "var(--text-3)" }}>
                    {MG_LABEL[ex.muscleGroup] ?? ex.muscleGroup}
                    {ex.description ? ` · ${ex.description}` : ""}
                  </span>
                </span>
                {diff && (
                  <span className={`hidden sm:inline shrink-0 text-2xs font-bold px-1.5 py-0.5 rounded-md ${diff.cls}`}>
                    {diff.label}
                  </span>
                )}
                {ex.videoUrl ? (
                  <span aria-hidden className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    <Play className="h-3.5 w-3.5" fill="currentColor" />
                  </span>
                ) : (
                  <span title="Sin video" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg"
                    style={{ border: "1px dashed var(--border-strong)", color: "var(--text-3)" }}>
                    <Video className="h-3.5 w-3.5" style={{ opacity: 0.6 }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-center py-12" style={{ color: "var(--text-3)" }}>
          Ningún {copy.singular} coincide con la búsqueda.
        </p>
      )}

      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}
