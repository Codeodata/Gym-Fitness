import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";

// Duplica una plantilla completa (plan + días + ejercicios) con un nombre nuevo.
// Sirve para "copiar una para hacer otra" sin empezar de cero.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const [orig] = await db.select().from(schema.plan).where(eq(schema.plan.id, id)).limit(1);
  if (!orig) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [copy] = await db.insert(schema.plan).values({
    name: `${orig.name} (copia)`,
    description: orig.description,
    category: orig.category,
    audience: orig.audience,
    frequency: orig.frequency,
    daysPerWeek: orig.daysPerWeek,
    durationWeeks: orig.durationWeeks,
  }).returning();
  if (!copy) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const days = await db
    .select()
    .from(schema.planDay)
    .where(eq(schema.planDay.planId, id))
    .orderBy(asc(schema.planDay.dayNumber));

  for (const d of days) {
    const [newDay] = await db.insert(schema.planDay).values({
      planId: copy.id,
      dayNumber: d.dayNumber,
      name: d.name,
      dayOfWeek: d.dayOfWeek,
    }).returning();
    if (!newDay) continue;

    const exs = await db
      .select()
      .from(schema.planExercise)
      .where(eq(schema.planExercise.planDayId, d.id))
      .orderBy(asc(schema.planExercise.orderIndex));

    if (exs.length > 0) {
      await db.insert(schema.planExercise).values(
        exs.map((e) => ({
          planDayId: newDay.id,
          exerciseId: e.exerciseId,
          section: e.section,
          orderIndex: e.orderIndex,
          sets: e.sets,
          reps: e.reps,
          weightKg: e.weightKg,
          restSeconds: e.restSeconds,
          notes: e.notes,
        })),
      );
    }
  }

  return NextResponse.json({ id: copy.id });
}
