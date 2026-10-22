"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X, Check, Flame } from "lucide-react";

type ExerciseOption = { id: string; name: string; muscleGroup: string; difficulty?: string | null };
type ExerciseForm = { exerciseId: string; exerciseName: string; section: "warmup" | "main"; sets: number; reps: string; weightKg: string; restSeconds: string; notes: string };
type DayForm = { name: string; dayOfWeek: number | null; warmup: ExerciseForm[]; exercises: ExerciseForm[] };

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

const DIFF_COLORS: Record<string, string> = {
  beginner: "badge-beginner", intermediate: "badge-intermediate", advanced: "badge-advanced",
};

type Category = "calentamiento" | "funcional" | "musculación";
type PlanType = "2" | "3" | "libre";

const PLAN_TYPES: { id: PlanType; label: string; sub: string; days: number }[] = [
  { id: "2",     label: "2 días",     sub: "2 entrenamientos por semana",          days: 2 },
  { id: "3",     label: "3 días",     sub: "3 entrenamientos por semana",          days: 3 },
  { id: "libre", label: "Pase libre", sub: "Lunes a Viernes — 5 días disponibles", days: 5 },
];

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const DOW_LABELS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function buildDays(type: PlanType): DayForm[] {
  if (type === "libre") return WEEK_DAYS.map((name, i) => ({ name, dayOfWeek: i + 1, warmup: [], exercises: [] }));
  return Array.from({ length: Number(type) }, (_, i) => ({ name: `Día ${i + 1}`, dayOfWeek: null, warmup: [], exercises: [] }));
}

const CATEGORIES: { id: Category; label: string; color: string; bg: string }[] = [
  { id: "musculación",   label: "Musculación",   color: "var(--c-lime)",   bg: "var(--c-lime-bg)" },
  { id: "funcional",     label: "Funcional",     color: "var(--c-blue)",   bg: "var(--c-blue-bg)" },
  { id: "calentamiento", label: "Calentamiento", color: "var(--c-orange)", bg: "var(--c-orange-bg)" },
];

const emptyEx = (exerciseId = "", exerciseName = "", section: "warmup" | "main" = "main"): ExerciseForm => ({
  exerciseId, exerciseName, section, sets: section === "warmup" ? 1 : 3, reps: section === "warmup" ? "10" : "10", weightKg: "", restSeconds: section === "warmup" ? "0" : "60", notes: "",
});

const inp: React.CSSProperties = {
  background: "var(--bg-hover)", border: "1px solid var(--border-strong)",
  color: "var(--text)", borderRadius: "10px", padding: "8px 12px",
  fontSize: "14px", outline: "none", width: "100%",
};

function ExercisePanel({
  exercises,
  onAdd,
  onClose,
  section,
}: {
  exercises: ExerciseOption[];
  onAdd: (ex: ExerciseOption) => void;
  onClose: () => void;
  section: "warmup" | "main";
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const groups = [...new Set(exercises.map((e) => e.muscleGroup))];
  const filtered = exercises.filter((e) => {
    const matchGroup = group === "all" || e.muscleGroup === group;
    const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
    return matchGroup && matchQuery;
  });

  const isWarmup = section === "warmup";

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-sm flex flex-col"
        style={{ background: "var(--bg-panel)", borderLeft: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {isWarmup && <Flame className="h-4 w-4" style={{ color: "var(--c-orange)" }} />}
            <p className="font-extrabold text-sm uppercase tracking-wider" style={{ color: isWarmup ? "var(--c-orange)" : "var(--accent)" }}>
              {isWarmup ? "Entrada en calor" : "Ejercicio principal"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
            <input
              ref={inputRef}
              placeholder="Buscar ejercicio…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ ...inp, paddingLeft: "36px" }}
            />
          </div>
        </div>

        {/* Group filter */}
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          {["all", ...groups].map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer"
              style={{
                background: group === g ? (isWarmup ? "var(--c-orange)" : "var(--accent)") : "var(--bg-hover)",
                color: group === g ? (isWarmup ? "#fff" : "var(--accent-fg)") : "var(--text-3)",
              }}
            >
              {g === "all" ? "Todos" : MUSCLE_LABELS[g] ?? g}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1.5">
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>Sin resultados</p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onAdd(ex)}
              className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = isWarmup ? "var(--c-orange)" : "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{ex.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                </p>
              </div>
              {ex.difficulty && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${DIFF_COLORS[ex.difficulty] ?? "badge-intermediate"}`}>
                  {ex.difficulty === "beginner" ? "Prin" : ex.difficulty === "intermediate" ? "Int" : "Avz"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseRow({
  ex, onRemove, onChange, isWarmup,
}: {
  ex: ExerciseForm;
  onRemove: () => void;
  onChange: (field: keyof ExerciseForm, val: string | number) => void;
  isWarmup?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{
      border: `1px solid ${isWarmup ? "rgba(251,146,60,0.3)" : "var(--border)"}`,
      background: isWarmup ? "rgba(251,146,60,0.04)" : "var(--bg)",
    }}>
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
          {ex.exerciseName}
        </span>

        {/* Sets stepper */}
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onChange("sets", Math.max(1, ex.sets - 1))}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>−</button>
          <span className="w-6 text-center text-sm font-extrabold tabular-nums"
            style={{ color: isWarmup ? "var(--c-orange)" : "var(--accent)" }}>
            {ex.sets}
          </span>
          <button type="button" onClick={() => onChange("sets", ex.sets + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>+</button>
          <span className="text-xs ml-0.5" style={{ color: "var(--text-3)" }}>series</span>
        </div>

        {/* Reps */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="text"
            value={ex.reps}
            onChange={(e) => onChange("reps", e.target.value)}
            className="text-center text-sm font-bold tabular-nums"
            style={{ ...inp, width: "52px", padding: "4px 6px" }}
            placeholder="10"
          />
          <span className="text-xs" style={{ color: "var(--text-3)" }}>reps</span>
        </div>

        {/* Expand / delete */}
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--destructive)" }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 flex gap-2 flex-wrap" style={{ borderTop: `1px solid ${isWarmup ? "rgba(251,146,60,0.2)" : "var(--border)"}` }}>
          {!isWarmup && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>Peso (kg)</label>
              <input
                type="number" step="0.5" placeholder="—"
                value={ex.weightKg}
                onChange={(e) => onChange("weightKg", e.target.value)}
                style={{ ...inp, width: "80px", padding: "5px 8px", fontSize: "13px" }}
              />
            </div>
          )}
          {!isWarmup && (
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>Descanso (seg)</label>
              <input
                type="number" step="15" placeholder="60"
                value={ex.restSeconds}
                onChange={(e) => onChange("restSeconds", e.target.value)}
                style={{ ...inp, width: "80px", padding: "5px 8px", fontSize: "13px" }}
              />
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 w-full">
            <label className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>Notas</label>
            <input
              placeholder="instrucción, variante…"
              value={ex.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              style={{ ...inp, padding: "5px 8px", fontSize: "13px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewPlanPage() {
  const router = useRouter();
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  useEffect(() => {
    fetch("/api/trainer/exercises").then((r) => r.json()).then(setExerciseOptions).catch(() => {});
  }, []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("musculación");
  const [planType, setPlanType] = useState<PlanType>("3");
  const [days, setDays] = useState<DayForm[]>(() => buildDays("3"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickerCtx, setPickerCtx] = useState<{ dayIdx: number; section: "warmup" | "main" } | null>(null);

  function handlePlanTypeChange(type: PlanType) {
    setPlanType(type);
    setDays(buildDays(type));
  }
  function updateDayName(i: number, val: string) {
    setDays((d) => d.map((day, idx) => idx === i ? { ...day, name: val } : day));
  }
  function updateDayOfWeek(i: number, dow: number | null) {
    setDays((d) => d.map((day, idx) => idx === i ? { ...day, dayOfWeek: day.dayOfWeek === dow ? null : dow } : day));
  }
  function addExercise(dayIdx: number, ex: ExerciseOption, section: "warmup" | "main") {
    const newEx = emptyEx(ex.id, ex.name, section);
    setDays((d) => d.map((day, i) => {
      if (i !== dayIdx) return day;
      return section === "warmup"
        ? { ...day, warmup: [...day.warmup, newEx] }
        : { ...day, exercises: [...day.exercises, newEx] };
    }));
  }
  function removeExercise(dayIdx: number, exIdx: number, section: "warmup" | "main") {
    setDays((d) => d.map((day, i) => {
      if (i !== dayIdx) return day;
      return section === "warmup"
        ? { ...day, warmup: day.warmup.filter((_, j) => j !== exIdx) }
        : { ...day, exercises: day.exercises.filter((_, j) => j !== exIdx) };
    }));
  }
  function updateExercise(dayIdx: number, exIdx: number, section: "warmup" | "main", field: keyof ExerciseForm, value: string | number) {
    setDays((d) => d.map((day, i) => {
      if (i !== dayIdx) return day;
      return section === "warmup"
        ? { ...day, warmup: day.warmup.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex) }
        : { ...day, exercises: day.exercises.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex) };
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const allHaveExercises = days.every((d) => d.exercises.length > 0);
    if (!allHaveExercises) { setError("Cada día debe tener al menos un ejercicio principal."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/trainer/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          daysPerWeek: planType === "libre" ? 5 : Number(planType),
          durationWeeks: 4,
          days: days.map((d) => ({
            name: d.name,
            dayOfWeek: d.dayOfWeek ?? null,
            exercises: [
              ...d.warmup.map((ex, i) => ({
                exerciseName: ex.exerciseName,
                section: "warmup" as const,
                sets: ex.sets,
                reps: ex.reps,
                weightKg: null,
                restSeconds: null,
                notes: ex.notes || null,
                orderIndex: i,
              })),
              ...d.exercises.map((ex, i) => ({
                exerciseName: ex.exerciseName,
                section: "main" as const,
                sets: ex.sets,
                reps: ex.reps,
                weightKg: ex.weightKg || null,
                restSeconds: ex.restSeconds ? Number(ex.restSeconds) : null,
                notes: ex.notes || null,
                orderIndex: i,
              })),
            ],
          })),
        }),
      });
      if (!res.ok) { setError("Error al guardar el plan"); return; }
      const data = await res.json() as { id: string };
      router.push(`/trainer/plans/${data.id}`);
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {pickerCtx !== null && (
        <ExercisePanel
          exercises={exerciseOptions}
          section={pickerCtx.section}
          onAdd={(ex) => { addExercise(pickerCtx.dayIdx, ex, pickerCtx.section); }}
          onClose={() => setPickerCtx(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Nuevo plan</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Nombrá los días y agregá ejercicios</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nombre del plan */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <input
            required
            placeholder="Nombre del plan (ej: Fuerza 3 días) *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inp}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          />
          <input
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inp}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          />

          {/* Plan type */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
              Tipo de plan
            </p>
            <div className="flex gap-2">
              {PLAN_TYPES.map((pt) => {
                const active = planType === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => handlePlanTypeChange(pt.id)}
                    className="flex-1 py-2.5 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-all flex flex-col items-center gap-0.5"
                    style={{
                      background: active ? "var(--accent-soft)" : "var(--bg-hover)",
                      border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      color: active ? "var(--accent)" : "var(--text-3)",
                      touchAction: "manipulation",
                    }}
                  >
                    <span>{pt.label}</span>
                    <span className="text-[10px] font-normal normal-case opacity-70">{pt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
              Categoría
            </p>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-all"
                    style={{
                      background: active ? cat.bg : "var(--bg-hover)",
                      border: `2px solid ${active ? cat.color : "var(--border)"}`,
                      color: active ? cat.color : "var(--text-3)",
                      touchAction: "manipulation",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Días */}
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            {/* Day header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                  style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                  {dayIdx + 1}
                </span>
                {planType === "libre" ? (
                  <span className="flex-1 text-sm font-semibold px-1" style={{ color: "var(--text)" }}>{day.name}</span>
                ) : (
                  <input
                    placeholder={`Día ${dayIdx + 1} (ej: Pecho + Tríceps)`}
                    value={day.name}
                    onChange={(e) => updateDayName(dayIdx, e.target.value)}
                    style={{ ...inp, flex: 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                  />
                )}
              </div>
              {planType !== "libre" && (
                <div className="flex items-center gap-1.5 flex-wrap pl-9">
                  <span className="text-xs mr-1" style={{ color: "var(--text-3)" }}>Día:</span>
                  {[1, 2, 3, 4, 5, 6].map((dow) => (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => updateDayOfWeek(dayIdx, dow)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                      style={{
                        background: day.dayOfWeek === dow ? "var(--accent)" : "var(--bg-hover)",
                        color: day.dayOfWeek === dow ? "var(--accent-fg)" : "var(--text-3)",
                        border: `1px solid ${day.dayOfWeek === dow ? "var(--accent)" : "var(--border)"}`,
                        touchAction: "manipulation",
                      }}
                    >
                      {DOW_LABELS[dow]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Entrada en calor section ───────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5" style={{ color: "var(--c-orange)" }} />
                <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--c-orange)" }}>
                  Entrada en calor
                </p>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>— opcional</span>
              </div>

              {day.warmup.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {day.warmup.map((ex, exIdx) => (
                    <ExerciseRow
                      key={exIdx}
                      ex={ex}
                      isWarmup
                      onRemove={() => removeExercise(dayIdx, exIdx, "warmup")}
                      onChange={(field, val) => updateExercise(dayIdx, exIdx, "warmup", field, val)}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPickerCtx({ dayIdx, section: "warmup" })}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold cursor-pointer w-full"
                style={{
                  border: "1px dashed rgba(251,146,60,0.4)",
                  color: "rgba(251,146,60,0.7)",
                  touchAction: "manipulation",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--c-orange)"; e.currentTarget.style.color = "var(--c-orange)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(251,146,60,0.4)"; e.currentTarget.style.color = "rgba(251,146,60,0.7)"; }}
              >
                <Plus className="h-3.5 w-3.5" />
                {day.warmup.length === 0 ? "Agregar entrada en calor" : "Agregar otro"}
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border)" }} />

            {/* ── Ejercicios principales ─────────────────────────── */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Ejercicios
              </p>

              {day.exercises.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {day.exercises.map((ex, exIdx) => (
                    <ExerciseRow
                      key={exIdx}
                      ex={ex}
                      onRemove={() => removeExercise(dayIdx, exIdx, "main")}
                      onChange={(field, val) => updateExercise(dayIdx, exIdx, "main", field, val)}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPickerCtx({ dayIdx, section: "main" })}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer w-full"
                style={{
                  border: "1px dashed var(--border-strong)",
                  color: "var(--text-3)",
                  touchAction: "manipulation",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-3)"; }}
              >
                <Plus className="h-4 w-4" />
                {day.exercises.length === 0 ? "Agregar ejercicio" : "Agregar otro ejercicio"}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "#2a0a0a", color: "var(--destructive)" }}>{error}</p>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <a href="/trainer/plans" className="px-5 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
            style={{
              background: loading || !name.trim() ? "var(--bg-hover)" : "var(--accent)",
              color: loading || !name.trim() ? "var(--text-3)" : "var(--accent-fg)",
              cursor: loading || !name.trim() ? "default" : "pointer",
              touchAction: "manipulation",
            }}
          >
            <Check className="h-4 w-4" />
            {loading ? "Guardando…" : "Guardar plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
