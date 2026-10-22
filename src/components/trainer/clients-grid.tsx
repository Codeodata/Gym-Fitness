"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, XCircle, UserX, UserPlus,
  Mail, Calendar, Dumbbell, Clock,
} from "lucide-react";
import type { User } from "@/lib/db/schema";

type PlanInfo = { planName: string; daysPerWeek: number } | null;
type Status = "pending" | "active" | "inactive";

type ClientCard = User & { planInfo: PlanInfo };

type Props = { clients: ClientCard[]; status: Status };

const STATUS_LABEL: Record<Status, string> = {
  pending:  "Pendiente",
  active:   "Activo",
  inactive: "Inactivo",
};
const STATUS_COLOR: Record<Status, { bg: string; text: string }> = {
  pending:  { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  active:   { bg: "rgba(196,241,53,0.12)", text: "var(--accent)" },
  inactive: { bg: "rgba(239,68,68,0.12)",  text: "#ef4444"  },
};

const MEMBERSHIP_LABEL: Record<string, string> = {
  "2dias":      "2 días / sem",
  "3dias":      "3 días / sem",
  "pase_libre": "Pase libre",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ClientsGrid({ clients: initial, status }: Props) {
  const [list, setList] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function patch(id: string, data: Record<string, unknown>) {
    setLoading(id);
    try {
      await fetch("/api/trainer/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      setList((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (list.length === 0) return null;

  const sc = STATUS_COLOR[status];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((client) => {
        const busy = loading === client.id;
        return (
          <div
            key={client.id}
            className="rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              opacity: busy ? 0.6 : 1,
              transition: "opacity 200ms",
            }}
          >
            {/* ── Top bar: status badge ─────────────────── */}
            <div
              className="flex items-center justify-between px-4 pt-4 pb-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg"
                style={{ background: sc.bg, color: sc.text }}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>

            {/* ── Avatar + name ─────────────────────────── */}
            <div className="flex items-center gap-4 px-4 py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-extrabold shrink-0"
                style={{
                  background: status === "inactive"
                    ? "var(--bg-hover)"
                    : "var(--accent)",
                  color: status === "inactive"
                    ? "var(--text-3)"
                    : "var(--accent-fg)",
                }}
              >
                {initials(client.name)}
              </div>
              <div className="min-w-0">
                <p
                  className="font-extrabold text-base leading-tight truncate"
                  style={{
                    color: status === "inactive" ? "var(--text-2)" : "var(--text)",
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  {client.name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-3)" }}>
                  Alumno
                </p>
              </div>
            </div>

            {/* ── Meta rows ─────────────────────────────── */}
            <div className="px-4 flex flex-col gap-2.5 pb-4 flex-1">

              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
                <span className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                  {client.email}
                </span>
              </div>

              {/* Since */}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
                <span className="text-xs" style={{ color: "var(--text-2)" }}>
                  Desde {formatDate(client.createdAt)}
                </span>
              </div>

              {/* Plan */}
              <div className="flex items-center gap-2">
                <Dumbbell className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
                {client.planInfo ? (
                  <span className="text-xs font-semibold truncate" style={{ color: "var(--accent)" }}>
                    {client.planInfo.planName}
                    <span className="font-normal ml-1" style={{ color: "var(--text-3)" }}>
                      · {client.planInfo.daysPerWeek === 5 ? "Pase libre" : `${client.planInfo.daysPerWeek}d/sem`}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs font-bold" style={{ color: status === "active" ? "#f59e0b" : "var(--text-3)" }}>
                    {status === "active" ? "⚠ Sin plan asignado" : "Sin plan"}
                  </span>
                )}
              </div>

              {/* Membership */}
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-3)" }} />
                <span className="text-xs" style={{ color: "var(--text-2)" }}>
                  {client.membershipType
                    ? MEMBERSHIP_LABEL[client.membershipType] ?? client.membershipType
                    : "Sin membresía"}
                </span>
              </div>
            </div>

            {/* ── Actions ───────────────────────────────── */}
            <div
              className="flex gap-2 px-4 pb-4 pt-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {status === "pending" && (
                <>
                  <button
                    onClick={() => patch(client.id, { approved: true })}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: "var(--accent)", color: "var(--accent-fg)", touchAction: "manipulation" }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                  </button>
                  <button
                    onClick={() => patch(client.id, { approved: false })}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: "var(--bg-hover)", color: "#ef4444", touchAction: "manipulation" }}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Rechazar
                  </button>
                </>
              )}

              {status === "active" && (
                <>
                  <Link
                    href={`/trainer/clients/${client.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
                  >
                    Ver ficha
                  </Link>
                  <button
                    onClick={() => patch(client.id, { active: false })}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: "var(--bg-hover)", color: "var(--text-2)", touchAction: "manipulation" }}
                    title="Quitar acceso"
                  >
                    <UserX className="h-3.5 w-3.5" /> Desactivar
                  </button>
                </>
              )}

              {status === "inactive" && (
                <>
                  <Link
                    href={`/trainer/clients/${client.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
                  >
                    Ver ficha
                  </Link>
                  <button
                    onClick={() => patch(client.id, { active: true })}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: "var(--accent)", color: "var(--accent-fg)", touchAction: "manipulation" }}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Reactivar
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
