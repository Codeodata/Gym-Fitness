import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq, max } from "drizzle-orm";
import { z } from "zod";

const PatchBody = z.object({
  planExerciseId: z.string().uuid(),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.string().min(1).optional(),
  weightKg: z.string().nullable().optional(),
});

const PostBody = z.object({
  planDayId: z.string().uuid(),
  exerciseName: z.string().min(1),
  section: z.enum(["warmup", "main"]).default("main"),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1),
  weightKg: z.string().optional(),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
});

const DeleteBody = z.object({
  planExerciseId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params; // ensure params are resolved (id not needed for post logic beyond auth)

  const parsed = PostBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { planDayId, exerciseName, section, sets, reps, weightKg, restSeconds, notes } = parsed.data;
  const db = getDb();

  // Upsert exercise by name
  let exerciseId: string;
  const existing = await db
    .select({ id: schema.exercise.id, muscleGroup: schema.exercise.muscleGroup })
    .from(schema.exercise)
    .where(eq(schema.exercise.name, exerciseName))
    .limit(1);

  let muscleGroup: string;
  if (existing[0]) {
    exerciseId = existing[0].id;
    muscleGroup = existing[0].muscleGroup;
  } else {
    const [newEx] = await db
      .insert(schema.exercise)
      .values({ name: exerciseName })
      .returning();
    exerciseId = newEx!.id;
    muscleGroup = newEx!.muscleGroup;
  }

  // Get max orderIndex for the day
  const [maxRow] = await db
    .select({ maxIdx: max(schema.planExercise.orderIndex) })
    .from(schema.planExercise)
    .where(eq(schema.planExercise.planDayId, planDayId));

  const orderIndex = (maxRow?.maxIdx ?? -1) + 1;

  const [inserted] = await db
    .insert(schema.planExercise)
    .values({
      planDayId,
      exerciseId,
      section,
      orderIndex,
      sets,
      reps,
      weightKg: weightKg || null,
      restSeconds: restSeconds ?? null,
      notes: notes || null,
    })
    .returning();

  return NextResponse.json({
    exercise: {
      id: inserted!.id,
      planDayId: inserted!.planDayId,
      section: inserted!.section,
      sets: inserted!.sets,
      reps: inserted!.reps,
      weightKg: inserted!.weightKg ?? null,
      notes: inserted!.notes ?? null,
      exerciseName,
      muscleGroup,
      orderIndex: inserted!.orderIndex,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await params;

  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { planExerciseId, sets, reps, weightKg } = parsed.data;
  const patch: Record<string, unknown> = {};
  if (sets !== undefined) patch.sets = sets;
  if (reps !== undefined) patch.reps = reps;
  if (weightKg !== undefined) patch.weightKg = weightKg === "" ? null : weightKg;

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

  const db = getDb();
  await db.update(schema.planExercise).set(patch).where(eq(schema.planExercise.id, planExerciseId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;

  const parsed = DeleteBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();
  await db
    .delete(schema.planExercise)
    .where(eq(schema.planExercise.id, parsed.data.planExerciseId));

  return NextResponse.json({ ok: true });
}
