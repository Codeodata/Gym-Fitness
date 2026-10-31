export const instant = false;
import { connection } from "next/server";
import { getSession } from "@/lib/get-session";
import { getDb, schema } from "@/lib/db";
import { and, count, countDistinct, eq, gte } from "drizzle-orm";
import { getMembershipStatus } from "@/lib/membership";
import { ResumenDashboard } from "@/components/trainer/resumen-dashboard";

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function ResumenPage() {
  await connection();
  const session = await getSession();
  const db = getDb();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  // Últimas 8 semanas (lunes a lunes); weeks[7] = semana actual
  const thisMonday = mondayOf(now);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const ws = new Date(thisMonday);
    ws.setDate(thisMonday.getDate() - (7 - i) * 7);
    return ws;
  });
  const eightWeeksAgo = weeks[0]!;

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
    renewalRows,
    categoryRows,
    topPlansRows,
    slotRows,
    enrollmentRows,
    attendanceRows,
    workoutRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(schema.user).where(and(isClient, eq(schema.user.active, true), eq(schema.user.approved, true))),
    db.select({ value: count() }).from(schema.user).where(and(isClient, eq(schema.user.approved, false))),
    db.select({ value: count() }).from(schema.user).where(and(isClient, gte(schema.user.createdAt, startOfMonth))),
    db.select({ value: count() }).from(schema.plan),
    db.select({ value: countDistinct(schema.clientDayBlock.clientId) }).from(schema.clientDayBlock),
    db.select({ value: count() }).from(schema.workoutLog).where(gte(schema.workoutLog.loggedAt, weekAgo)),
    db.select({ value: count() }).from(schema.classSlot),
    db.select({ membership: schema.user.membershipType, value: count() }).from(schema.user).where(isClient).groupBy(schema.user.membershipType),
    db.select({ renewsAt: schema.user.membershipRenewsAt }).from(schema.user).where(and(isClient, eq(schema.user.active, true), eq(schema.user.approved, true))),
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
    db.select({ dayOfWeek: schema.classSlot.dayOfWeek, type: schema.classSlot.type, maxCapacity: schema.classSlot.maxCapacity }).from(schema.classSlot),
    db
      .select({ dayOfWeek: schema.classSlot.dayOfWeek })
      .from(schema.slotEnrollment)
      .innerJoin(schema.classSlot, eq(schema.slotEnrollment.slotId, schema.classSlot.id)),
    db.select({ date: schema.attendance.date }).from(schema.attendance).where(gte(schema.attendance.date, eightWeeksAgo)),
    db.select({ loggedAt: schema.workoutLog.loggedAt }).from(schema.workoutLog).where(gte(schema.workoutLog.loggedAt, eightWeeksAgo)),
  ]);

  // Membresías por tipo
  const memBuckets = { "2dias": 0, "3dias": 0, pase_libre: 0, sin_plan: 0 };
  for (const r of membershipRows) {
    const k = (r.membership ?? "sin_plan") as keyof typeof memBuckets;
    memBuckets[k] = (memBuckets[k] ?? 0) + Number(r.value);
  }

  // Estado de renovación de membresías
  const renewal = { overdue: 0, soon: 0, ok: 0, none: 0 };
  for (const r of renewalRows) {
    const s = getMembershipStatus(r.renewsAt, now).state;
    if (s === "overdue") renewal.overdue++;
    else if (s === "due" || s === "soon") renewal.soon++;
    else if (s === "ok") renewal.ok++;
    else renewal.none++;
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

  // Ocupación por día (Lun–Vie) con capacidad
  const occupancy = [1, 2, 3, 4, 5].map((dow) => {
    const slots = slotRows.filter((s) => s.dayOfWeek === dow);
    const capacity = slots.reduce((a, s) => a + (s.maxCapacity ?? 0), 0);
    const enrolled = enrollmentRows.filter((e) => e.dayOfWeek === dow).length;
    return { dow, slots: slots.length, enrolled, capacity, pct: capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0 };
  });
  const totalCapacity = slotRows.reduce((a, s) => a + (s.maxCapacity ?? 0), 0);
  const totalEnrolled = enrollmentRows.length;
  const occupancyPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Seguimiento — últimas 8 semanas, dos series separadas
  const tracking = weeks.map((ws) => {
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const asistencias = attendanceRows.filter((r) => r.date >= ws && r.date < we).length;
    const entrenamientos = workoutRows.filter((r) => r.loggedAt >= ws && r.loggedAt < we).length;
    return { label: `${ws.getDate()}/${ws.getMonth() + 1}`, asistencias, entrenamientos };
  });
  const attendanceThisMonth = attendanceRows.filter((r) => r.date >= startOfMonth).length;
  const workoutsThisMonth = workoutRows.filter((r) => r.loggedAt >= startOfMonth).length;

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
          occupancyPct,
        },
        memberships: memBuckets,
        renewal,
        categories: catBuckets,
        topPlans,
        occupancy,
        tracking,
        trackingTotals: { asistencias: attendanceThisMonth, entrenamientos: workoutsThisMonth },
      }}
    />
  );
}
