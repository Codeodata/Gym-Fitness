"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, Check, Search, Pencil, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";

const DAYS = [
  { label: "Lunes",     short: "Lun", dow: 1 },
  { label: "Martes",    short: "Mar", dow: 2 },
  { label: "Miércoles", short: "Mié", dow: 3 },
  { label: "Jueves",    short: "Jue", dow: 4 },
  { label: "Viernes",   short: "Vie", dow: 5 },
];

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};

const MUSCLE_COLOR: Record<string, { color: string; bg: string }> = {
  chest:     { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  back:      { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  shoulders: { color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  arms:      { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  legs:      { color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  core:      { color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
  cardio:    { color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  full_body: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

const DAY_ACCENT: Record<number, { color: string; bg: string }> = {
  1: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)"  },
  2: { color: "#c084fc", bg: "rgba(192,132,252,0.08)" },
  3: { color: "#fb923c", bg: "rgba(251,146,60,0.08)"  },
  4: { color: "#f472b6", bg: "rgba(244,114,182,0.08)" },
  5: { color: "#4ade80", bg: "rgba(74,222,128,0.08)"  },
};

type Gender = "chica" | "chico" | null;
type Frequency = "2dias" | "3dias" | "pase_libre" | null;

type DayExercise = {
  id: string; dayOfWeek: number; orderIndex: number;
  sets: number; reps: string; restSeconds: number | null; notes: string | null;
  exerciseId: string; exerciseName: string; muscleGroup: string;
};
type TemplateDay = { id: string; name: string | null; dayNumber: number; exerciseCount: number };
type Template = {
  id: string; name: string; category: string;
  audience: string | null; frequency: string | null; daysPerWeek: number;
  days: TemplateDay[];
};
type ExerciseItem = { id: string; name: string; muscleGroup: string };

// Días de la semana según la frecuencia del alumno (para mapear la plantilla).
function dowsForFrequency(freq: Frequency): number[] {
  if (freq === "2dias") return [1, 3];
  if (freq === "3dias") return [1, 3, 5];
  return [1, 2, 3, 4, 5];
}

export function WeeklyScheduleBuilder({
  clientId,
  clientGender = null,
  clientFrequency = null,
  readOnly = false,
}: {
  clientId: string;
  clientGender?: Gender;
  clientFrequency?: Frequency;
  readOnly?: boolean;
}) {
  const [dayExercises, setDayExercises] = useState<DayExercise[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);

  const [activeDow, setActiveDow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // multi-select del picker de ejercicios
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exSearch, setExSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  // edición inline de un ejercicio del alumno
  const [editing, setEditing] = useState<string | null>(null);

  const [showTemplates, setShowTemplates] = useState(false);

  function loadDayExercises() {
    fetch(`/api/trainer/day-exercises?clientId=${clientId}`)
      .then(r => r.json()).then(d => setDayExercises(d.exercises ?? []));
  }

  useEffect(() => {
    loadDayExercises();
    fetch("/api/trainer/plan-library").then(r => r.json()).then(d => setTemplates(d.library ?? []));
    fetch("/api/trainer/exercises-list").then(r => r.json()).then(d => setAllExercises(d.exercises ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); } }, [toast]);

  function openDay(dow: number) {
    if (readOnly) return;
    setActiveDow(prev => (prev === dow ? null : dow));
    setSelected(new Set());
    setExSearch("");
    setMuscleFilter(null);
  }

  async function addSelected(dow: number) {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const items = [...selected].map(exerciseId => ({ exerciseId, sets: 3, reps: "10" }));
      const res = await fetch("/api/trainer/day-exercises", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dayOfWeek: dow, items }),
      });
      const data = await res.json() as { exercises: DayExercise[] };
      // Completar nombre/músculo desde el catálogo local
      const enriched = (data.exercises ?? []).map(row => {
        const ex = allExercises.find(e => e.id === row.exerciseId);
        return { ...row, exerciseName: ex?.name ?? "", muscleGroup: ex?.muscleGroup ?? "full_body" };
      });
      setDayExercises(prev => [...prev, ...enriched]);
      setSelected(new Set());
      setToast(`${enriched.length} ejercicio${enriched.length !== 1 ? "s" : ""} agregado${enriched.length !== 1 ? "s" : ""}`);
    } finally { setBusy(false); }
  }

  async function removeExercise(id: string) {
    setDayExercises(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/trainer/day-exercises/${id}`, { method: "DELETE" });
  }

  async function updateExercise(id: string, patch: { sets?: number; reps?: string; notes?: string | null }) {
    setDayExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    setEditing(null);
    await fetch(`/api/trainer/day-exercises/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function assignTemplate(tpl: Template) {
    const dows = dowsForFrequency(clientFrequency);
    const days = [...tpl.days].sort((a, b) => a.dayNumber - b.dayNumber);
    const dayMap = days.slice(0, dows.length).map((d, i) => ({ planDayId: d.id, dayOfWeek: dows[i]! }));
    if (dayMap.length === 0) { setToast("Esa plantilla no tiene días cargados"); return; }
    setBusy(true);
    try {
      await fetch("/api/trainer/assign-template", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dayMap, replace: true }),
      });
      loadDayExercises();
      setShowTemplates(false);
      setActiveDow(null);
      setToast(`Plantilla "${tpl.name}" copiada a la semana`);
    } finally { setBusy(false); }
  }

  const exercisesForDay = (dow: number) =>
    dayExercises.filter(e => e.dayOfWeek === dow).sort((a, b) => a.orderIndex - b.orderIndex);

  // Plantillas sugeridas según género + frecuencia del alumno (primero las que matchean).
  const sortedTemplates = useMemo(() => {
    const score = (t: Template) =>
      (clientGender && t.audience === (clientGender === "chica" ? "chicas" : "chicos") ? 2 : 0) +
      (clientFrequency && t.frequency === clientFrequency ? 1 : 0);
    return [...templates].sort((a, b) => score(b) - score(a));
  }, [templates, clientGender, clientFrequency]);

  const AUD: Record<string, { label: string; color: string }> = {
    chicas: { label: "Mujeres", color: "#f472b6" },
    chicos: { label: "Hombres", color: "#60a5fa" },
  };
  const FREQ_LABEL: Record<string, string> = { "2dias": "2 días", "3dias": "3 días", "pase_libre": "Pase libre" };
  const tplExCount = (t: Template) => t.days.reduce((a, d) => a + (d.exerciseCount || 0), 0);
  const suggested = sortedTemplates.find((t) =>
    !!clientGender && t.audience === (clientGender === "chica" ? "chicas" : "chicos") &&
    !!clientFrequency && t.frequency === clientFrequency,
  ) ?? null;
  const otherTemplates = suggested ? sortedTemplates.filter((t) => t.id !== suggested.id) : sortedTemplates;

  const filteredExercises = allExercises.filter(e => {
    const matchSearch = !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase());
    const matchMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    return matchSearch && matchMuscle;
  });
  const muscleGroups = [...new Set(allExercises.map(e => e.muscleGroup))];
  const grouped = filteredExercises.reduce<Record<string, ExerciseItem[]>>((acc, ex) => {
    const label = MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup;
    (acc[label] ??= []).push(ex);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
      {toast && (
        <div className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>
          Semana del alumno
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          {readOnly
            ? "Vista de solo lectura. Editá la rutina desde la sección Rutinas."
            : "Primero asigná una plantilla; después (opcional) ajustá ejercicios sueltos por día."}
        </p>
      </div>

      {/* ── Paso 1: Asignar plantilla ──────────────────────────── */}
      {!readOnly && (
        <div className="p-4" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>1</span>
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>Asignar plantilla</h3>
          </div>

          {templates.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Todavía no hay plantillas creadas.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* Sugerida (prominente) */}
              {suggested && (() => {
                const color = suggested.audience ? (AUD[suggested.audience]?.color ?? "var(--accent)") : "var(--accent)";
                return (
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `${color}14`, border: `1px solid ${color}55` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
                      <ClipboardList className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold truncate" style={{ color: "var(--text)" }}>{suggested.name}</p>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full shrink-0" style={{ background: color, color: "#0a0a0a" }}>sugerida</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                        {suggested.days.length} días · {tplExCount(suggested)} ejercicios
                      </p>
                    </div>
                    <button type="button" disabled={busy} onClick={() => assignTemplate(suggested)}
                      className="shrink-0 px-4 h-10 rounded-xl text-sm font-extrabold cursor-pointer disabled:opacity-50"
                      style={{ background: color, color: "#0a0a0a", touchAction: "manipulation" }}>
                      {busy ? "…" : "Asignar"}
                    </button>
                  </div>
                );
              })()}

              {/* Ver todas — resumido, se expande organizado por frecuencia */}
              <button type="button" onClick={() => setShowTemplates(v => !v)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{ border: "1px dashed var(--border-strong)", color: "var(--text-2)", touchAction: "manipulation" }}>
                {showTemplates ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showTemplates ? "Ocultar plantillas" : suggested ? `Ver todas las plantillas (${otherTemplates.length})` : "Elegir una plantilla"}
              </button>

              {showTemplates && (
                <div className="reveal-down flex flex-col gap-3">
                  {(["2dias", "3dias", "pase_libre"] as const).map((freq) => {
                    const list = otherTemplates.filter((t) => t.frequency === freq);
                    if (list.length === 0) return null;
                    return (
                      <div key={freq}>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 px-1" style={{ color: "var(--text-3)" }}>{FREQ_LABEL[freq]}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {list.map((tpl) => {
                            const color = tpl.audience ? (AUD[tpl.audience]?.color ?? "var(--text-3)") : "var(--text-3)";
                            return (
                              <button key={tpl.id} type="button" disabled={busy} onClick={() => assignTemplate(tpl)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer disabled:opacity-50"
                                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-xs font-bold truncate" style={{ color: "var(--text)" }}>
                                    {tpl.audience ? AUD[tpl.audience]?.label : tpl.name}
                                  </span>
                                  <span className="block text-[10px]" style={{ color: "var(--text-3)" }}>{tpl.days.length} días · {tplExCount(tpl)} ej.</span>
                                </span>
                                <Plus className="h-4 w-4 shrink-0" style={{ color }} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Paso 2: Ejercicios sueltos (opcional) ──────────────── */}
      {!readOnly && (
        <div className="px-4 pt-4 pb-1 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
            style={{ background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)" }}>2</span>
          <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
            Ejercicios sueltos <span style={{ color: "var(--text-3)" }}>(opcional)</span>
          </h3>
        </div>
      )}

      {/* Grid de 5 días */}
      <div className="grid grid-cols-5" style={{ borderBottom: activeDow !== null ? "1px solid var(--border)" : "none" }}>
        {DAYS.map(({ label, short, dow }, colIdx) => {
          const dayExs = exercisesForDay(dow);
          const isActive = activeDow === dow;
          const da = DAY_ACCENT[dow]!;
          return (
            <div key={dow} className="flex flex-col" style={{
              borderRight: colIdx < 4 ? "1px solid var(--border)" : "none",
              borderTop: `3px solid ${isActive ? da.color : "transparent"}`,
              background: isActive ? da.bg : "transparent",
            }}>
              <button onClick={() => openDay(dow)} className="w-full px-2 py-3 text-center cursor-pointer"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-extrabold uppercase tracking-wider block"
                  style={{ color: isActive ? da.color : "var(--text-3)" }}>{short}</span>
                <span className="text-[10px] hidden sm:block mt-0.5"
                  style={{ color: isActive ? da.color : "var(--text-3)", opacity: 0.7 }}>{label}</span>
                {dayExs.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold mt-1.5"
                    style={{ background: da.color, color: "#000" }}>{dayExs.length}</span>
                )}
              </button>

              <div className="flex flex-col gap-2 p-2 flex-1">
                {dayExs.map(ex => (
                  <div key={ex.id} className="rounded-xl p-2.5 flex flex-col gap-0.5 relative"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                    {editing === ex.id ? (
                      <InlineEditExercise ex={ex} accent={da.color}
                        onSave={(patch) => updateExercise(ex.id, patch)} onCancel={() => setEditing(null)} />
                    ) : (
                      <>
                        <p className="text-[11px] font-extrabold leading-tight pr-10" style={{ color: "var(--text)" }}>
                          {ex.exerciseName}
                        </p>
                        <p className="text-[10px]" style={{ color: da.color }}>{ex.sets}×{ex.reps}</p>
                        <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                          {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                        </p>
                        {ex.notes && (
                          <p className="text-[9px] italic mt-0.5 leading-tight pr-10" style={{ color: "var(--text-3)" }}>{ex.notes}</p>
                        )}
                        {!readOnly && (
                          <div className="absolute top-1.5 right-1.5 flex gap-1">
                            <button onClick={() => setEditing(ex.id)}
                              className="w-5 h-5 flex items-center justify-center rounded-lg cursor-pointer"
                              style={{ background: "var(--bg-panel)", color: "var(--text-3)" }}>
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={() => removeExercise(ex.id)}
                              className="w-5 h-5 flex items-center justify-center rounded-lg cursor-pointer"
                              style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444" }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {!readOnly && (
                  <button onClick={() => openDay(dow)}
                    className="w-full flex items-center justify-center rounded-xl cursor-pointer mt-auto"
                    style={{ height: 34, border: `1.5px dashed ${isActive ? da.color : "var(--border)"}`, color: isActive ? da.color : "var(--text-3)" }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                {readOnly && dayExs.length === 0 && (
                  <p className="text-[10px] text-center py-2 mt-auto" style={{ color: "var(--text-3)" }}>Descanso</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Picker multi-selección para el día activo */}
      {!readOnly && activeDow !== null && (
        <div className="p-5" style={{ background: "var(--bg)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Agregar a <span style={{ color: DAY_ACCENT[activeDow]?.color }}>{DAYS.find(d => d.dow === activeDow)?.label}</span>
            </p>
            <button onClick={() => setActiveDow(null)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={() => setMuscleFilter(null)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer"
              style={{ background: !muscleFilter ? "var(--accent)" : "var(--bg-panel)", color: !muscleFilter ? "var(--accent-fg)" : "var(--text-3)", border: `1px solid ${!muscleFilter ? "var(--accent)" : "var(--border)"}` }}>
              Todos
            </button>
            {muscleGroups.map(mg => {
              const mc = MUSCLE_COLOR[mg] ?? { color: "var(--text-3)", bg: "var(--bg-panel)" };
              const active = muscleFilter === mg;
              return (
                <button key={mg} onClick={() => setMuscleFilter(active ? null : mg)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer"
                  style={{ background: active ? mc.color : mc.bg, color: active ? "#000" : mc.color, border: `1px solid ${active ? mc.color : "transparent"}` }}>
                  {MUSCLE_LABELS[mg] ?? mg}
                </button>
              );
            })}
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <input placeholder="Buscar ejercicio…" value={exSearch} onChange={e => setExSearch(e.target.value)}
              className="w-full rounded-xl pl-8 pr-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>

          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pb-2">
            {Object.entries(grouped).map(([group, exercises]) => (
              <div key={group}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 px-1" style={{ color: "var(--text-3)" }}>{group}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {exercises.map(ex => {
                    const checked = selected.has(ex.id);
                    return (
                      <button key={ex.id} onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(ex.id)) n.delete(ex.id); else n.add(ex.id); return n; })}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-left"
                        style={{ background: "var(--bg-panel)", border: `1px solid ${checked ? DAY_ACCENT[activeDow]?.color : "var(--border)"}` }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                          style={{ background: checked ? DAY_ACCENT[activeDow]?.color : "var(--bg-hover)", border: `1px solid ${checked ? DAY_ACCENT[activeDow]?.color : "var(--border)"}` }}>
                          {checked && <Check className="h-2.5 w-2.5" style={{ color: "#000" }} />}
                        </div>
                        <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{ex.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>No se encontraron ejercicios.</p>
            )}
          </div>

          <button onClick={() => addSelected(activeDow)} disabled={selected.size === 0 || busy}
            className="w-full mt-2 h-11 rounded-xl text-sm font-extrabold cursor-pointer disabled:opacity-40"
            style={{ background: DAY_ACCENT[activeDow]?.color, color: "#000", touchAction: "manipulation" }}>
            {busy ? "Guardando…" : selected.size === 0 ? "Elegí ejercicios" : `Agregar ${selected.size} ejercicio${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Edición inline de un ejercicio del alumno ──────────────────────────── */

function InlineEditExercise({ ex, accent, onSave, onCancel }: {
  ex: DayExercise; accent: string;
  onSave: (patch: { sets: number; reps: string; notes: string | null }) => void;
  onCancel: () => void;
}) {
  const [sets, setSets] = useState(String(ex.sets));
  const [reps, setReps] = useState(ex.reps);
  const [notes, setNotes] = useState(ex.notes ?? "");

  function save() {
    const s = parseInt(sets, 10);
    if (!reps.trim() || isNaN(s) || s < 1) { onCancel(); return; }
    onSave({ sets: s, reps: reps.trim(), notes: notes.trim() || null });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-extrabold leading-tight" style={{ color: "var(--text)" }}>{ex.exerciseName}</p>
      <div className="flex items-center gap-1">
        <input type="number" min={1} max={20} value={sets} onChange={e => setSets(e.target.value)}
          className="w-9 text-center text-[11px] font-bold rounded-md px-1 py-1 outline-none"
          style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, color: accent }} />
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>×</span>
        <input type="text" value={reps} onChange={e => setReps(e.target.value)}
          className="w-11 text-center text-[11px] font-bold rounded-md px-1 py-1 outline-none"
          style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, color: accent }} />
        <button onClick={save} className="ml-auto w-6 h-6 flex items-center justify-center rounded-md cursor-pointer" style={{ color: accent }}>
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={onCancel} className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer" style={{ color: "var(--text-3)" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input type="text" value={notes} placeholder="Nota (opcional)" onChange={e => setNotes(e.target.value)}
        className="w-full text-[10px] rounded-md px-2 py-1 outline-none"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
    </div>
  );
}
