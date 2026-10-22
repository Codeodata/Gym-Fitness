"use client";
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, Minus, UserCheck, X } from "lucide-react";
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
  const [hovering, setHovering] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [dateRangeLabel, setDateRangeLabel] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
  const [wy, wm, wd] = weekStart.split("-").map(Number);
  const start = useMemo(() => new Date(wy!, wm! - 1, wd!), [wy, wm, wd]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  }), [start]);

  useEffect(() => {
    setDateRangeLabel(
      `${start.toLocaleDateString("es-AR", { day: "2-digit", month: "long" })} — ${days[6]!.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}`
    );
  }, [start, days]);

  function hasLog(clientId: string, day: Date) {
    return logs.some((l) => {
      const ld = new Date(l.loggedAt);
      return l.clientId === clientId && ld.toDateString() === day.toDateString();
    });
  }

  function getAtt(clientId: string, day: Date) {
    return att.find((a) => {
      const ad = new Date(a.date);
      return a.clientId === clientId && ad.toDateString() === day.toDateString();
    });
  }

  function isPast(day: Date) {
    if (!today) return false;
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }

  async function toggleAtt(clientId: string, day: Date) {
    const key = `${clientId}-${day.toDateString()}`;
    setSaving(key);
    const current = getAtt(clientId, day);
    const newPresent = !current?.present;

    setAtt((prev) => {
      const filtered = prev.filter((a) => {
        const ad = new Date(a.date);
        return !(a.clientId === clientId && ad.toDateString() === day.toDateString());
      });
      if (newPresent) return [...filtered, { clientId, date: day.toISOString(), present: true }];
      return filtered;
    });

    await fetch("/api/trainer/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, date: day.toISOString(), present: newPresent }),
    });
    setSaving(null);
  }

  // Summary per client
  function clientSummary(clientId: string) {
    const attDays = att.filter((a) => a.clientId === clientId && a.present).length;
    return { attDays };
  }

  // Total attendance for the week
  const totalPresent = att.filter((a) => a.present).length;
  const totalPossible = clients.length * days.filter((d) => isPast(d)).length;

  return (
    <div className="max-w-full">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Semana actual</h1>
          {dateRangeLabel && (
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{dateRangeLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl px-4 py-2 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-extrabold" style={{ color: "var(--accent)" }}>{totalPresent}</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>asistencias</p>
          </div>
          <div className="rounded-xl px-4 py-2 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
              {totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0}%
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>cumplimiento</p>
          </div>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos activos todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full min-w-[600px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider w-40" style={{ color: "var(--text-3)" }}>
                  Alumno
                </th>
                <th className="text-center px-2 py-3 text-xs font-bold uppercase tracking-wider w-20" style={{ color: "var(--text-3)" }}>
                  Plan
                </th>
                {days.map((d, i) => {
                  const isToday = today ? d.toDateString() === today.toDateString() : false;
                  return (
                    <th
                      key={i}
                      className="text-center px-2 py-3 text-xs font-bold uppercase tracking-wider"
                      style={{ color: isToday ? "var(--accent)" : "var(--text-3)", minWidth: "52px" }}
                    >
                      <div>{DAY_NAMES[i]}</div>
                      <div className="text-xs font-normal" style={{ color: isToday ? "var(--accent)" : "var(--text-3)" }}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
                <th className="text-center px-2 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  Sem.
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, ci) => {
                const assignment = assignments.find((a) => a.clientId === client.id);
                const { attDays } = clientSummary(client.id);
                return (
                  <tr
                    key={client.id}
                    style={{
                      background: ci % 2 === 0 ? "var(--bg)" : "var(--bg-subtle)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* Client */}
                    <td className="px-4 py-3">
                      <Link href={`/trainer/clients/${client.id}`} className="flex items-center gap-2 group">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                        >
                          {client.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold truncate max-w-[100px] group-hover:text-lime-400 transition-colors"
                          style={{ color: "var(--text)" }}>
                          {client.name.split(" ")[0]}
                        </span>
                      </Link>
                    </td>
                    {/* Plan */}
                    <td className="px-2 py-3 text-center">
                      {assignment?.planName ? (
                        <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                          {assignment.daysPerWeek === 5 ? "Pase libre" : `${assignment.daysPerWeek}d/sem`}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                    {/* Days */}
                    {days.map((day, di) => {
                      const key = `${client.id}-${day.toDateString()}`;
                      const logged = hasLog(client.id, day);
                      const attRow = getAtt(client.id, day);
                      const present = attRow?.present ?? false;
                      const past = isPast(day);
                      const isToday = today ? day.toDateString() === today.toDateString() : false;
                      const isSaving = saving === key;
                      const isHovering = hovering === key;
                      const canRemove = past && (present || logged);

                      return (
                        <td key={di} className="px-2 py-3 text-center">
                          <button
                            onClick={() => past ? toggleAtt(client.id, day) : undefined}
                            disabled={!past || isSaving}
                            onMouseEnter={() => past && setHovering(key)}
                            onMouseLeave={() => setHovering(null)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all"
                            style={{
                              cursor: past ? "pointer" : "default",
                              background: isHovering && canRemove
                                ? "rgba(239,68,68,0.15)"
                                : logged ? "var(--accent-soft)"
                                : present ? "#0f2a1a"
                                : isToday ? "rgba(196,241,53,0.08)"
                                : "transparent",
                              border: isHovering && canRemove
                                ? "1px solid #ef4444"
                                : isToday ? "1px solid rgba(196,241,53,0.25)"
                                : "1px solid transparent",
                              touchAction: "manipulation",
                            }}
                            title={
                              !past ? "Día futuro"
                              : present || logged ? "Quitar asistencia"
                              : "Marcar asistencia"
                            }
                          >
                            {isSaving ? (
                              <div className="w-3 h-3 rounded-full border border-current animate-spin" style={{ borderTopColor: "transparent", color: "var(--text-3)" }} />
                            ) : isHovering && canRemove ? (
                              <X className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
                            ) : logged ? (
                              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
                            ) : present ? (
                              <UserCheck className="h-4 w-4" style={{ color: "var(--success)" }} />
                            ) : past ? (
                              <Minus className="h-3 w-3" style={{ color: "var(--border-strong)" }} />
                            ) : null}
                          </button>
                        </td>
                      );
                    })}
                    {/* Week summary */}
                    <td className="px-2 py-3 text-center">
                      <span className="text-sm font-extrabold" style={{ color: attDays > 0 ? "var(--accent)" : "var(--text-3)" }}>
                        {attDays}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {[
          { icon: <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />, label: "Registrado por el alumno" },
          { icon: <UserCheck className="h-3.5 w-3.5" style={{ color: "var(--success)" }} />, label: "Asistencia marcada manualmente" },
          { icon: <Minus className="h-3 w-3" style={{ color: "var(--text-3)" }} />, label: "Sin registro — click para marcar" },
          { icon: <X className="h-3 w-3" style={{ color: "#ef4444" }} />, label: "Hover sobre asistencia marcada para quitar" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {item.icon}
            <span className="text-xs" style={{ color: "var(--text-3)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
