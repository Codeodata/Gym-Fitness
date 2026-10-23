export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { PlanMembershipTable } from "@/components/trainer/plan-membership-table";

export default async function PlanPage() {
  await connection();
  const db = getDb();

  const clients = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      membershipType: schema.user.membershipType,
      approved: schema.user.approved,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.active, true)))
    .orderBy(schema.user.name);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Plan</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Gestioná la membresía de cada alumno
        </p>
      </div>
      <PlanMembershipTable clients={clients} />
    </div>
  );
}
