export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanEditorClient } from "@/components/trainer/plan-editor-client";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const db = getDb();

  const plan = (await db.select().from(schema.plan).where(eq(schema.plan.id, id)).limit(1))[0];
  if (!plan) notFound();

  const days = await db
    .select()
    .from(schema.planDay)
    .where(eq(schema.planDay.planId, id))
    .orderBy(schema.planDay.dayNumber);

  const exercises =
    days.length === 0
      ? []
      : await db
          .select({
            id: schema.planExercise.id,
            planDayId: schema.planExercise.planDayId,
            section: schema.planExercise.section,
            orderIndex: schema.planExercise.orderIndex,
            sets: schema.planExercise.sets,
            reps: schema.planExercise.reps,
            weightKg: schema.planExercise.weightKg,
            notes: schema.planExercise.notes,
            exerciseName: schema.exercise.name,
            muscleGroup: schema.exercise.muscleGroup,
          })
          .from(schema.planExercise)
          .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
          .innerJoin(schema.planDay, eq(schema.planExercise.planDayId, schema.planDay.id))
          .where(eq(schema.planDay.planId, id))
          .orderBy(schema.planDay.dayNumber, schema.planExercise.orderIndex);

  // Group exercises by planDayId
  const exByDay = exercises.reduce<Record<string, typeof exercises>>((acc, ex) => {
    (acc[ex.planDayId] ??= []).push(ex);
    return acc;
  }, {});

  // ── Alumnos asignados a esta rutina (vía client_day_block → plan_day) ──────
  const assignedRaw =
    days.length === 0
      ? []
      : await db
          .select({
            clientId: schema.clientDayBlock.clientId,
            clientName: schema.user.name,
            dayOfWeek: schema.clientDayBlock.dayOfWeek,
          })
          .from(schema.clientDayBlock)
          .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
          .innerJoin(schema.user, eq(schema.clientDayBlock.clientId, schema.user.id))
          .where(eq(schema.planDay.planId, id));

  const assignedMap = new Map<string, { clientId: string; clientName: string | null; days: number[] }>();
  for (const a of assignedRaw) {
    const entry = assignedMap.get(a.clientId) ?? { clientId: a.clientId, clientName: a.clientName, days: [] };
    if (!entry.days.includes(a.dayOfWeek)) entry.days.push(a.dayOfWeek);
    assignedMap.set(a.clientId, entry);
  }
  const assignedStudents = [...assignedMap.values()]
    .map((s) => ({ ...s, days: s.days.sort((x, y) => x - y) }))
    .sort((a, b) => (a.clientName ?? "").localeCompare(b.clientName ?? ""));

  // Alumnos aprobados para el panel de "agregar"
  const approvedClients = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)))
    .orderBy(schema.user.name);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/trainer/routines"
          className="flex items-center gap-2 h-9 px-3 rounded-xl shrink-0"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: "var(--text-2)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Rutinas</span>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-xs px-2 py-1 rounded-lg font-semibold"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
            >
              {plan.daysPerWeek}d/sem
            </span>
            {plan.durationWeeks && (
              <span
                className="text-xs px-2 py-1 rounded-lg font-semibold"
                style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
              >
                {plan.durationWeeks} sem
              </span>
            )}
          </div>
        </div>
      </div>

      {plan.description && (
        <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>
          {plan.description}
        </p>
      )}

      <PlanEditorClient
        planId={plan.id}
        initialName={plan.name}
        clients={approvedClients}
        initialStudents={assignedStudents}
        initialDays={days.map((day) => ({
          ...day,
          exercises: (exByDay[day.id] ?? []).map((ex) => ({
            id: ex.id,
            planDayId: ex.planDayId,
            section: (ex.section ?? "main") as "warmup" | "main",
            sets: ex.sets,
            reps: ex.reps,
            weightKg: ex.weightKg ?? null,
            notes: ex.notes ?? null,
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup ?? "full_body",
            orderIndex: ex.orderIndex,
          })),
        }))}
      />
    </div>
  );
}
