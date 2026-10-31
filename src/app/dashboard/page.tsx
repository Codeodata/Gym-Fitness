export const instant = false;
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { eq, and, desc, count } from "drizzle-orm";
import { ClientDashboard } from "@/components/client/client-dashboard";
import { ClientNav } from "@/components/client/client-nav";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "trainer") redirect("/trainer/dashboard");
  if (!session.user.approved) redirect("/my-plan");

  const db = getDb();
  const clientId = session.user.id;

  const [meRow, assignmentRow, totalRow, recentLogs] = await Promise.all([
    db
      .select({ membershipRenewsAt: schema.user.membershipRenewsAt })
      .from(schema.user)
      .where(eq(schema.user.id, clientId))
      .limit(1),
    db
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
      .limit(1),
    db
      .select({ total: count() })
      .from(schema.workoutLog)
      .where(eq(schema.workoutLog.clientId, clientId)),
    db
      .select({ id: schema.workoutLog.id, loggedAt: schema.workoutLog.loggedAt })
      .from(schema.workoutLog)
      .where(eq(schema.workoutLog.clientId, clientId))
      .orderBy(desc(schema.workoutLog.loggedAt))
      .limit(400),
  ]);

  const [me] = meRow;
  const [assignment] = assignmentRow;
  const totalSessions = Number(totalRow[0]?.total ?? 0);

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const sessionsThisMonth = recentLogs.filter((l) => l.loggedAt >= monthStart).length;

  // Streak (recentLogs is ordered desc, limited to 400 — enough for any realistic streak)
  const uniqueDays = [...new Set(recentLogs.map((l) => new Date(l.loggedAt).toDateString()))];
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
          sessionsThisMonth={sessionsThisMonth}
          totalSessions={totalSessions}
          streak={streak}
          membershipRenewsAt={me?.membershipRenewsAt ? new Date(me.membershipRenewsAt).toISOString() : null}
        />
      </main>
    </div>
  );
}
