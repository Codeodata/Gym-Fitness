import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // plan_assignment has no cascade from plan — delete manually
  await db.delete(schema.planAssignment).where(eq(schema.planAssignment.planId, id));

  const [deleted] = await db
    .delete(schema.plan)
    .where(eq(schema.plan.id, id))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const plan = (
    await db.select().from(schema.plan).where(eq(schema.plan.id, id)).limit(1)
  )[0];
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const days = await db
    .select()
    .from(schema.planDay)
    .where(eq(schema.planDay.planId, id))
    .orderBy(schema.planDay.dayNumber);

  const exercises =
    days.length === 0
      ? []
      : await db
          .select({
            id: schema.planExercise.id,
            planDayId: schema.planExercise.planDayId,
            exerciseId: schema.exercise.id,
            section: schema.planExercise.section,
            orderIndex: schema.planExercise.orderIndex,
            sets: schema.planExercise.sets,
            reps: schema.planExercise.reps,
            weightKg: schema.planExercise.weightKg,
            notes: schema.planExercise.notes,
            exerciseName: schema.exercise.name,
            muscleGroup: schema.exercise.muscleGroup,
          })
          .from(schema.planExercise)
          .innerJoin(
            schema.exercise,
            eq(schema.planExercise.exerciseId, schema.exercise.id)
          )
          .innerJoin(
            schema.planDay,
            eq(schema.planExercise.planDayId, schema.planDay.id)
          )
          .where(eq(schema.planDay.planId, id))
          .orderBy(schema.planDay.dayNumber, schema.planExercise.orderIndex);

  return NextResponse.json({ plan, days, exercises });
}

const PatchBody = z.object({
  name: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(schema.plan)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(schema.plan.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ plan: updated });
}
