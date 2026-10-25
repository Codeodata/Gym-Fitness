"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  Search,
  Flame,
  Dumbbell,
  Users,
  UserPlus,
} from "lucide-react";

const DOW_FULL = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DOW_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEK_DAYS = [1, 2, 3, 4, 5];

type ExerciseItem = {
  id: string;
  planDayId: string;
  section: "warmup" | "main";
  sets: number;
  reps: string;
  weightKg: string | null;
  notes: string | null;
  exerciseName: string;
  muscleGroup: string;
  orderIndex: number;
};

type DayItem = {
  id: string;
  dayNumber: number;
  name: string | null;
  dayOfWeek: number | null;
  exercises: ExerciseItem[];
};

type ExerciseCatalogItem = {
  id: string;
  name: string;
  muscleGroup: string;
};

type Client = { id: string; name: string; email: string };
type AssignedStudent = { clientId: string; clientName: string | null; days: number[] };

type Props = {
  planId: string;
  initialName: string;
  initialDays: DayItem[];
  clients: Client[];
  initialStudents: AssignedStudent[];
};

export function PlanEditorClient({ planId, initialName, initialDays, clients, initialStudents }: Props) {
  const [planName, setPlanName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const [days, setDays] = useState<DayItem[]>(initialDays);

  // Catalog of exercises for search
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Per-day add panel state
  const [addingToDayId, setAddingToDayId] = useState<string | null>(null);
  const [addSection, setAddSection] = useState<"main" | "warmup">("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);

  // ── Student assignment ─────────────────────────────────────────
  const [students, setStudents] = useState<AssignedStudent[]>(initialStudents);
  const [addingStudents, setAddingStudents] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // día de la semana por cada día de la rutina (default: el del plan, o Lun..Vie)
  const [dayMap, setDayMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    initialDays.forEach((d, i) => {
      m[d.id] = d.dayOfWeek && d.dayOfWeek >= 1 && d.dayOfWeek <= 5 ? d.dayOfWeek : WEEK_DAYS[i % 5]!;
    });
    return m;
  });

  function toggleSelectClient(id: string) {
    setSelectedClients((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function assignStudents() {
    if (assigning || selectedClients.size === 0) return;
    setAssigning(true);
    try {
      const dayMappings = initialDays.map((d) => ({ planDayId: d.id, dayOfWeek: dayMap[d.id]! }));
      const res = await fetch("/api/trainer/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayMappings, clientIds: [...selectedClients] }),
      });
      if (res.ok) {
        const assignedDays = [...new Set(initialDays.map((d) => dayMap[d.id]!))].sort((a, b) => a - b);
        setStudents((prev) => {
          const next = [...prev];
          for (const id of selectedClients) {
            const existing = next.find((s) => s.clientId === id);
            if (existing) {
              existing.days = [...new Set([...existing.days, ...assignedDays])].sort((a, b) => a - b);
            } else {
              next.push({ clientId: id, clientName: clients.find((c) => c.id === id)?.name ?? null, days: assignedDays });
            }
          }
          return next.sort((a, b) => (a.clientName ?? "").localeCompare(b.clientName ?? ""));
        });
        const n = selectedClients.size;
        setToast(`✓ Rutina asignada a ${n} alumno${n !== 1 ? "s" : ""}`);
        setSelectedClients(new Set());
        setStudentSearch("");
        setAddingStudents(false);
      }
    } finally {
      setAssigning(false);
    }
  }

  async function removeStudent(clientId: string) {
    setUnassigning(clientId);
    const prev = students;
    setStudents((p) => p.filter((s) => s.clientId !== clientId));
    try {
      const res = await fetch(`/api/trainer/plans/${planId}/students`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!res.ok) setStudents(prev); // revertir si falla
    } catch {
      setStudents(prev);
    } finally {
      setUnassigning(null);
    }
  }

  const filteredClients = studentSearch.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(studentSearch.toLowerCase()))
    : clients;

  // Load catalog once
  useEffect(() => {
    if (catalogLoaded) return;
    fetch("/api/trainer/exercises")
      .then((r) => r.json())
      .then((data: ExerciseCatalogItem[]) => {
        setCatalog(data);
        setCatalogLoaded(true);
      })
      .catch(() => setCatalogLoaded(true));
  }, [catalogLoaded]);

  const openAddPanel = useCallback(
    (dayId: string) => {
      setAddingToDayId(dayId);
      setAddSection("main");
      setSearchQuery("");
      if (!catalogLoaded) {
        fetch("/api/trainer/exercises")
          .then((r) => r.json())
          .then((data: ExerciseCatalogItem[]) => {
            setCatalog(data);
            setCatalogLoaded(true);
          })
          .catch(() => setCatalogLoaded(true));
      }
    },
    [catalogLoaded]
  );

  // ── Rename plan ────────────────────────────────────────────────
  function startEditName() {
    setNameInput(planName);
    setEditingName(true);
  }

  async function saveName() {
    if (!nameInput.trim() || nameInput === planName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (res.ok) {
        setPlanName(nameInput.trim());
      }
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }

  function cancelEditName() {
    setEditingName(false);
    setNameInput(planName);
  }

  // ── Remove exercise ────────────────────────────────────────────
  async function removeExercise(planExerciseId: string, dayId: string) {
    // Optimistic removal
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.filter((e) => e.id !== planExerciseId) }
          : d
      )
    );
    try {
      await fetch(`/api/trainer/plans/${planId}/exercises`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planExerciseId }),
      });
    } catch {
      // On error, we could restore but for simplicity we leave it removed
    }
  }

  // ── Add exercise ───────────────────────────────────────────────
  async function addExercise(item: ExerciseCatalogItem) {
    if (!addingToDayId || addingExercise) return;
    setAddingExercise(true);
    try {
      const defaultSets = addSection === "main" ? 3 : 1;
      const res = await fetch(`/api/trainer/plans/${planId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDayId: addingToDayId,
          exerciseName: item.name,
          section: addSection,
          sets: defaultSets,
          reps: "10",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { exercise: ExerciseItem };
        setDays((prev) =>
          prev.map((d) =>
            d.id === addingToDayId
              ? { ...d, exercises: [...d.exercises, data.exercise] }
              : d
          )
        );
        setAddingToDayId(null);
      }
    } finally {
      setAddingExercise(false);
    }
  }

  // ── Filtered catalog ───────────────────────────────────────────
  const filteredCatalog = searchQuery.trim()
    ? catalog.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
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

      {/* Rename heading */}
      <div className="group flex items-center gap-2 mb-2">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") cancelEditName();
              }}
              className="text-xl font-extrabold flex-1 bg-transparent outline-none"
              style={{
                color: "var(--text)",
                fontFamily: "'Barlow Condensed', sans-serif",
                borderBottom: "2px solid var(--accent)",
                paddingBottom: "2px",
              }}
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="p-1.5 rounded-lg"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEditName}
              className="p-1.5 rounded-lg"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <h2
              className="text-xl font-extrabold"
              style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {planName}
            </h2>
            <button
              onClick={startEditName}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Alumnos asignados ─────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-hover)" }}>
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)" }}>
            <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>Alumnos asignados</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              {students.length === 0
                ? "Nadie tiene esta rutina todavía"
                : `${students.length} alumno${students.length !== 1 ? "s" : ""} con esta rutina`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setAddingStudents((v) => !v); setSelectedClients(new Set()); setStudentSearch(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all"
            style={addingStudents
              ? { background: "var(--bg-panel)", color: "var(--text-3)", border: "1px solid var(--border)" }
              : { background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            {addingStudents ? <><X className="h-3.5 w-3.5" />Cerrar</> : <><UserPlus className="h-3.5 w-3.5" />Agregar</>}
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Lista de asignados */}
          {students.length === 0 ? (
            <p className="text-sm text-center py-2" style={{ color: "var(--text-3)" }}>
              Usá <span style={{ color: "var(--accent)", fontWeight: 700 }}>Agregar</span> para asignar esta rutina a tus alumnos.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {students.map((s) => (
                <div key={s.clientId} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-extrabold"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {s.clientName?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {s.clientName ?? "Sin nombre"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.days.map((d) => (
                      <span key={d} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: "var(--bg-panel)", color: "var(--text-2)" }}>
                        {DOW_SHORT[d]}
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => removeStudent(s.clientId)} disabled={unassigning === s.clientId}
                    title="Quitar de esta rutina"
                    className="opacity-50 group-hover:opacity-100 p-1 rounded-md shrink-0 cursor-pointer transition-opacity disabled:opacity-40"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--destructive)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}>
                    {unassigning === s.clientId ? <span className="text-[10px]">…</span> : <X className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Panel agregar */}
          {addingStudents && (
            <div className="reveal-down rounded-xl p-4 flex flex-col gap-4 mt-1"
              style={{ border: "1px solid var(--accent)", background: "var(--bg)" }}>
              {initialDays.length > 0 && (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
                    ¿Qué día entrena cada jornada?
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {initialDays.map((d) => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className="text-xs font-semibold w-24 sm:w-28 shrink-0 truncate" style={{ color: "var(--text-2)" }}>
                          {d.name ?? `Día ${d.dayNumber}`}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {WEEK_DAYS.map((dw) => {
                            const sel = dayMap[d.id] === dw;
                            return (
                              <button key={dw} type="button" onClick={() => setDayMap((m) => ({ ...m, [d.id]: dw }))}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all"
                                style={{
                                  background: sel ? "var(--accent)" : "var(--bg-panel)",
                                  color: sel ? "var(--accent-fg)" : "var(--text-3)",
                                  border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                                }}>
                                {DOW_SHORT[dw]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Alumnos</p>
                  {clients.length > 0 && (
                    <button type="button" onClick={() => setSelectedClients(new Set(filteredClients.map((c) => c.id)))}
                      className="text-xs font-bold cursor-pointer" style={{ color: "var(--accent)" }}>Todos</button>
                  )}
                </div>
                {clients.length === 0 ? (
                  <p className="text-sm py-2" style={{ color: "var(--text-3)" }}>No hay alumnos aprobados.</p>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
                      <input placeholder="Buscar alumno…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
                      {filteredClients.map((c) => {
                        const sel = selectedClients.has(c.id);
                        const already = students.some((s) => s.clientId === c.id);
                        return (
                          <button key={c.id} type="button" onClick={() => toggleSelectClient(c.id)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-left transition-all"
                            style={{ background: sel ? "var(--accent-soft)" : "var(--bg-panel)", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}` }}>
                            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                              style={{ background: sel ? "var(--accent)" : "var(--bg-hover)", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}` }}>
                              {sel && <Check className="h-2.5 w-2.5" style={{ color: "var(--accent-fg)" }} />}
                            </div>
                            <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{c.name}</span>
                            {already && <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: "var(--text-3)" }}>ya asignado</span>}
                          </button>
                        );
                      })}
                      {filteredClients.length === 0 && (
                        <p className="text-xs col-span-full text-center py-2" style={{ color: "var(--text-3)" }}>Sin resultados</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button type="button" onClick={assignStudents} disabled={assigning || selectedClients.size === 0}
                className="w-full py-2.5 rounded-xl text-sm font-extrabold cursor-pointer transition-all disabled:opacity-40"
                style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                {assigning
                  ? "Asignando…"
                  : selectedClients.size === 0
                    ? "Seleccioná alumnos"
                    : `Asignar a ${selectedClients.size} alumno${selectedClients.size !== 1 ? "s" : ""} →`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Day cards */}
      {days.map((day) => {
        const warmup = day.exercises
          .filter((e) => e.section === "warmup")
          .sort((a, b) => a.orderIndex - b.orderIndex);
        const main = day.exercises
          .filter((e) => e.section === "main")
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const dow = day.dayOfWeek ?? null;
        const dayLabel = dow
          ? `${DOW_FULL[dow]} — ${day.name ?? `Día ${day.dayNumber}`}`
          : day.name ?? `Día ${day.dayNumber}`;

        const isAddingHere = addingToDayId === day.id;

        return (
          <div
            key={day.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            {/* Day header */}
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-hover)" }}
            >
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                D{day.dayNumber}
              </span>
              <span
                className="font-extrabold text-sm"
                style={{ color: "var(--text)" }}
              >
                {dayLabel}
              </span>
              <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>
                {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Warmup section */}
              {warmup.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Flame className="h-3.5 w-3.5" style={{ color: "var(--c-orange)" }} />
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: "var(--c-orange)" }}
                    >
                      Entrada en calor
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {warmup.map((ex) => (
                      <ExerciseRowEditable
                        key={ex.id}
                        ex={ex}
                        accent="var(--c-orange)"
                        onRemove={() => removeExercise(ex.id, day.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Main section */}
              {main.length > 0 && (
                <div>
                  {warmup.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Dumbbell className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{ color: "var(--accent)" }}
                      >
                        Trabajo principal
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {main.map((ex) => (
                      <ExerciseRowEditable
                        key={ex.id}
                        ex={ex}
                        accent="var(--accent)"
                        onRemove={() => removeExercise(ex.id, day.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add exercise panel or button */}
              {isAddingHere ? (
                <div
                  className="rounded-xl p-3 flex flex-col gap-3 mt-1"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-hover)" }}
                >
                  {/* Section toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddSection("main")}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: addSection === "main" ? "var(--accent)" : "var(--bg-panel)",
                        color: addSection === "main" ? "var(--accent-fg)" : "var(--text-3)",
                        border: `1px solid ${addSection === "main" ? "var(--accent)" : "var(--border)"}`,
                      }}
                    >
                      <Dumbbell className="h-3 w-3 inline mr-1" />
                      Ejercicio
                    </button>
                    <button
                      onClick={() => setAddSection("warmup")}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: addSection === "warmup" ? "var(--c-orange)" : "var(--bg-panel)",
                        color: addSection === "warmup" ? "#fff" : "var(--text-3)",
                        border: `1px solid ${addSection === "warmup" ? "var(--c-orange)" : "var(--border)"}`,
                      }}
                    >
                      <Flame className="h-3 w-3 inline mr-1" />
                      Calentamiento
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                      style={{ color: "var(--text-3)" }}
                    />
                    <input
                      autoFocus
                      placeholder="Buscar ejercicio…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                      style={{
                        background: "var(--bg-panel)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  </div>

                  {/* Results */}
                  <div
                    className="flex flex-col gap-1 max-h-48 overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {filteredCatalog.length === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>
                        {catalogLoaded ? "Sin resultados" : "Cargando…"}
                      </p>
                    )}
                    {filteredCatalog.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addExercise(item)}
                        disabled={addingExercise}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-semibold transition-colors"
                        style={{
                          background: "var(--bg-panel)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        <span className="flex-1 truncate">{item.name}</span>
                        <span
                          className="text-[10px] font-bold uppercase"
                          style={{ color: "var(--text-3)" }}
                        >
                          {item.muscleGroup}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setAddingToDayId(null)}
                    className="text-xs text-center"
                    style={{ color: "var(--text-3)" }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAddPanel(day.id)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mt-1"
                  style={{
                    border: "1.5px dashed var(--border)",
                    color: "var(--text-3)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-3)";
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar ejercicio
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExerciseRowEditable({
  ex,
  accent,
  onRemove,
}: {
  ex: ExerciseItem;
  accent: string;
  onRemove: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <span
        className="flex-1 text-sm font-semibold truncate"
        style={{ color: "var(--text)" }}
      >
        {ex.exerciseName}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>
          {ex.sets}×{ex.reps}
        </span>
        {ex.weightKg && (
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
            {ex.weightKg} kg
          </span>
        )}
      </div>
      {ex.notes && (
        <span
          className="text-xs truncate max-w-[100px] hidden sm:block"
          style={{ color: "var(--text-3)" }}
        >
          {ex.notes}
        </span>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shrink-0"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger, #ef4444)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
