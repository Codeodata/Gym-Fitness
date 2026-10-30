export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { AgendaEditor } from "@/components/trainer/agenda-editor";

export default async function RoutinesPage() {
  await connection();
  const db = getDb();

  const approvedClients = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)))
    .orderBy(schema.user.name);

  return (
    <div className="max-w-3xl pb-20">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            Rutinas
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
            Qué entrena cada alumno, día por día. Tocá para editar nombres, alumnos y ejercicios.
          </p>
        </div>
        <Link
          href="/trainer/plans/new"
          className="btn-accent flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          style={{ touchAction: "manipulation" }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Crear rutina nueva</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      <AgendaEditor clients={approvedClients} />
    </div>
  );
}
