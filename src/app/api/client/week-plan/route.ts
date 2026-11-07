import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq, asc, desc, inArray } from "drizzle-orm";

// La semana del alumno se arma desde client_day_block (bloques de rutina por día)
// + client_day_exercise (ejercicios sueltos por día) — el mismo modelo que escribe
// la profe en el WeeklyScheduleBuilder y en "Asignar" de Rutinas.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const clientId = session.user.id;

  // Bloques de rutina de toda la semana
  const blocks = await db
    .select({
      id: schema.clientDayBlock.id,
      dayOfWeek: schema.clientDayBlock.dayOfWeek,
      orderIndex: schema.clientDayBlock.orderIndex,
      planDayId: schema.clientDayBlock.planDayId,
      planDayName: schema.planDay.name,
      planName: schema.plan.name,
      planCategory: schema.plan.category,
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
    .innerJoin(schema.plan, eq(schema.planDay.planId, schema.plan.id))
    .where(eq(schema.clientDayBlock.clientId, clientId))
    .orderBy(asc(schema.clientDayBlock.dayOfWeek), asc(schema.clientDayBlock.orderIndex));

  // Ejercicios de esos días de plan, en una sola query
  const planDayIds = [...new Set(blocks.map((b) => b.planDayId))];
  const blockExercises = planDayIds.length
    ? await db
        .select({
          id: schema.planExercise.id,
          exerciseId: schema.planExercise.exerciseId,
          planDayId: schema.planExercise.planDayId,
          section: schema.planExercise.section,
          sets: schema.planExercise.sets,
          reps: schema.planExercise.reps,
          weightKg: schema.planExercise.weightKg,
          restSeconds: schema.planExercise.restSeconds,
          notes: schema.planExercise.notes,
          name: schema.exercise.name,
          muscleGroup: schema.exercise.muscleGroup,
          videoUrl: schema.exercise.videoUrl,
          imageUrl: schema.exercise.imageUrl,
        })
        .from(schema.planExercise)
        .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
        .where(inArray(schema.planExercise.planDayId, planDayIds))
        .orderBy(asc(schema.planExercise.section), asc(schema.planExercise.orderIndex))
    : [];

  // Ejercicios sueltos de toda la semana
  const singles = await db
    .select({
      id: schema.clientDayExercise.id,
      exerciseId: schema.clientDayExercise.exerciseId,
      dayOfWeek: schema.clientDayExercise.dayOfWeek,
      sets: schema.clientDayExercise.sets,
      reps: schema.clientDayExercise.reps,
      restSeconds: schema.clientDayExercise.restSeconds,
      notes: schema.clientDayExercise.notes,
      name: schema.exercise.name,
      muscleGroup: schema.exercise.muscleGroup,
      videoUrl: schema.exercise.videoUrl,
      imageUrl: schema.exercise.imageUrl,
    })
    .from(schema.clientDayExercise)
    .innerJoin(schema.exercise, eq(schema.clientDayExercise.exerciseId, schema.exercise.id))
    .where(eq(schema.clientDayExercise.clientId, clientId))
    .orderBy(asc(schema.clientDayExercise.dayOfWeek), asc(schema.clientDayExercise.orderIndex));

  // Último registro del alumno por ejercicio (para precargar peso/series/reps).
  const exerciseIds = [...new Set([...blockExercises.map((e) => e.exerciseId), ...singles.map((s) => s.exerciseId)])];
  const lastRows = exerciseIds.length
    ? await db
        .select({
          exerciseId: schema.exerciseLog.exerciseId,
          weightKg: schema.exerciseLog.weightKg,
          setsDone: schema.exerciseLog.setsDone,
          repsDone: schema.exerciseLog.repsDone,
          loggedAt: schema.workoutLog.loggedAt,
        })
        .from(schema.exerciseLog)
        .innerJoin(schema.workoutLog, eq(schema.exerciseLog.workoutLogId, schema.workoutLog.id))
        .where(eq(schema.workoutLog.clientId, clientId))
        .orderBy(desc(schema.workoutLog.loggedAt))
        .limit(500)
    : [];
  const last = new Map<string, { weightKg: string | null; setsDone: number | null; repsDone: string | null; loggedAt: string }>();
  for (const r of lastRows) {
    if (r.exerciseId && !last.has(r.exerciseId)) {
      last.set(r.exerciseId, {
        weightKg: r.weightKg ? String(Number(r.weightKg)) : null,
        setsDone: r.setsDone,
        repsDone: r.repsDone,
        loggedAt: r.loggedAt.toISOString(),
      });
    }
  }

  const days = [1, 2, 3, 4, 5]
    .map((dow) => ({
      dow,
      blocks: blocks
        .filter((b) => b.dayOfWeek === dow)
        .map((b) => ({
          id: b.id,
          planDayId: b.planDayId,
          planDayName: b.planDayName,
          planName: b.planName,
          planCategory: b.planCategory,
          exercises: blockExercises
            .filter((e) => e.planDayId === b.planDayId)
            .map((e) => ({
              id: e.id,
              exerciseId: e.exerciseId,
              planExerciseId: e.id as string | null,
              last: last.get(e.exerciseId) ?? null,
              name: e.name,
              muscleGroup: e.muscleGroup,
              section: e.section,
              sets: e.sets,
              reps: e.reps,
              weightKg: e.weightKg,
              restSeconds: e.restSeconds,
              notes: e.notes,
              videoUrl: e.videoUrl,
              imageUrl: e.imageUrl,
            })),
        })),
      singles: singles
        .filter((s) => s.dayOfWeek === dow)
        .map((s) => ({
          id: s.id,
          exerciseId: s.exerciseId,
          planExerciseId: null as string | null,
          last: last.get(s.exerciseId) ?? null,
          name: s.name,
          muscleGroup: s.muscleGroup,
          section: "main" as const,
          sets: s.sets,
          reps: s.reps,
          weightKg: null as string | null,
          restSeconds: s.restSeconds,
          notes: s.notes,
          videoUrl: s.videoUrl,
          imageUrl: s.imageUrl,
        })),
    }))
    .filter((d) => d.blocks.length > 0 || d.singles.length > 0);

  return NextResponse.json({ days });
}
