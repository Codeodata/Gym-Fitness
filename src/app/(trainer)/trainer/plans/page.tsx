import { getDb, schema } from "@/lib/db";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { count, eq } from "drizzle-orm";

export default async function PlansPage() {
  const db = getDb();
  const plans = await db.select().from(schema.plan).orderBy(schema.plan.createdAt);

  // Get day count per plan
  const dayCountRows = await db
    .select({ planId: schema.planDay.planId, count: count() })
    .from(schema.planDay)
    .groupBy(schema.planDay.planId);

  const dayCountMap = new Map(dayCountRows.map((r) => [r.planId, Number(r.count)]));

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Planes</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
            Creá plantillas y asignalas a tus clientes
          </p>
        </div>
        <Link
          href="/trainer/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
            <ClipboardList className="h-7 w-7" style={{ color: "var(--text-3)" }} />
          </div>
          <div>
            <p className="font-bold" style={{ color: "var(--text)" }}>Todavía no hay planes</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
              Creá el primer plan y asignalo a tus clientes
            </p>
          </div>
          <Link
            href="/trainer/plans/new"
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Crear plan
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/trainer/plans/${plan.id}`}
              className="rounded-2xl p-5 flex flex-col gap-3 group"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-extrabold text-base" style={{ color: "var(--text)" }}>{plan.name}</h2>
                <span
                  className="text-xs px-2 py-1 rounded-lg font-semibold shrink-0"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {plan.daysPerWeek}d/sem
                </span>
              </div>
              {plan.description && (
                <p className="text-sm line-clamp-2" style={{ color: "var(--text-3)" }}>{plan.description}</p>
              )}
              <div className="flex items-center gap-4 mt-auto pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {dayCountMap.get(plan.id) ?? 0} días
                </span>
                {plan.durationWeeks && (
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {plan.durationWeeks} semanas
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
