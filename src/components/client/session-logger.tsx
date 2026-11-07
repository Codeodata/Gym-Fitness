"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, Play, CheckCircle } from "lucide-react";
import type { ActiveVideo } from "./video-modal";

// Registro de sesión pensado para usar en el gimnasio con una mano:
// todo viene precargado (última vez → indicación del profe), botones −/+
// grandes y un solo botón para guardar. El borrador vive en el teléfono
// para no perder nada si se cierra la app a mitad del entrenamiento.

export type LoggableEx = {
  key: string;
  exerciseId: string;
  planExerciseId: string | null;
  name: string;
  sets: number;
  reps: string;
  weightKg: string | null;
  last: { weightKg: string | null; setsDone: number | null; repsDone: string | null; loggedAt: string } | null;
  videoUrl: string | null;
  imageUrl: string | null;
};

type Entry = { done: boolean; weight: string; sets: number; reps: string };
type Draft = Record<string, Entry>;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const savedLogKey = (dow: number) => `cdf-log:${today()}:${dow}`;
const draftKey = (dow: number) => `cdf-draft:${today()}:${dow}`;

function read<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function remove(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

const fmtKg = (n: number) => (Math.round(n * 100) / 100).toString().replace(".", ",");
const parseKg = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

// Reps a anotar = un número (lo que se hizo). Si lo indicado es un rango
// ("8-12") o texto ("AMRAP"), se precarga el primer número que aparezca.
const firstNumber = (s: string | null | undefined) => s?.match(/\d+/)?.[0] ?? null;

function initialEntry(ex: LoggableEx): Entry {
  const w = ex.last?.weightKg ?? ex.weightKg;
  return {
    done: true,
    weight: w ? fmtKg(Number(w)) : "",
    sets: ex.last?.setsDone ?? ex.sets,
    reps: firstNumber(ex.last?.repsDone) ?? firstNumber(ex.reps) ?? ex.reps,
  };
}

export function SessionLogger({ dow, planDayId, exercises, onPlay, onCancel, onSaved }: {
  dow: number;
  planDayId: string | null;
  exercises: LoggableEx[];
  onPlay: (v: ActiveVideo) => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const saved = useMemo(() => read<{ id: string; draft: Draft }>(savedLogKey(dow)), [dow]);
  const [draft, setDraft] = useState<Draft>(() => {
    const base = Object.fromEntries(exercises.map((ex) => [ex.key, initialEntry(ex)]));
    const stored = read<Draft>(draftKey(dow)) ?? saved?.draft ?? {};
    for (const k of Object.keys(base)) if (stored[k]) base[k] = { ...base[k]!, ...stored[k] };
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { write(draftKey(dow), draft); }, [dow, draft]);

  const set = (key: string, patch: Partial<Entry>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key]!, ...patch } }));

  const doneCount = exercises.filter((ex) => draft[ex.key]?.done).length;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/client/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutLogId: saved?.id ?? null,
          planDayId,
          exercises: exercises
            .filter((ex) => draft[ex.key]?.done)
            .map((ex) => {
              const e = draft[ex.key]!;
              return {
                exerciseId: ex.exerciseId,
                planExerciseId: ex.planExerciseId,
                setsDone: e.sets,
                repsDone: e.reps,
                weightKg: e.weight.trim() ? e.weight.replace(",", ".") : null,
              };
            }),
        }),
      });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      write(savedLogKey(dow), { id, draft });
      remove(draftKey(dow));
      onSaved();
    } catch {
      setError("No se pudo guardar. Revisá la conexión y probá de nuevo: lo que cargaste no se pierde.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    remove(draftKey(dow));
    onCancel();
  }

  return (
    <div className="flex flex-col gap-2 pb-24">
      <p className="text-xs px-1" style={{ color: "var(--text-3)" }}>
        Ya está cargado con lo de la última vez (o lo indicado). Ajustá lo que cambió y guardá.
      </p>

      {exercises.map((ex) => {
        const e = draft[ex.key]!;
        const prescribed = `${ex.sets}×${ex.reps}`;
        return (
          <div key={ex.key} className="rounded-2xl p-3 flex flex-col gap-3 transition-opacity"
            style={{
              background: "var(--bg-panel)",
              border: `1px solid ${e.done ? "var(--border-strong)" : "var(--border)"}`,
              opacity: e.done ? 1 : 0.55,
            }}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set(ex.key, { done: !e.done })}
                aria-pressed={e.done} aria-label={e.done ? `Desmarcar ${ex.name}` : `Marcar ${ex.name} como hecho`}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                style={{
                  background: e.done ? "var(--accent)" : "transparent",
                  border: `2px solid ${e.done ? "var(--accent)" : "var(--border-strong)"}`,
                  touchAction: "manipulation",
                }}>
                {e.done && <Check className="h-5 w-5" strokeWidth={3} style={{ color: "var(--accent-fg)" }} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{ex.name}</p>
                <p className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
                  Indicado {prescribed}
                  {ex.last?.weightKg ? ` · última vez ${fmtKg(Number(ex.last.weightKg))} kg` : ""}
                </p>
              </div>
              {ex.videoUrl && (
                <button type="button" aria-label={`Ver video de ${ex.name}`}
                  onClick={() => onPlay({ url: ex.videoUrl!, title: ex.name, poster: ex.imageUrl ?? undefined })}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", touchAction: "manipulation" }}>
                  <Play className="h-4 w-4" fill="currentColor" />
                </button>
              )}
            </div>

            {e.done && (
              <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-2">
                <Stepper label="Peso (kg)" value={e.weight} inputMode="decimal" placeholder="—"
                  onChange={(v) => set(ex.key, { weight: v })}
                  onStep={(dir) => {
                    const n = parseKg(e.weight);
                    const next = Math.max(0, (Number.isNaN(n) ? 0 : n) + dir * 2.5);
                    set(ex.key, { weight: fmtKg(next) });
                  }} />
                <Stepper label="Series" value={String(e.sets)} inputMode="numeric"
                  onChange={(v) => { const n = parseInt(v, 10); set(ex.key, { sets: Number.isNaN(n) ? 0 : Math.min(n, 50) }); }}
                  onStep={(dir) => set(ex.key, { sets: Math.max(1, Math.min(50, e.sets + dir)) })} />
                <Stepper label="Reps" value={e.reps} inputMode="numeric"
                  onChange={(v) => set(ex.key, { reps: v.slice(0, 20) })}
                  onStep={(dir) => {
                    const n = parseInt(e.reps, 10);
                    set(ex.key, { reps: String(Math.max(1, (Number.isNaN(n) ? 10 : n) + dir)) });
                  }} />
              </div>
            )}
          </div>
        );
      })}

      {/* Barra fija para guardar, al alcance del pulgar */}
      <div className="fixed left-0 right-0 bottom-0 z-40 lg:left-64 px-4 pt-3"
        style={{
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(to top, var(--bg) 70%, transparent)",
        }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {error && <p className="text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={cancel} disabled={saving}
              className="h-12 px-4 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: "var(--bg-hover)", color: "var(--text-2)", border: "1px solid var(--border)", touchAction: "manipulation" }}>
              Cancelar
            </button>
            <button type="button" onClick={save} disabled={saving || doneCount === 0}
              className="flex-1 h-12 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--accent-fg)", touchAction: "manipulation" }}>
              {saving ? "Guardando…" : (
                <><CheckCircle className="h-4 w-4" /> {saved ? "Guardar cambios" : "Guardar sesión"} · {doneCount}/{exercises.length}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange, onStep, inputMode, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onStep: (dir: 1 | -1) => void;
  inputMode: "numeric" | "decimal";
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-2xs font-bold uppercase tracking-wider px-0.5" style={{ color: "var(--text-3)" }}>{label}</span>
      <div className="flex items-stretch h-11 rounded-xl overflow-hidden"
        style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
        <button type="button" onClick={() => onStep(-1)} aria-label={`Bajar ${label}`}
          className="w-9 shrink-0 flex items-center justify-center cursor-pointer active:opacity-60"
          style={{ color: "var(--text-2)", touchAction: "manipulation" }}>
          <Minus className="h-4 w-4" />
        </button>
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode}
          placeholder={placeholder} aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 w-full bg-transparent text-center text-base font-extrabold tabular-nums outline-none"
          style={{ color: "var(--text)" }} />
        <button type="button" onClick={() => onStep(1)} aria-label={`Subir ${label}`}
          className="w-9 shrink-0 flex items-center justify-center cursor-pointer active:opacity-60"
          style={{ color: "var(--text-2)", touchAction: "manipulation" }}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
