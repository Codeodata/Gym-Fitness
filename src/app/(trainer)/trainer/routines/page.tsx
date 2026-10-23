export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import Link from "next/link";
import { Plus, Dumbbell } from "lucide-react";
import { count, eq, and } from "drizzle-orm";
import { RoutinesList } from "@/components/trainer/routines-list";

export default async function RoutinesPage() {
  await connection();
  const db = getDb();

  const routines = await db.select().from(schema.plan).orderBy(schema.plan.category, schema.plan.name);

  const dayCountRows = await db
    .select({ planId: schema.planDay.planId, count: count() })
    .from(schema.planDay)
    .groupBy(schema.planDay.planId);
  const dayCountMap = new Map(dayCountRows.map(r => [r.planId, Number(r.count)]));

  const routinesWithCount = routines.map(r => ({ ...r, dayCount: dayCountMap.get(r.id) ?? 0 }));

  const approvedRows = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)))
    .orderBy(schema.user.name);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Rutinas</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
            Creá plantillas de entrenamiento y asignalas a tus alumnos
          </p>
        </div>
        <Link
          href="/trainer/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Plus className="h-4 w-4" />
          Nueva rutina
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
            <Dumbbell className="h-7 w-7" style={{ color: "var(--text-3)" }} />
          </div>
          <div>
            <p className="font-bold" style={{ color: "var(--text)" }}>Todavía no hay rutinas</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
              Creá la primera rutina y asignala a tus alumnos
            </p>
          </div>
          <Link href="/trainer/plans/new" className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            Crear rutina
          </Link>
        </div>
      ) : (
        <RoutinesList routines={routinesWithCount} clients={approvedRows} />
      )}
    </div>
  );
}
