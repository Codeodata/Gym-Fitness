export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { ClientsView } from "@/components/trainer/clients-view";

export default async function ClientsPage() {
  await connection();
  const db = getDb();

  const [pending, active, inactive] = await Promise.all([
    db.select().from(schema.user)
      .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, false))),
    db.select().from(schema.user)
      .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true), eq(schema.user.active, true))),
    db.select().from(schema.user)
      .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true), eq(schema.user.active, false))),
  ]);

  // Fetch active plan assignments for all clients
  const allClientIds = [...pending, ...active, ...inactive].map((u) => u.id);
  const planMap = new Map<string, { planName: string; daysPerWeek: number }>();

  if (allClientIds.length > 0) {
    const assignments = await db
      .select({
        clientId: schema.planAssignment.clientId,
        planName: schema.plan.name,
        daysPerWeek: schema.plan.daysPerWeek,
      })
      .from(schema.planAssignment)
      .innerJoin(schema.plan, eq(schema.planAssignment.planId, schema.plan.id))
      .where(
        and(
          eq(schema.planAssignment.active, true),
          inArray(schema.planAssignment.clientId, allClientIds),
        ),
      );

    for (const a of assignments) {
      planMap.set(a.clientId, { planName: a.planName, daysPerWeek: a.daysPerWeek });
    }
  }

  function withPlan<T extends { id: string }>(users: T[]) {
    return users.map((u) => ({ ...u, planInfo: planMap.get(u.id) ?? null }));
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Alumnos</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Gestioná accesos, membresías y rutinas de cada alumno
        </p>
      </div>

      <ClientsView
        pending={withPlan(pending)}
        active={withPlan(active)}
        inactive={withPlan(inactive)}
      />
    </div>
  );
}
