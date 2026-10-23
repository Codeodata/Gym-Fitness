"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronUp, Dumbbell, Flame, Plus, Trash2, Search, X,
} from "lucide-react";

const CAT: Record<string, { color: string; bg: string; border: string; label: string }> = {
  musculación:   { color: "#84cc16", bg: "rgba(132,204,22,0.10)", border: "rgba(132,204,22,0.25)", label: "Musculación"   },
  funcional:     { color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)", label: "Funcional"     },
  calentamiento: { color: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.25)", label: "Calentamiento" },
};

type ExerciseItem = { id: string; planDayId: string; section: "warmup" | "main"; sets: number; reps: string; weightKg: string | null; notes: string | null; exerciseName: string; muscleGroup: string; orderIndex: number };
type DayItem      = { id: string; dayNumber: number; name: string | null; exercises: ExerciseItem[] };
type PlanDetail   = { days: DayItem[] };
type LibraryPlan  = { id: string; name: string; category: string; days: { id: string; name: string | null; dayNumber: number; exerciseCount: number }[] };
type CatalogItem  = { id: string; name: string; muscleGroup: string };

export function RoutinesLibrary() {
  const [library, setLibrary] = useState<LibraryPlan[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [planData, setPlanData] = useState<Record<string, PlanDetail>>({});
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Add-exercise panel state
  const [addingDayId, setAddingDayId]   = useState<string | null>(null);
  const [addingPlanId, setAddingPlanId] = useState<string | null>(null);
  const [addSection, setAddSection]     = useState<"main" | "warmup">("main");
  const [search, setSearch]             = useState("");
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetch("/api/trainer/plan-library")
      .then(r => r.json())
      .then(d => setLibrary(d.library ?? []));
    fetch("/api/trainer/exercises")
      .then(r => r.json())
      .then((d: CatalogItem[]) => { setCatalog(d); setCatalogLoaded(true); })
      .catch(() => setCatalogLoaded(true));
  }, []);

  async function togglePlan(planId: string) {
    if (expanded.has(planId)) {
      setExpanded(prev => { const n = new Set(prev); n.delete(planId); return n; });
      return;
    }
    setExpanded(prev => new Set([...prev, planId]));
    if (planData[planId]) return;
    setLoadingPlan(planId);
    try {
      const res  = await fetch(`/api/trainer/plans/${planId}`);
      const data = await res.json() as { days: { id: string; dayNumber: number; name: string | null }[]; exercises: (ExerciseItem & { planDayId: string })[] };
      const exByDay = data.exercises.reduce<Record<string, ExerciseItem[]>>((acc, ex) => {
        (acc[ex.planDayId] ??= []).push(ex);
        return acc;
      }, {});
      setPlanData(prev => ({
        ...prev,
        [planId]: {
          days: data.days.map(d => ({ ...d, exercises: (exByDay[d.id] ?? []).sort((a, b) => a.orderIndex - b.orderIndex) })),
        },
      }));
    } finally {
      setLoadingPlan(null);
    }
  }

  async function removeExercise(planId: string, dayId: string, exerciseId: string) {
    setPlanData(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId]!,
        days: prev[planId]!.days.map(d =>
          d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) } : d
        ),
      },
    }));
    await fetch(`/api/trainer/plans/${planId}/exercises`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planExerciseId: exerciseId }),
    });
  }

  async function addExercise(item: CatalogItem) {
    if (!addingDayId || !addingPlanId || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/trainer/plans/${addingPlanId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDayId: addingDayId,
          exerciseName: item.name,
          section: addSection,
          sets: addSection === "main" ? 3 : 1,
          reps: "10",
        }),
      });
      if (res.ok) {
        const data = await res.json() as { exercise: ExerciseItem };
        const pid = addingPlanId;
        const did = addingDayId;
        setPlanData(prev => ({
          ...prev,
          [pid]: {
            ...prev[pid]!,
            days: prev[pid]!.days.map(d =>
              d.id === did ? { ...d, exercises: [...d.exercises, data.exercise] } : d
            ),
          },
        }));
        setAddingDayId(null);
        setAddingPlanId(null);
        setSearch("");
      }
    } finally {
      setSaving(false);
    }
  }

  function openAdd(planId: string, dayId: string) {
    setAddingPlanId(planId);
    setAddingDayId(dayId);
    setAddSection("main");
    setSearch("");
  }

  function closeAdd() {
    setAddingDayId(null);
    setAddingPlanId(null);
    setSearch("");
  }

  const filtered = search.trim()
    ? catalog.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : catalog.slice(0, 20);

  return (
    <div className="flex flex-col gap-4">
      {library.map(plan => {
        const cat      = CAT[plan.category] ?? CAT.musculación!;
        const isOpen   = expanded.has(plan.id);
        const loading  = loadingPlan === plan.id;
        const detail   = planData[plan.id];

        return (
          <div key={plan.id} className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${isOpen ? cat.color : "var(--border)"}`, background: "var(--bg-panel)" }}>

            {/* Plan header */}
            <button
              onClick={() => togglePlan(plan.id)}
              className="w-full flex items-center gap-4 p-5 text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                {plan.category === "calentamiento"
                  ? <Flame className="h-4 w-4" style={{ color: cat.color }} />
                  : <Dumbbell className="h-4 w-4" style={{ color: cat.color }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold" style={{ color: "var(--text)" }}>{plan.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {plan.days.length} día{plan.days.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {loading
                ? <span className="text-xs" style={{ color: "var(--text-3)" }}>Cargando…</span>
                : isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                  : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />}
            </button>

            {/* Expanded detail */}
            {isOpen && detail && (
              <div style={{ borderTop: `1px solid ${cat.border}` }}>
                {detail.days.map((day, dayIdx) => {
                  const warmup = day.exercises.filter(e => e.section === "warmup");
                  const main   = day.exercises.filter(e => e.section === "main");
                  const isAddingHere = addingDayId === day.id && addingPlanId === plan.id;

                  return (
                    <div key={day.id}
                      style={{ borderBottom: dayIdx < detail.days.length - 1 ? "1px solid var(--border)" : "none" }}>

                      {/* Day header */}
                      <div className="flex items-center gap-3 px-5 py-3"
                        style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                          style={{ background: cat.bg, color: cat.color }}>
                          D{day.dayNumber}
                        </span>
                        <span className="font-bold text-sm flex-1" style={{ color: "var(--text)" }}>
                          {day.name ?? `Día ${day.dayNumber}`}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>
                          {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="px-5 py-3 flex flex-col gap-2">
                        {/* Warmup */}
                        {warmup.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Flame className="h-3 w-3" style={{ color: "var(--c-orange)" }} />
                              <span className="text-[10px] font-extrabold uppercase tracking-wider"
                                style={{ color: "var(--c-orange)" }}>Entrada en calor</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {warmup.map(ex => (
                                <ExerciseRow key={ex.id} ex={ex} accent="var(--c-orange)"
                                  onRemove={() => removeExercise(plan.id, day.id, ex.id)} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Main */}
                        {main.length > 0 && (
                          <div>
                            {warmup.length > 0 && (
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Dumbbell className="h-3 w-3" style={{ color: "var(--accent)" }} />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider"
                                  style={{ color: "var(--accent)" }}>Trabajo principal</span>
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                              {main.map(ex => (
                                <ExerciseRow key={ex.id} ex={ex} accent="var(--accent)"
                                  onRemove={() => removeExercise(plan.id, day.id, ex.id)} />
                              ))}
                            </div>
                          </div>
                        )}

                        {day.exercises.length === 0 && (
                          <p className="text-xs py-2 text-center" style={{ color: "var(--text-3)" }}>
                            Sin ejercicios todavía
                          </p>
                        )}

                        {/* Add panel / button */}
                        {isAddingHere ? (
                          <div className="rounded-xl p-3 flex flex-col gap-3 mt-1"
                            style={{ border: `1px solid ${cat.color}`, background: "var(--bg-hover)" }}>
                            {/* Section toggle */}
                            <div className="flex gap-2">
                              {(["main", "warmup"] as const).map(s => (
                                <button key={s} onClick={() => setAddSection(s)}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                  style={{
                                    background: addSection === s ? (s === "main" ? "var(--accent)" : "var(--c-orange)") : "var(--bg-panel)",
                                    color: addSection === s ? (s === "main" ? "var(--accent-fg)" : "#fff") : "var(--text-3)",
                                    border: `1px solid ${addSection === s ? (s === "main" ? "var(--accent)" : "var(--c-orange)") : "var(--border)"}`,
                                  }}>
                                  {s === "main"
                                    ? <><Dumbbell className="h-3 w-3 inline mr-1" />Ejercicio</>
                                    : <><Flame className="h-3 w-3 inline mr-1" />Calentamiento</>}
                                </button>
                              ))}
                            </div>

                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                                style={{ color: "var(--text-3)" }} />
                              <input
                                autoFocus
                                placeholder="Buscar ejercicio…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
                                onFocus={e => (e.currentTarget.style.borderColor = cat.color)}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                              />
                            </div>

                            {/* Results */}
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                              {!catalogLoaded && (
                                <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>Cargando…</p>
                              )}
                              {catalogLoaded && filtered.length === 0 && (
                                <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>Sin resultados</p>
                              )}
                              {filtered.map(item => (
                                <button key={item.id} onClick={() => addExercise(item)} disabled={saving}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-semibold transition-colors"
                                  style={{ background: "var(--bg-panel)", color: "var(--text)", border: "1px solid var(--border)" }}
                                  onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
                                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                                  <span className="flex-1 truncate">{item.name}</span>
                                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>
                                    {item.muscleGroup}
                                  </span>
                                </button>
                              ))}
                            </div>

                            <button onClick={closeAdd} className="text-xs text-center cursor-pointer"
                              style={{ color: "var(--text-3)" }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAdd(plan.id, day.id)}
                            className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold mt-1 cursor-pointer"
                            style={{ border: "1.5px dashed var(--border)", color: "var(--text-3)", background: "transparent" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.color = cat.color; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}>
                            <Plus className="h-3.5 w-3.5" />
                            Agregar ejercicio
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {detail.days.length === 0 && (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm" style={{ color: "var(--text-3)" }}>
                      Esta rutina no tiene días. Editá la rutina para agregar días.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {library.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay rutinas creadas todavía.</p>
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ ex, accent, onRemove }: { ex: ExerciseItem; accent: string; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
        {ex.exerciseName}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>
          {ex.sets}×{ex.reps}
        </span>
        {ex.weightKg && (
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>{ex.weightKg} kg</span>
        )}
      </div>
      {ex.notes && (
        <span className="text-xs truncate max-w-[100px] hidden sm:block" style={{ color: "var(--text-3)" }}>
          {ex.notes}
        </span>
      )}
      <button onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shrink-0 cursor-pointer"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
