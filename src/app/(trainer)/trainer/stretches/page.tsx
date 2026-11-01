export const instant = false;
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { ExerciseManager } from "@/components/trainer/exercise-manager";

export default async function StretchesPage() {
  await connection();
  const stretches = await getDb()
    .select()
    .from(schema.exercise)
    .where(eq(schema.exercise.isStretch, true))
    .orderBy(schema.exercise.muscleGroup, schema.exercise.name);

  return <ExerciseManager initialExercises={stretches} isStretchMode />;
}
