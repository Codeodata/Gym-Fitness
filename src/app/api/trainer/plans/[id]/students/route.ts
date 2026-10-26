import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";

const DeleteBody = z.object({ clientId: z.string().min(1) });

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId } = await params;
  const parsed = DeleteBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { clientId } = parsed.data;
  const db = getDb();

  const planDays = await db
    .select({ id: schema.planDay.id })
    .from(schema.planDay)
    .where(eq(schema.planDay.planId, planId));

  if (planDays.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

  const result = await db
    .delete(schema.clientDayBlock)
    .where(
      and(
        eq(schema.clientDayBlock.clientId, clientId),
        inArray(schema.clientDayBlock.planDayId, planDays.map(d => d.id)),
      ),
    )
    .returning({ id: schema.clientDayBlock.id });

  return NextResponse.json({ ok: true, deleted: result.length });
}
