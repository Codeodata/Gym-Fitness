"use client";

import { useEffect, useState } from "react";
import {
  Users, UserPlus, ClipboardList, Dumbbell, Activity, Clock, Flame, Trophy,
} from "lucide-react";
import Link from "next/link";

type Data = {
  kpis: {
    activeClients: number; pendingClients: number; newThisMonth: number;
    totalPlans: number; assignedClients: number; sessionsThisWeek: number;
    totalSlots: number; totalEnrollments: number;
  };
  memberships: { "2dias": number; "3dias": number; pase_libre: number; sin_plan: number };
  categories: { musculación: number; funcional: number; calentamiento: number };
  topPlans: { planId: string; name: string; category: string; students: number }[];
  occupancy: { dow: number; slots: number; enrolled: number }[];
  activity: { label: string; count: number }[];
};

const DOW_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie"];

const CAT_COLOR: Record<string, string> = {
  musculación: "#84cc16",
  funcional: "var(--c-blue)",
  calentamiento: "var(--c-orange)",
};

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
        <p key={String(value)} className="count-pop text-2xl font-extrabold tabular-nums leading-none"
          style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          {value}
        </p>
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
        style={{ width: mounted ? `${pct}%` : "0%", background: color, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

export function ResumenDashboard({ userName, data }: { userName: string; data: Data }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { kpis, memberships, categories, topPlans, occupancy, activity } = data;
  const totalClients = memberships["2dias"] + memberships["3dias"] + memberships.pase_libre + memberships.sin_plan;
  const maxActivity = Math.max(...activity.map((a) => a.count), 1);
  const totalSessions14 = activity.reduce((s, a) => s + a.count, 0);
  const maxOccupancy = Math.max(...occupancy.map((o) => o.enrolled), 1);
  const maxTopStudents = Math.max(...topPlans.map((p) => p.students), 1);
  const avgPerSlot = kpis.totalSlots > 0 ? (kpis.totalEnrollments / kpis.totalSlots).toFixed(1) : "0";

  const memberList: { key: string; label: string; value: number; color: string }[] = [
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

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>Resumen</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
          La foto general de tu gimnasio, {userName.split(" ")[0]} — alumnos, rutinas y actividad.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <Kpi icon={Users} label="Alumnos activos" value={kpis.activeClients} accent="var(--accent)"
          sub={kpis.pendingClients > 0 ? (
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1"
              style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
              {kpis.pendingClients} pendiente{kpis.pendingClients !== 1 ? "s" : ""}
            </span>
          ) : undefined} />
        <Kpi icon={UserPlus} label="Nuevos este mes" value={kpis.newThisMonth} accent="var(--c-green)" />
        <Kpi icon={ClipboardList} label="Rutinas creadas" value={kpis.totalPlans} accent="var(--c-blue)" />
        <Kpi icon={Dumbbell} label="Alumnos con rutina" value={kpis.assignedClients} accent="var(--c-purple)" />
        <Kpi icon={Activity} label="Sesiones (7 días)" value={kpis.sessionsThisWeek} accent="var(--c-orange)" />
        <Kpi icon={Clock} label="Inscripciones a turnos" value={kpis.totalEnrollments} accent="var(--c-pink)"
          sub={<span className="text-[10px] mt-1 block" style={{ color: "var(--text-3)" }}>en {kpis.totalSlots} turnos · {avgPerSlot} por turno</span>} />
      </div>

      {/* Actividad */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Actividad — últimos 14 días
          </h2>
          <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{totalSessions14} sesiones</span>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {activity.map((a, i) => {
              const h = (a.count / maxActivity) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full group">
                  <div className="w-full rounded-md relative" title={`${a.count} sesiones`}
                    style={{
                      height: mounted ? `${Math.max(h, a.count > 0 ? 6 : 2)}%` : "2%",
                      minHeight: 3,
                      background: a.count > 0 ? "var(--accent)" : "var(--bg-hover)",
                      opacity: a.count > 0 ? 1 : 0.5,
                      transition: `height 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms`,
                    }} />
                  <span className="text-[9px] tabular-nums" style={{ color: "var(--text-3)" }}>{a.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Membresías */}
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>Membresías</h2>
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
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

        {/* Rutinas por categoría */}
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>Rutinas por categoría</h2>
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            {catList.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[c.key] }} />
                    {c.label}
                  </span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-2)" }}>{c.value}</span>
                </div>
                <Bar pct={(c.value / maxCat) * 100} color={CAT_COLOR[c.key]!} mounted={mounted} />
              </div>
            ))}
          </div>
        </section>

        {/* Ocupación de turnos */}
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>Ocupación de turnos</h2>
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
              {occupancy.map((o) => {
                const h = (o.enrolled / maxOccupancy) * 100;
                return (
                  <div key={o.dow} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <span className="text-xs font-extrabold tabular-nums" style={{ color: "var(--text-2)" }}>{o.enrolled}</span>
                    <div className="w-full rounded-lg"
                      style={{
                        height: mounted ? `${Math.max(h, 4)}%` : "4%",
                        minHeight: 4,
                        background: "var(--c-blue)",
                        transition: `height 0.7s cubic-bezier(0.16,1,0.3,1) ${o.dow * 40}ms`,
                      }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>{DOW_SHORT[o.dow]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top rutinas */}
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>Rutinas más asignadas</h2>
          <div className="rounded-2xl p-3 flex flex-col gap-1.5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            {topPlans.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>Todavía no hay rutinas asignadas.</p>
            ) : topPlans.map((p, i) => (
              <Link key={p.planId} href={`/trainer/plans/${p.planId}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                <span className="w-6 text-center text-sm font-extrabold tabular-nums shrink-0"
                  style={{ color: i === 0 ? "var(--accent)" : "var(--text-3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {i === 0 ? <Trophy className="h-4 w-4 inline" /> : i + 1}
                </span>
                <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: CAT_COLOR[p.category] ?? "var(--accent)" }} />
                <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{p.name}</span>
                <div className="flex-1 max-w-[90px] hidden sm:block">
                  <Bar pct={(p.students / maxTopStudents) * 100} color={CAT_COLOR[p.category] ?? "var(--accent)"} mounted={mounted} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold tabular-nums shrink-0" style={{ color: "var(--text-2)" }}>
                  <Users className="h-3 w-3" style={{ color: "var(--text-3)" }} />{p.students}
                </span>
              </Link>
            ))}
          </div>
        </section>

      </div>

      {/* Accesos rápidos */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/trainer/routines" className="btn-accent flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold">
          <ClipboardList className="h-4 w-4" /> Ir a Rutinas
        </Link>
        <Link href="/trainer/clients" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
          <Users className="h-4 w-4" /> Ver alumnos
        </Link>
        <Link href="/trainer/classes" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
          <Flame className="h-4 w-4" /> Turnos
        </Link>
      </div>
    </div>
  );
}
