"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X, Users, CreditCard, CalendarClock, BadgeCheck, ChevronRight, AlertTriangle, Infinity as InfinityIcon, Calendar, Zap } from "lucide-react";
import { ClientsGrid } from "@/components/trainer/clients-grid";
import { getMembershipStatus, type MembershipState } from "@/lib/membership";
import type { User } from "@/lib/db/schema";

type PlanInfo = { planName: string; daysPerWeek: number } | null;
type ClientCard = User & { planInfo: PlanInfo };

type Props = {
  pending: ClientCard[];
  active: ClientCard[];
  inactive: ClientCard[];
};

const MEMBERSHIP: Record<string, { label: string; color: string; bg: string; icon: typeof Calendar }> = {
  "2dias":      { label: "2 días/sem", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: Calendar },
  "3dias":      { label: "3 días/sem", color: "#c084fc", bg: "rgba(192,132,252,0.12)", icon: Zap },
  "pase_libre": { label: "Pase libre", color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: InfinityIcon },
};

const STATE_COLOR: Record<MembershipState, { color: string; bg: string }> = {
  none:    { color: "var(--text-3)", bg: "var(--bg-hover)" },
  ok:      { color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
  soon:    { color: "var(--warning)", bg: "rgba(245,158,11,0.15)" },
  due:     { color: "var(--warning)", bg: "rgba(245,158,11,0.18)" },
  overdue: { color: "#ef4444",        bg: "rgba(239,68,68,0.15)" },
};

// Orden de urgencia para el listado de membresías: vencidas y por vencer primero.
const STATE_RANK: Record<MembershipState, number> = { overdue: 0, due: 1, soon: 2, ok: 3, none: 4 };

// Colores por género. Las claves son los valores del enum (chica/chico);
// las etiquetas visibles usan términos profesionales (Mujeres/Hombres).
const GENDER = {
  chica: { label: "Mujeres", color: "#f472b6" },
  chico: { label: "Hombres", color: "#60a5fa" },
} as const;

export function ClientsView({ pending, active, inactive }: Props) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"alumnos" | "membresias">("alumnos");
  const [genderFilter, setGenderFilter] = useState<"todas" | "chica" | "chico">("todas");
  const [membershipFilter, setMembershipFilter] = useState<"todas" | "2dias" | "3dias" | "pase_libre">("todas");
  const q = query.trim().toLowerCase();

  const matches = (c: ClientCard) =>
    (!q || c.name.toLowerCase().includes(q)) &&
    (genderFilter === "todas" || c.gender === genderFilter) &&
    (membershipFilter === "todas" || c.membershipType === membershipFilter);
  const countMatch = (arr: ClientCard[]) => arr.filter(matches).length;

  const nPending = countMatch(pending);
  const nActive = countMatch(active);
  const nInactive = countMatch(inactive);
  const anyFilter = q !== "" || genderFilter !== "todas" || membershipFilter !== "todas";
  const noResults = anyFilter && nPending + nActive + nInactive === 0;

  const GEN_CHIPS = [
    { id: "todas", label: "Todos",   color: "var(--accent)" },
    { id: "chica", label: "Mujeres", color: GENDER.chica.color },
    { id: "chico", label: "Hombres", color: GENDER.chico.color },
  ] as const;
  const MEM_CHIPS = [
    { id: "todas",      label: "Todas",      color: "var(--accent)" },
    { id: "2dias",      label: "2 días",     color: MEMBERSHIP["2dias"]!.color },
    { id: "3dias",      label: "3 días",     color: MEMBERSHIP["3dias"]!.color },
    { id: "pase_libre", label: "Pase libre", color: MEMBERSHIP["pase_libre"]!.color },
  ] as const;

  return (
    <>
      {/* Toggle de vista */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-full sm:w-auto sm:inline-flex" style={{ background: "var(--bg-hover)" }}>
        {([["alumnos", "Alumnos", Users], ["membresias", "Membresías", CreditCard]] as const).map(([key, label, Icon]) => (
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

      {/* Buscador por nombre (ambas vistas) */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar alumno por nombre…"
          className="w-full rounded-xl pl-10 pr-10 py-3 text-sm outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ color: "var(--text-3)", background: "var(--bg-hover)" }}
            title="Limpiar búsqueda">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {view === "membresias" ? (
        <MembershipsView active={active} inactive={inactive} query={q} />
      ) : (
        <>
          {/* Filtros: género + membresía */}
          <div className="flex flex-col gap-2.5 mb-6">
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs font-bold uppercase tracking-wider mr-1 w-[72px] shrink-0" style={{ color: "var(--text-3)" }}>Género</span>
              {GEN_CHIPS.map((c) => {
                const sel = genderFilter === c.id;
                return (
                  <button key={c.id} onClick={() => setGenderFilter(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    style={{ background: sel ? `${c.color}1f` : "var(--bg-panel)", border: `1px solid ${sel ? c.color : "var(--border)"}`, color: sel ? c.color : "var(--text-3)" }}>
                    {c.id !== "todas" && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-xs font-bold uppercase tracking-wider mr-1 w-[72px] shrink-0" style={{ color: "var(--text-3)" }}>Membresía</span>
              {MEM_CHIPS.map((c) => {
                const sel = membershipFilter === c.id;
                return (
                  <button key={c.id} onClick={() => setMembershipFilter(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    style={{ background: sel ? `${c.color}1f` : "var(--bg-panel)", border: `1px solid ${sel ? c.color : "var(--border)"}`, color: sel ? c.color : "var(--text-3)" }}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {nPending > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#f59e0b" }}>
                Esperando aprobación · {nPending}
              </h2>
              <ClientsGrid clients={pending} status="pending" filter={query} gender={genderFilter} membership={membershipFilter} />
            </section>
          )}

          {(nActive > 0 || !anyFilter) && (
            <section className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
                Activos · {nActive}
              </h2>
              {active.length === 0 ? (
                <div className="rounded-2xl p-10 flex items-center justify-center"
                  style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                  <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos activos todavía.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-7">
                  {genderFilter !== "chico" && (
                    <GenderGroup title={GENDER.chica.label} color={GENDER.chica.color}
                      clients={active.filter((c) => c.gender === "chica")} query={query} q={q} membership={membershipFilter} />
                  )}
                  {genderFilter !== "chica" && (
                    <GenderGroup title={GENDER.chico.label} color={GENDER.chico.color}
                      clients={active.filter((c) => c.gender === "chico")} query={query} q={q} membership={membershipFilter} />
                  )}
                  {genderFilter === "todas" && (
                    <GenderGroup title="Sin género asignado" color="var(--text-3)"
                      clients={active.filter((c) => c.gender !== "chica" && c.gender !== "chico")} query={query} q={q} membership={membershipFilter} />
                  )}
                </div>
              )}
            </section>
          )}

          {nInactive > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#ef4444" }}>
                Inactivos · {nInactive}
              </h2>
              <ClientsGrid clients={inactive} status="inactive" filter={query} gender={genderFilter} membership={membershipFilter} />
            </section>
          )}

          {noResults && (
            <div className="rounded-2xl p-10 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                No se encontraron alumnos con “{query}”.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ─── Vista de membresías ────────────────────────────────────────────────── */

function MembershipsView({ active, inactive, query }: { active: ClientCard[]; inactive: ClientCard[]; query: string }) {
  const all = [...active.map(c => ({ c, isActive: true })), ...inactive.map(c => ({ c, isActive: false }))]
    .filter(({ c }) => !query || c.name.toLowerCase().includes(query));

  const rows = all
    .map(({ c, isActive }) => ({ c, isActive, status: getMembershipStatus(c.membershipRenewsAt) }))
    .sort((a, b) => {
      const r = STATE_RANK[a.status.state] - STATE_RANK[b.status.state];
      if (r !== 0) return r;
      if (a.status.daysLeft != null && b.status.daysLeft != null) return a.status.daysLeft - b.status.daysLeft;
      return a.c.name.localeCompare(b.c.name);
    });

  const alerts = rows.filter(r => r.status.alert).length;
  const noDate = rows.filter(r => r.status.state === "none").length;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          {query ? `Sin alumnos con “${query}”.` : "No hay alumnos para mostrar."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatMini label="Alumnos" value={rows.length} color="var(--text)" />
        <StatMini label="Por renovar" value={alerts} color={alerts > 0 ? "var(--warning)" : "var(--text)"} />
        <StatMini label="Sin fecha" value={noDate} color="var(--text-3)" />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map(({ c, isActive, status }) => {
          const m = c.membershipType ? MEMBERSHIP[c.membershipType] : null;
          const sc = STATE_COLOR[status.state];
          const MIcon = m?.icon;
          return (
            <Link key={c.id} href={`/trainer/clients/${c.id}`}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-colors"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
                style={{ background: isActive ? "var(--accent-soft)" : "var(--bg-hover)", color: isActive ? "var(--accent)" : "var(--text-3)" }}>
                {c.name[0]?.toUpperCase()}
              </div>

              {/* Nombre + plan */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                  {!isActive && <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>inactivo</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {m ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: m.bg, color: m.color }}>
                      {MIcon && <MIcon className="h-2.5 w-2.5" />}{m.label}
                    </span>
                  ) : (
                    <span className="text-2xs font-bold" style={{ color: "var(--text-3)" }}>Sin plan</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-2xs" style={{ color: "var(--text-3)" }}>
                    <BadgeCheck className="h-2.5 w-2.5" style={{ color: c.membershipPaidAt ? "var(--success)" : "var(--text-3)" }} />
                    {c.membershipPaidAt ? `Pagó ${fmtShort(c.membershipPaidAt)}` : "Sin pago"}
                  </span>
                </div>
              </div>

              {/* Estado de renovación */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2 py-1 rounded-lg text-right"
                  style={{ color: sc.color, background: sc.bg }}>
                  {status.alert && <AlertTriangle className="h-3 w-3 shrink-0" />}
                  {status.state === "none"
                    ? <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />Sin fecha</span>
                    : status.trainerLabel}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl px-3 py-3 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color, fontFamily: "var(--font-display)" }}>{value}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-3)" }}>{label}</p>
    </div>
  );
}

/* ─── Grupo por género (chicas / chicos) ─────────────────────────────────── */

function GenderGroup({ title, color, clients, query, q, membership }: {
  title: string; color: string; clients: ClientCard[]; query: string; q: string;
  membership: "todas" | "2dias" | "3dias" | "pase_libre";
}) {
  const n = clients.filter(
    (c) => (!q || c.name.toLowerCase().includes(q)) && (membership === "todas" || c.membershipType === membership),
  ).length;
  if (n === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color }}>
          {title} · {n}
        </h3>
      </div>
      <ClientsGrid clients={clients} status="active" filter={query} accent={color} membership={membership} />
    </div>
  );
}

function fmtShort(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}
