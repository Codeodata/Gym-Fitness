import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

// Copia una plantilla a la semana propia del alumno: lee los ejercicios de los
// días de la plantilla y los inserta como client_day_exercise (independientes
// por alumno). Editar luego no afecta a la plantilla ni a otros alumnos.
const bodySchema = z.object({
  clientId: z.string().min(1),
  dayMap: z
    .array(
      z.object({
        planDayId: z.string().uuid(),
        dayOfWeek: z.number().int().min(1).max(7),
      }),
    )
    .min(1),
  replace: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { clientId, dayMap, replace } = parsed.data;

  const db = getDb();
  const planDayIds = dayMap.map((d) => d.planDayId);

  const exs = await db
    .select({
      planDayId: schema.planExercise.planDayId,
      exerciseId: schema.planExercise.exerciseId,
      section: schema.planExercise.section,
      orderIndex: schema.planExercise.orderIndex,
      sets: schema.planExercise.sets,
      reps: schema.planExercise.reps,
      restSeconds: schema.planExercise.restSeconds,
      notes: schema.planExercise.notes,
    })
    .from(schema.planExercise)
    .where(inArray(schema.planExercise.planDayId, planDayIds))
    .orderBy(asc(schema.planExercise.orderIndex));

  // Reemplazar lo que haya en los días destino (asignación "limpia").
  if (replace) {
    const dows = [...new Set(dayMap.map((d) => d.dayOfWeek))];
    await db.delete(schema.clientDayExercise).where(
      and(
        eq(schema.clientDayExercise.clientId, clientId),
        inArray(schema.clientDayExercise.dayOfWeek, dows),
      ),
    );
  }

  let inserted = 0;
  for (const { planDayId, dayOfWeek } of dayMap) {
    const dayExs = exs
      .filter((e) => e.planDayId === planDayId)
      .sort((a, b) =>
        a.section === b.section
          ? a.orderIndex - b.orderIndex
          : a.section === "warmup" ? -1 : 1,
      );
    if (dayExs.length === 0) continue;
    const rows = dayExs.map((e, i) => ({
      clientId,
      dayOfWeek,
      exerciseId: e.exerciseId,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSeconds ?? null,
      notes: e.notes ?? null,
      orderIndex: i,
    }));
    await db.insert(schema.clientDayExercise).values(rows);
    inserted += rows.length;
  }

  return NextResponse.json({ ok: true, inserted });
}
