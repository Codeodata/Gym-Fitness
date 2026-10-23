"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X, Check, Flame, ArrowLeft } from "lucide-react";
import Link from "next/link";

type ExerciseOption = { id: string; name: string; muscleGroup: string; difficulty?: string | null };
type ExerciseForm  = { exerciseId: string; exerciseName: string; section: "warmup" | "main"; sets: number; reps: string; restSeconds: string; notes: string };

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

type Category = "musculación" | "funcional" | "calentamiento";

const CATEGORIES: { id: Category; label: string; color: string; bg: string; border: string }[] = [
  { id: "musculación",   label: "Musculación",   color: "#84cc16", bg: "rgba(132,204,22,0.10)", border: "rgba(132,204,22,0.35)" },
  { id: "funcional",     label: "Funcional",     color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.35)" },
  { id: "calentamiento", label: "Calentamiento", color: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.35)" },
];

const inp: React.CSSProperties = {
  background: "var(--bg-hover)", border: "1px solid var(--border)",
  color: "var(--text)", borderRadius: "10px", padding: "10px 14px",
  fontSize: "14px", outline: "none", width: "100%",
};

const emptyEx = (section: "warmup" | "main" = "main"): ExerciseForm => ({
  exerciseId: "", exerciseName: "", section,
  sets: section === "warmup" ? 1 : 3,
  reps: "10", restSeconds: section === "warmup" ? "0" : "60", notes: "",
});

function ExercisePicker({
  exercises, section, onAdd, onClose,
}: {
  exercises: ExerciseOption[]; section: "warmup" | "main";
  onAdd: (ex: ExerciseOption) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const groups = [...new Set(exercises.map(e => e.muscleGroup))];
  const filtered = exercises.filter(e =>
    (group === "all" || e.muscleGroup === group) &&
    e.name.toLowerCase().includes(query.toLowerCase())
  );
  const isWarmup = section === "warmup";

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="ml-auto h-full w-full max-w-sm flex flex-col"
        style={{ background: "var(--bg-panel)", borderLeft: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {isWarmup && <Flame className="h-4 w-4" style={{ color: "#fb923c" }} />}
            <p className="font-extrabold text-sm uppercase tracking-wider"
              style={{ color: isWarmup ? "#fb923c" : "var(--accent)" }}>
              {isWarmup ? "Entrada en calor" : "Agregar ejercicio"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
            <input ref={ref} placeholder="Buscar ejercicio…" value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ ...inp, paddingLeft: "36px" }} />
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          {["all", ...groups].map(g => (
            <button key={g} onClick={() => setGroup(g)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer"
              style={{
                background: group === g ? (isWarmup ? "#fb923c" : "var(--accent)") : "var(--bg-hover)",
                color: group === g ? "#000" : "var(--text-3)",
              }}>
              {g === "all" ? "Todos" : MUSCLE_LABELS[g] ?? g}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5">
          {filtered.length === 0 && <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>Sin resultados</p>}
          {filtered.map(ex => (
            <button key={ex.id} onClick={() => onAdd(ex)}
              className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = isWarmup ? "#fb923c" : "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{ex.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseRow({ ex, onRemove, onChange, isWarmup }: {
  ex: ExerciseForm; onRemove: () => void;
  onChange: (f: keyof ExerciseForm, v: string | number) => void;
  isWarmup?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const accent = isWarmup ? "#fb923c" : "var(--accent)";

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${isWarmup ? "rgba(251,146,60,0.25)" : "var(--border)"}`, background: "var(--bg)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{ex.exerciseName}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onChange("sets", Math.max(1, ex.sets - 1))}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>−</button>
          <span className="w-6 text-center text-sm font-extrabold tabular-nums" style={{ color: accent }}>{ex.sets}</span>
          <button type="button" onClick={() => onChange("sets", ex.sets + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>+</button>
          <span className="text-xs ml-0.5" style={{ color: "var(--text-3)" }}>series</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input type="text" value={ex.reps} onChange={e => onChange("reps", e.target.value)}
            className="text-center text-sm font-bold tabular-nums"
            style={{ ...inp, width: "52px", padding: "4px 6px" }} placeholder="10" />
          <span className="text-xs" style={{ color: "var(--text-3)" }}>reps</span>
        </div>
        <button type="button" onClick={() => setExpanded(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "#ef4444" }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 flex gap-3 flex-wrap"
          style={{ borderTop: `1px solid ${isWarmup ? "rgba(251,146,60,0.2)" : "var(--border)"}` }}>
          {!isWarmup && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>Descanso (seg)</label>
              <input type="number" step="15" placeholder="60" value={ex.restSeconds}
                onChange={e => onChange("restSeconds", e.target.value)}
                style={{ ...inp, width: "80px", padding: "5px 8px", fontSize: "13px" }} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 w-full">
            <label className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>Nota</label>
            <input placeholder="instrucción, variante…" value={ex.notes}
              onChange={e => onChange("notes", e.target.value)}
              style={{ ...inp, padding: "5px 8px", fontSize: "13px" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewRoutinePage() {
  const router = useRouter();
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  useEffect(() => {
    fetch("/api/trainer/exercises").then(r => r.json()).then(setExerciseOptions).catch(() => {});
  }, []);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("musculación");
  const [warmup, setWarmup] = useState<ExerciseForm[]>([]);
  const [exercises, setExercises] = useState<ExerciseForm[]>([]);
  const [pickerSection, setPickerSection] = useState<"warmup" | "main" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addExercise(ex: ExerciseOption, section: "warmup" | "main") {
    const entry = { ...emptyEx(section), exerciseId: ex.id, exerciseName: ex.name };
    if (section === "warmup") setWarmup(p => [...p, entry]);
    else setExercises(p => [...p, entry]);
    setPickerSection(null);
  }

  function removeExercise(section: "warmup" | "main", idx: number) {
    if (section === "warmup") setWarmup(p => p.filter((_, i) => i !== idx));
    else setExercises(p => p.filter((_, i) => i !== idx));
  }

  function updateExercise(section: "warmup" | "main", idx: number, field: keyof ExerciseForm, val: string | number) {
    const update = (arr: ExerciseForm[]) => arr.map((ex, i) => i === idx ? { ...ex, [field]: val } : ex);
    if (section === "warmup") setWarmup(update);
    else setExercises(update);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!exercises.length) { setError("Agregá al menos un ejercicio."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/trainer/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          daysPerWeek: 1,
          days: [{
            name,
            dayOfWeek: null,
            exercises: [
              ...warmup.map((ex, i) => ({ exerciseName: ex.exerciseName, section: "warmup", sets: ex.sets, reps: ex.reps, weightKg: null, restSeconds: null, notes: ex.notes || null, orderIndex: i })),
              ...exercises.map((ex, i) => ({ exerciseName: ex.exerciseName, section: "main", sets: ex.sets, reps: ex.reps, weightKg: null, restSeconds: ex.restSeconds ? Number(ex.restSeconds) : null, notes: ex.notes || null, orderIndex: i })),
            ],
          }],
        }),
      });
      if (!res.ok) { setError("Error al guardar"); return; }
      const data = await res.json() as { id: string };
      router.push("/trainer/routines");
    } catch { setError("Error inesperado"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl">
      {pickerSection && (
        <ExercisePicker exercises={exerciseOptions} section={pickerSection}
          onAdd={ex => addExercise(ex, pickerSection)} onClose={() => setPickerSection(null)} />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/trainer/routines"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <ArrowLeft className="h-4 w-4" style={{ color: "var(--text-2)" }} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Nueva rutina</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            Ponele nombre, elegí categoría y agregá ejercicios
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name + category */}
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <input required placeholder="Nombre de la rutina (ej: Piernas, Pecho, Calentamiento…) *"
            value={name} onChange={e => setName(e.target.value)}
            style={inp}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
              Categoría
            </p>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => {
                const active = category === cat.id;
                return (
                  <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all"
                    style={{
                      background: active ? cat.bg : "var(--bg-hover)",
                      border: `2px solid ${active ? cat.color : "var(--border)"}`,
                      color: active ? cat.color : "var(--text-3)",
                    }}>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Warmup */}
        <div className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4" style={{ color: "#fb923c" }} />
            <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "#fb923c" }}>
              Entrada en calor
            </p>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>— opcional</span>
          </div>
          {warmup.map((ex, i) => (
            <ExerciseRow key={i} ex={ex} isWarmup
              onRemove={() => removeExercise("warmup", i)}
              onChange={(f, v) => updateExercise("warmup", i, f, v)} />
          ))}
          <button type="button" onClick={() => setPickerSection("warmup")}
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer w-full"
            style={{ border: "1px dashed rgba(251,146,60,0.4)", color: "rgba(251,146,60,0.7)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fb923c"; e.currentTarget.style.color = "#fb923c"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(251,146,60,0.4)"; e.currentTarget.style.color = "rgba(251,146,60,0.7)"; }}>
            <Plus className="h-3.5 w-3.5" />
            {warmup.length === 0 ? "Agregar entrada en calor" : "Agregar otro"}
          </button>
        </div>

        {/* Exercises */}
        <div className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Ejercicios
          </p>
          {exercises.map((ex, i) => (
            <ExerciseRow key={i} ex={ex}
              onRemove={() => removeExercise("main", i)}
              onChange={(f, v) => updateExercise("main", i, f, v)} />
          ))}
          <button type="button" onClick={() => setPickerSection("main")}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer w-full"
            style={{ border: "1px dashed var(--border)", color: "var(--text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}>
            <Plus className="h-4 w-4" />
            {exercises.length === 0 ? "Agregar ejercicio" : "Agregar otro"}
          </button>
        </div>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <Link href="/trainer/routines"
            className="px-5 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
            Cancelar
          </Link>
          <button type="submit" disabled={loading || !name.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            <Check className="h-4 w-4" />
            {loading ? "Guardando…" : "Guardar rutina"}
          </button>
        </div>
      </form>
    </div>
  );
}
