import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { count, countDistinct, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const plans = await db.select().from(schema.plan).orderBy(schema.plan.category, schema.plan.name);

  const planDays = await db.select().from(schema.planDay).orderBy(schema.planDay.planId, schema.planDay.dayNumber);

  const exCounts = await db
    .select({ planDayId: schema.planExercise.planDayId, count: count() })
    .from(schema.planExercise)
    .groupBy(schema.planExercise.planDayId);

  // Distinct students per plan
  const planStudentCounts = await db
    .select({
      planId: schema.planDay.planId,
      studentCount: countDistinct(schema.clientDayBlock.clientId),
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
    .groupBy(schema.planDay.planId);

  // Per-day assignments with student names
  const dayAssignments = await db
    .select({
      planDayId: schema.clientDayBlock.planDayId,
      clientId: schema.clientDayBlock.clientId,
      clientName: schema.user.name,
      dayOfWeek: schema.clientDayBlock.dayOfWeek,
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.user, eq(schema.clientDayBlock.clientId, schema.user.id));

  // Distinct students per plan with names
  const planStudentsRaw = await db
    .selectDistinct({
      planId: schema.planDay.planId,
      clientId: schema.clientDayBlock.clientId,
      clientName: schema.user.name,
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
    .innerJoin(schema.user, eq(schema.clientDayBlock.clientId, schema.user.id));

  // Class slots for each client
  const clientSlotsRaw = await db
    .select({
      clientId: schema.slotEnrollment.clientId,
      dayOfWeek: schema.classSlot.dayOfWeek,
      startTime: schema.classSlot.startTime,
      type: schema.classSlot.type,
    })
    .from(schema.slotEnrollment)
    .innerJoin(schema.classSlot, eq(schema.slotEnrollment.slotId, schema.classSlot.id));

  const countMap = new Map(exCounts.map((r) => [r.planDayId, Number(r.count)]));
  const studentCountMap = new Map(planStudentCounts.map(r => [r.planId, Number(r.studentCount)]));

  const dayAssignmentsMap = new Map<string, { clientId: string; clientName: string | null; dayOfWeek: number }[]>();
  for (const a of dayAssignments) {
    if (!dayAssignmentsMap.has(a.planDayId)) dayAssignmentsMap.set(a.planDayId, []);
    dayAssignmentsMap.get(a.planDayId)!.push({ clientId: a.clientId, clientName: a.clientName, dayOfWeek: a.dayOfWeek });
  }

  const clientSlotsMap = new Map<string, { dayOfWeek: number; startTime: string; type: string }[]>();
  for (const s of clientSlotsRaw) {
    if (!clientSlotsMap.has(s.clientId)) clientSlotsMap.set(s.clientId, []);
    clientSlotsMap.get(s.clientId)!.push({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, type: s.type });
  }

  const planStudentsMap = new Map<string, { clientId: string; clientName: string | null; slots: { dayOfWeek: number; startTime: string; type: string }[] }[]>();
  for (const s of planStudentsRaw) {
    if (!planStudentsMap.has(s.planId)) planStudentsMap.set(s.planId, []);
    planStudentsMap.get(s.planId)!.push({
      clientId: s.clientId,
      clientName: s.clientName,
      slots: (clientSlotsMap.get(s.clientId) ?? []).sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    });
  }

  const library = plans.map((plan) => ({
    ...plan,
    assignedStudentCount: studentCountMap.get(plan.id) ?? 0,
    students: planStudentsMap.get(plan.id) ?? [],
    days: planDays
      .filter((d) => d.planId === plan.id)
      .map((d) => ({
        ...d,
        exerciseCount: countMap.get(d.id) ?? 0,
        assignments: dayAssignmentsMap.get(d.id) ?? [],
      })),
  }));

  return NextResponse.json({ library });
}
