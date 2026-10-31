export const instant = false;
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { ExerciseLibrary } from "@/components/client/exercise-library";

export default async function BibliotecaPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const exercises = await getDb()
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
    .orderBy(schema.exercise.muscleGroup, schema.exercise.name);

  return <ExerciseLibrary exercises={exercises} />;
}
