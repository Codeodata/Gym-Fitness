"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown, ChevronUp, Dumbbell, Flame, Plus, Trash2, Search, Users, Check, X, AlertTriangle, Pencil, UserPlus,
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

const DOW_LABEL: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie" };

type DayAssignment  = { clientId: string; clientName: string | null; dayOfWeek: number };
type StudentSlot    = { dayOfWeek: number; startTime: string; type: string };
type StudentInfo    = { clientId: string; clientName: string | null; slots: StudentSlot[] };
type ExerciseItem   = { id: string; planDayId: string; section: "warmup" | "main"; sets: number; reps: string; weightKg: string | null; notes: string | null; exerciseName: string; muscleGroup: string; orderIndex: number };
type DayItem        = { id: string; dayNumber: number; name: string | null; exercises: ExerciseItem[] };
type PlanDetail     = { days: DayItem[] };
type LibraryDay     = { id: string; name: string | null; dayNumber: number; exerciseCount: number; assignments: DayAssignment[] };
type LibraryPlan    = { id: string; name: string; category: string; assignedStudentCount: number; students: StudentInfo[]; days: LibraryDay[] };
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

  // Assign panel search
  const [assignSearch, setAssignSearch] = useState("");

  // Unassign student
  const [unassigning, setUnassigning] = useState<string | null>(null); // clientId being removed

  // Agregar alumno (nivel rutina)
  const [addStudentsPlanId, setAddStudentsPlanId] = useState<string | null>(null);
  const [selStudents, setSelStudents] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [addingStudents, setAddingStudents] = useState(false);

  function openAddStudents(planId: string) {
    if (addStudentsPlanId === planId) { setAddStudentsPlanId(null); return; }
    setAssignPanel(null);
    setAddingPlanId(null);
    setAddingDayId(null);
    setConfirmDelete(null);
    setAddStudentsPlanId(planId);
    setSelStudents(new Set());
    setStudentSearch("");
  }

  function toggleSelStudent(id: string) {
    setSelStudents((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function assignStudentsToPlan(plan: LibraryPlan) {
    if (addingStudents || selStudents.size === 0) return;
    setAddingStudents(true);
    try {
      // Rutina completa: cada día del plan → un día de la semana (Lun..Vie por orden)
      const dayMappings = plan.days.map((d, i) => ({ planDayId: d.id, dayOfWeek: (i % 5) + 1 }));
      const res = await fetch("/api/trainer/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayMappings, clientIds: [...selStudents] }),
      });
      if (res.ok) {
        setLibrary((prev) => prev.map((p) => {
          if (p.id !== plan.id) return p;
          const existing = new Set(p.students.map((s) => s.clientId));
          const toAdd = [...selStudents]
            .filter((id) => !existing.has(id))
            .map((id) => ({ clientId: id, clientName: clients.find((c) => c.id === id)?.name ?? null, slots: [] }));
          const students = [...p.students, ...toAdd].sort((a, b) => (a.clientName ?? "").localeCompare(b.clientName ?? ""));
          return { ...p, students, assignedStudentCount: students.length };
        }));
        const n = selStudents.size;
        setToast(`${n} alumno${n !== 1 ? "s" : ""} asignado${n !== 1 ? "s" : ""} a ${plan.name}`);
        setAddStudentsPlanId(null);
        setSelStudents(new Set());
        setStudentSearch("");
      }
    } finally {
      setAddingStudents(false);
    }
  }

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
  function updateExercise(planId: string, dayId: string, exerciseId: string, patch: { sets?: number; reps?: string; weightKg?: string | null }) {
    setPlanData(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId]!,
        days: prev[planId]!.days.map(d =>
          d.id !== dayId ? d : {
            ...d,
            exercises: d.exercises.map(e =>
              e.id !== exerciseId ? e : {
                ...e,
                sets: patch.sets ?? e.sets,
                reps: patch.reps ?? e.reps,
                weightKg: patch.weightKg !== undefined ? patch.weightKg : e.weightKg,
              }
            ),
          }
        ),
      },
    }));
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
    setAssignSearch("");
  }

  async function unassignStudent(planId: string, clientId: string) {
    setUnassigning(clientId);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}/students`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        setLibrary(prev => prev.map(p =>
          p.id !== planId ? p : {
            ...p,
            assignedStudentCount: p.assignedStudentCount - 1,
            students: p.students.filter(s => s.clientId !== clientId),
          }
        ));
      }
    } finally {
      setUnassigning(null);
    }
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
        <div className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xl"
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
                    className="flex items-center gap-2 w-full text-left"
                    title="Tocá para editar el nombre">
                    <p className="font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>
                      {plan.name}
                    </p>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cat.bg, color: cat.color }}>
                      <Pencil className="h-3 w-3" />
                    </span>
                  </button>
                )}

                {/* Meta — click expande */}
                <button type="button" onClick={() => togglePlan(plan.id)}
                  className="flex items-center gap-2 mt-0.5 cursor-pointer flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {plan.days.length} día{plan.days.length !== 1 ? "s" : ""}
                  </span>
                  {plan.assignedStudentCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      <Users className="h-3 w-3" />
                      {plan.assignedStudentCount} alumno{plan.assignedStudentCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              </div>

              {/* Acciones: editar (expandir) + eliminar */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold hidden sm:inline" style={{ color: "#ef4444" }}>¿Eliminar?</span>
                    <button type="button" onClick={() => deletePlan(plan.id)} disabled={deleting}
                      className="h-9 px-3 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", touchAction: "manipulation" }}>
                      {deleting ? "…" : "Sí, eliminar"}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(null)}
                      className="h-9 px-3 rounded-xl text-xs font-bold cursor-pointer"
                      style={{ background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)", touchAction: "manipulation" }}>
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => togglePlan(plan.id)}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-extrabold cursor-pointer"
                      style={{
                        background: isOpen ? cat.color : cat.bg,
                        color: isOpen ? "#000" : cat.color,
                        border: `1px solid ${cat.border}`,
                        touchAction: "manipulation",
                      }}
                      title={isOpen ? "Cerrar edición" : "Editar rutina"}>
                      {loading
                        ? <span className="text-[10px]">…</span>
                        : hasError
                          ? <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
                          : <Pencil className="h-3.5 w-3.5" />}
                      <span>{isOpen ? "Cerrar" : "Editar"}</span>
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button"
                      onClick={() => { setConfirmDelete(plan.id); setExpanded(prev => { const n = new Set(prev); n.delete(plan.id); return n; }); }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer shrink-0"
                      style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", touchAction: "manipulation" }}
                      title="Eliminar rutina">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Expanded */}
            {isOpen && detail && (
              <div className="reveal-down" style={{ borderTop: `1px solid ${cat.border}` }}>

                {/* ── Alumnos asignados (siempre visible al expandir) ── */}
                {(() => {
                  const isAddingStudentsHere = addStudentsPlanId === plan.id;
                  const filteredStudents = studentSearch.trim()
                    ? clients.filter((c) => c.name.toLowerCase().includes(studentSearch.toLowerCase()))
                    : clients;
                  return (
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Users className="h-3.5 w-3.5" style={{ color: cat.color }} />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider flex-1" style={{ color: "var(--text-3)" }}>
                        Alumnos con esta rutina ({plan.students.length})
                      </span>
                      <button type="button" onClick={() => openAddStudents(plan.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                        style={isAddingStudentsHere
                          ? { background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)" }
                          : { background: "var(--accent)", color: "var(--accent-fg)" }}>
                        {isAddingStudentsHere ? <><X className="h-3 w-3" />Cerrar</> : <><UserPlus className="h-3 w-3" />Agregar alumno</>}
                      </button>
                    </div>

                    {plan.students.length === 0 && !isAddingStudentsHere && (
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
                        Nadie tiene esta rutina todavía. Tocá <span style={{ color: cat.color, fontWeight: 700 }}>Agregar alumno</span>.
                      </p>
                    )}

                    {plan.students.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {plan.students.map(s => (
                        <div key={s.clientId}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl group"
                          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-extrabold"
                            style={{ background: cat.bg, color: cat.color }}>
                            {s.clientName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold flex-1 min-w-0 truncate" style={{ color: "var(--text)" }}>
                            {s.clientName}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {s.slots.length === 0 ? (
                              <span className="text-[10px]" style={{ color: "var(--text-3)" }}>—</span>
                            ) : (
                              s.slots.slice(0, 2).map((slot, i) => (
                                <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                                  style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
                                  <span style={{ color: cat.color }}>{DOW_LABEL[slot.dayOfWeek]}</span>
                                  {" "}{slot.startTime}
                                </span>
                              ))
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={unassigning === s.clientId}
                            onClick={() => unassignStudent(plan.id, s.clientId)}
                            className="opacity-50 group-hover:opacity-100 p-0.5 rounded-md shrink-0 cursor-pointer transition-opacity disabled:opacity-50"
                            style={{ color: "var(--text-3)" }}
                            title="Quitar de esta rutina"
                            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
                            {unassigning === s.clientId
                              ? <span className="text-[10px]">…</span>
                              : <X className="h-3 w-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                    )}

                    {isAddingStudentsHere && (
                      <div className="reveal-down rounded-xl p-3 flex flex-col gap-3 mt-2.5"
                        style={{ border: `1px solid ${cat.color}`, background: "var(--bg-panel)" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Elegí alumnos</p>
                          {clients.length > 0 && (
                            <button type="button" onClick={() => setSelStudents(new Set(filteredStudents.map((c) => c.id)))}
                              className="text-xs font-bold cursor-pointer" style={{ color: cat.color }}>Todos</button>
                          )}
                        </div>
                        {clients.length === 0 ? (
                          <p className="text-sm py-1" style={{ color: "var(--text-3)" }}>No hay alumnos aprobados.</p>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
                              <input autoFocus placeholder="Buscar alumno…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = cat.color)}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                              {filteredStudents.map((c) => {
                                const sel = selStudents.has(c.id);
                                const already = plan.students.some((s) => s.clientId === c.id);
                                return (
                                  <button key={c.id} type="button" onClick={() => toggleSelStudent(c.id)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-left transition-all"
                                    style={{ background: sel ? cat.bg : "var(--bg)", border: `1px solid ${sel ? cat.color : "var(--border)"}` }}>
                                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                      style={{ background: sel ? cat.color : "var(--bg-hover)", border: `1px solid ${sel ? cat.color : "var(--border)"}` }}>
                                      {sel && <Check className="h-2.5 w-2.5" style={{ color: "#000" }} />}
                                    </div>
                                    <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{c.name}</span>
                                    {already && <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: "var(--text-3)" }}>ya está</span>}
                                  </button>
                                );
                              })}
                              {filteredStudents.length === 0 && (
                                <p className="text-xs col-span-full text-center py-2" style={{ color: "var(--text-3)" }}>Sin resultados</p>
                              )}
                            </div>
                            <button type="button" onClick={() => assignStudentsToPlan(plan)} disabled={addingStudents || selStudents.size === 0}
                              className="w-full py-2.5 rounded-xl text-sm font-extrabold cursor-pointer transition-all disabled:opacity-40"
                              style={{ background: cat.color, color: "#000" }}>
                              {addingStudents
                                ? "Asignando…"
                                : selStudents.size === 0
                                  ? "Seleccioná alumnos"
                                  : `Asignar a ${selStudents.size} alumno${selStudents.size !== 1 ? "s" : ""} →`}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })()}

                {detail.days.map((day, dayIdx) => {
                  const warmup       = day.exercises.filter(e => e.section === "warmup");
                  const main         = day.exercises.filter(e => e.section === "main");
                  const isAddingHere = addingDayId === day.id && addingPlanId === plan.id;
                  const isAssigning  = assignPanel?.dayId === day.id && assignPanel.planId === plan.id;

                  return (
                    <div key={day.id}
                      style={{ borderBottom: dayIdx < detail.days.length - 1 ? "1px solid var(--border)" : "none" }}>

                      {/* Day header */}
                      <div className="px-4 py-3"
                        style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-3">
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
                                <ExerciseRow key={ex.id} ex={ex} accent="var(--c-orange)" planId={plan.id}
                                  onRemove={() => removeExercise(plan.id, day.id, ex.id)}
                                  onUpdate={patch => updateExercise(plan.id, day.id, ex.id, patch)} />
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
                                <ExerciseRow key={ex.id} ex={ex} accent="var(--accent)" planId={plan.id}
                                  onRemove={() => removeExercise(plan.id, day.id, ex.id)}
                                  onUpdate={patch => updateExercise(plan.id, day.id, ex.id, patch)} />
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
                          <div className="reveal-down rounded-xl p-4 flex flex-col gap-4 mt-1"
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
                                    onClick={() => {
                                      const visible = clients.filter(c =>
                                        !assignSearch.trim() || c.name.toLowerCase().includes(assignSearch.toLowerCase())
                                      );
                                      setAssignClientIds(new Set(visible.map(c => c.id)));
                                    }}
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
                                <>
                                  <div className="relative mb-2">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3"
                                      style={{ color: "var(--text-3)" }} />
                                    <input
                                      placeholder="Buscar alumno…"
                                      value={assignSearch}
                                      onChange={e => setAssignSearch(e.target.value)}
                                      className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none"
                                      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
                                      onFocus={e => (e.currentTarget.style.borderColor = cat.color)}
                                      onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                                    {clients
                                      .filter(c => !assignSearch.trim() || c.name.toLowerCase().includes(assignSearch.toLowerCase()))
                                      .map(client => {
                                        const sel = assignClientIds.has(client.id);
                                        return (
                                          <button key={client.id} type="button"
                                            onClick={() => setAssignClientIds(prev => {
                                              const n = new Set(prev);
                                              n.has(client.id) ? n.delete(client.id) : n.add(client.id);
                                              return n;
                                            })}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-left transition-all"
                                            style={{
                                              background: sel ? cat.bg : "var(--bg-panel)",
                                              border: `1px solid ${sel ? cat.border : "var(--border)"}`,
                                            }}>
                                            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                              style={{ background: sel ? cat.color : "var(--bg-hover)", border: `1px solid ${sel ? cat.color : "var(--border)"}` }}>
                                              {sel && <Check className="h-2.5 w-2.5" style={{ color: "#000" }} />}
                                            </div>
                                            <span className="text-sm font-semibold truncate flex-1 min-w-0" style={{ color: "var(--text)" }}>
                                              {client.name}
                                            </span>
                                          </button>
                                        );
                                      })}
                                  </div>
                                </>
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
                          <div className="reveal-down rounded-xl p-3 flex flex-col gap-3 mt-1"
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

function ExerciseRow({
  ex, accent, planId, onRemove, onUpdate,
}: {
  ex: ExerciseItem;
  accent: string;
  planId: string;
  onRemove: () => void;
  onUpdate: (patch: { sets?: number; reps?: string; weightKg?: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(String(ex.sets));
  const [reps, setReps] = useState(ex.reps);
  const [weight, setWeight] = useState(ex.weightKg ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const parsedSets = parseInt(sets, 10);
    if (!reps.trim() || isNaN(parsedSets) || parsedSets < 1) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetch(`/api/trainer/plans/${planId}/exercises`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planExerciseId: ex.id,
          sets: parsedSets,
          reps: reps.trim(),
          weightKg: weight.trim() || null,
        }),
      });
      onUpdate({ sets: parsedSets, reps: reps.trim(), weightKg: weight.trim() || null });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--bg-hover)", border: `1px solid ${accent}` }}>
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
          {ex.exerciseName}
        </span>
        <input
          type="number" min={1} max={20} value={sets}
          onChange={e => setSets(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          className="w-10 text-center text-xs font-bold rounded-lg px-1 py-1 outline-none tabular-nums"
          style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, color: accent }}
          title="Series"
        />
        <span className="text-xs" style={{ color: "var(--text-3)" }}>×</span>
        <input
          type="text" value={reps}
          onChange={e => setReps(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          className="w-14 text-center text-xs font-bold rounded-lg px-1 py-1 outline-none"
          style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, color: accent }}
          title="Repeticiones"
        />
        <input
          type="text" value={weight} placeholder="kg"
          onChange={e => setWeight(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          className="w-14 text-center text-xs rounded-lg px-1 py-1 outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-3)" }}
          title="Peso (kg)"
        />
        <button type="button" onClick={save} disabled={saving}
          className="p-1 rounded-lg cursor-pointer shrink-0"
          style={{ color: accent }}>
          <Check className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => setEditing(false)}
          className="p-1 rounded-lg cursor-pointer shrink-0"
          style={{ color: "var(--text-3)" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
      onClick={() => setEditing(true)}
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
      title="Clic para editar">
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
        {ex.exerciseName}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>{ex.sets}×{ex.reps}</span>
        {ex.weightKg && (
          <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md"
            style={{ background: "var(--bg-panel)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
            {ex.weightKg} kg
          </span>
        )}
      </div>
      <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
        title="Quitar ejercicio"
        className="opacity-50 group-hover:opacity-100 p-1 rounded-lg shrink-0 cursor-pointer transition-opacity"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
