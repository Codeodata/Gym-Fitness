import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq, count, and } from "drizzle-orm";
import { Users, ClipboardList, CheckCircle, Clock } from "lucide-react";

export default async function TrainerDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = getDb();

  const [clientCount] = await db
    .select({ count: count() })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, true)));

  const [pendingCount] = await db
    .select({ count: count() })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, false)));

  const [planCount] = await db.select({ count: count() }).from(schema.plan);

  const [activeAssignments] = await db
    .select({ count: count() })
    .from(schema.planAssignment)
    .where(eq(schema.planAssignment.active, true));

  const stats = [
    { label: "Clientes activos", value: clientCount?.count ?? 0, icon: Users, color: "var(--accent)" },
    { label: "Pendientes de aprobación", value: pendingCount?.count ?? 0, icon: Clock, color: "var(--warning)" },
    { label: "Planes creados", value: planCount?.count ?? 0, icon: ClipboardList, color: "#60a5fa" },
    { label: "Asignaciones activas", value: activeAssignments?.count ?? 0, icon: CheckCircle, color: "var(--success)" },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
          Buen día, {session?.user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Resumen de tu actividad
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {(pendingCount?.count ?? 0) > 0 && (
        <div
          className="mt-6 rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "#1a1200", border: "1px solid #3a2800" }}
        >
          <Clock className="h-5 w-5 shrink-0" style={{ color: "var(--warning)" }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--warning)" }}>
              Tenés {pendingCount?.count} cliente{(pendingCount?.count ?? 0) > 1 ? "s" : ""} esperando aprobación
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Aprobá sus cuentas para que puedan ver sus planes
            </p>
          </div>
          <a
            href="/trainer/clients"
            className="text-xs font-bold px-4 py-2 rounded-xl shrink-0"
            style={{ background: "var(--warning)", color: "#0a0a0a" }}
          >
            Ver clientes
          </a>
        </div>
      )}
    </div>
  );
}
