import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  clientId: z.string(),
  fromSlotId: z.string(),
  toSlotId: z.string(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { clientId, fromSlotId, toSlotId } = body.data;
  const db = getDb();
  await db.delete(schema.slotEnrollment).where(and(eq(schema.slotEnrollment.slotId, fromSlotId), eq(schema.slotEnrollment.clientId, clientId)));
  const existing = await db.select().from(schema.slotEnrollment).where(and(eq(schema.slotEnrollment.slotId, toSlotId), eq(schema.slotEnrollment.clientId, clientId)));
  if (existing.length === 0) {
    await db.insert(schema.slotEnrollment).values({ slotId: toSlotId, clientId });
  }
  return NextResponse.json({ ok: true });
}
