import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { and, eq, count } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayMappings, clientIds } = await req.json() as {
    dayMappings: { planDayId: string; dayOfWeek: number }[];
    clientIds: string[];
  };

  if (!dayMappings?.length || !clientIds?.length)
    return NextResponse.json({ error: "Missing data" }, { status: 400 });

  const db = getDb();
  let created = 0;

  for (const clientId of clientIds) {
    for (const { planDayId, dayOfWeek } of dayMappings) {
      // Skip if already assigned
      const [{ value: existing }] = await db
        .select({ value: count() })
        .from(schema.clientDayBlock)
        .where(and(
          eq(schema.clientDayBlock.clientId, clientId),
          eq(schema.clientDayBlock.dayOfWeek, dayOfWeek),
          eq(schema.clientDayBlock.planDayId, planDayId),
        ));

      if (Number(existing) > 0) continue;

      const [{ value: orderIdx }] = await db
        .select({ value: count() })
        .from(schema.clientDayBlock)
        .where(and(
          eq(schema.clientDayBlock.clientId, clientId),
          eq(schema.clientDayBlock.dayOfWeek, dayOfWeek),
        ));

      await db.insert(schema.clientDayBlock).values({
        clientId,
        dayOfWeek,
        planDayId,
        orderIndex: Number(orderIdx),
      });
      created++;
    }
  }

  return NextResponse.json({ ok: true, created });
}
