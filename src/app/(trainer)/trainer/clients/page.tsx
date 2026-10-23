export const dynamic = "force-dynamic";
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { ClientsGrid } from "@/components/trainer/clients-grid";

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
          Gestioná los accesos y los planes asignados
        </p>
      </div>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#f59e0b" }}>
            Esperando aprobación · {pending.length}
          </h2>
          <ClientsGrid clients={withPlan(pending)} status="pending" />
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
          Activos · {active.length}
        </h2>
        {active.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex items-center justify-center"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-3)" }}>No hay alumnos activos todavía.</p>
          </div>
        ) : (
          <ClientsGrid clients={withPlan(active)} status="active" />
        )}
      </section>

      {inactive.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#ef4444" }}>
            Inactivos · {inactive.length}
          </h2>
          <ClientsGrid clients={withPlan(inactive)} status="inactive" />
        </section>
      )}
    </div>
  );
}
