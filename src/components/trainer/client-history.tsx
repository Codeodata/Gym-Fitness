"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, Activity } from "lucide-react";

const C_ASIST = "var(--c-blue)";   // asistencias marcadas por el profe
const C_ENTREN = "var(--accent)";  // entrenamientos registrados por el alumno

type Week = { label: string; asistencias: number; entrenamientos: number };

export function ClientHistory({
  attendanceTotal, workoutTotal, weeks,
}: {
  attendanceTotal: number; workoutTotal: number; weeks: Week[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const maxW = Math.max(...weeks.flatMap((w) => [w.asistencias, w.entrenamientos]), 1);
  const hasData = attendanceTotal > 0 || workoutTotal > 0;

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Historial</h2>
      </div>

      {/* Totales separados */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl px-3 py-3 flex items-center gap-2.5" style={{ background: "var(--bg-hover)" }}>
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: C_ASIST }} />
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>{attendanceTotal}</p>
            <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--text-3)" }}>asistencias marcadas</p>
          </div>
        </div>
        <div className="rounded-xl px-3 py-3 flex items-center gap-2.5" style={{ background: "var(--bg-hover)" }}>
          <Activity className="h-5 w-5 shrink-0" style={{ color: C_ENTREN }} />
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>{workoutTotal}</p>
            <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--text-3)" }}>entrenamientos registrados</p>
          </div>
        </div>
      </div>

      {/* Tendencia 8 semanas */}
      <div className="flex items-center gap-4 mb-2">
        <Legend color={C_ASIST} label="Asistencias" />
        <Legend color={C_ENTREN} label="Entrenamientos" />
      </div>
      {hasData ? (
        <div className="flex items-end justify-between gap-1.5" style={{ height: 90 }}>
          {weeks.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <div className="w-full flex items-end justify-center gap-0.5 h-full">
                <div className="w-1/2 rounded-t-md" title={`${w.asistencias} asistencias`}
                  style={{ height: mounted ? `${Math.max((w.asistencias / maxW) * 100, w.asistencias > 0 ? 5 : 1)}%` : "1%", background: C_ASIST, transition: `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms` }} />
                <div className="w-1/2 rounded-t-md" title={`${w.entrenamientos} entrenamientos`}
                  style={{ height: mounted ? `${Math.max((w.entrenamientos / maxW) * 100, w.entrenamientos > 0 ? 5 : 1)}%` : "1%", background: C_ENTREN, transition: `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms` }} />
              </div>
              <span className="text-[9px] tabular-nums" style={{ color: "var(--text-3)" }}>{w.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs py-4 text-center" style={{ color: "var(--text-3)" }}>
          Todavía no hay asistencias ni entrenamientos registrados.
        </p>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}
