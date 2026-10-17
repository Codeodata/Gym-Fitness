import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { z } from "zod";

const logSchema = z.object({
  assignmentId: z.string().uuid(),
  planDayId: z.string().uuid(),
  exercises: z.array(z.object({
    planExerciseId: z.string().uuid(),
    setsDone: z.number().int().min(0).nullable().optional(),
    repsDone: z.string().nullable().optional(),
    weightKg: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = logSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const db = getDb();
  const { assignmentId, planDayId, exercises } = body.data;

  const [log] = await db.insert(schema.workoutLog).values({
    clientId: session.user.id,
    assignmentId,
    planDayId,
  }).returning();

  if (!log) return NextResponse.json({ error: "DB error" }, { status: 500 });

  if (exercises.length > 0) {
    await db.insert(schema.exerciseLog).values(
      exercises.map((ex) => ({
        workoutLogId: log.id,
        planExerciseId: ex.planExerciseId,
        setsDone: ex.setsDone ?? null,
        repsDone: ex.repsDone ?? null,
        weightKg: ex.weightKg ?? null,
        notes: ex.notes ?? null,
      }))
    );
  }

  return NextResponse.json({ id: log.id });
}
