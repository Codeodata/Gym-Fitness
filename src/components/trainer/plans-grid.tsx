"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Copy, Plus } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  audience: string | null;
  frequency: string | null;
  daysPerWeek: number;
  durationWeeks: number | null;
  dayCount: number;
  exerciseCount: number;
  muscleGroups: string[];
};

const MUSCLE: Record<string, { label: string; color: string }> = {
  chest:     { label: "Pecho",           color: "#f87171" },
  back:      { label: "Espalda",         color: "#60a5fa" },
  shoulders: { label: "Hombros",         color: "#c084fc" },
  arms:      { label: "Brazos",          color: "#fb923c" },
  legs:      { label: "Piernas",         color: "#4ade80" },
  core:      { label: "Core",            color: "#facc15" },
  cardio:    { label: "Cardio",          color: "#f472b6" },
  full_body: { label: "Cuerpo completo", color: "#94a3b8" },
};
const MUSCLE_ORDER = ["chest", "back", "shoulders", "arms", "legs", "core", "cardio", "full_body"];
const sortMuscles = (ms: string[]) => [...ms].sort((a, b) => MUSCLE_ORDER.indexOf(a) - MUSCLE_ORDER.indexOf(b));

const AUDIENCE: Record<string, { color: string; label: string }> = {
  chicas: { color: "#f472b6", label: "Mujeres" },
  chicos: { color: "#60a5fa", label: "Hombres" },
};

const CATEGORY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  musculación:   { color: "var(--c-lime)",   bg: "var(--c-lime-bg)",   label: "Musculación"   },
  funcional:     { color: "var(--c-blue)",   bg: "var(--c-blue-bg)",   label: "Funcional"     },
  calentamiento: { color: "var(--c-orange)", bg: "var(--c-orange-bg)", label: "Calentamiento" },
};

// Los tres tipos de plan que maneja el profe.
const GROUPS = [
  { id: "2dias",      label: "2 días",   desc: "Dos entrenamientos por semana" },
  { id: "3dias",      label: "3 días",   desc: "Tres entrenamientos por semana" },
  { id: "pase_libre", label: "Pase libre", desc: "Cinco días por semana" },
] as const;

const KNOWN_FREQ = new Set<string>(GROUPS.map((g) => g.id));

type GenderFilter = "todas" | "chicas" | "chicos";

const GENDER_CHIPS: { id: GenderFilter; label: string; color: string }[] = [
  { id: "todas",  label: "Todos",   color: "var(--accent)" },
  { id: "chicas", label: "Mujeres", color: "#f472b6" },
  { id: "chicos", label: "Hombres", color: "#60a5fa" },
];

export function PlansGrid({ plans }: { plans: Plan[] }) {
  const [gender, setGender] = useState<GenderFilter>("todas");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [dupId, setDupId] = useState<string | null>(null);
  const router = useRouter();

  async function duplicate(e: React.MouseEvent, planId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (dupId) return;
    setDupId(planId);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}/duplicate`, { method: "POST" });
      const data = (await res.json()) as { id?: string };
      if (data.id) router.push(`/trainer/plans/${data.id}`);
      else router.refresh();
    } finally {
      setDupId(null);
    }
  }

  const byGender = gender === "todas" ? plans : plans.filter((p) => p.audience === gender);
  const visible = muscle ? byGender.filter((p) => p.muscleGroups.includes(muscle)) : byGender;
  const inGroup = (freq: string) =>
    visible
      .filter((p) => p.frequency === freq)
      .sort((a, b) => (a.audience ?? "zz").localeCompare(b.audience ?? "zz"));
  const others = visible.filter((p) => !KNOWN_FREQ.has(p.frequency ?? ""));

  // Músculos presentes en el set filtrado por género (para los chips).
  const musclesPresent = MUSCLE_ORDER.filter((m) => byGender.some((p) => p.muscleGroups.includes(m)));

  return (
    <>
      {/* Filtro por género */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {GENDER_CHIPS.map((c) => {
          const n = c.id === "todas" ? plans.length : plans.filter((p) => p.audience === c.id).length;
          const sel = gender === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setGender(c.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
              style={{
                background: sel ? `${c.color}1f` : "var(--bg-panel)",
                border: `1px solid ${sel ? c.color : "var(--border)"}`,
                color: sel ? c.color : "var(--text-3)",
                touchAction: "manipulation",
              }}
            >
              {c.id !== "todas" && <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />}
              {c.label}
              <span
                className="text-[10px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-md"
                style={{ background: sel ? c.color : "var(--bg-hover)", color: sel ? "#0a0a0a" : "var(--text-3)" }}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtro por grupo muscular */}
      {musclesPresent.length > 0 && (
        <div className="flex gap-1.5 mb-8 flex-wrap items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider mr-1" style={{ color: "var(--text-3)" }}>
            Músculo
          </span>
          <button
            onClick={() => setMuscle(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={{
              background: !muscle ? "var(--accent)" : "var(--bg-panel)",
              color: !muscle ? "var(--accent-fg)" : "var(--text-3)",
              border: `1px solid ${!muscle ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            Todos
          </button>
          {musclesPresent.map((m) => {
            const mm = MUSCLE[m]!;
            const sel = muscle === m;
            const n = byGender.filter((p) => p.muscleGroups.includes(m)).length;
            return (
              <button
                key={m}
                onClick={() => setMuscle(sel ? null : m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                style={{
                  background: sel ? mm.color : `${mm.color}1a`,
                  color: sel ? "#0a0a0a" : mm.color,
                  border: `1px solid ${sel ? mm.color : "transparent"}`,
                }}
              >
                {mm.label}
                <span className="tabular-nums" style={{ opacity: 0.8 }}>{n}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-10">
        {GROUPS.map((g) => {
          const list = inGroup(g.id);
          return (
            <section key={g.id}>
              <div className="flex items-baseline gap-3 mb-4">
                <h2
                  className="text-xl font-extrabold leading-none"
                  style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {g.label}
                </h2>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>{g.desc}</span>
                <span
                  className="ml-auto text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
                >
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                muscle ? (
                  <p className="text-sm py-3 px-1" style={{ color: "var(--text-3)" }}>
                    Ninguna plantilla de {g.label.toLowerCase()} con {MUSCLE[muscle]?.label ?? "ese músculo"}.
                  </p>
                ) : (
                  <Link
                    href="/trainer/plans/new"
                    className="flex items-center justify-center gap-2 rounded-2xl py-6 text-sm font-semibold"
                    style={{ border: "1.5px dashed var(--border-strong)", color: "var(--text-3)" }}
                  >
                    <Plus className="h-4 w-4" />
                    Crear plantilla de {g.label.toLowerCase()}
                  </Link>
                )
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} dupId={dupId} onDuplicate={duplicate} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {others.length > 0 && (
          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <h2
                className="text-xl font-extrabold leading-none"
                style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Otras
              </h2>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Sin tipo de plan asignado</span>
              <span
                className="ml-auto text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-full"
                style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
              >
                {others.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((plan) => (
                <PlanCard key={plan.id} plan={plan} dupId={dupId} onDuplicate={duplicate} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function PlanCard({
  plan,
  dupId,
  onDuplicate,
}: {
  plan: Plan;
  dupId: string | null;
  onDuplicate: (e: React.MouseEvent, id: string) => void;
}) {
  const aud = plan.audience ? AUDIENCE[plan.audience] : null;
  const cat = CATEGORY_STYLE[plan.category] ?? CATEGORY_STYLE["musculación"]!;
  const accent = aud?.color ?? "var(--border)";

  return (
    <Link
      href={`/trainer/plans/${plan.id}`}
      className="plan-card rounded-2xl p-5 flex flex-col gap-3 group"
      style={{ background: "var(--bg-panel)", border: `1px solid ${aud ? `${aud.color}44` : "var(--border)"}` }}
    >
      <div className="flex items-center justify-between gap-2">
        {aud ? (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0"
            style={{ background: `${aud.color}1f`, color: aud.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: aud.color }} />
            {aud.label}
          </span>
        ) : (
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0"
            style={{ background: cat.bg, color: cat.color }}
          >
            {cat.label}
          </span>
        )}
        <span
          className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg shrink-0"
          style={{ background: "var(--bg-hover)", color: plan.exerciseCount > 0 ? "var(--text-2)" : "#f59e0b" }}
        >
          {plan.exerciseCount > 0 ? `${plan.exerciseCount} ej.` : "Sin ejercicios"}
        </span>
      </div>

      <h3
        className="font-extrabold text-base leading-tight"
        style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {plan.name}
      </h3>

      {plan.muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sortMuscles(plan.muscleGroups).map((m) => {
            const mm = MUSCLE[m];
            if (!mm) return null;
            return (
              <span
                key={m}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: `${mm.color}1f`, color: mm.color }}
              >
                {mm.label}
              </span>
            );
          })}
        </div>
      )}

      {plan.description && (
        <p className="text-sm line-clamp-2" style={{ color: "var(--text-3)" }}>{plan.description}</p>
      )}

      <div
        className="flex items-center gap-3 mt-auto pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
          <ClipboardList className="h-3.5 w-3.5" style={{ color: accent }} />
          {plan.dayCount} día{plan.dayCount !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={(e) => onDuplicate(e, plan.id)}
          disabled={dupId === plan.id}
          title="Duplicar esta plantilla"
          className="ml-auto flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--text-2)", border: "1px solid var(--border)" }}
        >
          <Copy className="h-3 w-3" />
          {dupId === plan.id ? "Copiando…" : "Duplicar"}
        </button>
        <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent === "var(--border)" ? "var(--accent)" : accent }}>
          Ver →
        </span>
      </div>
    </Link>
  );
}
