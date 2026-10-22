import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { desc, eq, gt } from "drizzle-orm";
import { z } from "zod";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const bodySchema = z.object({
  body: z.string().min(1).max(500),
  toId: z.string().nullable(), // null = broadcast to all
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const cutoff = new Date(Date.now() - THREE_DAYS_MS);
  const rows = await db
    .select()
    .from(schema.notification)
    .where(gt(schema.notification.sentAt, cutoff))
    .orderBy(desc(schema.notification.sentAt))
    .limit(20);
  return NextResponse.json({ notifications: rows });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const db = getDb();
  const [n] = await db.insert(schema.notification).values({
    fromId: session.user.id,
    toId: body.data.toId,
    body: body.data.body,
  }).returning();
  return NextResponse.json({ notification: n });
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = getDb();
  await db.delete(schema.notification).where(eq(schema.notification.id, id));
  return NextResponse.json({ ok: true });
}
