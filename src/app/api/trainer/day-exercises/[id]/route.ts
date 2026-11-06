import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  await db.delete(schema.clientDayExercise).where(eq(schema.clientDayExercise.id, id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { sets, reps, restSeconds, notes } = await req.json();
  const patch: Record<string, unknown> = {};
  if (sets !== undefined) patch.sets = sets;
  if (reps !== undefined) patch.reps = reps;
  if (restSeconds !== undefined) patch.restSeconds = restSeconds;
  if (notes !== undefined) patch.notes = notes;
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

  const db = getDb();
  await db.update(schema.clientDayExercise).set(patch).where(eq(schema.clientDayExercise.id, id));
  return NextResponse.json({ ok: true });
}
