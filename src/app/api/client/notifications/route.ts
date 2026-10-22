import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { and, eq, isNull, or, desc, gt } from "drizzle-orm";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const cutoff = new Date(Date.now() - THREE_DAYS_MS);
  const rows = await db
    .select()
    .from(schema.notification)
    .where(and(
      or(isNull(schema.notification.toId), eq(schema.notification.toId, session.user.id)),
      gt(schema.notification.sentAt, cutoff),
    ))
    .orderBy(desc(schema.notification.sentAt))
    .limit(20);
  // Mark as read
  await db.update(schema.notification)
    .set({ readAt: new Date() })
    .where(and(
      or(isNull(schema.notification.toId), eq(schema.notification.toId, session.user.id)),
      isNull(schema.notification.readAt),
    ));
  return NextResponse.json({ notifications: rows });
}
