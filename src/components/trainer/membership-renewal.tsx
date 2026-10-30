"use client";

import { useState } from "react";
import { CalendarClock, Check, BadgeCheck, AlertTriangle } from "lucide-react";
import { getMembershipStatus, type MembershipState } from "@/lib/membership";

function toInputDate(d: Date | string | null): string {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  // yyyy-mm-dd en horario local
  const off = x.getTime() - x.getTimezoneOffset() * 60000;
  return new Date(off).toISOString().slice(0, 10);
}

function fmt(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

const STATE_COLOR: Record<MembershipState, { color: string; bg: string }> = {
  none:    { color: "var(--text-3)", bg: "var(--bg-hover)" },
  ok:      { color: "var(--success)", bg: "rgba(34,197,94,0.12)" },
  soon:    { color: "var(--warning)", bg: "rgba(245,158,11,0.15)" },
  due:     { color: "var(--warning)", bg: "rgba(245,158,11,0.18)" },
  overdue: { color: "#ef4444",        bg: "rgba(239,68,68,0.15)" },
};

export function MembershipRenewal({
  clientId,
  renewsAt: initialRenews,
  paidAt: initialPaid,
}: {
  clientId: string;
  renewsAt: string | null;
  paidAt: string | null;
}) {
  const [renewsAt, setRenewsAt] = useState<string | null>(initialRenews);
  const [paidAt, setPaidAt] = useState<string | null>(initialPaid);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const status = getMembershipStatus(renewsAt);
  const col = STATE_COLOR[status.state];

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/trainer/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: clientId, ...body }),
      });
      if (res.ok) flashSaved();
      return res.ok;
    } finally {
      setSaving(false);
    }
  }

  async function onDateChange(value: string) {
    const next = value || null;
    setRenewsAt(next);
    await patch({ membershipRenewsAt: next });
  }

  // "Marcar como pagado": registra el pago de hoy y corre la renovación +30 días
  // (desde la fecha actual de vencimiento o desde hoy, lo que sea mayor). Esto
  // apaga la alerta para el alumno y el profe.
  async function markPaid() {
    const today = new Date();
    const base = renewsAt && new Date(renewsAt) > today ? new Date(renewsAt) : today;
    const next = new Date(base);
    next.setDate(next.getDate() + 30);
    const nextStr = toInputDate(next);
    const todayStr = toInputDate(today);
    const ok = await patch({ membershipRenewsAt: nextStr, membershipPaidAt: todayStr });
    if (ok) {
      setRenewsAt(nextStr);
      setPaidAt(todayStr);
    }
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
          <CalendarClock className="h-3.5 w-3.5" /> Membresía
        </h2>
        {saved
          ? <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--success)" }}><Check className="h-3.5 w-3.5" /> Guardado</span>
          : status.state !== "none" && (
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1"
              style={{ color: col.color, background: col.bg }}>
              {status.alert && <AlertTriangle className="h-3 w-3" />}
              {status.trainerLabel}
            </span>
          )}
      </div>

      {/* Fecha de renovación */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>Fecha de renovación</span>
        <input
          type="date"
          value={toInputDate(renewsAt)}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={saving}
          className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border-strong)", color: "var(--text)", colorScheme: "dark" }}
        />
      </label>

      {/* Estado de pago */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-3)" }}>
          {paidAt
            ? <><BadgeCheck className="h-3.5 w-3.5" style={{ color: "var(--success)" }} /> Pagado el {fmt(paidAt)}</>
            : <>Sin pago registrado</>}
        </span>
        <button
          type="button"
          onClick={markPaid}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)", touchAction: "manipulation" }}>
          <BadgeCheck className="h-3.5 w-3.5" /> Marcar como pagado
        </button>
      </div>

      <p className="text-[11px] leading-snug" style={{ color: "var(--text-3)" }}>
        Al marcar pagado se corre la renovación 30 días y se apaga el aviso del alumno. Podés ajustar la fecha manualmente.
      </p>
    </div>
  );
}
