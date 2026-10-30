"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, X, Flame, Dumbbell, Users, Check, Trash2, Search, Pencil,
  UserPlus, ChevronDown, ChevronUp, CalendarPlus, AlertTriangle,
} from "lucide-react";

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
  1: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)"  },
  2: { color: "#c084fc", bg: "rgba(192,132,252,0.08)" },
  3: { color: "#fb923c", bg: "rgba(251,146,60,0.08)"  },
  4: { color: "#f472b6", bg: "rgba(244,114,182,0.08)" },
  5: { color: "#4ade80", bg: "rgba(74,222,128,0.08)"  },
};

type Student  = { blockId: string; clientId: string; clientName: string | null };
type Exercise = { id: string; planDayId: string; section: "warmup" | "main"; orderIndex: number; sets: number; reps: string; weightKg: string | null; exerciseName: string; muscleGroup: string };
type Block    = { dayOfWeek: number; planDayId: string; planDayName: string | null; dayNumber: number; planId: string; planName: string; planCategory: string; studentCount: number; students: Student[]; exercises: Exercise[] };
type LibraryDay  = { id: string; name: string | null; dayNumber: number; exerciseCount: number };
type LibraryPlan = { id: string; name: string; category: string; days: LibraryDay[] };
type CatalogItem = { id: string; name: string; muscleGroup: string };
type Client      = { id: string; name: string; email: string };

const keyOf = (b: { dayOfWeek: number; planDayId: string }) => `${b.dayOfWeek}::${b.planDayId}`;
const cat = (c: string) => CAT[c] ?? CAT.musculación!;

export function AgendaEditor({ clients }: { clients: Client[] }) {
  const [summary, setSummary] = useState<Block[]>([]);
  const [library, setLibrary] = useState<LibraryPlan[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const todayDow = ((): number => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d : 1; })();
  const [agendaDow, setAgendaDow] = useState<number>(todayDow);
  const [showAddRoutine, setShowAddRoutine] = useState(false);

  async function refresh() {
    const d = await fetch("/api/trainer/weekly-schedule/summary").then(r => r.json());
    setSummary(d.summary ?? []);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/trainer/weekly-schedule/summary").then(r => r.json()),
      fetch("/api/trainer/plan-library").then(r => r.json()),
    ]).then(([s, l]) => {
      setSummary(s.summary ?? []);
      setLibrary(l.library ?? []);
      setLoading(false);
    });
    fetch("/api/trainer/exercises")
      .then(r => r.json())
      .then((d: CatalogItem[]) => { setCatalog(d); setCatalogLoaded(true); })
      .catch(() => setCatalogLoaded(true));
  }, []);

  function flash(msg: string) { setToast(msg); }

  // ── Local summary mutators ───────────────────────────────────────────────
  const update = (fn: (b: Block[]) => Block[]) => setSummary(prev => fn(prev));
  const setDayExercises = (planDayId: string, up: (ex: Exercise[]) => Exercise[]) =>
    update(bs => bs.map(b => b.planDayId === planDayId ? { ...b, exercises: up(b.exercises) } : b));

  // ── Rename day (planDay.name) ────────────────────────────────────────────
  async function renameDay(planDayId: string, name: string) {
    const clean = name.trim();
    if (!clean) return;
    update(bs => bs.map(b => b.planDayId === planDayId ? { ...b, planDayName: clean } : b));
    await fetch(`/api/trainer/plan-days/${planDayId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clean }),
    });
  }

  // ── Rename routine (plan.name) ───────────────────────────────────────────
  async function renamePlan(planId: string, name: string) {
    const clean = name.trim();
    if (!clean) return;
    update(bs => bs.map(b => b.planId === planId ? { ...b, planName: clean } : b));
    await fetch(`/api/trainer/plans/${planId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clean }),
    });
  }

  // ── Students ─────────────────────────────────────────────────────────────
  async function removeStudent(block: Block, student: Student) {
    const k = keyOf(block);
    update(bs => bs.map(b => keyOf(b) === k
      ? { ...b, students: b.students.filter(s => s.blockId !== student.blockId), studentCount: Math.max(0, b.studentCount - 1) }
      : b));
    await fetch(`/api/trainer/weekly-schedule/${student.blockId}`, { method: "DELETE" });
  }

  async function addStudents(block: Block, clientIds: string[]) {
    if (clientIds.length === 0) return;
    await fetch("/api/trainer/bulk-assign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayMappings: [{ planDayId: block.planDayId, dayOfWeek: block.dayOfWeek }], clientIds }),
    });
    await refresh();
    flash(`${clientIds.length} alumno${clientIds.length !== 1 ? "s" : ""} agregado${clientIds.length !== 1 ? "s" : ""}`);
  }

  // ── Remove routine from this day / delete whole routine ──────────────────
  async function removeFromDay(block: Block) {
    const k = keyOf(block);
    update(bs => bs.filter(b => keyOf(b) !== k));
    await fetch("/api/trainer/weekly-schedule", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: block.dayOfWeek, planDayId: block.planDayId }),
    });
    flash(`"${block.planDayName ?? block.planName}" sacada del ${DAYS.find(d => d.dow === block.dayOfWeek)?.label.toLowerCase()}`);
  }

  async function deletePlan(block: Block) {
    update(bs => bs.filter(b => b.planId !== block.planId));
    setLibrary(prev => prev.filter(p => p.id !== block.planId));
    await fetch(`/api/trainer/plans/${block.planId}`, { method: "DELETE" });
    flash(`Rutina "${block.planName}" eliminada`);
  }

  // ── Exercises (belong to planDay, shared by all its blocks) ──────────────
  async function updateExercise(block: Block, exId: string, patch: { sets?: number; reps?: string; weightKg?: string | null }) {
    setDayExercises(block.planDayId, ex => ex.map(e => e.id === exId
      ? { ...e, sets: patch.sets ?? e.sets, reps: patch.reps ?? e.reps, weightKg: patch.weightKg !== undefined ? patch.weightKg : e.weightKg }
      : e));
    await fetch(`/api/trainer/plans/${block.planId}/exercises`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planExerciseId: exId, sets: patch.sets, reps: patch.reps, weightKg: patch.weightKg }),
    });
  }

  async function removeExercise(block: Block, exId: string) {
    setDayExercises(block.planDayId, ex => ex.filter(e => e.id !== exId));
    await fetch(`/api/trainer/plans/${block.planId}/exercises`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planExerciseId: exId }),
    });
  }

  async function addExercise(block: Block, item: CatalogItem, section: "main" | "warmup") {
    const res = await fetch(`/api/trainer/plans/${block.planId}/exercises`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planDayId: block.planDayId, exerciseName: item.name, section, sets: section === "main" ? 3 : 1, reps: "10" }),
    });
    if (res.ok) {
      const data = await res.json() as { exercise: Exercise };
      setDayExercises(block.planDayId, ex => [...ex, { ...data.exercise, planDayId: block.planDayId }]);
    }
  }

  // ── Add routine (planDay) to the active day ──────────────────────────────
  async function addRoutineToDay(planDayId: string, clientIds: string[]) {
    await fetch("/api/trainer/bulk-assign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayMappings: [{ planDayId, dayOfWeek: agendaDow }], clientIds }),
    });
    await refresh();
    setShowAddRoutine(false);
    flash("Rutina agregada al día");
  }

  const dayBlocks = summary.filter(b => b.dayOfWeek === agendaDow);

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Day tabs */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
        <div className="grid grid-cols-5">
          {DAYS.map(({ dow, short, label }, idx) => {
            const count = summary.filter(s => s.dayOfWeek === dow).length;
            const isActive = agendaDow === dow;
            const isToday = dow === todayDow;
            const da = DAY_ACCENT[dow]!;
            return (
              <button key={dow} type="button" onClick={() => { setAgendaDow(dow); setShowAddRoutine(false); }}
                className="px-1 py-3 text-center cursor-pointer transition-all"
                style={{
                  borderRight: idx < 4 ? "1px solid var(--border)" : "none",
                  borderTop: `3px solid ${isActive ? da.color : "transparent"}`,
                  background: isActive ? da.bg : "transparent",
                  touchAction: "manipulation",
                }}>
                <span className="text-xs font-extrabold uppercase tracking-wider block"
                  style={{ color: isActive ? da.color : "var(--text-3)" }}>{short}</span>
                <span className="text-[10px] hidden sm:block mt-0.5"
                  style={{ color: isActive ? da.color : "var(--text-3)", opacity: 0.7 }}>{isToday ? "Hoy" : label}</span>
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold mt-1.5"
                  style={{
                    background: count > 0 ? (isActive ? da.color : "var(--bg-hover)") : "transparent",
                    color: count > 0 ? (isActive ? "#000" : "var(--text-3)") : "var(--text-3)",
                  }}>{count > 0 ? count : "—"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "var(--bg-hover)" }} />)}
        </div>
      ) : (
        <div key={agendaDow} className="soft-fade flex flex-col gap-4">
          {dayBlocks.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
              <CalendarPlus className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                Nada asignado el {DAYS.find(d => d.dow === agendaDow)?.label.toLowerCase()}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Agregá una rutina a este día o creá una nueva.</p>
            </div>
          ) : (
            dayBlocks.map(block => (
              <BlockCard
                key={keyOf(block)}
                block={block}
                clients={clients}
                catalog={catalog}
                catalogLoaded={catalogLoaded}
                onRenameDay={renameDay}
                onRenamePlan={renamePlan}
                onRemoveStudent={removeStudent}
                onAddStudents={addStudents}
                onRemoveFromDay={removeFromDay}
                onDeletePlan={deletePlan}
                onUpdateExercise={updateExercise}
                onRemoveExercise={removeExercise}
                onAddExercise={addExercise}
              />
            ))
          )}

          {/* Add routine to this day */}
          {showAddRoutine ? (
            <AddRoutinePanel
              library={library}
              clients={clients}
              dayLabel={DAYS.find(d => d.dow === agendaDow)?.label ?? ""}
              onClose={() => setShowAddRoutine(false)}
              onAdd={addRoutineToDay}
            />
          ) : (
            <button type="button" onClick={() => setShowAddRoutine(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-extrabold cursor-pointer"
              style={{ border: "1.5px dashed var(--border-strong)", color: "var(--text-2)", background: "var(--bg-panel)", touchAction: "manipulation" }}>
              <CalendarPlus className="h-4 w-4" />
              Agregar rutina a este día
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Block card ──────────────────────────────────────────────────────────── */

function BlockCard({
  block, clients, catalog, catalogLoaded,
  onRenameDay, onRenamePlan, onRemoveStudent, onAddStudents,
  onRemoveFromDay, onDeletePlan, onUpdateExercise, onRemoveExercise, onAddExercise,
}: {
  block: Block; clients: Client[]; catalog: CatalogItem[]; catalogLoaded: boolean;
  onRenameDay: (planDayId: string, name: string) => void;
  onRenamePlan: (planId: string, name: string) => void;
  onRemoveStudent: (block: Block, s: Student) => void;
  onAddStudents: (block: Block, ids: string[]) => Promise<void>;
  onRemoveFromDay: (block: Block) => void;
  onDeletePlan: (block: Block) => void;
  onUpdateExercise: (block: Block, exId: string, patch: { sets?: number; reps?: string; weightKg?: string | null }) => void;
  onRemoveExercise: (block: Block, exId: string) => void;
  onAddExercise: (block: Block, item: CatalogItem, section: "main" | "warmup") => Promise<void>;
}) {
  const c = cat(block.planCategory);
  const [editingDay, setEditingDay] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [dayName, setDayName] = useState(block.planDayName ?? "");
  const [planName, setPlanName] = useState(block.planName);
  const [addingStudents, setAddingStudents] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addEx, setAddEx] = useState(false);

  const warmup = block.exercises.filter(e => e.section === "warmup").sort((a, b) => a.orderIndex - b.orderIndex);
  const main   = block.exercises.filter(e => e.section === "main").sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.border}`, background: "var(--bg-panel)" }}>
      {/* Header */}
      <div className="px-4 py-3.5 flex items-start gap-3" style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-panel)", border: `1px solid ${c.border}` }}>
          {block.planCategory === "calentamiento"
            ? <Flame className="h-5 w-5" style={{ color: c.color }} />
            : <Dumbbell className="h-5 w-5" style={{ color: c.color }} />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Day name */}
          {editingDay ? (
            <InlineEdit value={dayName} setValue={setDayName} accent={c.color}
              placeholder={`Día ${block.dayNumber}`}
              onSave={() => { setEditingDay(false); if (dayName.trim() && dayName.trim() !== (block.planDayName ?? "")) onRenameDay(block.planDayId, dayName.trim()); }}
              onCancel={() => { setDayName(block.planDayName ?? ""); setEditingDay(false); }} />
          ) : (
            <button type="button" onClick={() => { setDayName(block.planDayName ?? ""); setEditingDay(true); }}
              className="flex items-center gap-2 text-left w-full" title="Editar nombre del día">
              <p className="text-base font-extrabold leading-tight truncate" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {block.planDayName ?? `Día ${block.dayNumber}`}
              </p>
              <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-panel)", color: c.color }}>
                <Pencil className="h-3 w-3" />
              </span>
            </button>
          )}

          {/* Plan name */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md" style={{ background: "var(--bg-panel)", color: c.color }}>
              {block.planCategory}
            </span>
            {editingPlan ? (
              <InlineEdit value={planName} setValue={setPlanName} accent={c.color} small
                onSave={() => { setEditingPlan(false); if (planName.trim() && planName.trim() !== block.planName) onRenamePlan(block.planId, planName.trim()); }}
                onCancel={() => { setPlanName(block.planName); setEditingPlan(false); }} />
            ) : (
              <button type="button" onClick={() => { setPlanName(block.planName); setEditingPlan(true); }}
                className="flex items-center gap-1 min-w-0" title="Editar nombre de la rutina">
                <span className="text-xs font-semibold truncate" style={{ color: "var(--text-3)" }}>{block.planName}</span>
                <Pencil className="h-2.5 w-2.5 shrink-0" style={{ color: "var(--text-3)" }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alumnos */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Users className="h-3.5 w-3.5" style={{ color: c.color }} />
          <span className="text-[11px] font-extrabold uppercase tracking-wider flex-1" style={{ color: "var(--text-3)" }}>
            Alumnos ({block.students.length})
          </span>
          <button type="button" onClick={() => setAddingStudents(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
            style={addingStudents
              ? { background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)" }
              : { background: c.color, color: "#000" }}>
            {addingStudents ? <><X className="h-3 w-3" />Cerrar</> : <><UserPlus className="h-3 w-3" />Agregar</>}
          </button>
        </div>

        {block.students.length === 0 && !addingStudents && (
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Nadie asignado este día.</p>
        )}

        {block.students.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {block.students.map(s => (
              <div key={s.blockId} className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-extrabold" style={{ background: c.bg, color: c.color }}>
                  {s.clientName?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{s.clientName ?? "Sin nombre"}</span>
                <button type="button" onClick={() => onRemoveStudent(block, s)} title="Quitar del día"
                  className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 cursor-pointer"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {addingStudents && (
          <div className="mt-3">
            <StudentPicker clients={clients} accent={c.color}
              already={new Set(block.students.map(s => s.clientId))}
              onConfirm={async ids => { await onAddStudents(block, ids); setAddingStudents(false); }}
              onCancel={() => setAddingStudents(false)} confirmLabel="Agregar al día" />
          </div>
        )}
      </div>

      {/* Ejercicios */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Dumbbell className="h-3.5 w-3.5" style={{ color: c.color }} />
          <span className="text-[11px] font-extrabold uppercase tracking-wider flex-1" style={{ color: "var(--text-3)" }}>
            Ejercicios ({block.exercises.length})
          </span>
        </div>

        {block.exercises.length === 0 && !addEx && (
          <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>Sin ejercicios todavía.</p>
        )}

        <div className="flex flex-col gap-3">
          {warmup.length > 0 && (
            <ExerciseGroup title="Entrada en calor" icon={Flame} color="var(--c-orange)"
              exercises={warmup} onUpdate={(id, p) => onUpdateExercise(block, id, p)} onRemove={id => onRemoveExercise(block, id)} />
          )}
          {main.length > 0 && (
            <ExerciseGroup title={warmup.length > 0 ? "Trabajo principal" : null} icon={Dumbbell} color={c.color}
              exercises={main} onUpdate={(id, p) => onUpdateExercise(block, id, p)} onRemove={id => onRemoveExercise(block, id)} />
          )}
        </div>

        {addEx ? (
          <AddExercisePanel accent={c.color} catalog={catalog} catalogLoaded={catalogLoaded}
            onAdd={async (item, section) => { await onAddExercise(block, item, section); }}
            onClose={() => setAddEx(false)} />
        ) : (
          <button type="button" onClick={() => setAddEx(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold mt-3 cursor-pointer"
            style={{ border: `1.5px dashed ${c.border}`, color: c.color, background: "transparent", touchAction: "manipulation" }}>
            <Plus className="h-3.5 w-3.5" /> Agregar ejercicio
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        {confirmDelete ? (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs font-semibold flex-1" style={{ color: "#ef4444" }}>
              ¿Borrar la rutina completa? Afecta todos sus días y alumnos.
            </span>
            <button type="button" onClick={() => onDeletePlan(block)}
              className="h-9 px-3 rounded-xl text-xs font-extrabold cursor-pointer"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", touchAction: "manipulation" }}>
              Sí, borrar
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)}
              className="h-9 px-3 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border)", touchAction: "manipulation" }}>
              No
            </button>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => onRemoveFromDay(block)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: "var(--bg-hover)", color: "var(--text-2)", border: "1px solid var(--border)", touchAction: "manipulation" }}
              title="Sacar esta rutina de este día">
              <X className="h-3.5 w-3.5" /> Sacar del día
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", touchAction: "manipulation" }}
              title="Borrar la rutina completa">
              <Trash2 className="h-3.5 w-3.5" /> Borrar rutina
            </button>
            <span className="text-[10px] ml-auto flex items-center gap-1" style={{ color: "var(--text-3)" }}>
              <AlertTriangle className="h-3 w-3" /> Los ejercicios se comparten con quien tenga esta rutina
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Exercise group + editable row ──────────────────────────────────────── */

function ExerciseGroup({ title, icon: Icon, color, exercises, onUpdate, onRemove }: {
  title: string | null; icon: React.ElementType; color: string; exercises: Exercise[];
  onUpdate: (id: string, patch: { sets?: number; reps?: string; weightKg?: string | null }) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      {title && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon className="h-3 w-3" style={{ color }} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color }}>{title}</span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {exercises.map(ex => (
          <ExerciseRow key={ex.id} ex={ex} accent={ex.section === "warmup" ? "var(--c-orange)" : color}
            onUpdate={patch => onUpdate(ex.id, patch)} onRemove={() => onRemove(ex.id)} />
        ))}
      </div>
    </div>
  );
}

function ExerciseRow({ ex, accent, onUpdate, onRemove }: {
  ex: Exercise; accent: string;
  onUpdate: (patch: { sets?: number; reps?: string; weightKg?: string | null }) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(String(ex.sets));
  const [reps, setReps] = useState(ex.reps);
  const [weight, setWeight] = useState(ex.weightKg ?? "");

  function save() {
    const parsedSets = parseInt(sets, 10);
    if (!reps.trim() || isNaN(parsedSets) || parsedSets < 1) { setEditing(false); return; }
    onUpdate({ sets: parsedSets, reps: reps.trim(), weightKg: weight.trim() || null });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--bg-hover)", border: `1px solid ${accent}` }}>
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{ex.exerciseName}</span>
        <input type="number" min={1} max={20} value={sets} onChange={e => setSets(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
          className="w-10 text-center text-xs font-bold rounded-lg px-1 py-1.5 outline-none tabular-nums"
          style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, color: accent }} title="Series" />
        <span className="text-xs" style={{ color: "var(--text-3)" }}>×</span>
        <input type="text" value={reps} onChange={e => setReps(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
          className="w-12 text-center text-xs font-bold rounded-lg px-1 py-1.5 outline-none"
          style={{ background: "var(--bg-panel)", border: `1px solid ${accent}`, color: accent }} title="Repeticiones" />
        <input type="text" value={weight} placeholder="kg" onChange={e => setWeight(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
          className="w-12 text-center text-xs rounded-lg px-1 py-1.5 outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-3)" }} title="Peso (kg)" />
        <button type="button" onClick={save} className="p-1.5 rounded-lg cursor-pointer shrink-0" style={{ color: accent }}><Check className="h-4 w-4" /></button>
        <button type="button" onClick={() => setEditing(false)} className="p-1.5 rounded-lg cursor-pointer shrink-0" style={{ color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" onClick={() => setEditing(true)}
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }} title="Tocar para editar">
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{ex.exerciseName}</span>
      <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: accent }}>{ex.sets}×{ex.reps}</span>
      {ex.weightKg && (
        <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "var(--bg-panel)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
          {ex.weightKg} kg
        </span>
      )}
      <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ color: "var(--text-3)" }}><Pencil className="h-3 w-3" /></span>
      <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} title="Quitar ejercicio"
        className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 cursor-pointer"
        style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Add-exercise panel ─────────────────────────────────────────────────── */

function AddExercisePanel({ accent, catalog, catalogLoaded, onAdd, onClose }: {
  accent: string; catalog: CatalogItem[]; catalogLoaded: boolean;
  onAdd: (item: CatalogItem, section: "main" | "warmup") => Promise<void>; onClose: () => void;
}) {
  const [section, setSection] = useState<"main" | "warmup">("main");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = q.trim() ? catalog.filter(e => e.name.toLowerCase().includes(q.toLowerCase())) : catalog.slice(0, 20);

  return (
    <div className="reveal-down rounded-xl p-3 flex flex-col gap-2 mt-3" style={{ border: `1px solid ${accent}`, background: "var(--bg-hover)" }}>
      <div className="flex gap-2">
        {(["main", "warmup"] as const).map(s => (
          <button key={s} type="button" onClick={() => setSection(s)} className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={{
              background: section === s ? (s === "main" ? accent : "var(--c-orange)") : "var(--bg-panel)",
              color: section === s ? "#000" : "var(--text-3)",
              border: `1px solid ${section === s ? (s === "main" ? accent : "var(--c-orange)") : "var(--border)"}`,
            }}>
            {s === "main" ? <><Dumbbell className="h-3 w-3 inline mr-1" />Ejercicio</> : <><Flame className="h-3 w-3 inline mr-1" />Calentamiento</>}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
        <input autoFocus placeholder="Buscar ejercicio…" value={q} onChange={e => setQ(e.target.value)}
          className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
      </div>
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {!catalogLoaded && <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Cargando…</p>}
        {catalogLoaded && filtered.length === 0 && <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Sin resultados</p>}
        {filtered.map(item => (
          <button key={item.id} type="button" disabled={saving}
            onClick={async () => { setSaving(true); await onAdd(item, section); setSaving(false); setQ(""); }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm cursor-pointer"
            style={{ background: "var(--bg-panel)", color: "var(--text)", border: "1px solid var(--border)" }}>
            <span className="truncate">{item.name}</span>
            <span className="text-[10px] font-bold uppercase ml-2 shrink-0" style={{ color: "var(--text-3)" }}>{item.muscleGroup}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onClose} className="text-xs text-center cursor-pointer py-1" style={{ color: "var(--text-3)" }}>Listo</button>
    </div>
  );
}

/* ─── Student picker ─────────────────────────────────────────────────────── */

function StudentPicker({ clients, accent, already, onConfirm, onCancel, confirmLabel }: {
  clients: Client[]; accent: string; already: Set<string>;
  onConfirm: (ids: string[]) => Promise<void> | void; onCancel: () => void; confirmLabel: string;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = q.trim() ? clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : clients;

  const toggle = (id: string) => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="reveal-down rounded-xl p-3 flex flex-col gap-3" style={{ border: `1px solid ${accent}`, background: "var(--bg-hover)" }}>
      {clients.length === 0 ? (
        <p className="text-sm py-1" style={{ color: "var(--text-3)" }}>No hay alumnos aprobados.</p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <input autoFocus placeholder="Buscar alumno…" value={q} onChange={e => setQ(e.target.value)}
              className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
            {filtered.map(c => {
              const isAlready = already.has(c.id);
              const checked = sel.has(c.id);
              return (
                <button key={c.id} type="button" disabled={isAlready} onClick={() => toggle(c.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-left"
                  style={{
                    background: checked ? "var(--bg-panel)" : "var(--bg-panel)",
                    border: `1px solid ${checked ? accent : "var(--border)"}`,
                    opacity: isAlready ? 0.5 : 1,
                  }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{ background: checked ? accent : "var(--bg-hover)", border: `1px solid ${checked ? accent : "var(--border)"}` }}>
                    {checked && <Check className="h-2.5 w-2.5" style={{ color: "#000" }} />}
                  </div>
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{c.name}</span>
                  {isAlready && <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: "var(--text-3)" }}>ya está</span>}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="text-xs col-span-full text-center py-2" style={{ color: "var(--text-3)" }}>Sin resultados</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="h-10 px-3 rounded-xl text-xs font-bold cursor-pointer"
              style={{ background: "var(--bg-panel)", color: "var(--text-3)", border: "1px solid var(--border)" }}>Cancelar</button>
            <button type="button" disabled={sel.size === 0 || saving}
              onClick={async () => { setSaving(true); await onConfirm([...sel]); setSaving(false); }}
              className="flex-1 h-10 rounded-xl text-sm font-extrabold cursor-pointer disabled:opacity-40"
              style={{ background: accent, color: "#000", touchAction: "manipulation" }}>
              {saving ? "Guardando…" : sel.size === 0 ? "Elegí alumnos" : `${confirmLabel} (${sel.size})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Add-routine-to-day panel ───────────────────────────────────────────── */

function AddRoutinePanel({ library, clients, dayLabel, onClose, onAdd }: {
  library: LibraryPlan[]; clients: Client[]; dayLabel: string;
  onClose: () => void; onAdd: (planDayId: string, clientIds: string[]) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pickDay, setPickDay] = useState<{ planDayId: string; planColor: string } | null>(null);
  const [q, setQ] = useState("");
  const filtered = q.trim() ? library.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : library;

  return (
    <div className="reveal-down rounded-2xl overflow-hidden" style={{ border: "1px solid var(--accent)", background: "var(--bg-panel)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--accent-soft)", borderBottom: "1px solid var(--accent)" }}>
        <CalendarPlus className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <span className="text-sm font-extrabold flex-1" style={{ color: "var(--text)" }}>Agregar rutina al {dayLabel.toLowerCase()}</span>
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {library.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            No hay rutinas creadas. <Link href="/trainer/plans/new" style={{ color: "var(--accent)", fontWeight: 700 }}>Crear una →</Link>
          </p>
        ) : (
          <>
            <div className="relative mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
              <input placeholder="Buscar rutina…" value={q} onChange={e => setQ(e.target.value)}
                className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </div>
            {filtered.map(plan => {
              const c = cat(plan.category);
              const isOpen = expanded === plan.id;
              return (
                <div key={plan.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <button type="button" onClick={() => { setExpanded(isOpen ? null : plan.id); setPickDay(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-3 cursor-pointer" style={{ background: "var(--bg-panel)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      {plan.category === "calentamiento" ? <Flame className="h-3.5 w-3.5" style={{ color: c.color }} /> : <Dumbbell className="h-3.5 w-3.5" style={{ color: c.color }} />}
                    </div>
                    <span className="text-sm font-bold flex-1 text-left truncate" style={{ color: "var(--text)" }}>{plan.name}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "var(--text-3)" }} />}
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {plan.days.map(day => (
                        <div key={day.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: "var(--bg-panel)" }}>
                            <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                              {day.name ?? `Día ${day.dayNumber}`}
                              <span className="text-xs font-normal ml-1.5" style={{ color: "var(--text-3)" }}>· {day.exerciseCount} ej.</span>
                            </span>
                            <button type="button" onClick={() => setPickDay(pickDay?.planDayId === day.id ? null : { planDayId: day.id, planColor: c.color })}
                              className="h-8 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                              style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                              <Plus className="h-3.5 w-3.5" /> Elegir
                            </button>
                          </div>
                          {pickDay?.planDayId === day.id && (
                            <div className="px-3 pb-3 pt-1" style={{ background: "var(--bg)" }}>
                              <StudentPicker clients={clients} accent={c.color} already={new Set()}
                                confirmLabel={`Agregar al ${dayLabel.toLowerCase()}`}
                                onCancel={() => setPickDay(null)}
                                onConfirm={async ids => { await onAdd(day.id, ids); }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Small bits ─────────────────────────────────────────────────────────── */

function InlineEdit({ value, setValue, onSave, onCancel, accent, placeholder, small }: {
  value: string; setValue: (v: string) => void; onSave: () => void; onCancel: () => void;
  accent: string; placeholder?: string; small?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input autoFocus value={value} placeholder={placeholder}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSave(); } if (e.key === "Escape") { e.preventDefault(); onCancel(); } }}
        className={`flex-1 min-w-0 font-extrabold bg-transparent outline-none ${small ? "text-xs" : "text-base"} pb-0.5`}
        style={{ color: "var(--text)", borderBottom: `1.5px solid ${accent}`, fontFamily: small ? undefined : "'Barlow Condensed', sans-serif" }} />
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={onSave} className="p-1 rounded-lg shrink-0 cursor-pointer" style={{ color: accent }}><Check className="h-4 w-4" /></button>
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={onCancel} className="p-1 rounded-lg shrink-0 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
    </div>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2600); return () => clearTimeout(t); }, [msg, onClose]);
  return (
    <div className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xl"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
      {msg}
      <button type="button" onClick={onClose} style={{ color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
    </div>
  );
}
