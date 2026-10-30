"use client";
import { useState, useEffect, useMemo } from "react";
import { Check, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "@/lib/db/schema";
import Link from "next/link";

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type Assignment = { clientId: string; planId: string | null; planName: string | null; daysPerWeek: number | null };
type Log = { clientId: string; loggedAt: string };
type AttRow = { clientId: string; date: string; present: boolean };

type Props = {
  clients: User[];
  assignments: Assignment[];
  logs: Log[];
  attendance: AttRow[];
  weekStart: string;
};

export function WeeklySchedule({ clients, assignments, logs, attendance: initialAtt, weekStart }: Props) {
  const [att, setAtt] = useState<AttRow[]>(initialAtt);
  const [saving, setSaving] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [selected, setSelected] = useState<number>(0);
  const [dateRangeLabel, setDateRangeLabel] = useState<string | null>(null);

  // Parse YYYY-MM-DD as local date (avoid UTC shift)
  const [wy, wm, wd] = weekStart.split("-").map(Number);
  const start = useMemo(() => new Date(wy!, wm! - 1, wd!), [wy, wm, wd]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  }), [start]);

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
    // default a hoy si está en esta semana, si no al primer día
    const idx = days.findIndex((x) => x.toDateString() === d.toDateString());
    setSelected(idx >= 0 ? idx : 0);
  }, [days]);

  useEffect(() => {
    setDateRangeLabel(
      `${start.toLocaleDateString("es-AR", { day: "2-digit", month: "long" })} — ${days[6]!.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`
    );
  }, [start, days]);

  const sameDay = (iso: string, day: Date) => new Date(iso).toDateString() === day.toDateString();
  const hasLog = (clientId: string, day: Date) => logs.some((l) => l.clientId === clientId && sameDay(l.loggedAt, day));
  const getAtt = (clientId: string, day: Date) => att.find((a) => a.clientId === clientId && sameDay(a.date, day));
  const isPast = (day: Date) => { if (!today) return false; const d = new Date(day); d.setHours(0, 0, 0, 0); return d <= today; };
  const presentCount = (day: Date) => att.filter((a) => a.present && sameDay(a.date, day)).length;

  async function toggleAtt(clientId: string, day: Date) {
    const key = `${clientId}-${day.toDateString()}`;
    setSaving(key);
    const current = getAtt(clientId, day);
    const newPresent = !current?.present;
    setAtt((prev) => {
      const filtered = prev.filter((a) => !(a.clientId === clientId && sameDay(a.date, day)));
      return newPresent ? [...filtered, { clientId, date: day.toISOString(), present: true }] : filtered;
    });
    await fetch("/api/trainer/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, date: day.toISOString(), present: newPresent }),
    });
    setSaving(null);
  }

  // Resumen semana (días ya transcurridos)
  const totalPresent = att.filter((a) => a.present).length;
  const totalPossible = clients.length * days.filter((d) => isPast(d)).length;
  const pct = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

  const selDay = days[selected]!;
  const selPast = isPast(selDay);
  const selIsToday = today ? selDay.toDateString() === today.toDateString() : false;

  // Alumnos ordenados: presentes primero, luego por nombre
  const dayClients = [...clients].sort((a, b) => {
    const pa = (getAtt(a.id, selDay)?.present || hasLog(a.id, selDay)) ? 0 : 1;
    const pb = (getAtt(b.id, selDay)?.present || hasLog(b.id, selDay)) ? 0 : 1;
    return pa - pb || a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-3xl">
      {/* Header + resumen semanal */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Asistencias</h1>
        {dateRangeLabel && <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{dateRangeLabel}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatMini label="Asistencias" value={String(totalPresent)} color="var(--accent)" />
        <StatMini label="Cumplimiento" value={`${pct}%`} color="var(--text)" />
        <StatMini label="Alumnos" value={String(clients.length)} color="var(--text)" />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos activos todavía.</p>
        </div>
      ) : (
        <>
          {/* Selector de día */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const isToday = today ? d.toDateString() === today.toDateString() : false;
                const isSel = selected === i;
                const cnt = presentCount(d);
                return (
                  <button key={i} type="button" onClick={() => setSelected(i)}
                    className="px-1 py-2.5 text-center cursor-pointer transition-all"
                    style={{
                      borderRight: i < 6 ? "1px solid var(--border)" : "none",
                      borderTop: `3px solid ${isSel ? "var(--accent)" : "transparent"}`,
                      background: isSel ? "var(--accent-soft)" : "transparent",
                      touchAction: "manipulation",
                    }}>
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: isSel ? "var(--accent)" : isToday ? "var(--accent)" : "var(--text-3)" }}>
                      {DAY_NAMES[i]}
                    </span>
                    <span className="block text-sm font-bold tabular-nums leading-tight mt-0.5"
                      style={{ color: isSel ? "var(--text)" : "var(--text-2)" }}>{d.getDate()}</span>
                    <span className="inline-flex items-center justify-center min-w-4 h-4 mt-1 rounded-full text-[9px] font-extrabold px-1"
                      style={{ background: cnt > 0 ? (isSel ? "var(--accent)" : "var(--bg-hover)") : "transparent", color: cnt > 0 ? (isSel ? "#000" : "var(--text-3)") : "transparent" }}>
                      {cnt > 0 ? cnt : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Día seleccionado */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button type="button" onClick={() => setSelected((s) => Math.max(0, s - 1))} disabled={selected === 0}
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer disabled:opacity-30"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-extrabold capitalize" style={{ color: "var(--text)" }}>
              {DAY_FULL[selected]} {selDay.getDate()}{selIsToday ? " · Hoy" : ""}
            </p>
            <button type="button" onClick={() => setSelected((s) => Math.min(6, s + 1))} disabled={selected === 6}
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer disabled:opacity-30"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!selPast ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>Día futuro — todavía no se puede marcar asistencia.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dayClients.map((client) => {
                const assignment = assignments.find((a) => a.clientId === client.id);
                const logged = hasLog(client.id, selDay);
                const present = getAtt(client.id, selDay)?.present ?? false;
                const key = `${client.id}-${selDay.toDateString()}`;
                const isSaving = saving === key;
                const attended = present || logged;
                return (
                  <div key={client.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl"
                    style={{ background: "var(--bg-panel)", border: `1px solid ${attended ? "var(--accent)" : "var(--border)"}` }}>
                    <Link href={`/trainer/clients/${client.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: attended ? "var(--accent-soft)" : "var(--bg-hover)", color: attended ? "var(--accent)" : "var(--text-3)" }}>
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {assignment?.planName ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                              {assignment.daysPerWeek === 5 ? "Pase libre" : `${assignment.daysPerWeek}d/sem`}
                            </span>
                          ) : <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Sin plan</span>}
                          {logged && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
                              <Check className="h-2.5 w-2.5" /> Se registró
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Toggle presente */}
                    <button type="button" onClick={() => toggleAtt(client.id, selDay)} disabled={isSaving}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 transition-all"
                      style={present
                        ? { background: "var(--success)", color: "#03130a" }
                        : { background: "var(--bg-hover)", color: "var(--text-3)", border: "1px solid var(--border-strong)" }}
                      title={present ? "Quitar asistencia" : "Marcar presente"}>
                      {isSaving
                        ? <div className="w-3.5 h-3.5 rounded-full border-2 border-current animate-spin" style={{ borderTopColor: "transparent" }} />
                        : <UserCheck className="h-4 w-4" />}
                      {present ? "Presente" : "Marcar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
            <Legend icon={<UserCheck className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />} label="Presente (marcado por vos)" />
            <Legend icon={<Check className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />} label="Se registró (el alumno cargó su rutina)" />
          </div>
        </>
      )}
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl px-3 py-3 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
      <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--text-3)" }}>{label}</p>
    </div>
  );
}

function Legend({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}
