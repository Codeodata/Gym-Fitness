import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { BodyWeightForm } from "@/components/client/body-weight-form";
import { Scale, TrendingUp } from "lucide-react";

export default async function ProgressPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const db = getDb();

  const weights = await db
    .select()
    .from(schema.bodyWeight)
    .where(eq(schema.bodyWeight.clientId, session!.user.id))
    .orderBy(desc(schema.bodyWeight.recordedAt))
    .limit(30);

  const logs = await db
    .select({
      id: schema.workoutLog.id,
      loggedAt: schema.workoutLog.loggedAt,
      dayName: schema.planDay.name,
      dayNumber: schema.planDay.dayNumber,
    })
    .from(schema.workoutLog)
    .leftJoin(schema.planDay, eq(schema.workoutLog.planDayId, schema.planDay.id))
    .where(eq(schema.workoutLog.clientId, session!.user.id))
    .orderBy(desc(schema.workoutLog.loggedAt))
    .limit(20);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Mi progreso</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Registrá tu peso y revisá tu historial de entrenamientos
        </p>
      </div>

      {/* Body weight section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Peso corporal
          </h2>
        </div>
        <BodyWeightForm />

        {weights.length > 0 && (
          <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {weights.slice(0, 10).map((w, i) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3.5"
                style={{ background: "var(--bg-panel)", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <span className="text-sm" style={{ color: "var(--text-2)" }}>
                  {new Date(w.recordedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <span className="text-lg font-extrabold tabular-nums" style={{ color: "var(--accent)" }}>
                  {w.weightKg} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Workout history */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
            Historial de sesiones
          </h2>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Todavía no registraste ninguna sesión. Andá a tu plan y marcá tu primer entreno.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {logs.map((log, i) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-4"
                style={{ background: "var(--bg-panel)", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-soft)" }}>
                  <span className="text-xs font-extrabold" style={{ color: "var(--accent)" }}>
                    D{log.dayNumber ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {log.dayName || `Día ${log.dayNumber ?? "?"}`}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    {new Date(log.loggedAt).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
