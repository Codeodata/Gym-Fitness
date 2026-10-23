"use client";

import { useState, useEffect } from "react";
import { Plus, X, Flame, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

const DAYS = [
  { label: "Lunes",     short: "Lun", dow: 1 },
  { label: "Martes",    short: "Mar", dow: 2 },
  { label: "Miércoles", short: "Mié", dow: 3 },
  { label: "Jueves",    short: "Jue", dow: 4 },
  { label: "Viernes",   short: "Vie", dow: 5 },
];

const CAT: Record<string, { color: string; bg: string; border: string }> = {
  musculación:   { color: "#84cc16", bg: "rgba(132,204,22,0.10)", border: "rgba(132,204,22,0.30)" },
  calentamiento: { color: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.30)" },
  funcional:     { color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.30)" },
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

const DAY_ACCENT: Record<number, { color: string; bg: string }> = {
  1: { color: "#60a5fa",  bg: "rgba(96,165,250,0.08)"  },
  2: { color: "#c084fc",  bg: "rgba(192,132,252,0.08)" },
  3: { color: "#fb923c",  bg: "rgba(251,146,60,0.08)"  },
  4: { color: "#f472b6",  bg: "rgba(244,114,182,0.08)" },
  5: { color: "#4ade80",  bg: "rgba(74,222,128,0.08)"  },
};

type Block = {
  id: string; dayOfWeek: number; orderIndex: number;
  planDayId: string; planDayName: string | null; planName: string; planCategory: string;
};

type DayExercise = {
  id: string; dayOfWeek: number; orderIndex: number;
  sets: number; reps: string; restSeconds: number | null; notes: string | null;
  exerciseId: string; exerciseName: string; muscleGroup: string;
};

type LibraryDay = { id: string; name: string | null; dayNumber: number; exerciseCount: number };
type LibraryPlan = { id: string; name: string; category: string; days: LibraryDay[] };
type ExerciseItem = { id: string; name: string; muscleGroup: string };

export function WeeklyScheduleBuilder({ clientId }: { clientId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dayExercises, setDayExercises] = useState<DayExercise[]>([]);
  const [library, setLibrary] = useState<LibraryPlan[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);

  const [activeDow, setActiveDow] = useState<number | null>(null);
  const [libraryTab, setLibraryTab] = useState<"planes" | "ejercicios">("planes");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  // exercise picker state
  const [pickingEx, setPickingEx] = useState<string | null>(null); // exerciseId
  const [pickSets, setPickSets] = useState(3);
  const [pickReps, setPickReps] = useState("10");
  const [pickNotes, setPickNotes] = useState("");
  const [exSearch, setExSearch] = useState("");

  useEffect(() => {
    fetch(`/api/trainer/weekly-schedule?clientId=${clientId}`)
      .then(r => r.json()).then(d => setBlocks(d.blocks ?? []));
    fetch(`/api/trainer/day-exercises?clientId=${clientId}`)
      .then(r => r.json()).then(d => setDayExercises(d.exercises ?? []));
    fetch("/api/trainer/plan-library")
      .then(r => r.json()).then(d => setLibrary(d.library ?? []));
    fetch("/api/trainer/exercises-list")
      .then(r => r.json()).then(d => setAllExercises(d.exercises ?? []));
  }, [clientId]);

  async function addBlock(planDayId: string) {
    if (!activeDow) return;
    setLoadingId(planDayId);
    try {
      const res = await fetch("/api/trainer/weekly-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dayOfWeek: activeDow, planDayId }),
      });
      const data = await res.json() as { block: Block };
      const flat = library.flatMap(p => p.days.map(d => ({ ...d, planName: p.name, planCategory: p.category })));
      const planDay = flat.find(d => d.id === planDayId);
      if (planDay) {
        setBlocks(prev => [...prev, {
          ...data.block,
          planDayName: planDay.name,
          planName: planDay.planName,
          planCategory: planDay.planCategory,
        }]);
      }
    } finally { setLoadingId(null); }
  }

  async function removeBlock(blockId: string) {
    setLoadingId(blockId);
    try {
      await fetch(`/api/trainer/weekly-schedule/${blockId}`, { method: "DELETE" });
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    } finally { setLoadingId(null); }
  }

  async function addExercise(exerciseId: string) {
    if (!activeDow) return;
    setLoadingId(exerciseId);
    try {
      const res = await fetch("/api/trainer/day-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dayOfWeek: activeDow, exerciseId, sets: pickSets, reps: pickReps, notes: pickNotes || null }),
      });
      const data = await res.json() as { exercise: DayExercise };
      const ex = allExercises.find(e => e.id === exerciseId);
      if (ex) {
        setDayExercises(prev => [...prev, {
          ...data.exercise,
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
        }]);
      }
      setPickingEx(null);
      setPickSets(3);
      setPickReps("10");
      setPickNotes("");
    } finally { setLoadingId(null); }
  }

  async function removeDayExercise(id: string) {
    setLoadingId(id);
    try {
      await fetch(`/api/trainer/day-exercises/${id}`, { method: "DELETE" });
      setDayExercises(prev => prev.filter(e => e.id !== id));
    } finally { setLoadingId(null); }
  }

  function togglePlan(planId: string) {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      next.has(planId) ? next.delete(planId) : next.add(planId);
      return next;
    });
  }

  const blocksForDay = (dow: number) =>
    blocks.filter(b => b.dayOfWeek === dow).sort((a, b) => a.orderIndex - b.orderIndex);

  const exercisesForDay = (dow: number) =>
    dayExercises.filter(e => e.dayOfWeek === dow).sort((a, b) => a.orderIndex - b.orderIndex);

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
    MUSCLE_LABELS[e.muscleGroup]?.toLowerCase().includes(exSearch.toLowerCase())
  );

  // Group exercises by muscle group
  const grouped = filteredExercises.reduce<Record<string, ExerciseItem[]>>((acc, ex) => {
    const label = MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup;
    if (!acc[label]) acc[label] = [];
    acc[label]!.push(ex);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>

      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>
          Semana del alumno
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          Hacé clic en un día para agregar planes o ejercicios sueltos
        </p>
      </div>

      {/* 5-column grid */}
      <div className="grid grid-cols-5" style={{ borderBottom: activeDow !== null ? "1px solid var(--border)" : "none" }}>
        {DAYS.map(({ label, short, dow }, colIdx) => {
          const dayBlocks = blocksForDay(dow);
          const dayExs = exercisesForDay(dow);
          const total = dayBlocks.length + dayExs.length;
          const isActive = activeDow === dow;
          const da = DAY_ACCENT[dow]!;

          return (
            <div key={dow} className="flex flex-col" style={{
              borderRight: colIdx < 4 ? "1px solid var(--border)" : "none",
              borderTop: `3px solid ${isActive ? da.color : "transparent"}`,
              background: isActive ? da.bg : "transparent",
              transition: "background 0.15s, border-color 0.15s",
            }}>
              {/* Day header */}
              <button
                onClick={() => setActiveDow(isActive ? null : dow)}
                className="w-full px-2 py-3 text-center cursor-pointer"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider block"
                  style={{ color: isActive ? da.color : "var(--text-3)" }}>
                  {short}
                </span>
                <span className="text-[10px] hidden sm:block mt-0.5"
                  style={{ color: isActive ? da.color : "var(--text-3)", opacity: 0.7 }}>
                  {label}
                </span>
                {total > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold mt-1.5"
                    style={{ background: da.color, color: "#000" }}>
                    {total}
                  </span>
                )}
              </button>

              {/* Content */}
              <div className="flex flex-col gap-2 p-2 flex-1">
                {/* Plan blocks */}
                {dayBlocks.map(block => {
                  const cat = CAT[block.planCategory] ?? CAT.musculación!;
                  return (
                    <div key={block.id} className="rounded-xl p-2.5 flex flex-col gap-1 relative"
                      style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                      <div className="flex items-center gap-1.5 pr-5">
                        {block.planCategory === "calentamiento"
                          ? <Flame className="h-3 w-3 shrink-0" style={{ color: cat.color }} />
                          : <Dumbbell className="h-3 w-3 shrink-0" style={{ color: cat.color }} />}
                        <span className="text-[9px] font-extrabold uppercase tracking-wider truncate"
                          style={{ color: cat.color }}>
                          {block.planCategory}
                        </span>
                      </div>
                      <p className="text-[11px] font-extrabold leading-tight pr-5" style={{ color: "var(--text)" }}>
                        {block.planDayName ?? block.planName}
                      </p>
                      {block.planDayName && (
                        <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>
                          {block.planName}
                        </p>
                      )}
                      <button onClick={() => removeBlock(block.id)} disabled={loadingId === block.id}
                        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-lg cursor-pointer"
                        style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444" }}>
                        {loadingId === block.id ? <span className="text-[9px]">…</span> : <X className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}

                {/* Individual exercises */}
                {dayExs.map(ex => (
                  <div key={ex.id} className="rounded-xl p-2.5 flex flex-col gap-0.5 relative"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                    <p className="text-[11px] font-extrabold leading-tight pr-5" style={{ color: "var(--text)" }}>
                      {ex.exerciseName}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--accent)" }}>
                      {ex.sets}×{ex.reps}{ex.restSeconds ? ` · ${ex.restSeconds}s` : ""}
                    </p>
                    <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                      {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                    </p>
                    {ex.notes && (
                      <p className="text-[9px] italic mt-0.5 leading-tight pr-5" style={{ color: "var(--text-3)" }}>
                        {ex.notes}
                      </p>
                    )}
                    <button onClick={() => removeDayExercise(ex.id)} disabled={loadingId === ex.id}
                      className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-lg cursor-pointer"
                      style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444" }}>
                      {loadingId === ex.id ? <span className="text-[9px]">…</span> : <X className="w-3 h-3" />}
                    </button>
                  </div>
                ))}

                {/* Add button */}
                <button
                  onClick={() => setActiveDow(isActive ? null : dow)}
                  className="w-full flex items-center justify-center rounded-xl cursor-pointer transition-colors mt-auto"
                  style={{
                    height: 34,
                    border: `1.5px dashed ${isActive ? da.color : "var(--border)"}`,
                    color: isActive ? da.color : "var(--text-3)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = da.color; e.currentTarget.style.color = da.color; }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; } }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Library panel */}
      {activeDow !== null && (
        <div style={{ background: "var(--bg)" }}>
          {/* Tab switcher */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            {(["planes", "ejercicios"] as const).map(tab => (
              <button key={tab} onClick={() => setLibraryTab(tab)}
                className="flex-1 py-3 text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: libraryTab === tab ? DAY_ACCENT[activeDow]?.color : "var(--text-3)",
                  borderBottom: `2px solid ${libraryTab === tab ? DAY_ACCENT[activeDow]?.color : "transparent"}`,
                  background: "transparent",
                }}>
                {tab === "planes" ? "Planes" : "Ejercicios sueltos"}
              </button>
            ))}
          </div>

          <div className="p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
              Agregar a{" "}
              <span style={{ color: DAY_ACCENT[activeDow]?.color }}>
                {DAYS.find(d => d.dow === activeDow)?.label}
              </span>
            </p>

            {/* PLANES TAB */}
            {libraryTab === "planes" && (
              <div className="flex flex-col gap-2">
                {library.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>
                    No hay planes creados todavía.
                  </p>
                )}
                {library.map(plan => {
                  const cat = CAT[plan.category] ?? CAT.musculación!;
                  const expanded = expandedPlans.has(plan.id);
                  return (
                    <div key={plan.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <button onClick={() => togglePlan(plan.id)}
                        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
                        style={{ background: "var(--bg-panel)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                            {plan.category === "calentamiento"
                              ? <Flame className="h-3.5 w-3.5" style={{ color: cat.color }} />
                              : <Dumbbell className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{plan.name}</span>
                            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                              style={{ background: cat.bg, color: cat.color }}>{plan.category}</span>
                          </div>
                        </div>
                        {expanded
                          ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                          : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />}
                      </button>
                      {expanded && (
                        <div style={{ borderTop: "1px solid var(--border)" }}>
                          {plan.days.map(day => (
                            <button key={day.id} onClick={() => addBlock(day.id)}
                              disabled={loadingId === day.id}
                              className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
                              style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border)" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-panel)"; }}>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                  {day.name ?? `Día ${day.dayNumber}`}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                                  {day.exerciseCount} ejercicio{day.exerciseCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0"
                                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                                {loadingId === day.id
                                  ? <span className="text-[10px]" style={{ color: cat.color }}>…</span>
                                  : <Plus className="h-4 w-4" style={{ color: cat.color }} />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* EJERCICIOS TAB */}
            {libraryTab === "ejercicios" && (
              <div className="flex flex-col gap-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Buscar ejercicio o grupo muscular…"
                  value={exSearch}
                  onChange={e => setExSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />

                {Object.entries(grouped).map(([group, exercises]) => (
                  <div key={group}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 px-1"
                      style={{ color: "var(--text-3)" }}>{group}</p>
                    <div className="flex flex-col gap-1">
                      {exercises.map(ex => (
                        <div key={ex.id}>
                          {/* Exercise row */}
                          {pickingEx !== ex.id ? (
                            <button
                              onClick={() => { setPickingEx(ex.id); setPickSets(3); setPickReps("10"); setPickNotes(""); }}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-left"
                              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-panel)"; }}
                            >
                              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                                {ex.name}
                              </span>
                              <Plus className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                            </button>
                          ) : (
                            /* Inline sets/reps form */
                            <div className="rounded-xl p-3 flex flex-col gap-2"
                              style={{ background: "var(--bg-panel)", border: `1px solid ${DAY_ACCENT[activeDow]?.color}` }}>
                              <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>{ex.name}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color: "var(--text-3)" }}>Series</label>
                                  <input
                                    type="number" min={1} max={20} value={pickSets}
                                    onChange={e => setPickSets(Number(e.target.value))}
                                    className="w-full px-2 py-1.5 rounded-lg text-sm text-center font-bold outline-none"
                                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                                  />
                                </div>
                                <span className="text-sm font-bold mt-4" style={{ color: "var(--text-3)" }}>×</span>
                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color: "var(--text-3)" }}>Reps</label>
                                  <input
                                    type="text" value={pickReps} placeholder="10 / 8-12 / AMRAP"
                                    onChange={e => setPickReps(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg text-sm text-center font-bold outline-none"
                                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                                  />
                                </div>
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Nota para el alumno (opcional)…"
                                value={pickNotes}
                                onChange={e => setPickNotes(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none resize-none"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                              />
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => setPickingEx(null)}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                  style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => addExercise(ex.id)}
                                  disabled={loadingId === ex.id}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer"
                                  style={{ background: DAY_ACCENT[activeDow]?.color, color: "#000" }}>
                                  {loadingId === ex.id ? "…" : "Agregar"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredExercises.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>
                    No se encontraron ejercicios.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
