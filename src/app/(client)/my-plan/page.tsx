export const instant = false;
import { getSession } from "@/lib/get-session";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { PlanView } from "@/components/client/plan-view";

export default async function MyPlanPage() {
  const session = await getSession();
  const db = getDb();

  const [assignment] = await db
    .select()
    .from(schema.planAssignment)
    .where(and(
      eq(schema.planAssignment.clientId, session!.user.id),
      eq(schema.planAssignment.active, true),
    ))
    .limit(1);

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "var(--bg-panel)" }}>
          🏋️
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Sin plan asignado</h2>
          <p className="text-sm mt-2" style={{ color: "var(--text-2)" }}>
            Tu entrenador todavía no te asignó un plan. Pronto tendrás tu rutina lista.
          </p>
        </div>
      </div>
    );
  }

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

  if (!plan) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <PlanView plan={plan} assignment={assignment} clientId={session!.user.id} />
    </div>
  );
}
