"use client";

import { useState, useEffect } from "react";
import { Plus, X, Flame, Dumbbell, ChevronDown, ChevronUp, Users, Check, Trash2, Search } from "lucide-react";
import Link from "next/link";

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

const DAY_ACCENT: Record<number, { color: string; bg: string }> = {
  1: { color: "#60a5fa",  bg: "rgba(96,165,250,0.08)"  },
  2: { color: "#c084fc",  bg: "rgba(192,132,252,0.08)" },
  3: { color: "#fb923c",  bg: "rgba(251,146,60,0.08)"  },
  4: { color: "#f472b6",  bg: "rgba(244,114,182,0.08)" },
  5: { color: "#4ade80",  bg: "rgba(74,222,128,0.08)"  },
};

type TemplateBlock = {
  uid: string;
  dayOfWeek: number;
  planDayId: string;
  planDayName: string | null;
  planName: string;
  planCategory: string;
};

type ClassSlot = { id: string; dayOfWeek: number; startTime: string; type: string };
type SlotEnrollment = { slotId: string; clientId: string; clientName: string | null };
type SummaryStudent = { clientId: string; clientName: string | null };
type SummaryExercise = { planDayId: string; section: "warmup" | "main"; orderIndex: number; sets: number; reps: string; weightKg: string | null; exerciseName: string; muscleGroup: string };
type WeekSummaryItem = { dayOfWeek: number; planDayId: string; planDayName: string | null; dayNumber: number; planId: string; planName: string; planCategory: string; studentCount: number; students: SummaryStudent[]; exercises: SummaryExercise[] };

type LibraryDay  = { id: string; name: string | null; dayNumber: number; exerciseCount: number };
type LibraryPlan = { id: string; name: string; category: string; days: LibraryDay[] };
type Client      = { id: string; name: string; email: string };

type ExerciseForEdit = {
  id: string; planDayId: string; section: "warmup" | "main";
  sets: number; reps: string; weightKg: string | null; notes: string | null;
  exerciseName: string; muscleGroup: string; orderIndex: number;
};
type PlanExData = { days: { id: string; dayNumber: number; name: string | null; exercises: ExerciseForEdit[] }[] };
type CatalogItem = { id: string; name: string; muscleGroup: string };

type Props = { clients: Client[] };

export function TemplateWeekBuilder({ clients }: Props) {
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [library, setLibrary] = useState<LibraryPlan[]>([]);
  const [activeDow, setActiveDow] = useState<number | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [assignMode, setAssignMode] = useState<"alumnos" | "turnos">("alumnos");
  const [classSlots, setClassSlots] = useState<ClassSlot[]>([]);
  const [slotEnrollments, setSlotEnrollments] = useState<SlotEnrollment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsFetched, setSlotsFetched] = useState(false);
  const [weekSummary, setWeekSummary] = useState<WeekSummaryItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const todayDow = ((): number => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d : 1; })();
  const [agendaDow, setAgendaDow] = useState<number>(todayDow);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Per-plan exercise data
  const [planExData, setPlanExData] = useState<Record<string, PlanExData>>({});
  const [loadingPlanEx, setLoadingPlanEx] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [addExDayId, setAddExDayId] = useState<string | null>(null);
  const [addExPlanId, setAddExPlanId] = useState<string | null>(null);
  const [addExSection, setAddExSection] = useState<"main" | "warmup">("main");
  const [addExSearch, setAddExSearch] = useState("");
  const [savingEx, setSavingEx] = useState(false);

  useEffect(() => {
    fetch("/api/trainer/plan-library")
      .then(r => r.json())
      .then(d => setLibrary(d.library ?? []));
    fetch("/api/trainer/exercises")
      .then(r => r.json())
      .then((d: CatalogItem[]) => { setCatalog(d); setCatalogLoaded(true); })
      .catch(() => setCatalogLoaded(true));
    fetch("/api/trainer/weekly-schedule/summary")
      .then(r => r.json())
      .then(d => setWeekSummary(d.summary ?? []))
      .finally(() => setLoadingSummary(false));
  }, []);

  function addBlock(plan: LibraryPlan, day: LibraryDay) {
    if (!activeDow) return;
    setBlocks(prev => [...prev, {
      uid: `${Date.now()}-${Math.random()}`,
      dayOfWeek: activeDow,
      planDayId: day.id,
      planDayName: day.name,
      planName: plan.name,
      planCategory: plan.category,
    }]);
  }

  function removeBlock(uid: string) {
    setBlocks(prev => prev.filter(b => b.uid !== uid));
  }

  function togglePlan(id: string) {
    const isExpanding = !expandedPlans.has(id);
    setExpandedPlans(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    if (isExpanding) loadPlanEx(id);
  }

  function toggleClient(id: string) {
    setSelectedClients(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function clearTemplate() {
    setBlocks([]);
    setActiveDow(null);
  }

  async function fetchSlots() {
    if (slotsFetched) return;
    setLoadingSlots(true);
    try {
      const res = await fetch("/api/trainer/class-slots");
      const data = await res.json() as { slots: ClassSlot[]; enrollments: SlotEnrollment[] };
      setClassSlots(data.slots);
      setSlotEnrollments(data.enrollments);
      setSlotsFetched(true);
    } finally {
      setLoadingSlots(false);
    }
  }

  function getSlotClientIds(slotId: string) {
    return slotEnrollments
      .filter(e => e.slotId === slotId)
      .map(e => e.clientId)
      .filter(id => clients.some(c => c.id === id));
  }

  function isSlotFullySelected(slotId: string) {
    const ids = getSlotClientIds(slotId);
    return ids.length > 0 && ids.every(id => selectedClients.has(id));
  }

  function isSlotPartiallySelected(slotId: string) {
    const ids = getSlotClientIds(slotId);
    return ids.some(id => selectedClients.has(id)) && !isSlotFullySelected(slotId);
  }

  function toggleSlot(slotId: string) {
    const ids = getSlotClientIds(slotId);
    const allSelected = isSlotFullySelected(slotId);
    setSelectedClients(prev => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }

  async function assign() {
    const dayMappings = blocks.map(b => ({ planDayId: b.planDayId, dayOfWeek: b.dayOfWeek }));
    if (!dayMappings.length) { setToast("Armá la semana antes de asignar."); return; }
    if (!selectedClients.size) { setToast("Seleccioná al menos un alumno."); return; }
    setAssigning(true);
    try {
      const res = await fetch("/api/trainer/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayMappings, clientIds: [...selectedClients] }),
      });
      const data = await res.json() as { created: number };
      setToast(`✓ ${data.created} bloque${data.created !== 1 ? "s" : ""} asignados a ${selectedClients.size} alumno${selectedClients.size !== 1 ? "s" : ""}.`);
      clearTemplate();
      setSelectedClients(new Set());
    } finally { setAssigning(false); }
  }

  // ── Per-plan exercise loading ────────────────────────────────────────────────
  async function loadPlanEx(planId: string) {
    if (planExData[planId]) return;
    setLoadingPlanEx(planId);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as {
        days: { id: string; dayNumber: number; name: string | null }[];
        exercises: (ExerciseForEdit & { planDayId: string })[];
      };
      const exByDay = (data.exercises ?? []).reduce<Record<string, ExerciseForEdit[]>>((acc, ex) => {
        (acc[ex.planDayId] ??= []).push(ex);
        return acc;
      }, {});
      setPlanExData(prev => ({
        ...prev,
        [planId]: {
          days: (data.days ?? []).map(d => ({
            ...d,
            exercises: (exByDay[d.id] ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
          })),
        },
      }));
    } catch {
      // silently fail — exercises won't show but plan stays expanded
    } finally {
      setLoadingPlanEx(null);
    }
  }

  async function removeExercise(planId: string, dayId: string, exerciseId: string) {
    setPlanExData(prev => ({
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
    if (!addExDayId || !addExPlanId || savingEx) return;
    setSavingEx(true);
    try {
      const res = await fetch(`/api/trainer/plans/${addExPlanId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDayId: addExDayId,
          exerciseName: item.name,
          section: addExSection,
          sets: addExSection === "main" ? 3 : 1,
          reps: "10",
        }),
      });
      if (res.ok) {
        const data = await res.json() as { exercise: ExerciseForEdit };
        const pid = addExPlanId, did = addExDayId;
        setPlanExData(prev => ({
          ...prev,
          [pid]: {
            ...prev[pid]!,
            days: prev[pid]!.days.map(d =>
              d.id === did ? { ...d, exercises: [...d.exercises, data.exercise] } : d
            ),
          },
        }));
        setAddExDayId(null);
        setAddExPlanId(null);
        setAddExSearch("");
      }
    } finally {
      setSavingEx(false);
    }
  }

  const blocksForDay = (dow: number) => blocks.filter(b => b.dayOfWeek === dow);
  const totalBlocks = blocks.length;

  return (
    <div className="flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xl"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
          {toast}
          <button type="button" onClick={() => setToast(null)} style={{ color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Agenda del día — existing assignments from DB, day-focused */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
        <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>
            Agenda del día
          </span>
          <span className="text-xs hidden sm:inline" style={{ color: "var(--text-3)" }}>
            — qué entrena cada alumno, día por día
          </span>
        </div>

        {/* Day tabs */}
        <div className="grid grid-cols-5" style={{ borderBottom: "1px solid var(--border)" }}>
          {DAYS.map(({ dow, short, label }, idx) => {
            const count = weekSummary.filter(s => s.dayOfWeek === dow).length;
            const isActive = agendaDow === dow;
            const isToday = dow === todayDow;
            const da = DAY_ACCENT[dow]!;
            return (
              <button key={dow} type="button" onClick={() => setAgendaDow(dow)}
                className="px-2 py-3 text-center cursor-pointer transition-all duration-200"
                style={{
                  borderRight: idx < 4 ? "1px solid var(--border)" : "none",
                  borderTop: `3px solid ${isActive ? da.color : "transparent"}`,
                  background: isActive ? da.bg : "transparent",
                }}>
                <span className="text-xs font-extrabold uppercase tracking-wider block"
                  style={{ color: isActive ? da.color : "var(--text-3)" }}>{short}</span>
                <span className="text-[10px] hidden sm:block mt-0.5"
                  style={{ color: isActive ? da.color : "var(--text-3)", opacity: 0.7 }}>
                  {isToday ? "Hoy" : label}
                </span>
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold mt-1.5"
                  style={{
                    background: count > 0 ? (isActive ? da.color : "var(--bg-hover)") : "transparent",
                    color: count > 0 ? (isActive ? "#000" : "var(--text-3)") : "var(--text-3)",
                  }}>
                  {count > 0 ? count : "—"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day detail */}
        {loadingSummary ? (
          <div className="p-5 flex flex-col gap-3">
            {[0, 1].map(i => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--bg-hover)" }} />
            ))}
          </div>
        ) : (() => {
          const dayItems = weekSummary.filter(s => s.dayOfWeek === agendaDow);
          if (dayItems.length === 0) {
            return (
              <div key={agendaDow} className="soft-fade px-5 py-10 text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  Nada asignado el {DAYS.find(d => d.dow === agendaDow)?.label.toLowerCase()}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                  Armá el template de abajo y asignalo a tus alumnos.
                </p>
              </div>
            );
          }
          return (
            <div key={agendaDow} className="soft-fade p-4 sm:p-5 flex flex-col gap-3" style={{ background: "var(--bg)" }}>
              {dayItems.map(item => {
                const cat = CAT[item.planCategory] ?? CAT.musculación!;
                const warmup = item.exercises.filter(e => e.section === "warmup");
                const main = item.exercises.filter(e => e.section === "main");
                return (
                  <div key={item.planDayId} className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${cat.border}`, background: "var(--bg-panel)" }}>
                    {/* Block header */}
                    <div className="flex items-center gap-3 px-4 py-3"
                      style={{ background: cat.bg, borderBottom: `1px solid ${cat.border}` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "var(--bg-panel)", border: `1px solid ${cat.border}` }}>
                        {item.planCategory === "calentamiento"
                          ? <Flame className="h-4 w-4" style={{ color: cat.color }} />
                          : <Dumbbell className="h-4 w-4" style={{ color: cat.color }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold leading-tight truncate" style={{ color: "var(--text)" }}>
                          {item.planDayName ?? `Día ${item.dayNumber}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                            style={{ background: "var(--bg-panel)", color: cat.color }}>{item.planCategory}</span>
                          <span className="text-xs truncate" style={{ color: "var(--text-3)" }}>{item.planName}</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: "var(--bg-panel)", color: cat.color, border: `1px solid ${cat.border}` }}>
                        <Users className="h-3 w-3" />
                        {item.studentCount}
                      </span>
                      <Link href={`/trainer/plans/${item.planId}`}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 hidden sm:block cursor-pointer"
                        style={{ background: "var(--bg-panel)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                        Editar
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
                      {/* Alumnos */}
                      <div className="p-4" style={{ background: "var(--bg-panel)" }}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Users className="h-3.5 w-3.5" style={{ color: cat.color }} />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                            Alumnos ({item.students.length})
                          </span>
                        </div>
                        {item.students.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--text-3)" }}>Nadie asignado.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.students.map(s => (
                              <div key={s.clientId} className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-extrabold"
                                  style={{ background: cat.bg, color: cat.color }}>
                                  {s.clientName?.charAt(0).toUpperCase() ?? "?"}
                                </div>
                                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                                  {s.clientName ?? "Sin nombre"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Ejercicios */}
                      <div className="p-4" style={{ background: "var(--bg-panel)" }}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Dumbbell className="h-3.5 w-3.5" style={{ color: cat.color }} />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                            Ejercicios ({item.exercises.length})
                          </span>
                        </div>
                        {item.exercises.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--text-3)" }}>
                            Sin ejercicios.{" "}
                            <Link href={`/trainer/plans/${item.planId}`} className="underline" style={{ color: cat.color }}>
                              Agregalos
                            </Link>
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {warmup.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Flame className="h-3 w-3" style={{ color: "var(--c-orange)" }} />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--c-orange)" }}>
                                    Entrada en calor
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  {warmup.map((ex, i) => <SummaryExerciseRow key={i} ex={ex} accent="var(--c-orange)" />)}
                                </div>
                              </div>
                            )}
                            {main.length > 0 && (
                              <div>
                                {warmup.length > 0 && (
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Dumbbell className="h-3 w-3" style={{ color: cat.color }} />
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: cat.color }}>
                                      Trabajo principal
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-col gap-1">
                                  {main.map((ex, i) => <SummaryExerciseRow key={i} ex={ex} accent={cat.color} />)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Builder + assign — full-width vertical flow */}

      {/* Week table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--text)" }}>
              Template semanal
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Armá una semana tipo y asignala a varios alumnos
            </p>
          </div>
          {totalBlocks > 0 && (
            <button type="button" onClick={clearTemplate} className="text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
              style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
              Limpiar
            </button>
          )}
        </div>

        {/* 5-column grid */}
        <div className="grid grid-cols-5" style={{ borderBottom: activeDow !== null ? "1px solid var(--border)" : "none" }}>
          {DAYS.map(({ label, short, dow }, colIdx) => {
            const dayBlocks = blocksForDay(dow);
            const isActive = activeDow === dow;
            const da = DAY_ACCENT[dow]!;
            return (
              <div key={dow} className="flex flex-col" style={{
                borderRight: colIdx < 4 ? "1px solid var(--border)" : "none",
                borderTop: `3px solid ${isActive ? da.color : "transparent"}`,
                background: isActive ? da.bg : "transparent",
                transition: "background 0.15s, border-color 0.15s",
              }}>
                <button type="button" onClick={() => setActiveDow(isActive ? null : dow)}
                  className="w-full px-2 py-3 text-center cursor-pointer"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs font-extrabold uppercase tracking-wider block"
                    style={{ color: isActive ? da.color : "var(--text-3)" }}>{short}</span>
                  <span className="text-[10px] hidden sm:block mt-0.5"
                    style={{ color: isActive ? da.color : "var(--text-3)", opacity: 0.7 }}>{label}</span>
                  {dayBlocks.length > 0 && (
                    <span key={dayBlocks.length} className="count-pop inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold mt-1.5"
                      style={{ background: da.color, color: "#000" }}>{dayBlocks.length}</span>
                  )}
                </button>

                <div className="flex flex-col gap-2 p-2 flex-1 min-h-[132px]">
                  {dayBlocks.map(block => {
                    const cat = CAT[block.planCategory] ?? CAT.musculación!;
                    return (
                      <div key={block.uid} className="rounded-xl p-2.5 flex flex-col gap-1 relative"
                        style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                        <div className="flex items-center gap-1.5 pr-5">
                          {block.planCategory === "calentamiento"
                            ? <Flame className="h-3 w-3 shrink-0" style={{ color: cat.color }} />
                            : <Dumbbell className="h-3 w-3 shrink-0" style={{ color: cat.color }} />}
                          <span className="text-[9px] font-extrabold uppercase tracking-wider truncate" style={{ color: cat.color }}>
                            {block.planCategory}
                          </span>
                        </div>
                        <p className="text-[11px] font-extrabold leading-tight pr-5" style={{ color: "var(--text)" }}>
                          {block.planDayName ?? block.planName}
                        </p>
                        {block.planDayName && (
                          <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>{block.planName}</p>
                        )}
                        <button type="button" onClick={() => removeBlock(block.uid)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ background: "rgba(239,68,68,0.18)", color: "#ef4444" }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  <button type="button" onClick={() => setActiveDow(isActive ? null : dow)}
                    className="w-full flex items-center justify-center rounded-xl cursor-pointer mt-auto"
                    style={{ height: 34, border: `1.5px dashed ${isActive ? da.color : "var(--border)"}`, color: isActive ? da.color : "var(--text-3)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = da.color; e.currentTarget.style.color = da.color; }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; } }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Library panel */}
        {activeDow !== null && (
          <div key={activeDow} className="reveal-down p-5" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-xs font-extrabold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
              Agregar a{" "}
              <span style={{ color: DAY_ACCENT[activeDow]?.color }}>
                {DAYS.find(d => d.dow === activeDow)?.label}
              </span>
            </p>
            {library.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                No hay rutinas creadas.{" "}
                <Link href="/trainer/plans/new" style={{ color: "var(--accent)" }}>Crear una →</Link>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {library.map(plan => {
                  const cat = CAT[plan.category] ?? CAT.musculación!;
                  const expanded = expandedPlans.has(plan.id);
                  return (
                    <div key={plan.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      {/* Plan header */}
                      <button type="button" onClick={() => togglePlan(plan.id)}
                        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
                        style={{ background: "var(--bg-panel)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                            {plan.category === "calentamiento"
                              ? <Flame className="h-3.5 w-3.5" style={{ color: cat.color }} />
                              : <Dumbbell className="h-3.5 w-3.5" style={{ color: cat.color }} />}
                          </div>
                          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{plan.name}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: cat.bg, color: cat.color }}>{plan.category}</span>
                        </div>
                        {expanded
                          ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-3)" }} />
                          : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-3)" }} />}
                      </button>

                      {/* Days list */}
                      {expanded && (
                        <div style={{ borderTop: "1px solid var(--border)" }}>
                          {loadingPlanEx === plan.id ? (
                            <div className="px-4 py-4 text-xs text-center" style={{ color: "var(--text-3)" }}>
                              Cargando ejercicios…
                            </div>
                          ) : plan.days.map(day => {
                            const planLoaded = planExData[plan.id];
                            const dayWithEx  = planLoaded?.days.find(d => d.id === day.id);
                            const isAddHere  = addExDayId === day.id && addExPlanId === plan.id;
                            const filteredCat = addExSearch.trim()
                              ? catalog.filter(e => e.name.toLowerCase().includes(addExSearch.toLowerCase()))
                              : catalog.slice(0, 20);

                            return (
                              <div key={day.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                {/* Day header */}
                                <div className="flex items-center px-4 py-3" style={{ background: "var(--bg-panel)" }}>
                                  <p className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                                    {day.name ?? `Día ${day.dayNumber}`}
                                  </p>
                                  <button type="button"
                                    onClick={() => addBlock(plan, day)}
                                    title="Agregar al template"
                                    className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 ml-3 cursor-pointer"
                                    style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                                    <Plus className="h-4 w-4" style={{ color: cat.color }} />
                                  </button>
                                </div>

                                {/* Exercises — always visible */}
                                <div className="px-4 pb-4 pt-2 flex flex-col gap-2"
                                  style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>

                                  {!planLoaded && (
                                    <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Cargando…</p>
                                  )}

                                  {dayWithEx && dayWithEx.exercises.length === 0 && !isAddHere && (
                                    <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Sin ejercicios todavía</p>
                                  )}

                                  {dayWithEx?.exercises.map(ex => (
                                    <ExerciseRowSimple key={ex.id} ex={ex}
                                      accent={ex.section === "warmup" ? "var(--c-orange)" : cat.color}
                                      onRemove={() => removeExercise(plan.id, day.id, ex.id)} />
                                  ))}

                                  {isAddHere ? (
                                    <div className="reveal-down rounded-xl p-3 flex flex-col gap-2 mt-1"
                                      style={{ border: `1px solid ${cat.color}`, background: "var(--bg-panel)" }}>
                                      <div className="flex gap-2">
                                        {(["main", "warmup"] as const).map(s => (
                                          <button key={s} type="button" onClick={() => setAddExSection(s)}
                                            className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                            style={{
                                              background: addExSection === s ? (s === "main" ? cat.color : "var(--c-orange)") : "var(--bg)",
                                              color: addExSection === s ? "#000" : "var(--text-3)",
                                              border: `1px solid ${addExSection === s ? (s === "main" ? cat.color : "var(--c-orange)") : "var(--border)"}`,
                                            }}>
                                            {s === "main"
                                              ? <><Dumbbell className="h-3 w-3 inline mr-1" />Ejercicio</>
                                              : <><Flame className="h-3 w-3 inline mr-1" />Calentamiento</>}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: "var(--text-3)" }} />
                                        <input autoFocus placeholder="Buscar ejercicio…" value={addExSearch}
                                          onChange={e => setAddExSearch(e.target.value)}
                                          className="w-full rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none"
                                          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                                          onFocus={e => (e.currentTarget.style.borderColor = cat.color)}
                                          onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                                      </div>
                                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                                        {!catalogLoaded && <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Cargando…</p>}
                                        {catalogLoaded && filteredCat.length === 0 && (
                                          <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Sin resultados</p>
                                        )}
                                        {filteredCat.map(item => (
                                          <button key={item.id} type="button" onClick={() => addExercise(item)} disabled={savingEx}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm cursor-pointer"
                                            style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                                            onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
                                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                                            <span className="truncate">{item.name}</span>
                                            <span className="text-[10px] font-bold uppercase ml-2 shrink-0" style={{ color: "var(--text-3)" }}>
                                              {item.muscleGroup}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                      <button type="button"
                                        onClick={() => { setAddExDayId(null); setAddExPlanId(null); setAddExSearch(""); }}
                                        className="text-xs text-center cursor-pointer" style={{ color: "var(--text-3)" }}>
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : dayWithEx && (
                                    <button type="button"
                                      onClick={() => { setAddExPlanId(plan.id); setAddExDayId(day.id); setAddExSection("main"); setAddExSearch(""); }}
                                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold cursor-pointer mt-1"
                                      style={{ border: `1.5px dashed ${cat.border}`, color: cat.color, background: "transparent" }}
                                      onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
                                      onMouseLeave={e => (e.currentTarget.style.borderColor = cat.border)}>
                                      <Plus className="h-3 w-3" />
                                      Agregar ejercicio
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Assign section — always visible */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid var(--accent)", background: "var(--bg-panel)" }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: "var(--accent-soft)", borderBottom: "1px solid var(--accent)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--accent)" }}>
            <Users className="h-4 w-4" style={{ color: "var(--accent-fg)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>Asignar a alumnos</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {totalBlocks > 0
                ? `${totalBlocks} bloque${totalBlocks !== 1 ? "s" : ""} en el template — elegí a quién asignarlo`
                : "Armá el template semanal y después asignalo"}
            </p>
          </div>
          {selectedClients.size > 0 && (
            <span key={selectedClients.size} className="count-pop text-xs px-2.5 py-1 rounded-full font-extrabold shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
              {selectedClients.size} seleccionado{selectedClients.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="p-5">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--bg-hover)" }}>
            {(["alumnos", "turnos"] as const).map(mode => (
              <button key={mode} type="button"
                onClick={() => { setAssignMode(mode); if (mode === "turnos") fetchSlots(); }}
                className="flex-1 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all"
                style={{
                  background: assignMode === mode ? "var(--bg-panel)" : "transparent",
                  color: assignMode === mode ? "var(--text)" : "var(--text-3)",
                  border: assignMode === mode ? "1px solid var(--border)" : "1px solid transparent",
                }}>
                {mode === "alumnos" ? "Por alumno" : "Por turno"}
              </button>
            ))}
          </div>

          {/* Individual mode */}
          {assignMode === "alumnos" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  Alumnos aprobados
                </p>
                <button type="button" onClick={() => setSelectedClients(new Set(clients.map(c => c.id)))}
                  className="text-xs font-bold cursor-pointer" style={{ color: "var(--accent)" }}>
                  Todos
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-80 overflow-y-auto mb-5">
                {clients.map(client => {
                  const sel = selectedClients.has(client.id);
                  return (
                    <button key={client.id} type="button" onClick={() => toggleClient(client.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-all"
                      style={{
                        background: sel ? "var(--accent-soft)" : "var(--bg-hover)",
                        border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: sel ? "var(--accent)" : "var(--bg-panel)", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}` }}>
                        {sel && <Check className="h-3 w-3" style={{ color: "var(--accent-fg)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{client.email}</p>
                      </div>
                    </button>
                  );
                })}
                {clients.length === 0 && (
                  <p className="text-sm col-span-2 py-4 text-center" style={{ color: "var(--text-3)" }}>
                    No hay alumnos aprobados.
                  </p>
                )}
              </div>
            </>
          )}

          {/* By class slot mode */}
          {assignMode === "turnos" && (
            <div className="mb-5">
              {loadingSlots ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>Cargando turnos…</p>
              ) : classSlots.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>No hay turnos configurados.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                  {DAYS.map(({ dow, label }) => {
                    const daySlots = classSlots.filter(s => s.dayOfWeek === dow);
                    if (!daySlots.length) return null;
                    return (
                      <div key={dow}>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
                          {label}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {daySlots.map(slot => {
                            const slotIds = getSlotClientIds(slot.id);
                            const fullySelected = isSlotFullySelected(slot.id);
                            const partiallySelected = isSlotPartiallySelected(slot.id);
                            const isMus = slot.type === "musculación";
                            const color = isMus ? "var(--accent)" : "var(--c-blue)";
                            const bg = isMus ? "var(--accent-soft)" : "var(--c-blue-bg)";
                            const selectedInSlot = slotIds.filter(id => selectedClients.has(id)).length;
                            return (
                              <button key={slot.id} type="button" onClick={() => toggleSlot(slot.id)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-all"
                                style={{
                                  background: fullySelected ? bg : partiallySelected ? bg : "var(--bg-hover)",
                                  border: `1px solid ${fullySelected || partiallySelected ? color : "var(--border)"}`,
                                  opacity: slotIds.length === 0 ? 0.5 : 1,
                                }}>
                                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                  style={{ background: fullySelected ? color : partiallySelected ? bg : "var(--bg-panel)", border: `1px solid ${fullySelected || partiallySelected ? color : "var(--border)"}` }}>
                                  {fullySelected && <Check className="h-3 w-3" style={{ color: isMus ? "var(--accent-fg)" : "#fff" }} />}
                                  {partiallySelected && !fullySelected && (
                                    <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-extrabold tabular-nums" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                                      {slot.startTime} hs
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                      style={{ background: bg, color }}>
                                      {slot.type}
                                    </span>
                                  </div>
                                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                                    {slotIds.length === 0
                                      ? "Sin alumnos inscriptos"
                                      : partiallySelected
                                        ? `${selectedInSlot} de ${slotIds.length} alumno${slotIds.length !== 1 ? "s" : ""} seleccionado${selectedInSlot !== 1 ? "s" : ""}`
                                        : fullySelected
                                          ? `${slotIds.length} alumno${slotIds.length !== 1 ? "s" : ""} — todos seleccionados`
                                          : `${slotIds.length} alumno${slotIds.length !== 1 ? "s" : ""}`}
                                  </p>
                                </div>
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

          {/* Assign button */}
          <button type="button" onClick={assign}
            disabled={assigning || totalBlocks === 0 || selectedClients.size === 0}
            className="w-full py-3 rounded-xl text-sm font-extrabold cursor-pointer transition-all disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            {assigning
              ? "Asignando…"
              : totalBlocks === 0
                ? "Primero armá el template semanal"
                : selectedClients.size === 0
                  ? "Seleccioná alumnos o un turno"
                  : `Asignar ${totalBlocks} bloque${totalBlocks !== 1 ? "s" : ""} a ${selectedClients.size} alumno${selectedClients.size !== 1 ? "s" : ""} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryExerciseRow({ ex, accent }: { ex: SummaryExercise; accent: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <span className="flex-1 text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{ex.exerciseName}</span>
      <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: accent }}>{ex.sets}×{ex.reps}</span>
      {ex.weightKg && (
        <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-md shrink-0"
          style={{ background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
          {ex.weightKg} kg
        </span>
      )}
    </div>
  );
}

function ExerciseRowSimple({ ex, accent, onRemove }: { ex: ExerciseForEdit; accent: string; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <span className="flex-1 text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{ex.exerciseName}</span>
      <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: accent }}>{ex.sets}×{ex.reps}</span>
      <button type="button" onClick={onRemove} title="Quitar ejercicio"
        className="opacity-50 group-hover:opacity-100 transition-opacity p-1 rounded-md cursor-pointer shrink-0"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
