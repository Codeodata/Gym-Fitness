"use client";

import { useState } from "react";
import { CheckCircle, XCircle, UserCheck, ChevronRight, UserX, UserPlus } from "lucide-react";
import type { User } from "@/lib/db/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Status = "pending" | "active" | "inactive";
type Props = { clients: User[]; status: Status };

export function ClientsTable({ clients, status }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [list, setList] = useState(clients);
  const router = useRouter();

  async function patch(id: string, data: { approved?: boolean; active?: boolean }) {
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

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {list.map((client, i) => (
        <div
          key={client.id}
          className="flex items-center gap-4 px-5 py-4"
          style={{
            background: "var(--bg-panel)",
            borderTop: i > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: status === "inactive" ? "var(--bg-hover)" : "var(--bg-hover)",
              color: status === "inactive" ? "var(--text-3)" : "var(--text-2)",
            }}
          >
            {client.name[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: status === "inactive" ? "var(--text-3)" : "var(--text)" }}
            >
              {client.name}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
              {client.email}
            </p>
            {client.membershipType && (
              <p className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>
                {client.membershipType.replace("_", " ")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status === "pending" && (
              <>
                <button
                  onClick={() => patch(client.id, { approved: true })}
                  disabled={loading === client.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-fg)",
                    opacity: loading === client.id ? 0.5 : 1,
                    touchAction: "manipulation",
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Aprobar
                </button>
                <button
                  onClick={() => patch(client.id, { approved: false })}
                  disabled={loading === client.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    background: "var(--bg-hover)",
                    color: "var(--destructive)",
                    opacity: loading === client.id ? 0.5 : 1,
                    touchAction: "manipulation",
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Rechazar
                </button>
              </>
            )}

            {status === "active" && (
              <>
                <Link
                  href={`/trainer/clients/${client.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Ver plan
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => patch(client.id, { active: false })}
                  disabled={loading === client.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    background: "var(--bg-hover)",
                    color: "var(--destructive)",
                    opacity: loading === client.id ? 0.5 : 1,
                    touchAction: "manipulation",
                  }}
                  title="Quitar acceso a la plataforma"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Desactivar
                </button>
              </>
            )}

            {status === "inactive" && (
              <button
                onClick={() => patch(client.id, { active: true })}
                disabled={loading === client.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  background: "var(--bg-hover)",
                  color: "var(--success)",
                  opacity: loading === client.id ? 0.5 : 1,
                  touchAction: "manipulation",
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Reactivar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
