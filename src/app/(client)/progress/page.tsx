export const instant = false;
import { getSession } from "@/lib/get-session";
import { getDb, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { ClientProgress } from "@/components/client/client-progress";

export default async function ProgressPage() {
  const session = await getSession();
  const db = getDb();
  const clientId = session!.user.id;

  const [weights, logs, exerciseLogs] = await Promise.all([
    db
      .select()
      .from(schema.bodyWeight)
      .where(eq(schema.bodyWeight.clientId, clientId))
      .orderBy(desc(schema.bodyWeight.recordedAt))
      .limit(30),
    db
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
      .limit(60),
    db
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
      // exercise_id es la fuente; los registros viejos solo tenían plan_exercise_id.
      .leftJoin(schema.planExercise, eq(schema.exerciseLog.planExerciseId, schema.planExercise.id))
      .innerJoin(schema.exercise, sql`${schema.exercise.id} = coalesce(${schema.exerciseLog.exerciseId}, ${schema.planExercise.exerciseId})`)
      .where(eq(schema.workoutLog.clientId, clientId))
      .orderBy(desc(schema.workoutLog.loggedAt))
      .limit(200),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="font-extrabold uppercase"
          style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
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
