export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import Link from "next/link";
import { Plus, CalendarRange, Library } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { TemplateWeekBuilder } from "@/components/trainer/template-week-builder";
import { RoutinesLibrary } from "@/components/trainer/routines-library";

export default async function RoutinesPage() {
  await connection();
  const db = getDb();

  const approvedClients = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)))
    .orderBy(schema.user.name);

  return (
    <div className="max-w-5xl pb-20">
      {/* Page header */}
      <div className="mb-9">
        <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
          Rutinas
        </h1>
        <p className="mt-2 text-sm max-w-xl" style={{ color: "var(--text-2)" }}>
          Mirá qué entrena cada alumno, armá una semana tipo y asignala a varios de una vez.
        </p>
      </div>

      {/* ── Sección: planificar la semana ───────────────────────────── */}
      <section className="mb-14">
        <div className="mb-5 flex items-center gap-3">
          <span className="zone-chip" style={{ background: "var(--c-blue-bg)" }}>
            <CalendarRange className="h-[18px] w-[18px]" style={{ color: "var(--c-blue)" }} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold leading-tight" style={{ color: "var(--text)" }}>
              Planificá la semana
            </h2>
            <p className="text-sm leading-tight" style={{ color: "var(--text-3)" }}>
              Agenda del día, template semanal y asignación en un solo flujo.
            </p>
          </div>
        </div>
        <TemplateWeekBuilder clients={approvedClients} />
      </section>

      {/* ── Sección: biblioteca ─────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="zone-chip" style={{ background: "var(--accent-soft)" }}>
              <Library className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold leading-tight" style={{ color: "var(--text)" }}>
                Biblioteca de rutinas
              </h2>
              <p className="text-sm leading-tight truncate" style={{ color: "var(--text-3)" }}>
                Tocá el nombre para renombrar. Expandí para ver y editar ejercicios.
              </p>
            </div>
          </div>
          <Link
            href="/trainer/plans/new"
            className="btn-accent flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva rutina</span>
            <span className="sm:hidden">Nueva</span>
          </Link>
        </div>
        <RoutinesLibrary clients={approvedClients} />
      </section>
    </div>
  );
}
