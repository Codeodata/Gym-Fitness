export const instant = false;
import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { MovementLibrary } from "@/components/client/movement-library";

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
        isStretch: schema.exercise.isStretch,
      })
      .from(schema.exercise)
      .orderBy(schema.exercise.muscleGroup, schema.exercise.name),
  ["movement-library"],
  { tags: ["exercises"] },
);

// Ejercicios y estiramientos en una sola sección (igual que el profe).
export default async function BibliotecaPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const [all, { tipo }] = await Promise.all([getExercises(), searchParams]);
  return (
    <MovementLibrary
      exercises={all.filter((e) => !e.isStretch)}
      stretches={all.filter((e) => e.isStretch)}
      initialKind={tipo === "estiramientos" ? "estiramientos" : "ejercicios"}
    />
  );
}
