"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AR_HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-01-01": "Año Nuevo",
  "2025-03-03": "Carnaval",
  "2025-03-04": "Carnaval",
  "2025-03-24": "Día Nacional de la Memoria",
  "2025-04-02": "Día del Veterano de Malvinas",
  "2025-04-18": "Viernes Santo",
  "2025-05-01": "Día del Trabajador",
  "2025-05-25": "Revolución de Mayo",
  "2025-06-20": "Paso a la Inmortalidad del Gral. Belgrano",
  "2025-07-09": "Día de la Independencia",
  "2025-08-18": "Paso a la Inmortalidad del Gral. San Martín",
  "2025-10-13": "Día del Respeto a la Diversidad Cultural",
  "2025-11-20": "Día de la Soberanía Nacional",
  "2025-12-08": "Inmaculada Concepción de la Virgen",
  "2025-12-25": "Navidad",
  // 2026
  "2026-01-01": "Año Nuevo",
  "2026-02-16": "Carnaval",
  "2026-02-17": "Carnaval",
  "2026-03-24": "Día Nacional de la Memoria",
  "2026-04-02": "Día del Veterano de Malvinas",
  "2026-04-03": "Viernes Santo",
  "2026-05-01": "Día del Trabajador",
  "2026-05-25": "Revolución de Mayo",
  "2026-06-20": "Paso a la Inmortalidad del Gral. Belgrano",
  "2026-07-09": "Día de la Independencia",
  "2026-08-17": "Paso a la Inmortalidad del Gral. San Martín",
  "2026-10-12": "Día del Respeto a la Diversidad Cultural",
  "2026-11-20": "Día de la Soberanía Nacional",
  "2026-12-08": "Inmaculada Concepción de la Virgen",
  "2026-12-25": "Navidad",
  // 2027
  "2027-01-01": "Año Nuevo",
  "2027-02-15": "Carnaval",
  "2027-02-16": "Carnaval",
  "2027-03-24": "Día Nacional de la Memoria",
  "2027-04-02": "Día del Veterano de Malvinas",
  "2027-03-26": "Viernes Santo",
  "2027-05-01": "Día del Trabajador",
  "2027-05-25": "Revolución de Mayo",
  "2027-06-21": "Paso a la Inmortalidad del Gral. Belgrano",
  "2027-07-09": "Día de la Independencia",
  "2027-08-16": "Paso a la Inmortalidad del Gral. San Martín",
  "2027-10-11": "Día del Respeto a la Diversidad Cultural",
  "2027-11-22": "Día de la Soberanía Nacional",
  "2027-12-08": "Inmaculada Concepción de la Virgen",
  "2027-12-25": "Navidad",
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dowIndex(date: Date) {
  // Mon=0 … Sun=6
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

export function MonthCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prev() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = dowIndex(firstDay);

  const cells: Array<number | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Collect holidays in this month for the list below
  const monthHolidays: Array<{ day: number; name: string }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const h = AR_HOLIDAYS[toKey(viewYear, viewMonth, d)];
    if (h) monthHolidays.push({ day: d, name: h });
  }

  const btnStyle: React.CSSProperties = {
    background: "var(--bg-hover)",
    color: "var(--text-2)",
    border: "none",
    borderRadius: "10px",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} style={btnStyle}><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>
          {MONTHS_ES[viewMonth]} {viewYear}
        </p>
        <button onClick={next} style={btnStyle}><ChevronRight className="h-4 w-4" /></button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d, i) => (
          <div key={i} className="text-center text-xs font-bold py-1"
            style={{ color: i >= 5 ? "var(--text-3)" : "var(--text-3)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="h-9" />;

          const key = toKey(viewYear, viewMonth, day);
          const holiday = AR_HOLIDAYS[key];
          const isToday = isCurrentMonth && today.getDate() === day;
          const cellDow = (startOffset + day - 1) % 7;
          const isWeekend = cellDow >= 5;

          return (
            <div
              key={idx}
              title={holiday}
              className="h-9 flex flex-col items-center justify-center relative"
            >
              <div
                className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-semibold"
                style={{
                  background: isToday ? "var(--accent)" : holiday ? "var(--accent-soft)" : "transparent",
                  color: isToday
                    ? "white"
                    : holiday
                    ? "var(--accent)"
                    : isWeekend
                    ? "var(--text-3)"
                    : "var(--text)",
                  fontWeight: holiday || isToday ? 700 : 500,
                }}
              >
                {day}
              </div>
              {holiday && !isToday && (
                <div
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--warning)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Holidays list */}
      {monthHolidays.length > 0 && (
        <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          {monthHolidays.map(({ day, name }) => (
            <div key={day} className="flex items-center gap-2">
              <span
                className="text-xs font-bold tabular-nums w-6 text-right"
                style={{ color: "var(--accent)" }}
              >
                {day}
              </span>
              <span className="text-xs" style={{ color: "var(--text-2)" }}>{name}</span>
            </div>
          ))}
        </div>
      )}

      {monthHolidays.length === 0 && (
        <p className="mt-3 pt-3 text-xs text-center" style={{ borderTop: "1px solid var(--border)", color: "var(--text-3)" }}>
          Sin feriados este mes
        </p>
      )}
    </div>
  );
}
