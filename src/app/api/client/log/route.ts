import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

// Registrar (o corregir) una sesión de entrenamiento.
// La rutina vive en client_day_block (bloques → plan_exercise) y en
// client_day_exercise (rutina asignada / sueltos, sin plan_exercise).
// Cada ejercicio se guarda con su exerciseId; planExerciseId es opcional.
// Si llega workoutLogId (sesión propia), se reemplazan sus ejercicios.
const logSchema = z.object({
  workoutLogId: z.string().uuid().nullable().optional(),
  planDayId: z.string().uuid().nullable().optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().uuid(),
    planExerciseId: z.string().uuid().nullable().optional(),
    setsDone: z.number().int().min(0).max(50).nullable().optional(),
    repsDone: z.string().max(40).nullable().optional(),
    weightKg: z.string().max(10).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })).default([]),
});

const toKg = (v: string | null | undefined) => {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n < 10000 ? String(n) : null;
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = logSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const db = getDb();
  const clientId = session.user.id;
  const { workoutLogId, planDayId, exercises } = body.data;

  let logId: string | null = null;
  if (workoutLogId) {
    const [own] = await db
      .select({ id: schema.workoutLog.id })
      .from(schema.workoutLog)
      .where(and(eq(schema.workoutLog.id, workoutLogId), eq(schema.workoutLog.clientId, clientId)))
      .limit(1);
    if (own) {
      logId = own.id;
      await db.delete(schema.exerciseLog).where(eq(schema.exerciseLog.workoutLogId, own.id));
    }
  }

  if (!logId) {
    const [log] = await db.insert(schema.workoutLog).values({
      clientId,
      assignmentId: null,
      planDayId: planDayId ?? null,
    }).returning({ id: schema.workoutLog.id });
    if (!log) return NextResponse.json({ error: "DB error" }, { status: 500 });
    logId = log.id;
  }

  if (exercises.length > 0) {
    await db.insert(schema.exerciseLog).values(
      exercises.map((ex) => ({
        workoutLogId: logId!,
        exerciseId: ex.exerciseId,
        planExerciseId: ex.planExerciseId ?? null,
        setsDone: ex.setsDone ?? null,
        repsDone: ex.repsDone?.trim() || null,
        weightKg: toKg(ex.weightKg),
        notes: ex.notes ?? null,
      })),
    );
  }

  return NextResponse.json({ id: logId });
}
