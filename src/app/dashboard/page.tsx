export const instant = false;
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { ClientDashboard } from "@/components/client/client-dashboard";
import { ClientNav } from "@/components/client/client-nav";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "trainer") redirect("/trainer/dashboard");
  if (!session.user.approved) redirect("/my-plan");

  const db = getDb();
  const clientId = session.user.id;

  const [meRow, routineBlocks, singleDays, totalRow, recentLogs] = await Promise.all([
    db
      .select({ membershipRenewsAt: schema.user.membershipRenewsAt })
      .from(schema.user)
      .where(eq(schema.user.id, clientId))
      .limit(1),
    // Rutina del alumno = bloques por día (modelo nuevo), con su plan para resumen
    db
      .select({
        dayOfWeek: schema.clientDayBlock.dayOfWeek,
        planName: schema.plan.name,
        category: schema.plan.category,
      })
      .from(schema.clientDayBlock)
      .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
      .innerJoin(schema.plan, eq(schema.planDay.planId, schema.plan.id))
      .where(eq(schema.clientDayBlock.clientId, clientId)),
    db
      .select({ dayOfWeek: schema.clientDayExercise.dayOfWeek })
      .from(schema.clientDayExercise)
      .where(eq(schema.clientDayExercise.clientId, clientId)),
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
  // Resumen de la rutina a partir del modelo nuevo (client_day_block / client_day_exercise)
  const trainingDows = new Set<number>([
    ...routineBlocks.map((b) => b.dayOfWeek),
    ...singleDays.map((s) => s.dayOfWeek),
  ]);
  const planNames = [...new Set(routineBlocks.map((b) => b.planName))];
  const categories = [...new Set(routineBlocks.map((b) => b.category))];
  const assignment = trainingDows.size > 0 ? {
    id: "routine",
    trainerNotes: null,
    planName: planNames.length === 1 ? planNames[0]! : "Rutina semanal",
    daysPerWeek: trainingDows.size,
    category: categories.length === 1 ? categories[0]! : "musculación",
  } : null;
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
