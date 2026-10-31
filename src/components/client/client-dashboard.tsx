"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, CalendarCheck, ClipboardList, Flame, Activity, Trophy, ArrowRight, Dumbbell, CalendarClock } from "lucide-react";
import Link from "next/link";
import { MonthCalendar } from "@/components/trainer/monthly-calendar";
import { TodayRoutine } from "@/components/client/today-routine";
import { getMembershipStatus } from "@/lib/membership";

type Slot = { id: string; dayOfWeek: number; startTime: string; type: string };
type Notification = { id: string; body: string; toId: string | null; sentAt: string; readAt: string | null };
type Plan = { id: string; planName: string; daysPerWeek: number; category: string; trainerNotes: string | null } | null;

type Props = {
  userName: string;
  plan: Plan;
  sessionsThisMonth: number;
  totalSessions: number;
  streak: number;
  membershipRenewsAt: string | null;
};

const DAYS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie"];
const TYPE_COLOR: Record<string, string> = { musculación: "var(--accent)", funcional: "var(--c-blue)" };
const TYPE_BG: Record<string, string> = { musculación: "var(--accent-soft)", funcional: "var(--c-blue-bg)" };

const DAY_COLOR: Record<number, { text: string; bg: string }> = {
  1: { text: "var(--c-blue)",   bg: "var(--c-blue-bg)"   },
  2: { text: "var(--c-purple)", bg: "var(--c-purple-bg)" },
  3: { text: "var(--c-orange)", bg: "var(--c-orange-bg)" },
  4: { text: "var(--c-pink)",   bg: "var(--c-pink-bg)"   },
  5: { text: "var(--c-green)",  bg: "var(--c-green-bg)"  },
};

const CAT_STYLE: Record<string, { color: string; bg: string }> = {
  musculación:   { color: "var(--c-lime)",   bg: "var(--c-lime-bg)" },
  funcional:     { color: "var(--c-blue)",   bg: "var(--c-blue-bg)" },
  calentamiento: { color: "var(--c-orange)", bg: "var(--c-orange-bg)" },
};

export function ClientDashboard({ userName, plan, sessionsThisMonth, totalSessions, streak, membershipRenewsAt }: Props) {
  const membership = getMembershipStatus(membershipRenewsAt);
  const memberAccent = membership.state === "overdue" ? "#ef4444" : "var(--warning)";
  const memberBg = membership.state === "overdue" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)";
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [mySlotIds, setMySlotIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [today] = useState(() => { let d = new Date().getDay(); if (d === 0) d = 7; return d; });
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/client/class-slots").then((r) => r.json()),
      fetch("/api/client/notifications").then((r) => r.json()),
    ]).then(([slotData, notifData]) => {
      setAllSlots((slotData as { slots: Slot[] }).slots);
      setMySlotIds(new Set((slotData as { mySlotIds: string[] }).mySlotIds));
      setNotifications((notifData as { notifications: Notification[] }).notifications);
      setLoading(false);
    });
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const poll = () =>
      fetch("/api/client/notifications")
        .then((r) => r.json())
        .then((data) => {
          const fresh = (data as { notifications: Notification[] }).notifications;
          if (Array.isArray(fresh)) setNotifications(fresh);
        })
        .catch(() => {});
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  const mySlots = allSlots.filter((s) => mySlotIds.has(s.id));
  const todaySlots = mySlots.filter((s) => s.dayOfWeek === today);
  const weekSlots = mySlots.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const catStyle = plan ? (CAT_STYLE[plan.category] ?? CAT_STYLE.musculación!) : null;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-extrabold capitalize"
            style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Hola, {userName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--text-2)" }}>{dateLabel}</p>
        </div>
        <Link
          href="/my-plan"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)", touchAction: "manipulation" }}
        >
          <ClipboardList className="h-4 w-4" /> Mi plan
        </Link>
      </div>

      {/* ── Aviso de renovación de membresía ───────────────────────── */}
      {membership.alert && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: memberBg, border: `1px solid ${memberAccent}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--bg-panel)" }}>
            <CalendarClock className="h-5 w-5" style={{ color: memberAccent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug" style={{ color: "var(--text)" }}>
              {membership.state === "overdue" ? "Renová tu membresía" : "Tu plan está por vencer"}
            </p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-2)" }}>{membership.clientMessage}</p>
          </div>
        </div>
      )}

      {/* ── Layout: izquierda = contenido, derecha = calendario + avisos ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">

        {/* ── Columna izquierda ── */}
        <div className="flex flex-col gap-6 min-w-0">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 flex flex-col gap-1.5"
              style={{
                background: streak > 0 ? "var(--accent-soft)" : "var(--bg-panel)",
                border: `1px solid ${streak > 0 ? "var(--accent)" : "var(--border)"}`,
              }}>
              <Flame className="h-5 w-5" style={{ color: streak > 0 ? "var(--accent)" : "var(--text-3)" }} />
              <p className="text-2xl font-extrabold tabular-nums leading-none"
                style={{ color: streak > 0 ? "var(--accent)" : "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {streak}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>días seguidos</p>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-1.5 stat-card">
              <Activity className="h-5 w-5" style={{ color: "var(--c-blue)" }} />
              <p className="text-2xl font-extrabold tabular-nums leading-none"
                style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {sessionsThisMonth}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>este mes</p>
            </div>
            <div className="rounded-2xl p-4 flex flex-col gap-1.5 stat-card">
              <Trophy className="h-5 w-5" style={{ color: "var(--c-yellow)" }} />
              <p className="text-2xl font-extrabold tabular-nums leading-none"
                style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {totalSessions}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>totales</p>
            </div>
          </div>

          {/* Sin plan */}
          {!plan && (
            <div className="flex items-start gap-4 px-5 py-4 rounded-2xl"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--accent)" }}>
                <ClipboardList className="h-5 w-5" style={{ color: "var(--accent-fg)" }} />
              </div>
              <div>
                <p className="text-sm font-extrabold" style={{ color: "var(--accent)" }}>
                  Todavía no tenés un plan asignado
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>
                  Tu entrenador te va a asignar una rutina personalizada. Aparecerá en <strong>Mi plan</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Plan card */}
          {plan && catStyle && (
            <Link href="/my-plan" className="rounded-2xl p-5 flex items-center gap-4 group"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", textDecoration: "none" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: catStyle.bg }}>
                <Dumbbell className="h-6 w-6" style={{ color: catStyle.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: catStyle.color }}>
                  {plan.category}
                </p>
                <p className="font-extrabold text-base truncate"
                  style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {plan.planName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {plan.daysPerWeek === 5 ? "Pase libre · Lun a Vie" : `${plan.daysPerWeek} días por semana`}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--accent)" }} />
            </Link>
          )}

          {/* Rutina de hoy */}
          <section>
            <TodayRoutine />
          </section>

          {/* CTA: registrar la sesión del día (luego de ver la rutina) */}
          {plan && (
            <Link href="/my-plan"
              className="flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-extrabold"
              style={{ background: "var(--accent)", color: "var(--accent-fg)", touchAction: "manipulation" }}>
              <CalendarCheck className="h-5 w-5" /> Registrar sesión de hoy
            </Link>
          )}

          {/* Hoy */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Hoy — {DAYS[today]}
              </h2>
              {todaySlots.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {todaySlots.length} clase{todaySlots.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {loading ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>Cargando…</p>
              </div>
            ) : todaySlots.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  {mySlots.length === 0 ? "No estás anotado a ningún turno." : "No tenés clase hoy."}
                </p>
                {mySlots.length === 0 && (
                  <Link href="/my-schedule" className="inline-block mt-3 text-xs font-bold px-4 py-2 rounded-xl"
                    style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                    Ver turnos disponibles →
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {todaySlots.map((slot) => {
                  const accent = TYPE_COLOR[slot.type] ?? "var(--accent)";
                  const bg = TYPE_BG[slot.type] ?? "var(--accent-soft)";
                  return (
                    <div key={slot.id} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                      style={{ background: bg, border: `2px solid ${accent}` }}>
                      <Clock className="h-6 w-6 shrink-0" style={{ color: accent }} />
                      <div className="flex-1">
                        <p className="text-2xl font-extrabold tabular-nums"
                          style={{ color: accent, fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {slot.startTime} hs
                        </p>
                        <p className="text-sm font-semibold capitalize" style={{ color: accent }}>{slot.type}</p>
                      </div>
                      <CalendarCheck className="h-5 w-5 shrink-0" style={{ color: accent }} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Esta semana con colores por día */}
          {!loading && weekSlots.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  Esta semana
                </h2>
                <Link href="/my-schedule" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                  Gestionar →
                </Link>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
                <div className="grid grid-cols-5">
                  {[1, 2, 3, 4, 5].map((dow, i) => {
                    const dc = DAY_COLOR[dow]!;
                    const daySlots = weekSlots.filter((s) => s.dayOfWeek === dow);
                    const isToday = dow === today;
                    return (
                      <div key={dow} className="flex flex-col"
                        style={{ borderRight: i < 4 ? "1px solid var(--border)" : "none" }}>
                        <div className="px-2 py-3 text-center" style={{
                          borderBottom: "1px solid var(--border)",
                          borderTop: `2px solid ${isToday ? dc.text : "transparent"}`,
                          background: isToday ? dc.bg : "transparent",
                        }}>
                          <p className="text-sm font-extrabold"
                            style={{ color: isToday ? dc.text : "var(--text-3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {DAY_SHORT[dow]}
                          </p>
                        </div>
                        <div className="px-2 py-3 flex flex-col gap-1.5 items-center">
                          {daySlots.length === 0
                            ? <span className="text-[10px]" style={{ color: "var(--text-3)" }}>—</span>
                            : daySlots.map((s) => (
                              <div key={s.id} className="w-full text-center px-1 py-1 rounded-lg text-[10px] font-bold"
                                style={{ background: TYPE_BG[s.type] ?? "var(--accent-soft)", color: TYPE_COLOR[s.type] ?? "var(--accent)" }}>
                                {s.startTime}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

        </div>

        {/* ── Columna derecha: calendario + avisos ── */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-8">

          {/* Calendario */}
          <section>
            <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>Calendario</h2>
            <MonthCalendar />
          </section>

          {/* Avisos */}
          {!loading && (
            <section>
              <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: "var(--text-3)" }}>
                <Bell className="h-3.5 w-3.5" />
                Avisos
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                    {unreadCount}
                  </span>
                )}
              </h2>
              {notifications.length === 0 && !membership.alert ? (
                <div className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                  <Bell className="h-5 w-5 mx-auto mb-1.5" style={{ color: "var(--text-3)" }} />
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Sin avisos del gimnasio.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {membership.alert && (
                    <div className="flex items-start gap-3 px-3 py-3 rounded-2xl"
                      style={{ background: memberBg, border: `1px solid ${memberAccent}` }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "var(--bg-panel)" }}>
                        <CalendarClock className="h-3.5 w-3.5" style={{ color: memberAccent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-snug" style={{ color: "var(--text)" }}>
                          {membership.state === "overdue" ? "Renová tu membresía" : "Renovación de plan"}
                        </p>
                        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-2)" }}>{membership.clientMessage}</p>
                      </div>
                    </div>
                  )}
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-3 py-3 rounded-2xl"
                      style={{
                        background: n.readAt ? "var(--bg-panel)" : "var(--accent-soft)",
                        border: `1px solid ${n.readAt ? "var(--border)" : "var(--accent)"}`,
                      }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: n.readAt ? "var(--bg-hover)" : "var(--accent-soft)" }}>
                        <Bell className="h-3 w-3" style={{ color: n.readAt ? "var(--text-3)" : "var(--accent)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-snug" style={{ color: "var(--text)" }}>{n.body}</p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
                          {new Date(n.sentAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </div>
    </>
  );
}
