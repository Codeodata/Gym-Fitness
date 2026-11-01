export const instant = false;
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { StretchLibrary } from "@/components/client/stretch-library";

const getStretches = unstable_cache(
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
      .where(eq(schema.exercise.isStretch, true))
      .orderBy(schema.exercise.muscleGroup, schema.exercise.name),
  ["stretches-library"],
  { tags: ["exercises"] },
);

export default async function EstiramientosPage() {
  const stretches = await getStretches();
  return <StretchLibrary stretches={stretches} />;
}
