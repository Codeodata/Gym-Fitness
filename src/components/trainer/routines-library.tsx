"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronUp, Dumbbell, Flame, Plus, Trash2, Search, Users, Check, X, AlertTriangle, Pencil,
} from "lucide-react";

const CAT: Record<string, { color: string; bg: string; border: string; label: string }> = {
  musculación:   { color: "#84cc16", bg: "rgba(132,204,22,0.10)", border: "rgba(132,204,22,0.25)", label: "Musculación"   },
  funcional:     { color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)", label: "Funcional"     },
  calentamiento: { color: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.25)", label: "Calentamiento" },
};

const DAYS_WEEK = [
  { dow: 1, label: "Lun" }, { dow: 2, label: "Mar" }, { dow: 3, label: "Mié" },
  { dow: 4, label: "Jue" }, { dow: 5, label: "Vie" },
];

type ExerciseItem = { id: string; planDayId: string; section: "warmup" | "main"; sets: number; reps: string; weightKg: string | null; notes: string | null; exerciseName: string; muscleGroup: string; orderIndex: number };
type DayItem      = { id: string; dayNumber: number; name: string | null; exercises: ExerciseItem[] };
type PlanDetail   = { days: DayItem[] };
type LibraryPlan  = { id: string; name: string; category: string; days: { id: string; name: string | null; dayNumber: number; exerciseCount: number }[] };
type CatalogItem  = { id: string; name: string; muscleGroup: string };
type Client       = { id: string; name: string; email: string };

type Props = { clients: Client[] };

export function RoutinesLibrary({ clients }: Props) {
  const [library, setLibrary]         = useState<LibraryPlan[]>([]);
  const [expanded, setExpanded]       = useState<Set<string>>(new Set());
  const [planData, setPlanData]       = useState<Record<string, PlanDetail>>({});
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorPlan, setErrorPlan]     = useState<string | null>(null);

  const [catalog, setCatalog]           = useState<CatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Add-exercise panel
  const [addingDayId, setAddingDayId]   = useState<string | null>(null);
  const [addingPlanId, setAddingPlanId] = useState<string | null>(null);
  const [addSection, setAddSection]     = useState<"main" | "warmup">("main");
  const [search, setSearch]             = useState("");
  const [saving, setSaving]             = useState(false);

  // Assign panel
  const [assignPanel, setAssignPanel]         = useState<{ planId: string; dayId: string } | null>(null);
  const [assignDow, setAssignDow]             = useState<number | null>(null);
  const [assignClientIds, setAssignClientIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning]             = useState(false);
  const [toast, setToast]                     = useState<string | null>(null);

  // Delete plan
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting]           = useState(false);

  // Inline rename
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingName, setEditingName]     = useState("");

  useEffect(() => {
    fetch("/api/trainer/plan-library")
      .then(r => r.json())
      .then(d => setLibrary(d.library ?? []));
    fetch("/api/trainer/exercises")
      .then(r => r.json())
      .then((d: CatalogItem[]) => { setCatalog(d); setCatalogLoaded(true); })
      .catch(() => setCatalogLoaded(true));
  }, []);

  // ── Plan expand/collapse ────────────────────────────────────────────────────
  async function togglePlan(planId: string) {
    if (expanded.has(planId)) {
      setExpanded(prev => { const n = new Set(prev); n.delete(planId); return n; });
      return;
    }
    setExpanded(prev => new Set([...prev, planId]));
    setErrorPlan(null);
    if (planData[planId]) return;
    setLoadingPlan(planId);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        days: { id: string; dayNumber: number; name: string | null }[];
        exercises: (ExerciseItem & { planDayId: string })[];
      };
      const exercises = data.exercises ?? [];
      const exByDay = exercises.reduce<Record<string, ExerciseItem[]>>((acc, ex) => {
        (acc[ex.planDayId] ??= []).push(ex);
        return acc;
      }, {});
      setPlanData(prev => ({
        ...prev,
        [planId]: {
          days: (data.days ?? []).map(d => ({
            ...d,
            exercises: (exByDay[d.id] ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
          })),
        },
      }));
    } catch {
      setErrorPlan(planId);
      setExpanded(prev => { const n = new Set(prev); n.delete(planId); return n; });
    } finally {
      setLoadingPlan(null);
    }
  }

  // ── Delete plan ─────────────────────────────────────────────────────────────
  async function deletePlan(planId: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        setLibrary(prev => prev.filter(p => p.id !== planId));
        setExpanded(prev => { const n = new Set(prev); n.delete(planId); return n; });
        setPlanData(prev => { const n = { ...prev }; delete n[planId]; return n; });
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  // ── Inline rename ───────────────────────────────────────────────────────────
  function startEditing(plan: LibraryPlan) {
    setConfirmDelete(null);
    setEditingPlanId(plan.id);
    setEditingName(plan.name);
  }

  async function savePlanName(planId: string) {
    const name = editingName.trim();
    setEditingPlanId(null);
    if (!name) return;
    const current = library.find(p => p.id === planId)?.name;
    if (name === current) return;
    const res = await fetch(`/api/trainer/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setLibrary(prev => prev.map(p => p.id === planId ? { ...p, name } : p));
    }
  }

  // ── Exercise add/remove ─────────────────────────────────────────────────────
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
        const pid = addingPlanId, did = addingDayId;
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
    setAssignPanel(null);
    setConfirmDelete(null);
    setAddingPlanId(planId);
    setAddingDayId(dayId);
    setAddSection("main");
    setSearch("");
  }

  // ── Assignment ──────────────────────────────────────────────────────────────
  function openAssignPanel(planId: string, dayId: string) {
    if (assignPanel?.dayId === dayId && assignPanel.planId === planId) {
      setAssignPanel(null);
      return;
    }
    setAddingDayId(null);
    setAddingPlanId(null);
    setConfirmDelete(null);
    setAssignPanel({ planId, dayId });
    setAssignDow(null);
    setAssignClientIds(new Set());
  }

  async function assign() {
    if (!assignPanel || !assignDow || !assignClientIds.size) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/trainer/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayMappings: [{ planDayId: assignPanel.dayId, dayOfWeek: assignDow }],
          clientIds: [...assignClientIds],
        }),
      });
      const data = await res.json() as { created: number };
      setToast(`${data.created} bloque${data.created !== 1 ? "s" : ""} asignado${data.created !== 1 ? "s" : ""} a ${assignClientIds.size} alumno${assignClientIds.size !== 1 ? "s" : ""}`);
      setAssignPanel(null);
    } finally {
      setAssigning(false);
    }
  }

  const filtered = search.trim()
    ? catalog.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : catalog.slice(0, 20);

  return (
    <div className="flex flex-col gap-4">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xl"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
          {toast}
          <button type="button" onClick={() => setToast(null)} style={{ color: "var(--text-3)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {library.map(plan => {
        const cat      = CAT[plan.category] ?? CAT.musculación!;
        const isOpen   = expanded.has(plan.id);
        const loading  = loadingPlan === plan.id;
        const detail   = planData[plan.id];
        const hasError = errorPlan === plan.id;
        const isConfirmingDelete = confirmDelete === plan.id;

        return (
          <div key={plan.id} className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${isOpen ? cat.color : "var(--border)"}`, background: "var(--bg-panel)" }}>

            {/* Plan header */}
            <div className="flex items-center gap-3 px-4 py-4">

              {/* Icon — click expande/colapsa */}
              <button type="button" onClick={() => togglePlan(plan.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                {plan.category === "calentamiento"
                  ? <Flame className="h-4 w-4" style={{ color: cat.color }} />
                  : <Dumbbell className="h-4 w-4" style={{ color: cat.color }} />}
              </button>

              {/* Nombre — click edita inline */}
              <div className="flex-1 min-w-0">
                {editingPlanId === plan.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); savePlanName(plan.id); }
                        if (e.key === "Escape") { e.preventDefault(); setEditingPlanId(null); }
                      }}
                      onBlur={() => savePlanName(plan.id)}
                      className="flex-1 min-w-0 font-extrabold bg-transparent outline-none text-sm pb-0.5"
                      style={{ color: "var(--text)", borderBottom: `1.5px solid ${cat.color}` }}
                    />
                    <button type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => savePlanName(plan.id)}
                      className="p-1 rounded-lg shrink-0 cursor-pointer"
                      style={{ color: cat.color }}>
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => setEditingPlanId(null)}
                      className="p-1 rounded-lg shrink-0 cursor-pointer"
                      style={{ color: "var(--text-3)" }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => startEditing(plan)}
                    className="flex items-center gap-1.5 group w-full text-left"
                    title="Clic para editar el nombre">
                    <p className="font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>
                      {plan.name}
                    </p>
                    <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
                      style={{ color: "var(--text-3)" }} />
                  </button>
                )}

                {/* Meta — click expande */}
                <button type="button" onClick={() => togglePlan(plan.id)}
                  className="flex items-center gap-2 mt-0.5 cursor-pointer">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {plan.days.length} día{plan.days.length !== 1 ? "s" : ""}
                  </span>
                </button>
              </div>

              {/* Acciones: eliminar + expandir */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>¿Eliminar?</span>
                    <button type="button" onClick={() => deletePlan(plan.id)} disabled={deleting}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }}>
                      {deleting ? "…" : "Sí"}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(null)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      style={{ background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                      No
                    </button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => { setConfirmDelete(plan.id); setExpanded(prev => { const n = new Set(prev); n.delete(plan.id); return n; }); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-colors"
                    style={{ color: "var(--text-3)" }}
                    title="Eliminar rutina"
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.10)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {!isConfirmingDelete && (
                  <button type="button" onClick={() => togglePlan(plan.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
                    style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                    {loading
                      ? <span className="text-[10px]" style={{ color: "var(--text-3)" }}>…</span>
                      : hasError
                        ? <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
                        : isOpen
                          ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
                          : <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded */}
            {isOpen && detail && (
              <div style={{ borderTop: `1px solid ${cat.border}` }}>
                {detail.days.map((day, dayIdx) => {
                  const warmup       = day.exercises.filter(e => e.section === "warmup");
                  const main         = day.exercises.filter(e => e.section === "main");
                  const isAddingHere = addingDayId === day.id && addingPlanId === plan.id;
                  const isAssigning  = assignPanel?.dayId === day.id && assignPanel.planId === plan.id;

                  return (
                    <div key={day.id}
                      style={{ borderBottom: dayIdx < detail.days.length - 1 ? "1px solid var(--border)" : "none" }}>

                      {/* Day header */}
                      <div className="flex items-center gap-3 px-4 py-3"
                        style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                          style={{ background: cat.bg, color: cat.color }}>
                          D{day.dayNumber}
                        </span>
                        <span className="font-bold text-sm flex-1 min-w-0 truncate" style={{ color: "var(--text)" }}>
                          {day.name ?? `Día ${day.dayNumber}`}
                        </span>
                        <span className="text-xs shrink-0 hidden sm:block" style={{ color: "var(--text-3)" }}>
                          {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
                        </span>
                        <button type="button"
                          onClick={() => openAssignPanel(plan.id, day.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-all"
                          style={{
                            background: isAssigning ? cat.color : cat.bg,
                            color: isAssigning ? "#000" : cat.color,
                            border: `1px solid ${cat.border}`,
                          }}>
                          <Users className="h-3 w-3" />
                          Asignar
                        </button>
                      </div>

                      <div className="px-4 py-3 flex flex-col gap-2">
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

                        {day.exercises.length === 0 && !isAssigning && !isAddingHere && (
                          <p className="text-xs py-1 text-center" style={{ color: "var(--text-3)" }}>
                            Sin ejercicios todavía
                          </p>
                        )}

                        {/* ── Assign panel ────────────────────────────────── */}
                        {isAssigning && (
                          <div className="rounded-xl p-4 flex flex-col gap-4 mt-1"
                            style={{ border: `1px solid ${cat.color}`, background: "var(--bg)" }}>

                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-wider mb-2"
                                style={{ color: "var(--text-3)" }}>¿Qué día de la semana?</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {DAYS_WEEK.map(({ dow, label }) => {
                                  const sel = assignDow === dow;
                                  return (
                                    <button key={dow} type="button"
                                      onClick={() => setAssignDow(sel ? null : dow)}
                                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all"
                                      style={{
                                        background: sel ? cat.color : "var(--bg-panel)",
                                        color: sel ? "#000" : "var(--text-3)",
                                        border: `1px solid ${sel ? cat.color : "var(--border)"}`,
                                      }}>
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-extrabold uppercase tracking-wider"
                                  style={{ color: "var(--text-3)" }}>¿A qué alumnos?</p>
                                {clients.length > 0 && (
                                  <button type="button"
                                    onClick={() => setAssignClientIds(new Set(clients.map(c => c.id)))}
                                    className="text-xs font-bold cursor-pointer"
                                    style={{ color: cat.color }}>
                                    Todos
                                  </button>
                                )}
                              </div>
                              {clients.length === 0 ? (
                                <p className="text-sm py-2" style={{ color: "var(--text-3)" }}>
                                  No hay alumnos aprobados.
                                </p>
                              ) : (
                                <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                                  {clients.map(client => {
                                    const sel = assignClientIds.has(client.id);
                                    return (
                                      <button key={client.id} type="button"
                                        onClick={() => setAssignClientIds(prev => {
                                          const n = new Set(prev);
                                          n.has(client.id) ? n.delete(client.id) : n.add(client.id);
                                          return n;
                                        })}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-all"
                                        style={{
                                          background: sel ? cat.bg : "var(--bg-panel)",
                                          border: `1px solid ${sel ? cat.border : "var(--border)"}`,
                                        }}>
                                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                          style={{ background: sel ? cat.color : "var(--bg-hover)", border: `1px solid ${sel ? cat.color : "var(--border)"}` }}>
                                          {sel && <Check className="h-2.5 w-2.5" style={{ color: "#000" }} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                                            {client.name}
                                          </p>
                                          <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                                            {client.email}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button type="button" onClick={() => setAssignPanel(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                                style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                                Cancelar
                              </button>
                              <button type="button" onClick={assign}
                                disabled={assigning || !assignDow || assignClientIds.size === 0}
                                className="flex-1 py-2 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-40"
                                style={{ background: cat.color, color: "#000" }}>
                                {assigning
                                  ? "Asignando…"
                                  : `Asignar a ${assignClientIds.size} alumno${assignClientIds.size !== 1 ? "s" : ""} →`}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Add exercise button / panel ──────────────────── */}
                        {isAddingHere ? (
                          <div className="rounded-xl p-3 flex flex-col gap-3 mt-1"
                            style={{ border: `1px solid ${cat.color}`, background: "var(--bg-hover)" }}>
                            <div className="flex gap-2">
                              {(["main", "warmup"] as const).map(s => (
                                <button key={s} type="button" onClick={() => setAddSection(s)}
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
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                                style={{ color: "var(--text-3)" }} />
                              <input autoFocus placeholder="Buscar ejercicio…" value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
                                onFocus={e => (e.currentTarget.style.borderColor = cat.color)}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                            </div>
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                              {!catalogLoaded && <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>Cargando…</p>}
                              {catalogLoaded && filtered.length === 0 && <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>Sin resultados</p>}
                              {filtered.map(item => (
                                <button key={item.id} type="button" onClick={() => addExercise(item)} disabled={saving}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-semibold cursor-pointer"
                                  style={{ background: "var(--bg-panel)", color: "var(--text)", border: "1px solid var(--border)" }}
                                  onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
                                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                                  <span className="flex-1 truncate">{item.name}</span>
                                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>{item.muscleGroup}</span>
                                </button>
                              ))}
                            </div>
                            <button type="button" onClick={() => { setAddingDayId(null); setAddingPlanId(null); }}
                              className="text-xs text-center cursor-pointer" style={{ color: "var(--text-3)" }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => openAdd(plan.id, day.id)}
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
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay rutinas creadas todavía.</p>
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ ex, accent, onRemove }: { ex: ExerciseItem; accent: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
        {ex.exerciseName}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>{ex.sets}×{ex.reps}</span>
        {ex.weightKg && <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>{ex.weightKg} kg</span>}
      </div>
      {ex.notes && (
        <span className="text-xs truncate max-w-[100px] hidden sm:block" style={{ color: "var(--text-3)" }}>
          {ex.notes}
        </span>
      )}
      <button type="button" onClick={onRemove}
        className="p-1 rounded-lg shrink-0 cursor-pointer transition-colors"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
