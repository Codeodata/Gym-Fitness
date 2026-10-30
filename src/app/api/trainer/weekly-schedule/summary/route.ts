import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { countDistinct, eq, asc, desc, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const rows = await db
    .select({
      dayOfWeek: schema.clientDayBlock.dayOfWeek,
      planDayId: schema.clientDayBlock.planDayId,
      planDayName: schema.planDay.name,
      dayNumber: schema.planDay.dayNumber,
      planId: schema.planDay.planId,
      planName: schema.plan.name,
      planCategory: schema.plan.category,
      studentCount: countDistinct(schema.clientDayBlock.clientId),
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
    .innerJoin(schema.plan, eq(schema.planDay.planId, schema.plan.id))
    .groupBy(
      schema.clientDayBlock.dayOfWeek,
      schema.clientDayBlock.planDayId,
      schema.planDay.name,
      schema.planDay.dayNumber,
      schema.planDay.planId,
      schema.plan.name,
      schema.plan.category,
    )
    .orderBy(
      asc(schema.clientDayBlock.dayOfWeek),
      desc(countDistinct(schema.clientDayBlock.clientId)),
    );

  const planDayIds = [...new Set(rows.map(r => r.planDayId))];

  // Students per (dayOfWeek, planDayId) block
  const studentRows = planDayIds.length === 0 ? [] : await db
    .select({
      blockId: schema.clientDayBlock.id,
      dayOfWeek: schema.clientDayBlock.dayOfWeek,
      planDayId: schema.clientDayBlock.planDayId,
      clientId: schema.clientDayBlock.clientId,
      clientName: schema.user.name,
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.user, eq(schema.clientDayBlock.clientId, schema.user.id))
    .where(inArray(schema.clientDayBlock.planDayId, planDayIds))
    .orderBy(asc(schema.user.name));

  // Exercises per planDay
  const exerciseRows = planDayIds.length === 0 ? [] : await db
    .select({
      id: schema.planExercise.id,
      planDayId: schema.planExercise.planDayId,
      section: schema.planExercise.section,
      orderIndex: schema.planExercise.orderIndex,
      sets: schema.planExercise.sets,
      reps: schema.planExercise.reps,
      weightKg: schema.planExercise.weightKg,
      exerciseName: schema.exercise.name,
      muscleGroup: schema.exercise.muscleGroup,
    })
    .from(schema.planExercise)
    .innerJoin(schema.exercise, eq(schema.planExercise.exerciseId, schema.exercise.id))
    .where(inArray(schema.planExercise.planDayId, planDayIds))
    .orderBy(asc(schema.planExercise.orderIndex));

  const studentsByBlock = new Map<string, { blockId: string; clientId: string; clientName: string | null }[]>();
  for (const s of studentRows) {
    const key = `${s.dayOfWeek}::${s.planDayId}`;
    (studentsByBlock.get(key) ?? studentsByBlock.set(key, []).get(key)!).push({
      blockId: s.blockId,
      clientId: s.clientId,
      clientName: s.clientName,
    });
  }

  const exercisesByDay = new Map<string, typeof exerciseRows>();
  for (const e of exerciseRows) {
    (exercisesByDay.get(e.planDayId) ?? exercisesByDay.set(e.planDayId, []).get(e.planDayId)!).push(e);
  }

  return NextResponse.json({
    summary: rows.map(r => ({
      ...r,
      studentCount: Number(r.studentCount),
      students: studentsByBlock.get(`${r.dayOfWeek}::${r.planDayId}`) ?? [],
      exercises: exercisesByDay.get(r.planDayId) ?? [],
    })),
  });
}
