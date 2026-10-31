import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const slots = await db.select().from(schema.classSlot).orderBy(schema.classSlot.dayOfWeek, schema.classSlot.startTime);

  const myEnrollments = await db
    .select({ slotId: schema.slotEnrollment.slotId })
    .from(schema.slotEnrollment)
    .where(eq(schema.slotEnrollment.clientId, session.user.id));

  const me = await db
    .select({ membershipType: schema.user.membershipType })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  // Inscriptos por turno (para mostrar lugares libres)
  const countRows = await db
    .select({ slotId: schema.slotEnrollment.slotId, c: count() })
    .from(schema.slotEnrollment)
    .groupBy(schema.slotEnrollment.slotId);
  const enrolledCounts: Record<string, number> = Object.fromEntries(countRows.map((r) => [r.slotId, Number(r.c)]));

  return NextResponse.json({
    slots,
    mySlotIds: myEnrollments.map((e) => e.slotId),
    membershipType: me[0]?.membershipType ?? null,
    enrolledCounts,
  });
}
