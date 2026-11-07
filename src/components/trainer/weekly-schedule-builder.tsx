"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Check, Pencil, ClipboardList, ChevronDown, ChevronUp, Plus, Search } from "lucide-react";

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

type Gender = "chica" | "chico" | null;
type Frequency = "2dias" | "3dias" | "pase_libre" | null;

type DayExercise = {
  id: string; dayOfWeek: number; orderIndex: number;
  sets: number; reps: string; restSeconds: number | null; notes: string | null;
  exerciseId: string; exerciseName: string; muscleGroup: string;
};
type ExerciseItem = { id: string; name: string; muscleGroup: string };
type TemplateDay = { id: string; name: string | null; dayNumber: number; exerciseCount: number };
type Template = {
  id: string; name: string; category: string;
  audience: string | null; frequency: string | null; daysPerWeek: number;
  days: TemplateDay[];
};

// Punto de color único de género, solo como marca chica de escaneo.
const GENDER_DOT: Record<string, string> = { chicas: "#f472b6", chicos: "#60a5fa" };

// Días de la semana según la frecuencia del alumno (para mapear la plantilla).
export function dowsForFrequency(freq: Frequency): number[] {
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

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // edición inline de un ejercicio del alumno
  const [editing, setEditing] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Ejercicios sueltos (opción secundaria, plegada por defecto)
  const [showLoose, setShowLoose] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [looseDow, setLooseDow] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exSearch, setExSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  function openLoose() {
    setShowLoose(v => !v);
    if (allExercises.length === 0)
      fetch("/api/trainer/exercises-list").then(r => r.json()).then(d => setAllExercises(d.exercises ?? []));
  }

  async function addSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const items = [...selected].map(exerciseId => ({ exerciseId, sets: 3, reps: "10" }));
      const res = await fetch("/api/trainer/day-exercises", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dayOfWeek: looseDow, items }),
      });
      const data = await res.json() as { exercises: DayExercise[] };
      const enriched = (data.exercises ?? []).map(row => {
        const ex = allExercises.find(e => e.id === row.exerciseId);
        return { ...row, exerciseName: ex?.name ?? "", muscleGroup: ex?.muscleGroup ?? "full_body" };
      });
      setDayExercises(prev => [...prev, ...enriched]);
      setSelected(new Set());
      const day = DAYS.find(d => d.dow === looseDow)?.label ?? "";
      setToast(`${enriched.length} ejercicio${enriched.length !== 1 ? "s" : ""} agregado${enriched.length !== 1 ? "s" : ""} al ${day.toLowerCase()}`);
    } finally { setBusy(false); }
  }

  function loadDayExercises() {
    fetch(`/api/trainer/day-exercises?clientId=${clientId}`)
      .then(r => r.json()).then(d => setDayExercises(d.exercises ?? []));
  }

  useEffect(() => {
    loadDayExercises();
    fetch("/api/trainer/plan-library").then(r => r.json()).then(d => setTemplates(d.library ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); } }, [toast]);

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

  const looseTerm = exSearch.trim().toLowerCase();
  const filteredExercises = allExercises.filter(e =>
    (!looseTerm || e.name.toLowerCase().includes(looseTerm)) && (!muscleFilter || e.muscleGroup === muscleFilter));
  const muscleGroups = [...new Set(allExercises.map(e => e.muscleGroup))];

  const AUD: Record<string, string> = { chicas: "Mujeres", chicos: "Hombres" };
  const FREQ_LABEL: Record<string, string> = { "2dias": "2 días", "3dias": "3 días", "pase_libre": "Pase libre" };
  const tplExCount = (t: Template) => t.days.reduce((a, d) => a + (d.exerciseCount || 0), 0);
  const suggested = sortedTemplates.find((t) =>
    !!clientGender && t.audience === (clientGender === "chica" ? "chicas" : "chicos") &&
    !!clientFrequency && t.frequency === clientFrequency,
  ) ?? null;
  const otherTemplates = suggested ? sortedTemplates.filter((t) => t.id !== suggested.id) : sortedTemplates;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
      {toast && (
        <div className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
          Semana del alumno
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
          {readOnly
            ? "Vista de solo lectura. Editá la rutina desde la sección Rutinas."
            : "Asigná una plantilla para armar la semana. Después podés ajustar o quitar ejercicios de cada día."}
        </p>
      </div>

      {/* ── Asignar plantilla ──────────────────────────────────── */}
      {!readOnly && (
        <div className="p-3" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-xs font-extrabold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-3)" }}>
            Asignar plantilla
          </h3>

          {templates.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Todavía no hay plantillas creadas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Sugerida */}
              {suggested && (
                <div className="rounded-xl p-2.5 flex items-center gap-2.5"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-hover)" }}>
                    <ClipboardList className="h-4 w-4" style={{ color: "var(--text-2)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {suggested.audience && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GENDER_DOT[suggested.audience] ?? "var(--text-3)" }} />}
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{suggested.name}</p>
                      <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>sugerida</span>
                    </div>
                    <p className="text-2xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {suggested.days.length} días · {tplExCount(suggested)} ejercicios
                    </p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => assignTemplate(suggested)}
                    className="btn-accent shrink-0 px-3.5 h-8 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50"
                    style={{ touchAction: "manipulation" }}>
                    {busy ? "…" : "Asignar"}
                  </button>
                </div>
              )}

              {/* Ver todas */}
              <button type="button" onClick={() => setShowTemplates(v => !v)}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                style={{ border: "1px dashed var(--border-strong)", color: "var(--text-2)", touchAction: "manipulation" }}>
                {showTemplates ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showTemplates ? "Ocultar plantillas" : suggested ? `Ver todas las plantillas (${otherTemplates.length})` : "Elegir una plantilla"}
              </button>

              {showTemplates && (
                <div className="reveal-down flex flex-col gap-2.5">
                  {(["2dias", "3dias", "pase_libre"] as const).map((freq) => {
                    const list = otherTemplates.filter((t) => t.frequency === freq);
                    if (list.length === 0) return null;
                    return (
                      <div key={freq}>
                        <p className="text-2xs font-extrabold uppercase tracking-widest mb-1 px-1" style={{ color: "var(--text-3)" }}>{FREQ_LABEL[freq]}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {list.map((tpl) => (
                            <button key={tpl.id} type="button" disabled={busy} onClick={() => assignTemplate(tpl)}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left cursor-pointer disabled:opacity-50 transition-colors hover:border-[var(--border-strong)]"
                              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                              {tpl.audience && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GENDER_DOT[tpl.audience] ?? "var(--text-3)" }} />}
                              <span className="flex-1 min-w-0">
                                <span className="block text-xs font-bold truncate" style={{ color: "var(--text)" }}>
                                  {tpl.audience ? AUD[tpl.audience] : tpl.name}
                                </span>
                                <span className="block text-2xs" style={{ color: "var(--text-3)" }}>{tpl.days.length} días · {tplExCount(tpl)} ej.</span>
                              </span>
                            </button>
                          ))}
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

      {/* Grid de 5 días (solo lectura/edición de lo asignado) */}
      <div className="grid grid-cols-5">
        {DAYS.map(({ short, dow }, colIdx) => {
          const dayExs = exercisesForDay(dow);
          return (
            <div key={dow} className="flex flex-col" style={{ borderRight: colIdx < 4 ? "1px solid var(--border)" : "none" }}>
              <div className="px-2 py-2 text-center" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-extrabold uppercase tracking-wider block" style={{ color: "var(--text-3)" }}>{short}</span>
                {dayExs.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-2xs font-extrabold mt-1 tabular-nums"
                    style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>{dayExs.length}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 p-1.5 flex-1">
                {dayExs.map(ex => (
                  <div key={ex.id} className="rounded-lg p-2 flex flex-col gap-0.5 relative"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                    {editing === ex.id ? (
                      <InlineEditExercise ex={ex}
                        onSave={(patch) => updateExercise(ex.id, patch)} onCancel={() => setEditing(null)} />
                    ) : (
                      <>
                        <p className="text-xs font-bold leading-tight pr-9" style={{ color: "var(--text)" }}>
                          {ex.exerciseName}
                        </p>
                        <p className="text-2xs font-semibold tabular-nums" style={{ color: "var(--text-2)" }}>{ex.sets}×{ex.reps}</p>
                        <p className="text-2xs" style={{ color: "var(--text-3)" }}>
                          {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                        </p>
                        {ex.notes && (
                          <p className="text-2xs italic mt-0.5 leading-tight" style={{ color: "var(--text-3)" }}>{ex.notes}</p>
                        )}
                        {!readOnly && (
                          <div className="absolute top-1.5 right-1.5 flex gap-1">
                            <button onClick={() => setEditing(ex.id)}
                              className="w-5 h-5 flex items-center justify-center rounded-md cursor-pointer"
                              style={{ background: "var(--bg-panel)", color: "var(--text-3)" }}>
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={() => removeExercise(ex.id)}
                              className="w-5 h-5 flex items-center justify-center rounded-md cursor-pointer"
                              style={{ background: "var(--bg-panel)", color: "var(--text-3)" }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {dayExs.length === 0 && (
                  <p className="text-2xs text-center py-3" style={{ color: "var(--text-3)" }}>Descanso</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Opción secundaria: ejercicios sueltos ─────────────── */}
      {!readOnly && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={openLoose}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold cursor-pointer"
            style={{ color: "var(--text-3)", touchAction: "manipulation" }}>
            {showLoose ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showLoose ? "Ocultar ejercicios sueltos" : "Agregar ejercicios sueltos (opcional)"}
          </button>

          {showLoose && (
            <div className="reveal-down px-3 pb-3 flex flex-col gap-2.5" style={{ background: "var(--bg)" }}>
              <div className="flex items-center gap-1.5 pt-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: "var(--text-3)" }}>Día</span>
                {DAYS.map(d => {
                  const sel = looseDow === d.dow;
                  return (
                    <button key={d.dow} type="button" onClick={() => setLooseDow(d.dow)}
                      className="px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
                      style={{ background: sel ? "var(--accent)" : "var(--bg-panel)", color: sel ? "var(--accent-fg)" : "var(--text-3)", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}` }}>
                      {d.short}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
                  <input placeholder="Buscar ejercicio…" value={exSearch} onChange={e => setExSearch(e.target.value)}
                    className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                    style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <select value={muscleFilter ?? ""} onChange={e => setMuscleFilter(e.target.value || null)} aria-label="Filtrar por músculo"
                  className="rounded-lg px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                  <option value="">Todos los músculos</option>
                  {muscleGroups.map(mg => <option key={mg} value={mg}>{MUSCLE_LABELS[mg] ?? mg}</option>)}
                </select>
              </div>

              <div className="flex flex-col max-h-64 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
                {allExercises.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Cargando…</p>}
                {allExercises.length > 0 && filteredExercises.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>No se encontraron ejercicios.</p>
                )}
                {filteredExercises.map((ex, i) => {
                  const checked = selected.has(ex.id);
                  return (
                    <button key={ex.id} type="button"
                      onClick={() => setSelected(prev => { const n = new Set(prev); if (n.has(ex.id)) n.delete(ex.id); else n.add(ex.id); return n; })}
                      className="flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
                      style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{ background: checked ? "var(--accent)" : "var(--bg-hover)", border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}` }}>
                        {checked && <Check className="h-3 w-3" style={{ color: "var(--accent-fg)" }} />}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{ex.name}</span>
                      <span className="text-2xs shrink-0" style={{ color: "var(--text-3)" }}>{MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}</span>
                    </button>
                  );
                })}
              </div>

              <button type="button" onClick={addSelected} disabled={selected.size === 0 || busy}
                className="btn-accent h-10 rounded-lg text-sm font-extrabold cursor-pointer disabled:opacity-40"
                style={{ touchAction: "manipulation" }}>
                {busy ? "Guardando…" : selected.size === 0
                  ? "Elegí ejercicios"
                  : `Agregar ${selected.size} al ${DAYS.find(d => d.dow === looseDow)?.label.toLowerCase()}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Edición inline de un ejercicio del alumno ──────────────────────────── */

function InlineEditExercise({ ex, onSave, onCancel }: {
  ex: DayExercise;
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
      <p className="text-xs font-bold leading-tight" style={{ color: "var(--text)" }}>{ex.exerciseName}</p>
      <div className="flex items-center gap-1">
        <input type="number" min={1} max={20} value={sets} onChange={e => setSets(e.target.value)}
          className="w-9 text-center text-xs font-bold rounded-md px-1 py-1 outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", color: "var(--text)" }} />
        <span className="text-2xs" style={{ color: "var(--text-3)" }}>×</span>
        <input type="text" value={reps} onChange={e => setReps(e.target.value)}
          className="w-11 text-center text-xs font-bold rounded-md px-1 py-1 outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", color: "var(--text)" }} />
        <button onClick={save} className="ml-auto w-6 h-6 flex items-center justify-center rounded-md cursor-pointer" style={{ color: "var(--accent)" }}>
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={onCancel} className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer" style={{ color: "var(--text-3)" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input type="text" value={notes} placeholder="Nota (opcional)" onChange={e => setNotes(e.target.value)}
        className="w-full text-2xs rounded-md px-2 py-1 outline-none"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
    </div>
  );
}
