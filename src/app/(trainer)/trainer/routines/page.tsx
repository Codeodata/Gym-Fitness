export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { and, count, eq } from "drizzle-orm";
import { RoutinesHub } from "@/components/trainer/routines-hub";
import { TemplateLibrary, type LibraryTemplate } from "@/components/trainer/template-library";
import { RoutinesTabs } from "@/components/trainer/routines-tabs";

export default async function RoutinesPage() {
  await connection();
  const db = getDb();

  const [approvedClients, plans, planDays, exPerDay, muscleRows, routineRows] = await Promise.all([
    db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        gender: schema.user.gender,
        membershipType: schema.user.membershipType,
      })
      .from(schema.user)
      .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)))
      .orderBy(schema.user.name),
    db
      .select({
        id: schema.plan.id,
        name: schema.plan.name,
        audience: schema.plan.audience,
        frequency: schema.plan.frequency,
      })
      .from(schema.plan)
      .orderBy(schema.plan.name),
    db
      .select({ id: schema.planDay.id, planId: schema.planDay.planId, dayNumber: schema.planDay.dayNumber })
      .from(schema.planDay),
    db
      .select({ planDayId: schema.planExercise.planDayId, count: count() })
      .from(schema.planExercise)
      .groupBy(schema.planExercise.planDayId),
    db
      .select({ planId: schema.planDay.planId, muscleGroup: schema.exercise.muscleGroup })
      .from(schema.planExercise)
      .innerJoin(schema.planDay, eq(schema.planExercise.planDayId, schema.planDay.id))
      .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
      .groupBy(schema.planDay.planId, schema.exercise.muscleGroup),
    // Alumnos que ya tienen algo cargado en su semana (asignar lo reemplaza).
    db
      .select({ clientId: schema.clientDayExercise.clientId, count: count() })
      .from(schema.clientDayExercise)
      .groupBy(schema.clientDayExercise.clientId),
  ]);

  const exCount = new Map(exPerDay.map((r) => [r.planDayId, Number(r.count)]));
  const templates: LibraryTemplate[] = plans.map((p) => {
    const days = planDays
      .filter((d) => d.planId === p.id)
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((d) => ({ id: d.id, dayNumber: d.dayNumber, exerciseCount: exCount.get(d.id) ?? 0 }));
    return {
      ...p,
      days,
      exerciseCount: days.reduce((a, d) => a + d.exerciseCount, 0),
      muscleGroups: muscleRows.filter((m) => m.planId === p.id).map((m) => m.muscleGroup),
    };
  });

  const withRoutine = new Set(routineRows.filter((r) => Number(r.count) > 0).map((r) => r.clientId));
  const clients = approvedClients.map((c) => ({ ...c, hasRoutine: withRoutine.has(c.id) }));

  return (
    <div className="max-w-3xl pb-20">
      <div className="mb-5">
        <h1 className="font-extrabold leading-none" style={{ color: "var(--text)" }}>
          Rutinas
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-2)" }}>
          Creá una plantilla y asignala a tus alumnos. Después podés ajustar la semana de cada uno.
        </p>
      </div>

      <RoutinesTabs
        templates={<TemplateLibrary templates={templates} clients={clients} />}
        byClient={<RoutinesHub clients={approvedClients} />}
      />
    </div>
  );
}
