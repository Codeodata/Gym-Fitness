import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const patchSchema = z.object({
  id: z.string().min(1),
  approved: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.user)
    .set({ approved: body.data.approved, updatedAt: new Date() })
    .where(eq(schema.user.id, body.data.id));

  return NextResponse.json({ ok: true });
}
