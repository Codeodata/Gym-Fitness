export const dynamic = "force-dynamic";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { ClientDashboard } from "@/components/client/client-dashboard";
import { ClientNav } from "@/components/client/client-nav";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role === "trainer") redirect("/trainer/dashboard");
  if (!session.user.approved) redirect("/my-plan");

  const db = getDb();
  const clientId = session.user.id;

  const [assignment] = await db
    .select({
      id: schema.planAssignment.id,
      trainerNotes: schema.planAssignment.trainerNotes,
      planName: schema.plan.name,
      daysPerWeek: schema.plan.daysPerWeek,
      category: schema.plan.category,
    })
    .from(schema.planAssignment)
    .innerJoin(schema.plan, eq(schema.planAssignment.planId, schema.plan.id))
    .where(and(
      eq(schema.planAssignment.clientId, clientId),
      eq(schema.planAssignment.active, true),
    ))
    .limit(1);

  // Sessions this month
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const logsThisMonth = await db
    .select({ id: schema.workoutLog.id })
    .from(schema.workoutLog)
    .where(and(
      eq(schema.workoutLog.clientId, clientId),
      gte(schema.workoutLog.loggedAt, monthStart),
    ));

  // Total sessions
  const allLogs = await db
    .select({ id: schema.workoutLog.id, loggedAt: schema.workoutLog.loggedAt })
    .from(schema.workoutLog)
    .where(eq(schema.workoutLog.clientId, clientId))
    .orderBy(desc(schema.workoutLog.loggedAt));

  // Streak
  const uniqueDays = [...new Set(allLogs.map((l) => new Date(l.loggedAt).toDateString()))];
  let streak = 0;
  const checkDate = new Date(); checkDate.setHours(0, 0, 0, 0);
  for (const dayStr of uniqueDays) {
    const d = new Date(dayStr); d.setHours(0, 0, 0, 0);
    const diff = Math.round((checkDate.getTime() - d.getTime()) / 86400000);
    if (diff === streak || (streak === 0 && diff <= 1)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  return (
    <div data-client-theme="" style={{ background: "var(--bg)", minHeight: "100svh" }}>
      <ClientNav userName={session.user.name} />
      <main className="pb-24 md:pb-8 pt-16 md:pt-0 md:pl-64 px-4 md:px-8 md:py-8">
        <ClientDashboard
          userName={session.user.name}
          plan={assignment ?? null}
          sessionsThisMonth={logsThisMonth.length}
          totalSessions={allLogs.length}
          streak={streak}
        />
      </main>
    </div>
  );
}
