import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

const exerciseSchema = z.object({
  exerciseName: z.string().min(1),
  section: z.enum(["warmup", "main"]).default("main"),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1),
  weightKg: z.string().nullable().optional(),
  restSeconds: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const daySchema = z.object({
  name: z.string(),
  dayOfWeek: z.number().int().min(1).max(6).nullable().optional(),
  exercises: z.array(exerciseSchema).min(1),
});

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["calentamiento", "funcional", "musculación"]).default("musculación"),
  daysPerWeek: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5)]),
  durationWeeks: z.number().int().min(1).nullable().optional(),
  days: z.array(daySchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = planSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid body", issues: body.error.issues }, { status: 400 });

  const db = getDb();
  const { name, description, category, daysPerWeek, durationWeeks, days } = body.data;

  // 1. Create plan
  const [newPlan] = await db.insert(schema.plan).values({
    name,
    description: description ?? null,
    category,
    daysPerWeek,
    durationWeeks: durationWeeks ?? null,
  }).returning();

  if (!newPlan) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // 2. For each day, upsert exercises and create plan structure
  for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
    const day = days[dayIdx]!;
    const [planDay] = await db.insert(schema.planDay).values({
      planId: newPlan.id,
      dayNumber: dayIdx + 1,
      name: day.name || null,
      dayOfWeek: day.dayOfWeek ?? null,
    }).returning();

    if (!planDay) continue;

    for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
      const ex = day.exercises[exIdx]!;

      // Upsert exercise by name (simple approach)
      let exerciseId: string;
      const existing = await db
        .select({ id: schema.exercise.id })
        .from(schema.exercise)
        .where(eq(schema.exercise.name, ex.exerciseName))
        .limit(1);

      if (existing[0]) {
        exerciseId = existing[0].id;
      } else {
        const [newEx] = await db.insert(schema.exercise).values({
          name: ex.exerciseName,
        }).returning();
        exerciseId = newEx!.id;
      }

      await db.insert(schema.planExercise).values({
        planDayId: planDay.id,
        exerciseId,
        section: ex.section ?? "main",
        orderIndex: exIdx,
        sets: ex.sets,
        reps: ex.reps,
        weightKg: ex.weightKg ?? null,
        restSeconds: ex.restSeconds ?? null,
        notes: ex.notes ?? null,
      });
    }
  }

  return NextResponse.json({ id: newPlan.id });
}
