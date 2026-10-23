import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  const db = getDb();
  const blocks = await db
    .select({
      id: schema.clientDayBlock.id,
      dayOfWeek: schema.clientDayBlock.dayOfWeek,
      orderIndex: schema.clientDayBlock.orderIndex,
      planDayId: schema.clientDayBlock.planDayId,
      planDayName: schema.planDay.name,
      planId: schema.planDay.planId,
      planName: schema.plan.name,
      planCategory: schema.plan.category,
    })
    .from(schema.clientDayBlock)
    .innerJoin(schema.planDay, eq(schema.clientDayBlock.planDayId, schema.planDay.id))
    .innerJoin(schema.plan, eq(schema.planDay.planId, schema.plan.id))
    .where(eq(schema.clientDayBlock.clientId, clientId))
    .orderBy(asc(schema.clientDayBlock.dayOfWeek), asc(schema.clientDayBlock.orderIndex));

  return NextResponse.json({ blocks });
}

const postSchema = z.object({
  clientId: z.string().min(1),
  dayOfWeek: z.number().int().min(1).max(5),
  planDayId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = postSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { clientId, dayOfWeek, planDayId } = body.data;
  const db = getDb();

  const existing = await db
    .select({ orderIndex: schema.clientDayBlock.orderIndex })
    .from(schema.clientDayBlock)
    .where(and(eq(schema.clientDayBlock.clientId, clientId), eq(schema.clientDayBlock.dayOfWeek, dayOfWeek)))
    .orderBy(asc(schema.clientDayBlock.orderIndex));

  const nextOrder = existing.length > 0 ? (existing[existing.length - 1]!.orderIndex + 1) : 0;

  const [block] = await db.insert(schema.clientDayBlock).values({
    clientId,
    dayOfWeek,
    planDayId,
    orderIndex: nextOrder,
  }).returning();

  return NextResponse.json({ block });
}
