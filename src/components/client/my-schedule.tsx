"use client";

import { useState, useEffect } from "react";
import { Check, Calendar, Zap, Infinity, Lock, Clock } from "lucide-react";

type Slot = { id: string; dayOfWeek: number; startTime: string; type: string };
type MembershipType = "2dias" | "3dias" | "pase_libre" | null;

const DAYS = [
  { num: 1, label: "Lunes",     short: "LUN", color: "var(--c-lime)",   bg: "var(--c-lime-bg)" },
  { num: 2, label: "Martes",    short: "MAR", color: "var(--c-blue)",   bg: "var(--c-blue-bg)" },
  { num: 3, label: "Miércoles", short: "MIÉ", color: "var(--c-purple)", bg: "var(--c-purple-bg)" },
  { num: 4, label: "Jueves",    short: "JUE", color: "var(--c-orange)", bg: "var(--c-orange-bg)" },
  { num: 5, label: "Viernes",   short: "VIE", color: "var(--c-pink)",   bg: "var(--c-pink-bg)" },
];

const MEMBERSHIP_INFO: Record<string, { label: string; sub: string; icon: typeof Calendar; limit: number | null }> = {
  "2dias":      { label: "2 días / semana", sub: "2 turnos fijos",  icon: Calendar, limit: 2    },
  "3dias":      { label: "3 días / semana", sub: "3 turnos fijos",  icon: Zap,      limit: 3    },
  "pase_libre": { label: "Pase libre",      sub: "Sin límite",      icon: Infinity, limit: null },
};

const TYPE_ACCENT: Record<string, string> = {
  musculación: "var(--c-lime)",
  funcional:   "var(--c-blue)",
};
const TYPE_BG: Record<string, string> = {
  musculación: "var(--c-lime-bg)",
  funcional:   "var(--c-blue-bg)",
};
const TYPE_BG_ACTIVE: Record<string, string> = {
  musculación: "var(--c-lime-bg)",
  funcional:   "var(--c-blue-bg)",
};

export function MySchedule() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mySlotIds, setMySlotIds] = useState<Set<string>>(new Set());
  const [membership, setMembership] = useState<MembershipType>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/class-slots")
      .then((r) => r.json())
      .then((d: { slots: Slot[]; mySlotIds: string[]; membershipType: MembershipType }) => {
        setSlots(d.slots);
        setMySlotIds(new Set(d.mySlotIds));
        setMembership(d.membershipType);
        setLoading(false);
      });
  }, []);

  async function toggleSlot(slotId: string) {
    if (toggling) return;
    setError(null);
    const isEnrolled = mySlotIds.has(slotId);
    setToggling(slotId);
    const res = await fetch(`/api/client/class-slots/${slotId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isEnrolled ? "unenroll" : "enroll" }),
    });
    if (res.ok) {
      setMySlotIds((prev) => {
        const next = new Set(prev);
        isEnrolled ? next.delete(slotId) : next.add(slotId);
        return next;
      });
    } else {
      const data = await res.json() as { message?: string };
      setError(data.message ?? "No se pudo actualizar.");
    }
    setToggling(null);
  }

  if (loading) {
    return <div className="py-20 text-center text-sm" style={{ color: "var(--text-3)" }}>Cargando…</div>;
  }

  const info = membership ? MEMBERSHIP_INFO[membership] : null;
  const limit = info?.limit ?? null;
  const enrolled = mySlotIds.size;
  const remaining = limit !== null ? limit - enrolled : null;
  const isPaseLibre = membership === "pase_libre";
  const enrolledDays = new Set(slots.filter((s) => mySlotIds.has(s.id)).map((s) => s.dayOfWeek));
  const enrolledSlots = slots.filter((s) => mySlotIds.has(s.id));

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">

      {/* ── Mi semana (visual summary) ─────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: "var(--text-3)" }} />
            <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Mi semana
            </p>
          </div>
          {/* Quota indicator */}
          {membership && (
            <div className="flex items-center gap-2">
              {limit !== null ? (
                <>
                  <div className="flex gap-1">
                    {Array.from({ length: limit }).map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full"
                        style={{ background: i < enrolled ? "var(--accent)" : "var(--bg-hover)", border: `1px solid ${i < enrolled ? "var(--accent)" : "var(--border-strong)"}` }} />
                    ))}
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: enrolled >= limit ? "var(--success)" : "var(--text-3)" }}>
                    {enrolled}/{limit}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>Pase libre</span>
              )}
            </div>
          )}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-5 divide-x" style={{ borderColor: "var(--border)" }}>
          {DAYS.map((day) => {
            const dayEnrolled = enrolledSlots.filter((s) => s.dayOfWeek === day.num);
            const hasSlot = dayEnrolled.length > 0;
            return (
              <div key={day.num}
                className="flex flex-col items-center gap-1.5 py-3 px-1"
                style={{
                  background: hasSlot ? day.bg : "transparent",
                  borderRight: "1px solid var(--border)",
                }}>
                <span className="text-[10px] font-extrabold tracking-wider"
                  style={{ color: hasSlot ? day.color : "var(--text-3)" }}>
                  {day.short}
                </span>
                {hasSlot ? (
                  dayEnrolled.map((s) => (
                    <div key={s.id} className="w-full text-center">
                      <div className="text-xs font-extrabold tabular-nums leading-none"
                        style={{ color: TYPE_ACCENT[s.type] ?? "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {s.startTime}
                      </div>
                      <div className="text-[9px] mt-0.5 font-semibold capitalize leading-none"
                        style={{ color: TYPE_ACCENT[s.type] ?? "var(--accent)", opacity: 0.7 }}>
                        {s.type === "musculación" ? "mus" : "fun"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "var(--bg-hover)" }}>
                    <span className="text-[10px]" style={{ color: "var(--border-strong)" }}>—</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Plan de asistencia ────────────────────────────────────── */}
      {membership ? (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          {(() => { const Icon = info!.icon; return <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />; })()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>{info?.label}</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>{info?.sub}</p>
          </div>
          <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
        </div>
      ) : (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <Lock className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Tu entrenador todavía no configuró tu plan de asistencia
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* ── Grilla de turnos — 5 columnas ────────────────────────── */}
      {membership ? (
        <div className="flex flex-col gap-3">
          {remaining !== null && remaining > 0 && (
            <p className="text-xs font-bold text-center py-2 rounded-xl"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              Podés elegir {remaining} turno{remaining !== 1 ? "s" : ""} más
            </p>
          )}
          {remaining === 0 && (
            <p className="text-xs font-bold text-center py-2 rounded-xl"
              style={{ background: "rgba(34,197,94,0.1)", color: "var(--success)" }}>
              ✓ Plan completo
            </p>
          )}

          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid min-w-[340px]" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
              {DAYS.map((day) => {
                const daySlots = slots.filter((s) => s.dayOfWeek === day.num);
                return (
                  <div key={day.num} className="flex flex-col gap-2">
                    {/* Day header — colored per day */}
                    <div className="text-center py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ background: day.bg, color: day.color, border: `1px solid ${day.color}44` }}>
                      {day.short}
                    </div>

                    {/* Slots for this day */}
                    {daySlots.length === 0 ? (
                      <div className="rounded-xl py-4 flex items-center justify-center"
                        style={{ background: "var(--bg-panel)", border: "1px dashed var(--border)", opacity: 0.4 }}>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>—</span>
                      </div>
                    ) : (
                      daySlots.map((slot) => {
                        const isEnrolled = mySlotIds.has(slot.id);
                        const dayAlreadyTaken = !isEnrolled && !isPaseLibre && enrolledDays.has(slot.dayOfWeek);
                        const overLimit = !isEnrolled && limit !== null && mySlotIds.size >= limit;
                        const canEnroll = isEnrolled || (!dayAlreadyTaken && !overLimit);
                        const isLoading = toggling === slot.id;
                        const typeAccent = TYPE_ACCENT[slot.type] ?? "var(--accent)";
                        const bg = isEnrolled ? (TYPE_BG_ACTIVE[slot.type] ?? "var(--accent-soft)") : "var(--bg-panel)";
                        const badgeColor = TYPE_ACCENT[slot.type] ?? "var(--accent)";
                        const badgeBg = TYPE_BG[slot.type] ?? "var(--accent-soft)";

                        return (
                          <button
                            key={slot.id}
                            onClick={() => canEnroll ? toggleSlot(slot.id) : undefined}
                            disabled={!canEnroll || isLoading}
                            title={dayAlreadyTaken ? "Ya tenés un turno este día." : undefined}
                            className="w-full flex flex-col items-center gap-2 px-2 py-3 rounded-xl"
                            style={{
                              background: bg,
                              border: `1.5px solid ${isEnrolled ? typeAccent : "var(--border)"}`,
                              opacity: !canEnroll ? 0.35 : isLoading ? 0.6 : 1,
                              cursor: !canEnroll ? "not-allowed" : "pointer",
                              touchAction: "manipulation",
                              transition: "border-color 150ms, background 150ms",
                            }}
                            onMouseEnter={(e) => { if (canEnroll && !isEnrolled) e.currentTarget.style.borderColor = typeAccent; }}
                            onMouseLeave={(e) => { if (!isEnrolled) e.currentTarget.style.borderColor = "var(--border)"; }}
                          >
                            {/* Time */}
                            <span className="text-base font-extrabold tabular-nums leading-none"
                              style={{ color: isEnrolled ? typeAccent : "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {slot.startTime}
                            </span>
                            {/* Type badge — always colored */}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: badgeBg, color: badgeColor }}>
                              {slot.type === "musculación" ? "MUS" : "FUN"}
                            </span>
                            {/* Check */}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: isEnrolled ? typeAccent : "var(--bg-hover)" }}>
                              {isLoading
                                ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: "transparent", borderTopColor: isEnrolled ? "black" : "var(--text-3)" }} />
                                : isEnrolled
                                  ? <Check className="h-3.5 w-3.5" style={{ color: "black" }} />
                                  : <span className="text-sm font-bold leading-none" style={{ color: "var(--text-3)" }}>+</span>
                              }
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center rounded-2xl"
          style={{ border: "2px dashed var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-3)" }}>
            Una vez que tu entrenador configure tu plan, podrás elegir tus turnos
          </p>
        </div>
      )}
    </div>
  );
}
