export const instant = false;
import { connection } from "next/server";
import { getDb, schema } from "@/lib/db";
import { and, eq, gte } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MembershipPicker } from "@/components/trainer/membership-picker";
import { MembershipRenewal } from "@/components/trainer/membership-renewal";
import { ClientHistory } from "@/components/trainer/client-history";
import { WeeklyScheduleBuilder } from "@/components/trainer/weekly-schedule-builder";
import { ArrowLeft, Calendar, Mail, Activity } from "lucide-react";
import Link from "next/link";

function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + (x.getDay() === 0 ? -6 : 1 - x.getDay()));
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const db = getDb();

  // Historial — asistencias marcadas (todas) y entrenamientos registrados (8 semanas)
  const now = new Date();
  const thisMonday = mondayOf(now);
  const weekStarts = Array.from({ length: 8 }, (_, i) => {
    const ws = new Date(thisMonday);
    ws.setDate(thisMonday.getDate() - (7 - i) * 7);
    return ws;
  });

  const [clientResult, sessionCountResult, attRows, workoutRows] = await Promise.all([
    db.select().from(schema.user).where(eq(schema.user.id, id)).limit(1),
    db.select({ id: schema.workoutLog.id }).from(schema.workoutLog).where(eq(schema.workoutLog.clientId, id)),
    db.select({ date: schema.attendance.date }).from(schema.attendance).where(eq(schema.attendance.clientId, id)),
    db.select({ loggedAt: schema.workoutLog.loggedAt }).from(schema.workoutLog)
      .where(and(eq(schema.workoutLog.clientId, id), gte(schema.workoutLog.loggedAt, weekStarts[0]!))),
  ]);

  const client = clientResult[0];
  if (!client || client.role !== "client") notFound();
  const sessionCount = sessionCountResult;
  const historyWeeks = weekStarts.map((ws) => {
    const we = new Date(ws); we.setDate(ws.getDate() + 7);
    return {
      label: `${ws.getDate()}/${ws.getMonth() + 1}`,
      asistencias: attRows.filter((r) => r.date >= ws && r.date < we).length,
      entrenamientos: workoutRows.filter((r) => r.loggedAt >= ws && r.loggedAt < we).length,
    };
  });

  return (
    <div className="max-w-3xl">
      {/* Back + title */}
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

      {/* Info + Membresía */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Info */}
        <div className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
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
            <Activity className="h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
            <span className="text-sm" style={{ color: "var(--text-2)" }}>
              {sessionCount.length} sesiones registradas
            </span>
          </div>
        </div>

        {/* Membresía */}
        <MembershipPicker
          clientId={id}
          current={client.membershipType as "2dias" | "3dias" | "pase_libre" | null}
        />
      </div>

      {/* Renovación de membresía */}
      <div className="mb-6">
        <MembershipRenewal
          clientId={id}
          renewsAt={client.membershipRenewsAt ? new Date(client.membershipRenewsAt).toISOString() : null}
          paidAt={client.membershipPaidAt ? new Date(client.membershipPaidAt).toISOString() : null}
        />
      </div>

      {/* Historial */}
      <div className="mb-6">
        <ClientHistory
          attendanceTotal={attRows.length}
          workoutTotal={sessionCount.length}
          weeks={historyWeeks}
        />
      </div>

      {/* Weekly schedule */}
      <WeeklyScheduleBuilder clientId={id} />
    </div>
  );
}
