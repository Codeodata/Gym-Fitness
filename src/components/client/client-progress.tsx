"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Flame, TrendingDown, TrendingUp, Trophy, Activity,
  Scale, ChevronDown, ChevronUp, Plus, CheckCircle, Trash2, Dumbbell,
} from "lucide-react";

type Weight  = { id: string; weightKg: string; recordedAt: string };
type Log     = { id: string; loggedAt: string; dayName: string | null; dayNumber: number | null };
type ExEntry = {
  exerciseName: string;
  muscleGroup: string;
  weightKg: string | null;
  repsDone: string | null;
  setsDone: number | null;
  loggedAt: string;
};
type Props = { weights: Weight[]; logs: Log[]; exerciseLogs: ExEntry[] };

const MG_LABEL: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  arms: "Brazos", legs: "Piernas", core: "Core",
  cardio: "Cardio", full_body: "Cuerpo completo",
};
const MG_COLOR: Record<string, string> = {
  chest: "var(--c-red)", back: "var(--c-blue)", shoulders: "var(--c-purple)",
  arms: "var(--c-orange)", legs: "var(--c-green)", core: "var(--c-yellow)",
  cardio: "var(--c-pink)", full_body: "var(--c-lime)",
};

/* ─────────────────────────────────────────────────────────────────
   Weight chart (smooth bezier)
───────────────────────────────────────────────────────────────── */
function WeightChart({ weights }: { weights: Weight[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (weights.length < 2) return (
    <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>
      Registrá al menos 2 pesajes para ver la evolución
    </p>
  );

  const rev  = [...weights].reverse();
  const vals = rev.map((w) => parseFloat(w.weightKg));
  const min  = Math.min(...vals) - 1;
  const max  = Math.max(...vals) + 1;
  const W = 400, H = 100, pad = 12;

  const pts = vals.map((v, i) => ({
    x: pad + (i / (vals.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2),
    v, date: rev[i]!.recordedAt,
  }));

  function cp(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: a.x + (b.x - a.x) * 0.35, y: a.y + (b.y - a.y) * 0.35 };
  }
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length; i++) {
    const c1 = cp(pts[i - 1]!, pts[i]!);
    const c2 = cp(pts[i]!, pts[i - 1]!);
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${pts[i]!.x} ${pts[i]!.y}`;
  }
  const fill = `${d} L ${pts.at(-1)!.x} ${H + 2} L ${pts[0]!.x} ${H + 2} Z`;

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H + 4}`} className="overflow-visible"
        onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-lime)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--c-lime)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#wg)" />
        <path d={d} fill="none" stroke="var(--c-lime)" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 6 : 3.5} fill="var(--c-lime)"
              style={{ transition: "r 100ms" }} />
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
          </g>
        ))}
      </svg>
      {hovered !== null && pts[hovered] && (
        <div className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl text-xs font-bold"
          style={{
            background: "var(--bg-hover)", border: "1px solid var(--accent)", color: "var(--text)",
            left: `${(pts[hovered]!.x / W) * 100}%`, top: `${(pts[hovered]!.y / (H + 4)) * 100}%`,
            transform: "translate(-50%, -130%)", whiteSpace: "nowrap",
          }}>
          {pts[hovered]!.v.toFixed(1)} kg
          <span className="block font-normal" style={{ color: "var(--text-3)" }}>
            {new Date(pts[hovered]!.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      )}
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          {new Date(rev[0]!.recordedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          {new Date(rev.at(-1)!.recordedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Activity heatmap
───────────────────────────────────────────────────────────────── */
function Heatmap({ logs }: { logs: Log[] }) {
  const now      = new Date();
  const logDates = new Set(logs.map((l) => new Date(l.loggedAt).toDateString()));

  const weeks: Date[][] = [];
  const cur = new Date(now);
  cur.setDate(now.getDate() - 83);
  cur.setDate(cur.getDate() - cur.getDay() + 1);
  while (cur <= now) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    weeks.push(week);
  }

  const monthLabels: { label: string; wi: number }[] = [];
  weeks.forEach((week, wi) => {
    const m = week[0]!.toLocaleDateString("es-AR", { month: "short" });
    if (!monthLabels.length || monthLabels.at(-1)!.label !== m) monthLabels.push({ label: m, wi });
  });

  return (
    <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <div style={{ display: "inline-flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: "3px", paddingLeft: "18px", marginBottom: "3px", height: "12px" }}>
          {weeks.map((_, wi) => {
            const ml = monthLabels.find((m) => m.wi === wi);
            return (
              <div key={wi} style={{ width: "13px", fontSize: "8px", color: "var(--text-3)", fontWeight: 700, whiteSpace: "nowrap" }}>
                {ml?.label ?? ""}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginRight: "3px" }}>
            {["L","M","X","J","V","S","D"].map((d, i) => (
              <div key={i} style={{ width: "14px", height: "13px", fontSize: "8px", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "2px" }}>
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px", marginRight: "3px" }}>
              {week.map((day, di) => {
                const has    = logDates.has(day.toDateString());
                const future = day > now;
                const today  = day.toDateString() === now.toDateString();
                return (
                  <div key={di}
                    title={`${day.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}${has ? " · Entrenamiento" : ""}`}
                    style={{
                      width: "13px", height: "13px", borderRadius: "3px",
                      background: has ? "var(--accent)" : "var(--bg-hover)",
                      opacity: future ? 0.15 : has ? 1 : 0.45,
                      outline: today ? "2px solid var(--accent)" : "none",
                      outlineOffset: "1px",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Exercise history chart (full size, per exercise)
───────────────────────────────────────────────────────────────── */
function ExerciseChart({ entries, color }: { entries: ExEntry[]; color: string }) {
  const [hovered, setHovered] = useState<number | null>(null);

  // chronological order, only entries with weight
  const withW = [...entries].reverse().filter((e) => e.weightKg);

  if (withW.length < 2) return (
    <div className="py-3 text-center">
      <p className="text-xs" style={{ color: "var(--text-3)" }}>
        {withW.length === 1 ? "Solo hay una sesión con peso registrado — necesitás más para ver la curva" : "Sin datos de peso para graficar"}
      </p>
    </div>
  );

  const vals   = withW.map((e) => parseFloat(e.weightKg!));
  const maxW   = Math.max(...vals);
  const firstW = vals[0]!;
  const lastW  = vals[vals.length - 1]!;
  const total  = lastW - firstW;

  const min = Math.min(...vals) - 2;
  const max = maxW + 2;
  const W = 400, H = 80, pad = 10;

  const pts = vals.map((v, i) => ({
    x: pad + (i / (vals.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2),
    v,
    date: withW[i]!.loggedAt,
    reps: withW[i]!.repsDone,
    isPR: v === maxW,
  }));

  function cp(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: a.x + (b.x - a.x) * 0.35, y: a.y + (b.y - a.y) * 0.35 };
  }
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length; i++) {
    const c1 = cp(pts[i - 1]!, pts[i]!);
    const c2 = cp(pts[i]!, pts[i - 1]!);
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${pts[i]!.x} ${pts[i]!.y}`;
  }
  const fillPath = `${d} L ${pts.at(-1)!.x} ${H + 2} L ${pts[0]!.x} ${H + 2} Z`;

  const isUp   = total > 0;
  const dc     = isUp ? "var(--c-green)" : total < 0 ? "var(--c-red)" : "var(--text-3)";
  const dbg    = isUp ? "var(--c-green-bg)" : total < 0 ? "var(--c-red-bg)" : "var(--bg-hover)";
  const safeId = `exg${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          {withW.length} sesiones ·{" "}
          <span style={{ color: "var(--text-2)" }}>{firstW % 1 === 0 ? firstW : firstW.toFixed(1)}</span>
          {" → "}
          <span style={{ color }}>{lastW % 1 === 0 ? lastW : lastW.toFixed(1)} kg</span>
        </span>
        {total !== 0 && (
          <span className="flex items-center gap-1 text-sm font-extrabold px-2.5 py-1 rounded-xl"
            style={{ background: dbg, color: dc }}>
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isUp ? "+" : ""}{total % 1 === 0 ? total : total.toFixed(1)} kg en total
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${W} ${H + 4}`} className="overflow-visible"
          onMouseLeave={() => setHovered(null)}>
          <defs>
            <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#${safeId})`} />
          <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          {pts.map((p, i) => (
            <g key={i} style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHovered(i)}
              onTouchStart={() => setHovered(i)}>
              <circle cx={p.x} cy={p.y}
                r={hovered === i ? 6 : p.isPR ? 5 : 3.5}
                fill={p.isPR ? "var(--c-yellow)" : color}
                style={{ transition: "r 100ms" }} />
              {p.isPR && (
                <circle cx={p.x} cy={p.y} r={8} fill="none"
                  stroke="var(--c-yellow)" strokeWidth="1.5" strokeDasharray="3,2" />
              )}
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hovered !== null && pts[hovered] && (
          <div className="absolute pointer-events-none z-10 px-3 py-2 rounded-xl text-xs font-bold"
            style={{
              background: "var(--bg-raised)", border: `1px solid ${color}88`, color: "var(--text)",
              left: `${(pts[hovered]!.x / W) * 100}%`,
              top: `${(pts[hovered]!.y / (H + 4)) * 100}%`,
              transform: "translate(-50%, -135%)", whiteSpace: "nowrap",
            }}>
            {pts[hovered]!.v.toFixed(1)} kg
            {pts[hovered]!.reps && (
              <span className="font-normal" style={{ color: "var(--text-3)" }}>
                {" · "}{pts[hovered]!.reps} reps
              </span>
            )}
            <span className="block font-normal mt-0.5" style={{ color: "var(--text-3)" }}>
              {new Date(pts[hovered]!.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
            </span>
            {pts[hovered]!.isPR && (
              <span className="block font-extrabold mt-0.5" style={{ color: "var(--c-yellow)" }}>★ PR</span>
            )}
          </div>
        )}

        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            {new Date(withW[0]!.loggedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            {new Date(withW.at(-1)!.loggedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Exercise section — progression with expandable chart
───────────────────────────────────────────────────────────────── */
function ExerciseSection({ entries }: { entries: ExEntry[] }) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedEx,  setSelectedEx]  = useState<string | null>(null);

  // Group by muscleGroup → exerciseName (entries sorted desc by date)
  const byGroup = new Map<string, Map<string, ExEntry[]>>();
  for (const e of entries) {
    if (!byGroup.has(e.muscleGroup)) byGroup.set(e.muscleGroup, new Map());
    const gm = byGroup.get(e.muscleGroup)!;
    if (!gm.has(e.exerciseName)) gm.set(e.exerciseName, []);
    gm.get(e.exerciseName)!.push(e);
  }

  const groups = [...byGroup.keys()];
  const active = activeGroup ?? groups[0] ?? null;

  if (groups.length === 0) return (
    <div className="rounded-2xl py-10 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <Dumbbell className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Completá una sesión para ver tu progreso</p>
    </div>
  );

  const activeMap  = active ? byGroup.get(active) : null;
  const exercises  = activeMap ? [...activeMap.entries()] : [];
  const totalCount = [...byGroup.values()].reduce((s, m) => s + m.size, 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Progreso por ejercicio
        </p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          {totalCount} ejercicios
        </span>
      </div>

      {/* Muscle group tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}>
        {groups.map((g) => {
          const col    = MG_COLOR[g] ?? "var(--c-lime)";
          const isAct  = g === active;
          return (
            <button key={g} onClick={() => { setActiveGroup(g); setSelectedEx(null); }}
              className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
              style={{
                background: isAct ? col + "22" : "var(--bg-hover)",
                color: isAct ? col : "var(--text-3)",
                border: `1px solid ${isAct ? col + "66" : "transparent"}`,
                touchAction: "manipulation",
              }}>
              {MG_LABEL[g] ?? g}
              <span className="ml-1.5 text-[10px] opacity-60">{byGroup.get(g)?.size ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Exercise rows */}
      <div>
        {exercises.map(([name, exEntries], i) => {
          const col      = MG_COLOR[exEntries[0]!.muscleGroup] ?? "var(--c-lime)";
          const latest   = exEntries[0]!;
          const prev     = exEntries[1] ?? null;

          const latestW  = latest.weightKg  ? parseFloat(latest.weightKg)  : null;
          const prevW    = prev?.weightKg   ? parseFloat(prev.weightKg)    : null;

          // Delta: recent change (last 2 sessions with weight)
          const withW    = exEntries.filter((e) => e.weightKg);
          const lastTwoW = withW.length >= 2
            ? parseFloat(withW[0]!.weightKg!) - parseFloat(withW[1]!.weightKg!)
            : null;

          // PR
          const allW     = withW.map((e) => parseFloat(e.weightKg!));
          const isPR     = latestW !== null && allW.length > 1 && latestW === Math.max(...allW);

          // Trend palette
          const up       = lastTwoW !== null && lastTwoW > 0;
          const down     = lastTwoW !== null && lastTwoW < 0;
          const trendCol = up ? "var(--c-green)" : down ? "var(--c-red)" : "var(--text-3)";
          const trendBg  = up ? "var(--c-green-bg)" : down ? "var(--c-red-bg)" : "var(--bg-hover)";
          const rowBg    = up
            ? "rgba(74,222,128,0.04)"
            : down
            ? "rgba(248,113,113,0.04)"
            : "transparent";
          const rowBgSel = up
            ? "rgba(74,222,128,0.09)"
            : down
            ? "rgba(248,113,113,0.08)"
            : "var(--bg-hover)";

          const isOpen   = selectedEx === name;
          const hasChart = withW.length >= 2;

          return (
            <div key={name} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              {/* Row */}
              <button
                onClick={() => setSelectedEx(isOpen ? null : name)}
                className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left"
                style={{
                  background: isOpen ? rowBgSel : rowBg,
                  transition: "background 150ms",
                  touchAction: "manipulation",
                }}>
                {/* Trend indicator bar */}
                <div className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: lastTwoW !== null && lastTwoW !== 0 ? trendCol : "var(--border)", opacity: lastTwoW !== null && lastTwoW !== 0 ? 1 : 0.3 }} />

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                    {new Date(latest.loggedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                    {exEntries.length > 1 && (
                      <span> · {exEntries.length} sesiones</span>
                    )}
                  </p>
                </div>

                {/* Weight + delta — main visual */}
                <div className="flex items-center gap-2 shrink-0">
                  {latestW !== null && (
                    <div className="flex items-baseline gap-1">
                      <span className="font-extrabold tabular-nums"
                        style={{ color: col, fontSize: "22px", lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {latestW % 1 === 0 ? latestW : latestW.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>kg</span>
                    </div>
                  )}

                  {/* Delta badge — THE main element */}
                  {lastTwoW !== null && lastTwoW !== 0 && (
                    <span className="flex items-center gap-0.5 font-extrabold px-2 py-1 rounded-xl"
                      style={{ background: trendBg, color: trendCol, fontSize: "13px", lineHeight: 1 }}>
                      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {lastTwoW > 0 ? "+" : ""}{lastTwoW % 1 === 0 ? lastTwoW : lastTwoW.toFixed(1)}
                    </span>
                  )}
                  {lastTwoW === 0 && latestW !== null && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-xl"
                      style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                      igual
                    </span>
                  )}

                  {isPR && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                      style={{ background: "var(--c-yellow-bg)", color: "var(--c-yellow)" }}>
                      PR
                    </span>
                  )}
                </div>

                {/* Chevron */}
                {hasChart && (
                  <ChevronDown className="h-4 w-4 shrink-0"
                    style={{
                      color: "var(--text-3)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms",
                    }} />
                )}
              </button>

              {/* Expanded chart */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1"
                  style={{ background: isOpen ? rowBgSel : "transparent", borderTop: "1px dashed var(--border)" }}>
                  {hasChart
                    ? <ExerciseChart entries={exEntries} color={col} />
                    : (
                      <p className="text-xs py-2 text-center" style={{ color: "var(--text-3)" }}>
                        Registrá el peso en tus sesiones para ver la curva de progresión
                      </p>
                    )
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Session timeline
───────────────────────────────────────────────────────────────── */
function SessionTimeline({ logs }: { logs: Log[] }) {
  const [expanded, setExpanded] = useState(false);
  if (logs.length === 0) return (
    <div className="py-8 text-center rounded-2xl" style={{ border: "2px dashed var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Todavía no registraste sesiones</p>
    </div>
  );

  const shown  = expanded ? logs : logs.slice(0, 8);
  const groups = new Map<string, Log[]>();
  for (const l of shown) {
    const k = new Date(l.loggedAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(l);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Historial de sesiones</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          {logs.length} en total
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {[...groups.entries()].map(([month, entries]) => (
          <div key={month}>
            <p className="px-5 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest capitalize"
              style={{ color: "var(--text-3)" }}>{month}</p>
            {entries.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3"
                style={{ borderTop: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  D{log.dayNumber ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {log.dayName || `Día ${log.dayNumber ?? "?"}`}
                  </p>
                  <p className="text-xs capitalize mt-0.5" style={{ color: "var(--text-3)" }}>
                    {new Date(log.loggedAt).toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {logs.length > 8 && (
        <button onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold cursor-pointer"
          style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)", touchAction: "manipulation" }}>
          {expanded
            ? <><ChevronUp className="h-3.5 w-3.5" /> Mostrar menos</>
            : <><ChevronDown className="h-3.5 w-3.5" /> Ver {logs.length - 8} sesiones más</>}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Weight input
───────────────────────────────────────────────────────────────── */
function WeightInput({ onSaved }: { onSaved: () => void }) {
  const [val, setVal]       = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk]         = useState(false);
  const router              = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!val) return;
    setSaving(true);
    await fetch("/api/client/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: val }),
    });
    setVal(""); setSaving(false); setOk(true);
    setTimeout(() => setOk(false), 2000);
    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={save} className="flex gap-2 mt-4">
      <input
        type="number" step="0.1" min="20" max="300" required
        placeholder="Tu peso hoy (kg)"
        value={val} onChange={(e) => setVal(e.target.value)}
        style={{
          background: "var(--bg-hover)", border: "1px solid var(--border-strong)",
          color: "var(--text)", borderRadius: "10px", padding: "8px 12px",
          fontSize: "14px", outline: "none", flex: 1, minWidth: 0,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      />
      <button type="submit" disabled={saving || !val}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm shrink-0 cursor-pointer"
        style={{
          background: ok ? "rgba(34,197,94,0.15)" : (saving || !val) ? "var(--bg-hover)" : "var(--accent)",
          color: ok ? "var(--success)" : (saving || !val) ? "var(--text-3)" : "var(--accent-fg)",
          touchAction: "manipulation",
        }}>
        {ok ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {ok ? "Guardado" : saving ? "…" : "Registrar"}
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Weight history list with delete
───────────────────────────────────────────────────────────────── */
function WeightHistory({ weights }: { weights: Weight[] }) {
  const [list, setList]         = useState(weights);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router                  = useRouter();

  async function del(id: string) {
    setDeleting(id);
    await fetch(`/api/client/weight?id=${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((w) => w.id !== id));
    setDeleting(null);
    router.refresh();
  }

  if (list.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
        Últimos pesajes
      </p>
      {list.slice(0, 8).map((w, i) => (
        <div key={w.id} className="flex items-center gap-2 px-4 py-2.5"
          style={{
            borderTop: i > 0 ? "1px solid var(--border)" : "none",
            opacity: deleting === w.id ? 0.4 : 1,
            transition: "opacity 150ms",
          }}>
          <span className="text-xs flex-1" style={{ color: "var(--text-3)" }}>
            {new Date(w.recordedAt).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" })}
          </span>
          <span className="text-sm font-extrabold tabular-nums"
            style={{ color: i === 0 ? "var(--accent)" : "var(--text-2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {parseFloat(w.weightKg).toFixed(1)} kg
          </span>
          <button
            onClick={() => del(w.id)}
            disabled={!!deleting}
            className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer shrink-0"
            style={{ background: "transparent", color: "var(--text-3)", touchAction: "manipulation" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}
            title="Eliminar registro"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
type Tab = "ejercicios" | "actividad" | "sesiones" | "peso";

export function ClientProgress({ weights, logs, exerciseLogs }: Props) {
  const router  = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  const [tab, setTab] = useState<Tab>("ejercicios");

  const sorted = [...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  // Streak
  const unique = [...new Set(sorted.map((l) => new Date(l.loggedAt).toDateString()))];
  let streak = 0;
  const ref = new Date(); ref.setHours(0, 0, 0, 0);
  for (const s of unique) {
    const d = new Date(s); d.setHours(0, 0, 0, 0);
    const diff = Math.round((ref.getTime() - d.getTime()) / 86400000);
    if (diff === streak || (streak === 0 && diff <= 1)) { streak++; ref.setDate(ref.getDate() - 1); }
    else break;
  }

  const now       = new Date();
  const thisMonth = logs.filter((l) => {
    const d = new Date(l.loggedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const curW  = weights[0] ? parseFloat(weights[0].weightKg) : null;
  const prevW = weights[1] ? parseFloat(weights[1].weightKg) : null;
  const wDiff = curW && prevW ? curW - prevW : null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "ejercicios", label: "Ejercicios", icon: <Dumbbell className="h-4 w-4" /> },
    { id: "actividad",  label: "Actividad",  icon: <Activity className="h-4 w-4" /> },
    { id: "sesiones",   label: "Sesiones",   icon: <Trophy className="h-4 w-4" /> },
    { id: "peso",       label: "Peso",       icon: <Scale className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{ background: streak > 0 ? "var(--accent-soft)" : "var(--bg-panel)", border: `1px solid ${streak > 0 ? "var(--accent)" : "var(--border)"}` }}>
          <Flame className="h-4 w-4" style={{ color: streak > 0 ? "var(--accent)" : "var(--text-3)" }} />
          <p className="text-3xl font-extrabold tabular-nums leading-none"
            style={{ color: streak > 0 ? "var(--accent)" : "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {streak}
          </p>
          <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-3)" }}>
            {streak === 1 ? "día seguido" : "días seguidos"}
          </p>
        </div>
        <div className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <Activity className="h-4 w-4" style={{ color: "var(--c-blue)" }} />
          <p className="text-3xl font-extrabold tabular-nums leading-none"
            style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {thisMonth}
          </p>
          <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-3)" }}>este mes</p>
        </div>
        <div className="rounded-2xl p-4 flex flex-col gap-1.5"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <Trophy className="h-4 w-4" style={{ color: "var(--c-yellow)" }} />
          <p className="text-3xl font-extrabold tabular-nums leading-none"
            style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {logs.length}
          </p>
          <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-3)" }}>totales</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
            style={{
              background: tab === t.id ? "var(--bg-raised)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-3)",
              border: tab === t.id ? "1px solid var(--border-strong)" : "1px solid transparent",
              touchAction: "manipulation",
            }}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "ejercicios" && (
        <ExerciseSection entries={exerciseLogs} />
      )}

      {tab === "actividad" && (
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Últimas 12 semanas
            </p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              {logs.filter((l) => {
                const d = new Date(l.loggedAt);
                const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay() + 1); ws.setHours(0,0,0,0);
                return d >= ws;
              }).length} esta semana
            </span>
          </div>
          <Heatmap logs={logs} />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--bg-hover)", opacity: 0.45 }} />
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Sin entreno</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--accent)" }} />
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Entrenamiento</span>
            </div>
          </div>
        </div>
      )}

      {tab === "sesiones" && (
        <SessionTimeline logs={sorted} />
      )}

      {tab === "peso" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {curW ? (
                  <>
                    <span className="text-3xl font-extrabold tabular-nums"
                      style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {curW.toFixed(1)}
                    </span>
                    <span className="text-base font-semibold" style={{ color: "var(--text-3)" }}>kg</span>
                    <span className="text-xs ml-1" style={{ color: "var(--text-3)" }}>
                      · {new Date(weights[0]!.recordedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                    </span>
                  </>
                ) : (
                  <span className="text-sm" style={{ color: "var(--text-3)" }}>Sin registros aún</span>
                )}
              </div>
              {wDiff !== null && (
                <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: wDiff < 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)", color: wDiff < 0 ? "var(--success)" : "#ef4444" }}>
                  {wDiff < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  {wDiff > 0 ? "+" : ""}{wDiff.toFixed(1)} kg
                </span>
              )}
            </div>
            <WeightChart weights={weights} />
            <WeightInput onSaved={refresh} />
          </div>
          <WeightHistory weights={weights} />
        </div>
      )}
    </div>
  );
}
