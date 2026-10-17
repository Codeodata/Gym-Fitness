"use client";

import { useState } from "react";
import { CheckCircle, XCircle, UserCheck, ChevronRight } from "lucide-react";
import type { User } from "@/lib/db/schema";
import Link from "next/link";

type Props = { clients: User[]; approved: boolean };

export function ClientsTable({ clients, approved }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [list, setList] = useState(clients);

  async function toggleApproval(id: string, approve: boolean) {
    setLoading(id);
    try {
      await fetch("/api/trainer/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved: approve }),
      });
      setList((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setLoading(null);
    }
  }

  if (list.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {list.map((client, i) => (
        <div
          key={client.id}
          className="flex items-center gap-4 px-5 py-4"
          style={{
            background: "var(--bg-panel)",
            borderTop: i > 0 ? "1px solid var(--border)" : "none",
          }}
        >
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
          >
            {client.name[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {client.name}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
              {client.email}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!approved ? (
              <>
                <button
                  onClick={() => toggleApproval(client.id, true)}
                  disabled={loading === client.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-fg)",
                    cursor: "pointer",
                    touchAction: "manipulation",
                    opacity: loading === client.id ? 0.5 : 1,
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Aprobar
                </button>
                <button
                  onClick={() => toggleApproval(client.id, false)}
                  disabled={loading === client.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: "var(--bg-hover)",
                    color: "var(--destructive)",
                    cursor: "pointer",
                    touchAction: "manipulation",
                    opacity: loading === client.id ? 0.5 : 1,
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Rechazar
                </button>
              </>
            ) : (
              <Link
                href={`/trainer/clients/${client.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Ver plan
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
