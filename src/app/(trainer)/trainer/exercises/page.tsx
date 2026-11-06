export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { ExerciseManager } from "@/components/trainer/exercise-manager";

export default async function ExercisesPage() {
  await connection();
  // Trae ejercicios y estiramientos juntos; el toggle los separa en la UI.
  const exercises = await getDb()
    .select()
    .from(schema.exercise)
    .orderBy(schema.exercise.muscleGroup, schema.exercise.name);

  return <ExerciseManager initialExercises={exercises} />;
}
