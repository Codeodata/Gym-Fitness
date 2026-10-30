"use client";

import { useEffect, useState } from "react";
import {
  Users, UserPlus, ClipboardList, Dumbbell, Activity, Clock, Flame, Trophy,
  CreditCard, CalendarCheck, AlertTriangle, ChevronRight, CheckCircle2,
} from "lucide-react";
import Link from "next/link";

type Data = {
  kpis: {
    activeClients: number; pendingClients: number; newThisMonth: number;
    totalPlans: number; assignedClients: number; sessionsThisWeek: number;
    totalSlots: number; totalEnrollments: number; occupancyPct: number;
  };
  memberships: { "2dias": number; "3dias": number; pase_libre: number; sin_plan: number };
  renewal: { overdue: number; soon: number; ok: number; none: number };
  categories: { musculación: number; funcional: number; calentamiento: number };
  topPlans: { planId: string; name: string; category: string; students: number }[];
  occupancy: { dow: number; slots: number; enrolled: number; capacity: number; pct: number }[];
  tracking: { label: string; asistencias: number; entrenamientos: number }[];
  trackingTotals: { asistencias: number; entrenamientos: number };
};

const DOW_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie"];
const CAT_COLOR: Record<string, string> = { musculación: "#84cc16", funcional: "var(--c-blue)", calentamiento: "var(--c-orange)" };

// Series del seguimiento
const C_ASIST = "var(--c-blue)";   // asistencias marcadas por el profe
const C_ENTREN = "var(--accent)";  // entrenamientos registrados por el alumno

function Kpi({ icon: Icon, label, value, accent, sub }: {
  icon: React.ElementType; label: string; value: number | string; accent: string; sub?: React.ReactNode;
}) {
  return (
    <div className="stat-card rounded-2xl px-4 py-4 flex items-center gap-3.5">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums leading-none"
          style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
        <p className="text-xs mt-1 font-medium leading-tight" style={{ color: "var(--text-3)" }}>{label}</p>
        {sub}
      </div>
    </div>
  );
}

function Bar({ pct, color, mounted }: { pct: number; color: string; mounted: boolean }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
      <div className="h-full rounded-full"
        style={{ width: mounted ? `${Math.min(pct, 100)}%` : "0%", background: color, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{children}</h2>
      {right}
    </div>
  );
}

export function ResumenDashboard({ userName, data }: { userName: string; data: Data }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { kpis, memberships, renewal, categories, topPlans, occupancy, tracking, trackingTotals } = data;
  const totalClients = memberships["2dias"] + memberships["3dias"] + memberships.pase_libre + memberships.sin_plan;
  const maxTopStudents = Math.max(...topPlans.map((p) => p.students), 1);
  const avgPerSlot = kpis.totalSlots > 0 ? (kpis.totalEnrollments / kpis.totalSlots).toFixed(1) : "0";
  const byVencer = renewal.overdue + renewal.soon;
  const pctConRutina = kpis.activeClients > 0 ? Math.round((kpis.assignedClients / kpis.activeClients) * 100) : 0;

  const memberList = [
    { key: "3dias", label: "3 días", value: memberships["3dias"], color: "var(--accent)" },
    { key: "2dias", label: "2 días", value: memberships["2dias"], color: "var(--c-blue)" },
    { key: "pase_libre", label: "Pase libre", value: memberships.pase_libre, color: "var(--c-purple)" },
    { key: "sin_plan", label: "Sin plan", value: memberships.sin_plan, color: "var(--text-3)" },
  ];
  const catList = [
    { key: "musculación", label: "Musculación", value: categories.musculación },
    { key: "funcional", label: "Funcional", value: categories.funcional },
    { key: "calentamiento", label: "Calentamiento", value: categories.calentamiento },
  ];
  const maxCat = Math.max(...catList.map((c) => c.value), 1);
  const maxTrack = Math.max(...tracking.flatMap((t) => [t.asistencias, t.entrenamientos]), 1);

  const renewalCards = [
    { label: "Vencidas", value: renewal.overdue, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    { label: "Por vencer", value: renewal.soon, color: "var(--warning)", bg: "rgba(245,158,11,0.14)" },
    { label: "Al día", value: renewal.ok, color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
    { label: "Sin fecha", value: renewal.none, color: "var(--text-3)", bg: "var(--bg-hover)" },
  ];

  return (
    <div className="max-w-3xl pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>Resumen</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
          La foto de tu gimnasio, {userName.split(" ")[0]} — membresías, turnos, rutinas y seguimiento.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <Kpi icon={Users} label="Alumnos activos" value={kpis.activeClients} accent="var(--accent)"
          sub={kpis.pendingClients > 0 ? (
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
              {kpis.pendingClients} pendiente{kpis.pendingClients !== 1 ? "s" : ""}
            </span>
          ) : undefined} />
        <Kpi icon={Dumbbell} label="Con rutina" value={`${kpis.assignedClients}`} accent="var(--c-purple)"
          sub={<span className="text-[10px] mt-1 block" style={{ color: "var(--text-3)" }}>{pctConRutina}% de los activos</span>} />
        <Kpi icon={CalendarCheck} label="Ocupación turnos" value={`${kpis.occupancyPct}%`} accent="var(--c-blue)"
          sub={<span className="text-[10px] mt-1 block" style={{ color: "var(--text-3)" }}>{kpis.totalEnrollments} en {kpis.totalSlots} turnos</span>} />
        <Kpi icon={CreditCard} label="Membresías por vencer" value={byVencer} accent={byVencer > 0 ? "var(--warning)" : "var(--c-green)"} />
        <Kpi icon={UserPlus} label="Nuevos este mes" value={kpis.newThisMonth} accent="var(--c-green)" />
        <Kpi icon={Activity} label="Sesiones (7 días)" value={kpis.sessionsThisWeek} accent="var(--c-orange)" />
      </div>

      {/* Membresías */}
      <section className="mb-8">
        <SectionTitle right={
          <Link href="/trainer/clients" className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--accent)" }}>
            Ver lista <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }>Membresías</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {renewalCards.map((c) => (
            <Link key={c.label} href="/trainer/clients" className="rounded-2xl px-3 py-3.5 flex flex-col gap-1"
              style={{ background: "var(--bg-panel)", border: `1px solid ${c.value > 0 && c.color !== "var(--text-3)" ? c.color : "var(--border)"}` }}>
              <span className="inline-flex items-center gap-1.5 text-2xl font-extrabold tabular-nums leading-none"
                style={{ color: c.color, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {(c.label === "Vencidas" || c.label === "Por vencer") && c.value > 0 && <AlertTriangle className="h-4 w-4" />}
                {c.value}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{c.label}</span>
            </Link>
          ))}
        </div>
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Por tipo de plan</p>
          {memberList.map((m) => {
            const pct = totalClients > 0 ? Math.round((m.value / totalClients) * 100) : 0;
            return (
              <div key={m.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{m.label}</span>
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
                    <span className="font-bold" style={{ color: "var(--text-2)" }}>{m.value}</span> · {pct}%
                  </span>
                </div>
                <Bar pct={pct} color={m.color} mounted={mounted} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Ocupación de turnos */}
      <section className="mb-8">
        <SectionTitle right={<span className="text-xs font-bold" style={{ color: "var(--c-blue)" }}>{kpis.occupancyPct}% ocupado</span>}>
          Ocupación de turnos
        </SectionTitle>
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <div className="flex items-end justify-between gap-2" style={{ height: 130 }}>
            {occupancy.map((o) => {
              const full = o.pct >= 100;
              return (
                <div key={o.dow} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-xs font-extrabold tabular-nums" style={{ color: full ? "var(--warning)" : "var(--text-2)" }}>{o.pct}%</span>
                  <div className="w-full rounded-lg relative overflow-hidden" style={{ background: "var(--bg-hover)", height: "100%" }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-lg"
                      style={{ height: mounted ? `${Math.max(Math.min(o.pct, 100), 3)}%` : "3%", background: full ? "var(--warning)" : "var(--c-blue)", transition: `height 0.7s cubic-bezier(0.16,1,0.3,1) ${o.dow * 40}ms` }} />
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--text-3)" }}>{o.enrolled}/{o.capacity || "—"}</span>
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>{DOW_SHORT[o.dow]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Planes asignados + categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-8">
        <section>
          <SectionTitle>Rutinas más asignadas</SectionTitle>
          <div className="rounded-2xl p-3 flex flex-col gap-1.5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            {topPlans.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>Todavía no hay rutinas asignadas.</p>
            ) : topPlans.map((p, i) => (
              <Link key={p.planId} href={`/trainer/plans/${p.planId}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                <span className="w-6 text-center text-sm font-extrabold tabular-nums shrink-0"
                  style={{ color: i === 0 ? "var(--accent)" : "var(--text-3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {i === 0 ? <Trophy className="h-4 w-4 inline" /> : i + 1}
                </span>
                <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: CAT_COLOR[p.category] ?? "var(--accent)" }} />
                <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{p.name}</span>
                <span className="flex items-center gap-1 text-xs font-bold tabular-nums shrink-0" style={{ color: "var(--text-2)" }}>
                  <Users className="h-3 w-3" style={{ color: "var(--text-3)" }} />{p.students}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Rutinas por categoría</SectionTitle>
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            {catList.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[c.key] }} />{c.label}
                  </span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-2)" }}>{c.value}</span>
                </div>
                <Bar pct={(c.value / maxCat) * 100} color={CAT_COLOR[c.key]!} mounted={mounted} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Seguimiento — últimas 8 semanas */}
      <section className="mb-8">
        <SectionTitle>Seguimiento — últimas 8 semanas</SectionTitle>
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          {/* Leyenda + totales del mes */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-4">
              <LegendDot color={C_ASIST} label="Asistencias marcadas" />
              <LegendDot color={C_ENTREN} label="Entrenamientos registrados" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-1.5" style={{ height: 120 }}>
            {tracking.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div className="w-1/2 rounded-t-md" title={`${t.asistencias} asistencias`}
                    style={{ height: mounted ? `${Math.max((t.asistencias / maxTrack) * 100, t.asistencias > 0 ? 4 : 1)}%` : "1%", background: C_ASIST, transition: `height 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms` }} />
                  <div className="w-1/2 rounded-t-md" title={`${t.entrenamientos} entrenamientos`}
                    style={{ height: mounted ? `${Math.max((t.entrenamientos / maxTrack) * 100, t.entrenamientos > 0 ? 4 : 1)}%` : "1%", background: C_ENTREN, transition: `height 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms` }} />
                </div>
                <span className="text-[9px] tabular-nums" style={{ color: "var(--text-3)" }}>{t.label}</span>
              </div>
            ))}
          </div>
          {/* Totales del mes */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "var(--bg-hover)" }}>
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: C_ASIST }} />
              <div>
                <p className="text-lg font-extrabold tabular-nums leading-none" style={{ color: "var(--text)" }}>{trackingTotals.asistencias}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>asistencias este mes</p>
              </div>
            </div>
            <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "var(--bg-hover)" }}>
              <Activity className="h-4 w-4 shrink-0" style={{ color: C_ENTREN }} />
              <div>
                <p className="text-lg font-extrabold tabular-nums leading-none" style={{ color: "var(--text)" }}>{trackingTotals.entrenamientos}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>entrenamientos este mes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-3">
        <Link href="/trainer/routines" className="btn-accent flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold">
          <ClipboardList className="h-4 w-4" /> Ir a Rutinas
        </Link>
        <Link href="/trainer/clients" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
          <Users className="h-4 w-4" /> Ver alumnos
        </Link>
        <Link href="/trainer/schedule" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
          <CalendarCheck className="h-4 w-4" /> Asistencias
        </Link>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}
