import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { and, eq, asc, count } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  const db = getDb();
  const rows = await db
    .select({
      id: schema.clientDayExercise.id,
      dayOfWeek: schema.clientDayExercise.dayOfWeek,
      orderIndex: schema.clientDayExercise.orderIndex,
      sets: schema.clientDayExercise.sets,
      reps: schema.clientDayExercise.reps,
      restSeconds: schema.clientDayExercise.restSeconds,
      exerciseId: schema.exercise.id,
      exerciseName: schema.exercise.name,
      muscleGroup: schema.exercise.muscleGroup,
    })
    .from(schema.clientDayExercise)
    .innerJoin(schema.exercise, eq(schema.clientDayExercise.exerciseId, schema.exercise.id))
    .where(eq(schema.clientDayExercise.clientId, clientId))
    .orderBy(asc(schema.clientDayExercise.dayOfWeek), asc(schema.clientDayExercise.orderIndex));

  return NextResponse.json({ exercises: rows });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, dayOfWeek, exerciseId, sets, reps, restSeconds } = await req.json();

  const db = getDb();
  const [{ value: maxOrder }] = await db
    .select({ value: count() })
    .from(schema.clientDayExercise)
    .where(and(
      eq(schema.clientDayExercise.clientId, clientId),
      eq(schema.clientDayExercise.dayOfWeek, dayOfWeek),
    ));

  const [row] = await db.insert(schema.clientDayExercise).values({
    clientId,
    dayOfWeek,
    exerciseId,
    sets: sets ?? 3,
    reps: reps ?? "10",
    restSeconds: restSeconds ?? null,
    orderIndex: Number(maxOrder),
  }).returning();

  return NextResponse.json({ exercise: row });
}
