"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Flame, Users, ChevronDown, ChevronUp, Check, X } from "lucide-react";

const CAT = {
  musculación:   { color: "#84cc16", bg: "rgba(132,204,22,0.10)", border: "rgba(132,204,22,0.25)", label: "Musculación"   },
  funcional:     { color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.25)", label: "Funcional"     },
  calentamiento: { color: "#fb923c", bg: "rgba(251,146,60,0.10)", border: "rgba(251,146,60,0.25)", label: "Calentamiento" },
} as const;

const DAYS_WEEK = [
  { dow: 1, label: "Lun" }, { dow: 2, label: "Mar" }, { dow: 3, label: "Mié" },
  { dow: 4, label: "Jue" }, { dow: 5, label: "Vie" },
];

type RoutineDay = { id: string; name: string | null; dayNumber: number };
type Routine = {
  id: string; name: string; description: string | null;
  category: string; daysPerWeek: number; dayCount: number;
};
type Client = { id: string; name: string; email: string };

type Props = {
  routines: Routine[];
  clients: Client[];
};

type DayMapping = Record<string, number | null>; // planDayId → dayOfWeek | null

type Filter = "todas" | "musculación" | "funcional" | "calentamiento";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "musculación", label: "Musculación" },
  { id: "funcional", label: "Funcional" },
  { id: "calentamiento", label: "Calentamiento" },
];

export function RoutinesList({ routines, clients }: Props) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [dayMapping, setDayMapping] = useState<DayMapping>({});
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = filter === "todas" ? routines : routines.filter(r => r.category === filter);

  async function openAssign(routine: Routine) {
    if (assigningId === routine.id) { setAssigningId(null); return; }
    setLoading(true);
    setAssigningId(routine.id);
    setSelectedClients(new Set());
    try {
      const res = await fetch(`/api/trainer/plan-library`);
      const data = await res.json() as { library: { id: string; days: RoutineDay[] }[] };
      const days = data.library.find(p => p.id === routine.id)?.days ?? [];
      setRoutineDays(days);
      const mapping: DayMapping = {};
      days.forEach(d => { mapping[d.id] = null; });
      setDayMapping(mapping);
    } finally { setLoading(false); }
  }

  function setDow(planDayId: string, dow: number) {
    setDayMapping(prev => ({
      ...prev,
      [planDayId]: prev[planDayId] === dow ? null : dow,
    }));
  }

  function toggleClient(id: string) {
    setSelectedClients(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedClients(new Set(clients.map(c => c.id)));
  }

  async function apply() {
    const dayMappings = Object.entries(dayMapping)
      .filter(([, dow]) => dow !== null)
      .map(([planDayId, dayOfWeek]) => ({ planDayId, dayOfWeek: dayOfWeek! }));

    if (!dayMappings.length) { setToast("Asigná al menos un día de la rutina a un día de la semana."); return; }
    if (!selectedClients.size) { setToast("Seleccioná al menos un alumno."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/trainer/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayMappings, clientIds: [...selectedClients] }),
      });
      const data = await res.json() as { created: number };
      setToast(`✓ ${data.created} bloque${data.created !== 1 ? "s" : ""} asignados a ${selectedClients.size} alumno${selectedClients.size !== 1 ? "s" : ""}.`);
      setAssigningId(null);
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-xl"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
          {toast}
          <button onClick={() => setToast(null)} style={{ color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => {
          const cnt = f.id === "todas" ? routines.length : routines.filter(r => r.category === f.id).length;
          const sel = filter === f.id;
          const style = f.id !== "todas" ? CAT[f.id as keyof typeof CAT] : null;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              style={{
                background: sel ? (style?.bg ?? "var(--accent-soft)") : "var(--bg-panel)",
                border: `1px solid ${sel ? (style?.color ?? "var(--accent)") : "var(--border)"}`,
                color: sel ? (style?.color ?? "var(--accent)") : "var(--text-3)",
              }}>
              {f.label}
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                style={{ background: sel ? (style?.border ?? "var(--accent-soft)") : "var(--bg-hover)", color: sel ? (style?.color ?? "var(--accent)") : "var(--text-3)" }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-4">
        {filtered.map(routine => {
          const cat = CAT[routine.category as keyof typeof CAT] ?? CAT.musculación;
          const isOpen = assigningId === routine.id;

          return (
            <div key={routine.id} className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${isOpen ? cat.color : "var(--border)"}`, background: "var(--bg-panel)" }}>

              {/* Card header */}
              <div className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                  {routine.category === "calentamiento"
                    ? <Flame className="h-5 w-5" style={{ color: cat.color }} />
                    : <Dumbbell className="h-5 w-5" style={{ color: cat.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold" style={{ color: "var(--text)" }}>{routine.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {routine.dayCount} día{routine.dayCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/trainer/plans/${routine.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "var(--bg-hover)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                    Editar
                  </Link>
                  <button
                    onClick={() => openAssign(routine)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    style={{
                      background: isOpen ? cat.color : cat.bg,
                      color: isOpen ? "#000" : cat.color,
                      border: `1px solid ${cat.border}`,
                    }}>
                    <Users className="h-3.5 w-3.5" />
                    Asignar
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Assign panel */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${cat.border}`, background: "var(--bg)" }}>
                  <div className="p-5 grid md:grid-cols-2 gap-6">

                    {/* Day mapping */}
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
                        ¿En qué días de la semana?
                      </p>
                      {loading && !routineDays.length ? (
                        <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando…</p>
                      ) : routineDays.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--text-3)" }}>Esta rutina no tiene días cargados. <Link href={`/trainer/plans/${routine.id}`} className="underline" style={{ color: cat.color }}>Editá la rutina</Link> para agregar días.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {routineDays.map(day => (
                            <div key={day.id}>
                              <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                                {day.name ?? `Día ${day.dayNumber}`}
                              </p>
                              <div className="flex gap-1.5 flex-wrap">
                                {DAYS_WEEK.map(({ dow, label }) => {
                                  const sel = dayMapping[day.id] === dow;
                                  return (
                                    <button key={dow} onClick={() => setDow(day.id, dow)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all"
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
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client selector */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                          ¿A qué alumnos?
                        </p>
                        <button onClick={selectAll}
                          className="text-xs font-bold cursor-pointer"
                          style={{ color: cat.color }}>
                          Seleccionar todos
                        </button>
                      </div>
                      {clients.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos aprobados.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                          {clients.map(client => {
                            const sel = selectedClients.has(client.id);
                            return (
                              <button key={client.id} onClick={() => toggleClient(client.id)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-all"
                                style={{
                                  background: sel ? cat.bg : "var(--bg-panel)",
                                  border: `1px solid ${sel ? cat.border : "var(--border)"}`,
                                }}>
                                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                  style={{ background: sel ? cat.color : "var(--bg-hover)", border: `1px solid ${sel ? cat.color : "var(--border)"}` }}>
                                  {sel && <Check className="h-3 w-3" style={{ color: "#000" }} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                                  <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{client.email}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply button */}
                  <div className="px-5 pb-5 flex items-center justify-between gap-4">
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {selectedClients.size > 0
                        ? `${selectedClients.size} alumno${selectedClients.size !== 1 ? "s" : ""} seleccionado${selectedClients.size !== 1 ? "s" : ""}`
                        : "Ningún alumno seleccionado"}
                    </p>
                    <button
                      onClick={apply}
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold cursor-pointer transition-all disabled:opacity-50"
                      style={{ background: cat.color, color: "#000" }}>
                      {loading ? "Asignando…" : `Asignar a ${selectedClients.size} alumno${selectedClients.size !== 1 ? "s" : ""} →`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
