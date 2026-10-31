export const instant = false;
import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { ExerciseLibrary } from "@/components/client/exercise-library";

const getExercises = unstable_cache(
  () =>
    getDb()
      .select({
        id: schema.exercise.id,
        name: schema.exercise.name,
        muscleGroup: schema.exercise.muscleGroup,
        description: schema.exercise.description,
        difficulty: schema.exercise.difficulty,
        imageUrl: schema.exercise.imageUrl,
        videoUrl: schema.exercise.videoUrl,
      })
      .from(schema.exercise)
      .orderBy(schema.exercise.muscleGroup, schema.exercise.name),
  ["exercises-library"],
  { tags: ["exercises"] },
);

export default async function BibliotecaPage() {
  const exercises = await getExercises();
  return <ExerciseLibrary exercises={exercises} />;
}
