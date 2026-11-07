"use client";

import { useState } from "react";
import { Clock, CalendarDays } from "lucide-react";
import { ClassSchedule } from "./class-schedule";
import { WeeklySchedule } from "./weekly-schedule";
import type { User } from "@/lib/db/schema";

type Assignment = { clientId: string; planId: string | null; planName: string | null; daysPerWeek: number | null };
type Log = { clientId: string; loggedAt: string };
type AttRow = { clientId: string; date: string; present: boolean };

export function TurnosTabs({
  clients,
  assignments,
  logs,
  attendance,
  weekStart,
}: {
  clients: User[];
  assignments: Assignment[];
  logs: Log[];
  attendance: AttRow[];
  weekStart: string;
}) {
  const [view, setView] = useState<"turnos" | "asistencias">("turnos");

  return (
    <div>
      {/* Toggle de vista */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-full sm:w-auto sm:inline-flex" style={{ background: "var(--bg-hover)" }}>
        {([["turnos", "Turnos", Clock], ["asistencias", "Asistencias", CalendarDays]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setView(key)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all"
            style={{
              background: view === key ? "var(--bg-panel)" : "transparent",
              color: view === key ? "var(--text)" : "var(--text-3)",
              border: view === key ? "1px solid var(--border)" : "1px solid transparent",
              touchAction: "manipulation",
            }}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {view === "turnos" ? (
        <>
          <div className="mb-6">
            <h1 className="font-extrabold" style={{ color: "var(--text)" }}>Turnos</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
              Asigná alumnos a cada turno semanal — tocá cualquier turno para gestionar
            </p>
          </div>
          <ClassSchedule />
        </>
      ) : (
        <WeeklySchedule clients={clients} assignments={assignments} logs={logs} attendance={attendance} weekStart={weekStart} />
      )}
    </div>
  );
}
