import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema_in = z.object({ weightKg: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0) });

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema_in.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const db = getDb();
  await db.insert(schema.bodyWeight).values({
    clientId: session.user.id,
    weightKg: body.data.weightKg,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDb();
  await db
    .delete(schema.bodyWeight)
    .where(and(eq(schema.bodyWeight.id, id), eq(schema.bodyWeight.clientId, session.user.id)));

  return NextResponse.json({ ok: true });
}
