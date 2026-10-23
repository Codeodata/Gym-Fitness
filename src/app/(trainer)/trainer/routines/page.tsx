export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { TemplateWeekBuilder } from "@/components/trainer/template-week-builder";

export default async function RoutinesPage() {
  await connection();
  const db = getDb();

  const approvedClients = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)))
    .orderBy(schema.user.name);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Rutinas</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
            Armá una semana tipo y asignala a varios alumnos de una vez
          </p>
        </div>
        <Link href="/trainer/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          <Plus className="h-4 w-4" />
          Nueva rutina
        </Link>
      </div>

      <TemplateWeekBuilder clients={approvedClients} />
    </div>
  );
}
