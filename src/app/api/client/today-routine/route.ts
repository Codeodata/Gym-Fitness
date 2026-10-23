import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { and, eq, asc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jsDay = new Date().getDay();
  const dayOfWeek = jsDay === 0 || jsDay === 6 ? null : jsDay;
  if (!dayOfWeek) return NextResponse.json({ blocks: [], singleExercises: [] });

  const db = getDb();
  const clientId = session.user.id;

  // Plan day blocks
  const blocks = await db
    .select({
      id: schema.clientDayBlock.id,
      orderIndex: schema.clientDayBlock.orderIndex,
      planDayId: schema.clientDayBlock.planDayId,
      planDayName: schema.planDay.name,
      planName: schema.plan.name,
      planCategory: schema.plan.category,
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
    .innerJoin(schema.plan, eq(schema.planDay.planId, schema.plan.id))
    .where(and(
      eq(schema.clientDayBlock.clientId, clientId),
      eq(schema.clientDayBlock.dayOfWeek, dayOfWeek),
    ))
    .orderBy(asc(schema.clientDayBlock.orderIndex));

  const blocksWithExercises = await Promise.all(
    blocks.map(async (block) => {
      const exercises = await db
        .select({
          id: schema.planExercise.id,
          section: schema.planExercise.section,
          orderIndex: schema.planExercise.orderIndex,
          sets: schema.planExercise.sets,
          reps: schema.planExercise.reps,
          restSeconds: schema.planExercise.restSeconds,
          notes: schema.planExercise.notes,
          exerciseName: schema.exercise.name,
          muscleGroup: schema.exercise.muscleGroup,
        })
        .from(schema.planExercise)
        .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
        .where(eq(schema.planExercise.planDayId, block.planDayId))
        .orderBy(asc(schema.planExercise.section), asc(schema.planExercise.orderIndex));
      return { ...block, exercises };
    })
  );

  // Individual exercises
  const singleExercises = await db
    .select({
      id: schema.clientDayExercise.id,
      sets: schema.clientDayExercise.sets,
      reps: schema.clientDayExercise.reps,
      restSeconds: schema.clientDayExercise.restSeconds,
      orderIndex: schema.clientDayExercise.orderIndex,
      exerciseName: schema.exercise.name,
      muscleGroup: schema.exercise.muscleGroup,
    })
    .from(schema.clientDayExercise)
    .innerJoin(schema.exercise, eq(schema.clientDayExercise.exerciseId, schema.exercise.id))
    .where(and(
      eq(schema.clientDayExercise.clientId, clientId),
      eq(schema.clientDayExercise.dayOfWeek, dayOfWeek),
    ))
    .orderBy(asc(schema.clientDayExercise.orderIndex));

  return NextResponse.json({ blocks: blocksWithExercises, singleExercises });
}
