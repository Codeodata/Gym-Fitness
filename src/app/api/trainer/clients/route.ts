import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const patchSchema = z.object({
  id: z.string().min(1),
  approved: z.boolean().optional(),
  active: z.boolean().optional(),
  membershipType: z.enum(["2dias", "3dias", "pase_libre"]).nullable().optional(),
  // Fechas de membresía: ISO string (yyyy-mm-dd o datetime) o null para limpiar
  membershipRenewsAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  membershipPaidAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { id, approved, active, membershipType, membershipRenewsAt, membershipPaidAt } = body.data;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (approved !== undefined) patch.approved = approved;
  if (active !== undefined) patch.active = active;
  if (membershipType !== undefined) patch.membershipType = membershipType;
  if (membershipRenewsAt !== undefined) patch.membershipRenewsAt = membershipRenewsAt ? new Date(membershipRenewsAt) : null;
  if (membershipPaidAt !== undefined) patch.membershipPaidAt = membershipPaidAt ? new Date(membershipPaidAt) : null;

  const db = getDb();
  await db.update(schema.user).set(patch).where(eq(schema.user.id, id));

  return NextResponse.json({ ok: true });
}
