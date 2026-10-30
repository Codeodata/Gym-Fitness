"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { ClientsGrid } from "@/components/trainer/clients-grid";
import type { User } from "@/lib/db/schema";

type PlanInfo = { planName: string; daysPerWeek: number } | null;
type ClientCard = User & { planInfo: PlanInfo };

type Props = {
  pending: ClientCard[];
  active: ClientCard[];
  inactive: ClientCard[];
};

function countMatches(arr: ClientCard[], q: string): number {
  if (!q) return arr.length;
  return arr.filter((c) => c.name.toLowerCase().includes(q)).length;
}

export function ClientsView({ pending, active, inactive }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const nPending = countMatches(pending, q);
  const nActive = countMatches(active, q);
  const nInactive = countMatches(inactive, q);
  const noResults = q !== "" && nPending + nActive + nInactive === 0;

  return (
    <>
      {/* Buscador por nombre */}
      <div className="relative mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar alumno por nombre…"
          className="w-full rounded-xl pl-10 pr-10 py-3 text-sm outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ color: "var(--text-3)", background: "var(--bg-hover)" }}
            title="Limpiar búsqueda">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {nPending > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#f59e0b" }}>
            Esperando aprobación · {nPending}
          </h2>
          <ClientsGrid clients={pending} status="pending" filter={query} />
        </section>
      )}

      {/* Activos: solo mostramos la sección si hay match (o si no hay búsqueda) */}
      {(nActive > 0 || q === "") && (
        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
            Activos · {nActive}
          </h2>
          {active.length === 0 ? (
            <div className="rounded-2xl p-10 flex items-center justify-center"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos activos todavía.</p>
            </div>
          ) : (
            <ClientsGrid clients={active} status="active" filter={query} />
          )}
        </section>
      )}

      {nInactive > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#ef4444" }}>
            Inactivos · {nInactive}
          </h2>
          <ClientsGrid clients={inactive} status="inactive" filter={query} />
        </section>
      )}

      {noResults && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            No se encontraron alumnos con “{query}”.
          </p>
        </div>
      )}
    </>
  );
}
