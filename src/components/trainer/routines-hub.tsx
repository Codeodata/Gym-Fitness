"use client";

import { useState } from "react";
import { ArrowLeft, Search, ChevronRight, Users } from "lucide-react";
import { WeeklyScheduleBuilder } from "./weekly-schedule-builder";

type Gender = "chica" | "chico" | null;
type Frequency = "2dias" | "3dias" | "pase_libre" | null;
type Client = { id: string; name: string; gender: Gender; membershipType: Frequency };

const MEM_LABEL: Record<string, string> = { "2dias": "2 días", "3dias": "3 días", "pase_libre": "Pase libre" };
const GENDER_LABEL: Record<string, string> = { chica: "Mujer", chico: "Hombre" };

const GROUPS: { key: "chica" | "chico" | "sin"; title: string; color: string }[] = [
  { key: "chica", title: "Mujeres", color: "#f472b6" },
  { key: "chico", title: "Hombres", color: "#60a5fa" },
  { key: "sin",   title: "Sin género asignado", color: "var(--text-3)" },
];

const GEN_CHIPS = [
  { id: "todas", label: "Todos",   color: "var(--accent)" },
  { id: "chica", label: "Mujeres", color: "#f472b6" },
  { id: "chico", label: "Hombres", color: "#60a5fa" },
] as const;

const MEM_CHIPS = [
  { id: "todas",      label: "Todas",      color: "var(--accent)" },
  { id: "2dias",      label: "2 días",     color: "#60a5fa" },
  { id: "3dias",      label: "3 días",     color: "#c084fc" },
  { id: "pase_libre", label: "Pase libre", color: "#4ade80" },
] as const;

export function RoutinesHub({ clients }: { clients: Client[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [genderFilter, setGenderFilter] = useState<"todas" | "chica" | "chico">("todas");
  const [membershipFilter, setMembershipFilter] = useState<"todas" | "2dias" | "3dias" | "pase_libre">("todas");

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-sm font-bold w-fit cursor-pointer"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="h-4 w-4" /> Volver a alumnos
        </button>
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{selected.name}</h2>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {selected.gender ? GENDER_LABEL[selected.gender] : "Sin género"}
            {selected.membershipType ? ` · ${MEM_LABEL[selected.membershipType]}` : ""}
          </p>
        </div>
        <WeeklyScheduleBuilder
          clientId={selected.id}
          clientGender={selected.gender}
          clientFrequency={selected.membershipType}
        />
      </div>
    );
  }

  const term = q.trim().toLowerCase();
  const match = (c: Client) =>
    (!term || c.name.toLowerCase().includes(term)) &&
    (membershipFilter === "todas" || c.membershipType === membershipFilter);
  const visibleGroups = GROUPS.filter((g) =>
    genderFilter === "todas" ? true : g.key === genderFilter,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alumno por nombre…"
          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
      </div>

      {/* Filtros: género + membresía */}
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider mr-1 w-[72px] shrink-0" style={{ color: "var(--text-3)" }}>Género</span>
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
          <span className="text-[11px] font-bold uppercase tracking-wider mr-1 w-[72px] shrink-0" style={{ color: "var(--text-3)" }}>Membresía</span>
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

      {visibleGroups.map((g) => {
        const list = clients.filter((c) =>
          (g.key === "sin" ? c.gender !== "chica" && c.gender !== "chico" : c.gender === g.key) && match(c),
        );
        if (list.length === 0) return null;
        return (
          <section key={g.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
              <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: g.color }}>
                {g.title} · {list.length}
              </h3>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${g.color}33`, background: "var(--bg-panel)" }}>
              {list.map((c, i) => (
                <button key={c.id} type="button" onClick={() => setSelectedId(c.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", touchAction: "manipulation" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
                    style={{ background: `${g.color}22`, color: g.color }}>
                    {c.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="flex-1 min-w-0 truncate text-sm font-bold" style={{ color: "var(--text)" }}>{c.name}</span>
                  {c.membershipType && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                      {MEM_LABEL[c.membershipType]}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {clients.length === 0 && (
        <div className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <Users className="h-8 w-8" style={{ color: "var(--text-3)" }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Todavía no hay alumnos aprobados.</p>
        </div>
      )}
    </div>
  );
}
