export const instant = false;
import { connection } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { and, count, countDistinct, eq, gte } from "drizzle-orm";
import { ResumenDashboard } from "@/components/trainer/resumen-dashboard";

export default async function ResumenPage() {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  const db = getDb();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
  twoWeeksAgo.setHours(0, 0, 0, 0);

  const isClient = eq(schema.user.role, "client");

  const [
    activeClientsR,
    pendingClientsR,
    newThisMonthR,
    totalPlansR,
    assignedClientsR,
    sessionsWeekR,
    totalSlotsR,
    membershipRows,
    categoryRows,
    topPlansRows,
    slotRows,
    enrollmentRows,
    activityRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(schema.user).where(and(isClient, eq(schema.user.active, true), eq(schema.user.approved, true))),
    db.select({ value: count() }).from(schema.user).where(and(isClient, eq(schema.user.approved, false))),
    db.select({ value: count() }).from(schema.user).where(and(isClient, gte(schema.user.createdAt, startOfMonth))),
    db.select({ value: count() }).from(schema.plan),
    db.select({ value: countDistinct(schema.clientDayBlock.clientId) }).from(schema.clientDayBlock),
    db.select({ value: count() }).from(schema.workoutLog).where(gte(schema.workoutLog.loggedAt, weekAgo)),
    db.select({ value: count() }).from(schema.classSlot),
    db.select({ membership: schema.user.membershipType, value: count() }).from(schema.user).where(isClient).groupBy(schema.user.membershipType),
    db.select({ category: schema.plan.category, value: count() }).from(schema.plan).groupBy(schema.plan.category),
    db
      .select({
        planId: schema.planDay.planId,
        planName: schema.plan.name,
        category: schema.plan.category,
        students: countDistinct(schema.clientDayBlock.clientId),
      })
      .from(schema.clientDayBlock)
      .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
      .innerJoin(schema.plan, eq(schema.planDay.planId, schema.plan.id))
      .groupBy(schema.planDay.planId, schema.plan.name, schema.plan.category),
    db.select({ dayOfWeek: schema.classSlot.dayOfWeek, type: schema.classSlot.type }).from(schema.classSlot),
    db
      .select({ dayOfWeek: schema.classSlot.dayOfWeek })
      .from(schema.slotEnrollment)
      .innerJoin(schema.classSlot, eq(schema.slotEnrollment.slotId, schema.classSlot.id)),
    db.select({ loggedAt: schema.workoutLog.loggedAt }).from(schema.workoutLog).where(gte(schema.workoutLog.loggedAt, twoWeeksAgo)),
  ]);

  // Membresías
  const memBuckets = { "2dias": 0, "3dias": 0, pase_libre: 0, sin_plan: 0 };
  for (const r of membershipRows) {
    const k = (r.membership ?? "sin_plan") as keyof typeof memBuckets;
    memBuckets[k] = (memBuckets[k] ?? 0) + Number(r.value);
  }

  // Rutinas por categoría
  const catBuckets = { musculación: 0, funcional: 0, calentamiento: 0 };
  for (const r of categoryRows) {
    const k = r.category as keyof typeof catBuckets;
    catBuckets[k] = (catBuckets[k] ?? 0) + Number(r.value);
  }

  // Top rutinas por alumnos
  const topPlans = topPlansRows
    .map((r) => ({ planId: r.planId, name: r.planName, category: r.category, students: Number(r.students) }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 5);

  // Ocupación por día (Lun–Vie)
  const occupancy = [1, 2, 3, 4, 5].map((dow) => ({
    dow,
    slots: slotRows.filter((s) => s.dayOfWeek === dow).length,
    enrolled: enrollmentRows.filter((e) => e.dayOfWeek === dow).length,
  }));

  // Actividad (sesiones registradas, últimos 14 días)
  const dayCounts = new Map<string, number>();
  for (const r of activityRows) {
    const key = new Date(r.loggedAt).toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const activity: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    activity.push({ label: `${d.getDate()}`, count: dayCounts.get(key) ?? 0 });
  }

  return (
    <ResumenDashboard
      userName={session?.user.name ?? "Profe"}
      data={{
        kpis: {
          activeClients: Number(activeClientsR[0]?.value ?? 0),
          pendingClients: Number(pendingClientsR[0]?.value ?? 0),
          newThisMonth: Number(newThisMonthR[0]?.value ?? 0),
          totalPlans: Number(totalPlansR[0]?.value ?? 0),
          assignedClients: Number(assignedClientsR[0]?.value ?? 0),
          sessionsThisWeek: Number(sessionsWeekR[0]?.value ?? 0),
          totalSlots: Number(totalSlotsR[0]?.value ?? 0),
          totalEnrollments: enrollmentRows.length,
        },
        memberships: memBuckets,
        categories: catBuckets,
        topPlans,
        occupancy,
        activity,
      }}
    />
  );
}
