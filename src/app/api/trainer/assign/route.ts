import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const PatchBody = z.object({
  assignmentId: z.string().uuid(),
  trainerNotes: z.string().nullable(),
});

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const db = getDb();
  await db
    .update(schema.planAssignment)
    .set({ trainerNotes: parsed.data.trainerNotes })
    .where(eq(schema.planAssignment.id, parsed.data.assignmentId));
  return NextResponse.json({ ok: true });
}

const Body = z.object({
  clientId: z.string(),
  planId: z.string().uuid(),
  trainerNotes: z.string().nullable().optional(),
  daySchedule: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { clientId, planId, trainerNotes, daySchedule } = parsed.data;
  const db = getDb();

  // Deactivate existing assignments
  await db
    .update(schema.planAssignment)
    .set({ active: false })
    .where(and(
      eq(schema.planAssignment.clientId, clientId),
      eq(schema.planAssignment.active, true),
    ));

  // Create new assignment
  const [created] = await db
    .insert(schema.planAssignment)
    .values({
      planId,
      clientId,
      active: true,
      trainerNotes: trainerNotes ?? null,
      daySchedule: daySchedule ?? null,
    })
    .returning();

  return NextResponse.json({ id: created!.id });
}
