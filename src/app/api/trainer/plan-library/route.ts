import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { count, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const plans = await db.select().from(schema.plan).orderBy(schema.plan.category, schema.plan.name);

  const planDays = await db.select().from(schema.planDay).orderBy(schema.planDay.planId, schema.planDay.dayNumber);

  const exCounts = await db
    .select({ planDayId: schema.planExercise.planDayId, count: count() })
    .from(schema.planExercise)
    .groupBy(schema.planExercise.planDayId);

  const countMap = new Map(exCounts.map((r) => [r.planDayId, Number(r.count)]));

  const library = plans.map((plan) => ({
    ...plan,
    days: planDays
      .filter((d) => d.planId === plan.id)
      .map((d) => ({ ...d, exerciseCount: countMap.get(d.id) ?? 0 })),
  }));

  return NextResponse.json({ library });
}
