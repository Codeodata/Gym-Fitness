import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { and, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });

  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const rows = await getDb()
    .select()
    .from(schema.attendance)
    .where(and(gte(schema.attendance.date, start), lt(schema.attendance.date, end)));

  return NextResponse.json(rows);
}

const Body = z.object({
  clientId: z.string(),
  date: z.string(), // ISO date string
  present: z.boolean(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { clientId, date, present, notes } = parsed.data;
  const dateObj = new Date(date);
  const dayStart = new Date(dateObj);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateObj);
  dayEnd.setHours(23, 59, 59, 999);

  const db = getDb();

  // Upsert: delete existing and insert
  await db.delete(schema.attendance).where(
    and(
      eq(schema.attendance.clientId, clientId),
      gte(schema.attendance.date, dayStart),
      lt(schema.attendance.date, dayEnd),
    )
  );

  if (present) {
    const [created] = await db.insert(schema.attendance).values({
      clientId, date: dateObj, present, notes: notes ?? null,
    }).returning();
    return NextResponse.json(created);
  }

  return NextResponse.json({ ok: true });
}
