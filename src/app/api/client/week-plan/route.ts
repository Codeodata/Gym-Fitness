import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const clientId = session.user.id;

  const [assignment] = await db
    .select()
    .from(schema.planAssignment)
    .where(and(
      eq(schema.planAssignment.clientId, clientId),
      eq(schema.planAssignment.active, true),
    ))
    .limit(1);

  if (!assignment) return NextResponse.json({ days: [] });

  const plan = await db.query.plan.findFirst({
    where: eq(schema.plan.id, assignment.planId),
    with: {
      planDays: {
        orderBy: schema.planDay.dayNumber,
        with: {
          planExercises: {
            orderBy: schema.planExercise.orderIndex,
            with: { exercise: true },
          },
        },
      },
    },
  });

  if (!plan) return NextResponse.json({ days: [] });

  // Parse daySchedule: planDayId → dayOfWeek
  let scheduleMap: Record<string, number> = {};
  if (assignment.daySchedule) {
    try {
      const arr = JSON.parse(assignment.daySchedule) as { planDayId: string; dayOfWeek: number }[];
      scheduleMap = Object.fromEntries(arr.map((e) => [e.planDayId, e.dayOfWeek]));
    } catch { /* no schedule */ }
  }

  const days = plan.planDays.map((day) => {
    const dow = scheduleMap[day.id] ?? day.dayOfWeek ?? null;
    return {
      id: day.id,
      name: day.name,
      dayNumber: day.dayNumber,
      dow,
      exercises: day.planExercises.map((pe) => ({
        id: pe.id,
        name: pe.exercise.name,
        muscleGroup: pe.exercise.muscleGroup,
        sets: pe.sets,
        reps: pe.reps,
        weightKg: pe.weightKg,
        notes: pe.notes,
        videoUrl: pe.exercise.videoUrl,
        imageUrl: pe.exercise.imageUrl,
        section: pe.section,
      })),
    };
  });

  // Sort by dow (null days last)
  days.sort((a, b) => {
    if (a.dow === null && b.dow === null) return 0;
    if (a.dow === null) return 1;
    if (b.dow === null) return -1;
    return a.dow - b.dow;
  });

  return NextResponse.json({ days });
}
