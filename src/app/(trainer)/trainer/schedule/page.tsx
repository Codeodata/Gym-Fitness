import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and, gte, lt } from "drizzle-orm";
import { WeeklySchedule } from "@/components/trainer/weekly-schedule";

export default async function SchedulePage() {
  await connection();
  const db = getDb();

  // This week Mon-Sun
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Approved clients
  const clients = await db
    .select()
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)));

  // Active assignments with plan info
  const assignments = await db
    .select({
      clientId: schema.planAssignment.clientId,
      planId: schema.planAssignment.planId,
      planName: schema.plan.name,
      daysPerWeek: schema.plan.daysPerWeek,
    })
    .from(schema.planAssignment)
    .leftJoin(schema.plan, eq(schema.planAssignment.planId, schema.plan.id))
    .where(eq(schema.planAssignment.active, true));

  // Workout logs this week
  const logs = await db
    .select({
      clientId: schema.workoutLog.clientId,
      loggedAt: schema.workoutLog.loggedAt,
    })
    .from(schema.workoutLog)
    .where(and(gte(schema.workoutLog.loggedAt, weekStart), lt(schema.workoutLog.loggedAt, weekEnd)));

  // Attendance this week
  const attendanceRows = await db
    .select()
    .from(schema.attendance)
    .where(and(gte(schema.attendance.date, weekStart), lt(schema.attendance.date, weekEnd)));

  return (
    <WeeklySchedule
      clients={clients}
      assignments={assignments}
      logs={logs.map((l) => ({ clientId: l.clientId, loggedAt: l.loggedAt.toISOString() }))}
      attendance={attendanceRows.map((a) => ({
        clientId: a.clientId,
        date: a.date.toISOString(),
        present: a.present,
      }))}
      weekStart={`${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`}
    />
  );
}
