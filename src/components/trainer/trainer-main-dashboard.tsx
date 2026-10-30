"use client";

import { useState, useEffect } from "react";
import { Bell, ArrowRight, Users, Send, X, Trash2, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";
import { MonthCalendar } from "./monthly-calendar";

type Slot = { id: string; dayOfWeek: number; startTime: string; type: string };
type Enrollment = { slotId: string; clientId: string; clientName: string | null };
type Client = { id: string; name: string };
type Notification = { id: string; body: string; toId: string | null; sentAt: string };

const DAYS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const TYPE_COLOR: Record<string, string> = { musculación: "var(--accent)", funcional: "var(--c-blue)" };
const TYPE_BG: Record<string, string> = { musculación: "var(--accent-soft)", funcional: "var(--c-blue-bg)" };

const DAY_COLOR: Record<number, { text: string; bg: string; border: string }> = {
  1: { text: "var(--c-blue)",   bg: "var(--c-blue-bg)",   border: "rgba(96,165,250,0.3)"  },
  2: { text: "var(--c-purple)", bg: "var(--c-purple-bg)", border: "rgba(192,132,252,0.3)" },
  3: { text: "var(--c-orange)", bg: "var(--c-orange-bg)", border: "rgba(251,146,60,0.3)"  },
  4: { text: "var(--c-pink)",   bg: "var(--c-pink-bg)",   border: "rgba(244,114,182,0.3)" },
  5: { text: "var(--c-green)",  bg: "var(--c-green-bg)",  border: "rgba(52,211,153,0.3)"  },
};

/* ─── Stat card ──────────────────────────────────────────── */

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number | string; icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="stat-card rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent ? `${accent}18` : "var(--accent-soft)" }}>
        <Icon className="h-5 w-5" style={{ color: accent ?? "var(--accent)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums leading-none"
          style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          {value}
        </p>
        <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-3)" }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── Notif modal ────────────────────────────────────────── */

function NotifModal({ clients, onSend, onClose }: {
  clients: Client[];
  onSend: (body: string, toId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [toId, setToId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setLoading(true);
    await onSend(body.trim(), toId);
    setLoading(false);
    onClose();
  }

  const inp: React.CSSProperties = {
    background: "var(--bg-hover)", border: "1px solid var(--border-strong)",
    color: "var(--text)", borderRadius: "10px", padding: "8px 12px",
    fontSize: "14px", outline: "none", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base" style={{ color: "var(--text)" }}>Enviar aviso</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
        </div>
        <select value={toId ?? ""} onChange={(e) => setToId(e.target.value || null)}
          style={{ ...inp, cursor: "pointer" }}>
          <option value="">Todos los alumnos</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea placeholder="Escribí el aviso…" value={body} onChange={(e) => setBody(e.target.value)}
          rows={3} autoFocus style={{ ...inp, resize: "none" }} />
        <button onClick={send} disabled={loading || !body.trim()}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold cursor-pointer btn-accent"
          style={{ opacity: !body.trim() ? 0.5 : 1 }}>
          <Send className="h-4 w-4" />
          {loading ? "Enviando…" : "Enviar aviso"}
        </button>
      </div>
    </div>
  );
}

/* ─── Move modal ─────────────────────────────────────────── */

function MoveModal({ client, fromSlot, slots, onMove, onClose }: {
  client: { id: string; name: string };
  fromSlot: Slot;
  slots: Slot[];
  onMove: (toSlotId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const others = slots.filter((s) => s.id !== fromSlot.id);

  async function confirm() {
    if (!selected) return;
    setLoading(true);
    await onMove(selected);
    setLoading(false);
    onClose();
  }

  const inp: React.CSSProperties = {
    background: "var(--bg-hover)", border: "1px solid var(--border-strong)",
    color: "var(--text)", borderRadius: "10px", padding: "8px 12px",
    fontSize: "14px", outline: "none", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base" style={{ color: "var(--text)" }}>Mover alumno</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer"
            style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          <strong>{client.name}</strong> está en <strong>{DAYS[fromSlot.dayOfWeek]} {fromSlot.startTime} hs</strong>. Moverlo a:
        </p>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
          <option value="">Elegir turno…</option>
          {others.map((s) => (
            <option key={s.id} value={s.id}>{DAYS[s.dayOfWeek]} {s.startTime} hs — {s.type}</option>
          ))}
        </select>
        <button onClick={confirm} disabled={!selected || loading}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold cursor-pointer btn-accent"
          style={{ opacity: !selected ? 0.5 : 1 }}>
          <ArrowRight className="h-4 w-4" />
          {loading ? "Moviendo…" : "Confirmar cambio"}
        </button>
      </div>
    </div>
  );
}

/* ─── Slot card (vertical) ───────────────────────────────── */

function SlotCard({ slot, enrolled, allSlots, onMoveRequest }: {
  slot: Slot;
  enrolled: Enrollment[];
  allSlots: Slot[];
  onMoveRequest: (client: { id: string; name: string }, fromSlot: Slot) => void;
}) {
  const accent = TYPE_COLOR[slot.type] ?? "var(--accent)";
  const bg = TYPE_BG[slot.type] ?? "var(--accent-soft)";

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ border: `1px solid ${accent}33`, background: "var(--bg-panel)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-1" style={{ background: bg }}>
        <span className="text-3xl font-extrabold tabular-nums leading-none"
          style={{ color: accent, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {slot.startTime} hs
        </span>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg capitalize"
            style={{ background: accent, color: "#0a0a0a" }}>
            {slot.type}
          </span>
          <span className="text-xs font-bold flex items-center gap-1" style={{ color: accent }}>
            <Users className="h-3 w-3" />{enrolled.length}
          </span>
        </div>
      </div>

      {/* Alumnos */}
      <div className="px-3 py-3 flex flex-col gap-1.5 flex-1"
        style={{ borderTop: `1px solid ${accent}22` }}>
        {enrolled.length === 0 ? (
          <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>Sin inscriptos</p>
        ) : enrolled.map((e) => (
          <div key={e.clientId} className="flex items-center gap-2 group cursor-default">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
              style={{ background: accent, color: "#0a0a0a" }}>
              {e.clientName?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="flex-1 text-xs font-medium truncate" style={{ color: "var(--text)" }}>
              {e.clientName ?? "Alumno"}
            </span>
            <button
              onClick={() => onMoveRequest({ id: e.clientId, name: e.clientName ?? "Alumno" }, slot)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md cursor-pointer transition-opacity"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
              title="Mover alumno">
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main dashboard ─────────────────────────────────────── */

export function TrainerMainDashboard({ userName }: { userName: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ client: { id: string; name: string }; fromSlot: Slot } | null>(null);
  const [dateLabel, setDateLabel] = useState("");

  const [today] = useState(() => {
    const d = new Date(); let dow = d.getDay(); if (dow === 0) dow = 7; return dow;
  });

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/trainer/class-slots").then((r) => r.json()),
      fetch("/api/trainer/notifications").then((r) => r.json()),
    ]).then(([slotData, notifData]) => {
      setSlots((slotData as { slots: Slot[] }).slots);
      setEnrollments((slotData as { enrollments: Enrollment[] }).enrollments);
      setClients((slotData as { clients: Client[] }).clients);
      setNotifications((notifData as { notifications: Notification[] }).notifications);
      setLoading(false);
    });
  }, []);

  async function sendNotification(body: string, toId: string | null) {
    const res = await fetch("/api/trainer/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, toId }),
    });
    const data = await res.json() as { notification: Notification };
    setNotifications((prev) => [data.notification, ...prev]);
  }

  async function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/trainer/notifications", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function moveClient(fromSlotId: string, clientId: string, toSlotId: string) {
    await fetch("/api/trainer/move-client", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, fromSlotId, toSlotId }),
    });
    setEnrollments((prev) => {
      const filtered = prev.filter((e) => !(e.slotId === fromSlotId && e.clientId === clientId));
      const moved = prev.find((e) => e.slotId === fromSlotId && e.clientId === clientId);
      if (moved) filtered.push({ ...moved, slotId: toSlotId });
      return filtered;
    });
  }

  const todaySlots = slots.filter((s) => s.dayOfWeek === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayEnrolled = todaySlots.reduce((acc, s) => acc + enrollments.filter((e) => e.slotId === s.id).length, 0);
  const weekSlots = slots.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
  const dayLabel = DAYS[today] ?? "Hoy";

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: "var(--bg-panel)" }} />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl" style={{ background: "var(--bg-panel)" }} />)}
        </div>
        <div className="h-48 rounded-2xl" style={{ background: "var(--bg-panel)" }} />
      </div>
    );
  }

  return (
    <>
      {showNotif && <NotifModal clients={clients} onSend={sendNotification} onClose={() => setShowNotif(false)} />}
      {moveTarget && (
        <MoveModal
          client={moveTarget.client}
          fromSlot={moveTarget.fromSlot}
          slots={slots}
          onMove={(toSlotId) => moveClient(moveTarget.fromSlot.id, moveTarget.client.id, toSlotId)}
          onClose={() => setMoveTarget(null)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold capitalize leading-tight"
            style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            Buen día, {userName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--text-3)" }}>{dateLabel}</p>
        </div>
        <button
          onClick={() => setShowNotif(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer btn-accent shrink-0"
          style={{ touchAction: "manipulation" }}>
          <Bell className="h-4 w-4" /> Enviar aviso
        </button>
      </div>

      {/* ── Stats strip ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Alumnos activos" value={clients.length} icon={Users} />
        <StatCard label={`Clases hoy — ${dayLabel}`} value={todaySlots.length} icon={CalendarDays} accent="var(--c-blue)" />
        <StatCard label="Inscriptos hoy" value={todayEnrolled} icon={TrendingUp} accent="var(--c-green)" />
      </div>

      {/* ── Layout: izquierda = contenido principal, derecha = calendario + avisos ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">

        {/* ── Columna izquierda ── */}
        <div className="flex flex-col gap-6 min-w-0">

          {/* HOY — 3 cards en una fila */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Hoy — {dayLabel}
              </h2>
              {todaySlots.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-lg font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {todaySlots.length} clase{todaySlots.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {todaySlots.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                <CalendarDays className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
                <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay clases programadas para hoy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {todaySlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    enrolled={enrollments.filter((e) => e.slotId === slot.id)}
                    allSlots={slots}
                    onMoveRequest={(client, fromSlot) => setMoveTarget({ client, fromSlot })}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ESTA SEMANA */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Esta semana</h2>
              <Link href="/trainer/schedule" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                Ver detalle →
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
              <div className="grid grid-cols-5">
                {[1, 2, 3, 4, 5].map((dow, i) => {
                  const dc = DAY_COLOR[dow];
                  const daySlots = weekSlots.filter((s) => s.dayOfWeek === dow);
                  const totalEnrolled = daySlots.reduce((acc, s) => acc + enrollments.filter((e) => e.slotId === s.id).length, 0);
                  const isToday = dow === today;
                  return (
                    <div key={dow} className="flex flex-col"
                      style={{ borderRight: i < 4 ? "1px solid var(--border)" : "none" }}>
                      <div className="px-3 py-3 text-center" style={{
                        borderBottom: "1px solid var(--border)",
                        borderTop: `2px solid ${isToday ? dc.text : "transparent"}`,
                        background: isToday ? dc.bg : "transparent",
                      }}>
                        <p className="text-sm font-extrabold"
                          style={{ color: isToday ? dc.text : "var(--text-3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {DAY_SHORT[dow]}
                        </p>
                      </div>
                      <div className="px-2 py-3 flex flex-col gap-1.5 flex-1">
                        {daySlots.length === 0
                          ? <p className="text-[10px] text-center" style={{ color: "var(--text-3)" }}>—</p>
                          : daySlots.map((s) => {
                            const cnt = enrollments.filter((e) => e.slotId === s.id).length;
                            const color = TYPE_COLOR[s.type] ?? "var(--accent)";
                            return (
                              <div key={s.id} className="rounded-lg px-1.5 py-1 flex items-center gap-1"
                                style={{ background: TYPE_BG[s.type] ?? "var(--accent-soft)" }}>
                                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                                <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{s.startTime}</span>
                                <span className="text-[10px] ml-auto font-semibold" style={{ color }}>{cnt}</span>
                              </div>
                            );
                          })
                        }
                      </div>
                      <div className="py-2 text-center" style={{ borderTop: "1px solid var(--border)", background: isToday ? dc.bg : "transparent" }}>
                        <span className="text-sm font-extrabold"
                          style={{ color: isToday ? dc.text : "var(--text-3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {totalEnrolled}
                        </span>
                        <p className="text-[9px]" style={{ color: "var(--text-3)" }}>alum.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

        </div>

        {/* ── Columna derecha: calendario + avisos ── */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-8">

          {/* CALENDARIO */}
          <section>
            <h2 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>Calendario</h2>
            <MonthCalendar />
          </section>

          {/* AVISOS */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Avisos</h2>
              <button onClick={() => setShowNotif(true)}
                className="text-xs font-bold flex items-center gap-1 cursor-pointer"
                style={{ color: "var(--accent)" }}>
                <Send className="h-3 w-3" /> Nuevo
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                <Bell className="h-5 w-5 mx-auto mb-1.5" style={{ color: "var(--text-3)" }} />
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Sin avisos enviados.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id}
                    className="flex items-start gap-3 px-3 py-3 rounded-2xl group"
                    style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--accent-soft)" }}>
                      <Bell className="h-3 w-3" style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug" style={{ color: "var(--text)" }}>{n.body}</p>
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
                        {n.toId ? `Para: ${clients.find((c) => c.id === n.toId)?.name ?? "alumno"}` : "Para: todos"}
                        {" · "}
                        {new Date(n.sentAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
