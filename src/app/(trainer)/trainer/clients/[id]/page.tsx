import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AssignPlanPanel } from "@/components/trainer/assign-plan-panel";
import { MembershipPicker } from "@/components/trainer/membership-picker";
import { TrainerNotesEditor } from "@/components/trainer/trainer-notes-editor";
import { WeeklyScheduleBuilder } from "@/components/trainer/weekly-schedule-builder";
import { ArrowLeft, Calendar, Mail, ClipboardList, Bell } from "lucide-react";
import Link from "next/link";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const db = getDb();

  const client = await db.query.user?.findFirst?.({
    where: eq(schema.user.id, id),
  }) ?? (await db.select().from(schema.user).where(eq(schema.user.id, id)).limit(1))[0];

  if (!client || client.role !== "client") notFound();

  const [activeAssignment] = await db
    .select()
    .from(schema.planAssignment)
    .where(and(eq(schema.planAssignment.clientId, id), eq(schema.planAssignment.active, true)))
    .limit(1);

  const currentPlan = activeAssignment
    ? (await db.select().from(schema.plan).where(eq(schema.plan.id, activeAssignment.planId)).limit(1))[0]
    : null;

  const allPlans = await db.select().from(schema.plan).orderBy(schema.plan.createdAt);

  const recentLogs = await db
    .select({ id: schema.workoutLog.id, loggedAt: schema.workoutLog.loggedAt })
    .from(schema.workoutLog)
    .where(eq(schema.workoutLog.clientId, id))
    .orderBy(schema.workoutLog.loggedAt)
    .limit(10);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/trainer/clients"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <ArrowLeft className="h-4 w-4" style={{ color: "var(--text-2)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{client.name}</h1>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Alumno</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Info card */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Info</h2>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <span className="text-sm" style={{ color: "var(--text-2)" }}>{client.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <span className="text-sm" style={{ color: "var(--text-2)" }}>
              Desde {new Date(client.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <span className="text-sm" style={{ color: "var(--text-2)" }}>
              {recentLogs.length} sesiones registradas
            </span>
          </div>
        </div>

        {/* Current plan card */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Plan activo</h2>
          {currentPlan ? (
            <>
              <p className="font-extrabold text-base" style={{ color: "var(--text)" }}>{currentPlan.name}</p>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {currentPlan.daysPerWeek === 5 ? "Pase libre" : `${currentPlan.daysPerWeek}d/sem`}
                </span>
                {currentPlan.durationWeeks && (
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                    style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                    {currentPlan.durationWeeks} semanas
                  </span>
                )}
              </div>
              {activeAssignment && (
                <TrainerNotesEditor
                  assignmentId={activeAssignment.id}
                  initialNotes={activeAssignment.trainerNotes}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center">
              <p className="text-sm" style={{ color: "var(--text-3)" }}>Sin plan asignado</p>
            </div>
          )}
        </div>
      </div>

      {/* No-plan alert */}
      {!currentPlan && (
        <div
          className="flex items-start gap-4 px-5 py-4 rounded-2xl mb-4"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b" }}
        >
          <Bell className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <div>
            <p className="text-sm font-extrabold" style={{ color: "#f59e0b" }}>
              {client.name} no tiene un plan asignado
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
              Asigná un plan abajo para que el alumno pueda ver su rutina.
            </p>
          </div>
        </div>
      )}

      {/* Membership */}
      <MembershipPicker clientId={id} current={client.membershipType as "2dias" | "3dias" | "pase_libre" | null} />

      {/* Weekly schedule */}
      <div className="mt-6">
        <WeeklyScheduleBuilder clientId={id} />
      </div>

      {/* Assign plan */}
      <div className="mt-4">
        <AssignPlanPanel
          clientId={id}
          plans={allPlans}
          currentPlanId={currentPlan?.id ?? null}
        />
      </div>
    </div>
  );
}
