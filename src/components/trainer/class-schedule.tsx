"use client";

import { useState, useEffect } from "react";
import { Plus, X, Users, Search } from "lucide-react";

type Slot = { id: string; dayOfWeek: number; startTime: string; type: string };
type Enrollment = { slotId: string; clientId: string; clientName: string | null };
type Client = { id: string; name: string };

const DAYS = [
  { num: 1, label: "Lunes", short: "Lun" },
  { num: 2, label: "Martes", short: "Mar" },
  { num: 3, label: "Miércoles", short: "Mié" },
  { num: 4, label: "Jueves", short: "Jue" },
  { num: 5, label: "Viernes", short: "Vie" },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  musculación: { bg: "var(--accent-soft)", text: "var(--accent)", border: "var(--accent)" },
  funcional: { bg: "var(--c-blue-bg)", text: "var(--c-blue)", border: "var(--c-blue)" },
};

function AddClientPanel({
  slot,
  enrolled,
  clients,
  onAction,
  onClose,
}: {
  slot: Slot;
  enrolled: Enrollment[];
  clients: Client[];
  onAction: (clientId: string, action: "enroll" | "unenroll") => Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const enrolledIds = new Set(enrolled.map((e) => e.clientId));
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  async function toggle(clientId: string) {
    setLoading(clientId);
    await onAction(clientId, enrolledIds.has(clientId) ? "unenroll" : "enroll");
    setLoading(null);
  }

  const typeStyle = TYPE_COLORS[slot.type] ?? TYPE_COLORS["musculación"]!;

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-xs flex flex-col"
        style={{ background: "var(--bg-panel)", borderLeft: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: typeStyle.bg, color: typeStyle.text }}>
              {slot.type}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xl font-extrabold" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {DAYS.find((d) => d.num === slot.dayOfWeek)?.label} {slot.startTime} hs
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {enrolled.length} alumno{enrolled.length !== 1 ? "s" : ""} inscripto{enrolled.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <input
              placeholder="Buscar alumno…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: "var(--bg-hover)", border: "1px solid var(--border-strong)",
                color: "var(--text)", borderRadius: "10px", padding: "7px 10px 7px 32px",
                fontSize: "13px", outline: "none", width: "100%",
              }}
            />
          </div>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1">
          {filtered.length === 0 && (
            <p className="text-center py-6 text-sm" style={{ color: "var(--text-3)" }}>Sin resultados</p>
          )}
          {filtered.map((client) => {
            const isEnrolled = enrolledIds.has(client.id);
            const isLoading = loading === client.id;
            return (
              <button
                key={client.id}
                onClick={() => toggle(client.id)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left"
                style={{
                  background: isEnrolled ? "var(--accent-soft)" : "var(--bg-hover)",
                  border: `1px solid ${isEnrolled ? "var(--accent)" : "var(--border)"}`,
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                  style={{ background: isEnrolled ? "var(--accent)" : "var(--bg-panel)", color: isEnrolled ? "white" : "var(--text-3)" }}>
                  {client.name[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{client.name}</span>
                {isEnrolled && (
                  <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ClassSchedule() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const res = await fetch("/api/trainer/class-slots");
    const data = await res.json() as { slots: Slot[]; enrollments: Enrollment[]; clients: Client[] };
    setSlots(data.slots);
    setEnrollments(data.enrollments);
    setClients(data.clients);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAction(slotId: string, clientId: string, action: "enroll" | "unenroll") {
    await fetch(`/api/trainer/class-slots/${slotId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, action }),
    });
    setEnrollments((prev) =>
      action === "enroll"
        ? [...prev, { slotId, clientId, clientName: clients.find((c) => c.id === clientId)?.name ?? null }]
        : prev.filter((e) => !(e.slotId === slotId && e.clientId === clientId))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: "var(--text-3)" }}>Cargando turnos…</div>
      </div>
    );
  }

  return (
    <>
      {activeSlot && (
        <AddClientPanel
          slot={activeSlot}
          enrolled={enrollments.filter((e) => e.slotId === activeSlot.id)}
          clients={clients}
          onAction={(clientId, action) => handleAction(activeSlot.id, clientId, action)}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* Desktop grid */}
      <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day.num);
          return (
            <div key={day.num} className="flex flex-col gap-2">
              <div className="text-center py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider"
                style={{ background: "var(--bg-panel)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
                {day.label}
              </div>
              {daySlots.map((slot) => {
                const slotEnrolled = enrollments.filter((e) => e.slotId === slot.id);
                const typeStyle = TYPE_COLORS[slot.type] ?? TYPE_COLORS["musculación"]!;
                return (
                  <div
                    key={slot.id}
                    className="rounded-2xl p-3 flex flex-col gap-2 cursor-pointer"
                    style={{ background: "var(--bg-panel)", border: `1px solid var(--border)` }}
                    onClick={() => setActiveSlot(slot)}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = typeStyle.border; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    {/* Time + type */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-sm tabular-nums" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {slot.startTime} hs
                      </span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                        style={{ background: typeStyle.bg, color: typeStyle.text }}>
                        {slot.type === "musculación" ? "MUS" : "FUN"}
                      </span>
                    </div>

                    {/* Enrolled count */}
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 shrink-0" style={{ color: "var(--text-3)" }} />
                      <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        {slotEnrolled.length} alumno{slotEnrolled.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Enrolled names */}
                    {slotEnrolled.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {slotEnrolled.slice(0, 4).map((e) => (
                          <div key={e.clientId} className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                              style={{ background: typeStyle.bg, color: typeStyle.text }}
                            >
                              {e.clientName?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span
                              className="text-xs font-medium truncate"
                              style={{ color: "var(--text)" }}
                            >
                              {e.clientName}
                            </span>
                          </div>
                        ))}
                        {slotEnrolled.length > 4 && (
                          <span className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>
                            +{slotEnrolled.length - 4} más
                          </span>
                        )}
                      </div>
                    )}

                    {/* Add button */}
                    <button
                      className="flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold w-full"
                      style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
                      onClick={(e) => { e.stopPropagation(); setActiveSlot(slot); }}
                    >
                      <Plus className="h-3 w-3" /> Gestionar
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-4 md:hidden">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day.num);
          return (
            <div key={day.num}>
              <p className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
                {day.label}
              </p>
              <div className="flex flex-col gap-2">
                {daySlots.map((slot) => {
                  const slotEnrolled = enrollments.filter((e) => e.slotId === slot.id);
                  const typeStyle = TYPE_COLORS[slot.type] ?? TYPE_COLORS["musculación"]!;
                  return (
                    <div
                      key={slot.id}
                      className="rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer"
                      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
                      onClick={() => setActiveSlot(slot)}
                    >
                      <div className="shrink-0">
                        <p className="font-extrabold text-base tabular-nums" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {slot.startTime} hs
                        </p>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                          style={{ background: typeStyle.bg, color: typeStyle.text }}>
                          {slot.type}
                        </span>
                      </div>
                      <div className="flex-1">
                        {slotEnrolled.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--text-3)" }}>Sin alumnos</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {slotEnrolled.map((e) => (
                              <span key={e.clientId} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                                {e.clientName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Plus className="h-4 w-4 shrink-0" style={{ color: "var(--text-3)" }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
