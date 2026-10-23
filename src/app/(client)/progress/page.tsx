export const instant = false;
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { ClientProgress } from "@/components/client/client-progress";

export default async function ProgressPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = getDb();
  const clientId = session!.user.id;

  const weights = await db
    .select()
    .from(schema.bodyWeight)
    .where(eq(schema.bodyWeight.clientId, clientId))
    .orderBy(desc(schema.bodyWeight.recordedAt))
    .limit(30);

  const logs = await db
    .select({
      id: schema.workoutLog.id,
      loggedAt: schema.workoutLog.loggedAt,
      dayName: schema.planDay.name,
      dayNumber: schema.planDay.dayNumber,
    })
    .from(schema.workoutLog)
    .leftJoin(schema.planDay, eq(schema.workoutLog.planDayId, schema.planDay.id))
    .where(eq(schema.workoutLog.clientId, clientId))
    .orderBy(desc(schema.workoutLog.loggedAt))
    .limit(60);

  const exerciseLogs = await db
    .select({
      exerciseName: schema.exercise.name,
      muscleGroup: schema.exercise.muscleGroup,
      weightKg: schema.exerciseLog.weightKg,
      repsDone: schema.exerciseLog.repsDone,
      setsDone: schema.exerciseLog.setsDone,
      loggedAt: schema.workoutLog.loggedAt,
    })
    .from(schema.exerciseLog)
    .innerJoin(schema.workoutLog, eq(schema.exerciseLog.workoutLogId, schema.workoutLog.id))
    .innerJoin(schema.planExercise, eq(schema.exerciseLog.planExerciseId, schema.planExercise.id))
    .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
    .where(eq(schema.workoutLog.clientId, clientId))
    .orderBy(desc(schema.workoutLog.loggedAt))
    .limit(200);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold uppercase"
          style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Mi progreso
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Peso corporal, ejercicios y sesiones
        </p>
      </div>
      <ClientProgress
        weights={weights.map((w) => ({
          id: w.id,
          weightKg: String(w.weightKg),
          recordedAt: w.recordedAt.toISOString(),
        }))}
        logs={logs.map((l) => ({
          id: l.id,
          loggedAt: l.loggedAt.toISOString(),
          dayName: l.dayName,
          dayNumber: l.dayNumber,
        }))}
        exerciseLogs={exerciseLogs.map((e) => ({
          exerciseName: e.exerciseName,
          muscleGroup: e.muscleGroup,
          weightKg: e.weightKg ? String(e.weightKg) : null,
          repsDone: e.repsDone,
          setsDone: e.setsDone,
          loggedAt: e.loggedAt.toISOString(),
        }))}
      />
    </div>
  );
}
