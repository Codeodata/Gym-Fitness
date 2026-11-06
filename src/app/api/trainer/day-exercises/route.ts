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
      notes: schema.clientDayExercise.notes,
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

  const body = await req.json();
  const { clientId, dayOfWeek } = body;
  if (!clientId || !dayOfWeek) return NextResponse.json({ error: "Missing clientId/dayOfWeek" }, { status: 400 });

  // Acepta alta simple (exerciseId…) o alta múltiple (items: [{exerciseId,…}]).
  type Item = { exerciseId: string; sets?: number; reps?: string; restSeconds?: number | null; notes?: string | null };
  const items: Item[] = Array.isArray(body.items) && body.items.length > 0
    ? body.items
    : [{ exerciseId: body.exerciseId, sets: body.sets, reps: body.reps, restSeconds: body.restSeconds, notes: body.notes }];
  if (items.some((it) => !it.exerciseId)) return NextResponse.json({ error: "Missing exerciseId" }, { status: 400 });

  const db = getDb();
  const [{ value: maxOrder }] = await db
    .select({ value: count() })
    .from(schema.clientDayExercise)
    .where(and(
      eq(schema.clientDayExercise.clientId, clientId),
      eq(schema.clientDayExercise.dayOfWeek, dayOfWeek),
    ));

  const base = Number(maxOrder);
  const rows = await db.insert(schema.clientDayExercise).values(
    items.map((it, i) => ({
      clientId,
      dayOfWeek,
      exerciseId: it.exerciseId,
      sets: it.sets ?? 3,
      reps: it.reps ?? "10",
      restSeconds: it.restSeconds ?? null,
      notes: it.notes ?? null,
      orderIndex: base + i,
    })),
  ).returning();

  return NextResponse.json({ exercises: rows, exercise: rows[0] });
}
