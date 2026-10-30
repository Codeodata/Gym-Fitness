import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const PatchBody = z.object({
  name: z.string().min(1),
});

// Renombra el nombre de un día de rutina (planDay.name), ej. "Push".
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dayId } = await params;
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(schema.planDay)
    .set({ name: parsed.data.name.trim() })
    .where(eq(schema.planDay.id, dayId))
    .returning({ id: schema.planDay.id, name: schema.planDay.name });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, day: updated });
}
