import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { ClientsTable } from "@/components/trainer/clients-table";

export default async function ClientsPage() {
  const db = getDb();

  const pending = await db
    .select()
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, false)));

  const approved = await db
    .select()
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)));

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Clientes</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Gestioná los accesos y los planes asignados
        </p>
      </div>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--warning)" }}>
            Esperando aprobación ({pending.length})
          </h2>
          <ClientsTable clients={pending} approved={false} />
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
          Activos ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Todavía no hay clientes aprobados. Compartí el link de registro y aprobá sus cuentas acá.
            </p>
          </div>
        ) : (
          <ClientsTable clients={approved} approved={true} />
        )}
      </section>
    </div>
  );
}
