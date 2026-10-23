"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Zap, Infinity, Check, Clock, UserCheck, UserX } from "lucide-react";

type MembershipType = "2dias" | "3dias" | "pase_libre";

type Client = {
  id: string;
  name: string;
  email: string;
  membershipType: string | null;
  approved: boolean;
  createdAt: Date;
};

const MEMBERSHIP: Record<MembershipType, { label: string; color: string; bg: string; icon: typeof Calendar }> = {
  "2dias":      { label: "2 días",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: Calendar },
  "3dias":      { label: "3 días",     color: "#c084fc", bg: "rgba(192,132,252,0.12)", icon: Zap      },
  "pase_libre": { label: "Pase libre", color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: Infinity },
};

const TYPES: MembershipType[] = ["2dias", "3dias", "pase_libre"];

type Filter = "todos" | "aprobados" | "pendientes";

export function PlanMembershipTable({ clients }: { clients: Client[] }) {
  const [memberships, setMemberships] = useState<Record<string, MembershipType | null>>(
    Object.fromEntries(clients.map(c => [c.id, c.membershipType as MembershipType | null]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todos");

  const filtered = clients.filter(c => {
    if (filter === "aprobados") return c.approved;
    if (filter === "pendientes") return !c.approved;
    return true;
  });

  const approved = clients.filter(c => c.approved).length;
  const pending = clients.filter(c => !c.approved).length;

  async function setMembership(clientId: string, type: MembershipType) {
    setSaving(clientId);
    setMemberships(prev => ({ ...prev, [clientId]: type }));
    await fetch("/api/trainer/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, membershipType: type }),
    });
    setSaving(null);
    setSaved(clientId);
    setTimeout(() => setSaved(prev => prev === clientId ? null : prev), 2000);
  }

  return (
    <>
      {/* Stats + filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {(["todos", "aprobados", "pendientes"] as Filter[]).map(f => {
          const cnt = f === "todos" ? clients.length : f === "aprobados" ? approved : pending;
          const sel = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all capitalize"
              style={{
                background: sel ? "var(--accent-soft)" : "var(--bg-panel)",
                border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                color: sel ? "var(--accent)" : "var(--text-3)",
              }}>
              {f === "aprobados" ? <UserCheck className="h-3.5 w-3.5" /> : f === "pendientes" ? <UserX className="h-3.5 w-3.5" /> : null}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                style={{ background: sel ? "var(--accent)" : "var(--bg-hover)", color: sel ? "var(--accent-fg)" : "var(--text-3)" }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto] px-5 py-3"
          style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border)" }}>
          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Alumno</span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider hidden md:block" style={{ color: "var(--text-3)" }}>Desde</span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Membresía</span>
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center" style={{ background: "var(--bg-panel)" }}>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos en esta categoría.</p>
          </div>
        )}

        {filtered.map((client, i) => {
          const current = memberships[client.id];
          const isSaving = saving === client.id;
          const isSaved = saved === client.id;

          return (
            <div key={client.id}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto] items-center px-5 py-4 gap-4"
              style={{
                background: i % 2 === 0 ? "var(--bg-panel)" : "var(--bg)",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
              }}>

              {/* Client info */}
              <Link href={`/trainer/clients/${client.id}`}
                className="flex flex-col min-w-0 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold truncate" style={{ color: "var(--text)" }}>{client.name}</p>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${client.approved ? "" : ""}`}
                    style={{ background: client.approved ? "#4ade80" : "#f59e0b" }} />
                </div>
                <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{client.email}</p>
              </Link>

              {/* Join date */}
              <p className="text-xs hidden md:block" style={{ color: "var(--text-3)" }}>
                {new Date(client.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>

              {/* Membership pills */}
              <div className="flex items-center gap-1.5 shrink-0">
                {TYPES.map(type => {
                  const m = MEMBERSHIP[type]!;
                  const active = current === type;
                  const Icon = m.icon;
                  return (
                    <button key={type} onClick={() => setMembership(client.id, type)}
                      disabled={isSaving}
                      title={m.label}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all"
                      style={{
                        background: active ? m.bg : "var(--bg-hover)",
                        border: `1px solid ${active ? m.color : "var(--border)"}`,
                        color: active ? m.color : "var(--text-3)",
                        opacity: isSaving ? 0.5 : 1,
                      }}>
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{m.label}</span>
                    </button>
                  );
                })}
                {isSaved && <Check className="h-4 w-4 shrink-0" style={{ color: "#4ade80" }} />}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
