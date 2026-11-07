export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { count, eq } from "drizzle-orm";
import { PlansGrid } from "@/components/trainer/plans-grid";

export default async function PlansPage() {
  await connection();
  const db = getDb();
  const plans = await db.select().from(schema.plan).orderBy(schema.plan.createdAt);

  const dayCountRows = await db
    .select({ planId: schema.planDay.planId, count: count() })
    .from(schema.planDay)
    .groupBy(schema.planDay.planId);

  const exCountRows = await db
    .select({ planId: schema.planDay.planId, count: count() })
    .from(schema.planExercise)
    .innerJoin(schema.planDay, eq(schema.planExercise.planDayId, schema.planDay.id))
    .groupBy(schema.planDay.planId);

  // Grupos musculares que toca cada plan (distinct planId × muscleGroup).
  const muscleRows = await db
    .select({ planId: schema.planDay.planId, muscleGroup: schema.exercise.muscleGroup })
    .from(schema.planExercise)
    .innerJoin(schema.planDay, eq(schema.planExercise.planDayId, schema.planDay.id))
    .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
    .groupBy(schema.planDay.planId, schema.exercise.muscleGroup);

  const dayCountMap = new Map(dayCountRows.map((r) => [r.planId, Number(r.count)]));
  const exByPlan = new Map<string, number>();
  for (const r of exCountRows) exByPlan.set(r.planId, (exByPlan.get(r.planId) ?? 0) + Number(r.count));
  const muscleByPlan = new Map<string, string[]>();
  for (const r of muscleRows) {
    const arr = muscleByPlan.get(r.planId) ?? [];
    arr.push(r.muscleGroup);
    muscleByPlan.set(r.planId, arr);
  }
  const plansWithCount = plans.map((p) => ({
    ...p,
    dayCount: dayCountMap.get(p.id) ?? 0,
    exerciseCount: exByPlan.get(p.id) ?? 0,
    muscleGroups: muscleByPlan.get(p.id) ?? [],
  }));

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-extrabold" style={{ color: "var(--text)" }}>Plantillas</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
            Armá tus plantillas (chicas/chicos × 2, 3 días o pase libre) y copialas a cada alumno
          </p>
        </div>
        <Link
          href="/trainer/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </Link>
      </div>

      {plans.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
            <ClipboardList className="h-7 w-7" style={{ color: "var(--text-3)" }} />
          </div>
          <div>
            <p className="font-bold" style={{ color: "var(--text)" }}>Todavía no hay plantillas</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
              Creá la primera plantilla y copiala a tus alumnos
            </p>
          </div>
          <Link
            href="/trainer/plans/new"
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Crear plantilla
          </Link>
        </div>
      ) : (
        <PlansGrid plans={plansWithCount} />
      )}
    </div>
  );
}
