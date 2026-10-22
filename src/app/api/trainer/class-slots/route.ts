import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const DEFAULT_SLOTS = [
  // Lunes
  { dayOfWeek: 1, startTime: "16:00", type: "musculación" },
  { dayOfWeek: 1, startTime: "19:00", type: "funcional" },
  { dayOfWeek: 1, startTime: "20:00", type: "musculación" },
  // Martes
  { dayOfWeek: 2, startTime: "15:00", type: "musculación" },
  { dayOfWeek: 2, startTime: "18:00", type: "musculación" },
  { dayOfWeek: 2, startTime: "20:00", type: "musculación" },
  // Miércoles
  { dayOfWeek: 3, startTime: "16:00", type: "musculación" },
  { dayOfWeek: 3, startTime: "19:00", type: "funcional" },
  { dayOfWeek: 3, startTime: "20:00", type: "musculación" },
  // Jueves
  { dayOfWeek: 4, startTime: "15:00", type: "musculación" },
  { dayOfWeek: 4, startTime: "18:00", type: "musculación" },
  { dayOfWeek: 4, startTime: "20:00", type: "musculación" },
  // Viernes
  { dayOfWeek: 5, startTime: "16:00", type: "musculación" },
  { dayOfWeek: 5, startTime: "19:00", type: "funcional" },
  { dayOfWeek: 5, startTime: "20:00", type: "musculación" },
];

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  // Auto-seed slots if none exist
  const existing = await db.select().from(schema.classSlot);
  if (existing.length === 0) {
    await db.insert(schema.classSlot).values(DEFAULT_SLOTS);
  }

  const slots = await db.select().from(schema.classSlot).orderBy(schema.classSlot.dayOfWeek, schema.classSlot.startTime);

  const enrollments = await db
    .select({
      slotId: schema.slotEnrollment.slotId,
      clientId: schema.slotEnrollment.clientId,
      clientName: schema.user.name,
    })
    .from(schema.slotEnrollment)
    .leftJoin(schema.user, eq(schema.slotEnrollment.clientId, schema.user.id));

  const clients = await db
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.role, "client"));

  return NextResponse.json({ slots, enrollments, clients });
}
