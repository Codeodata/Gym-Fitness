import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { and, eq, count } from "drizzle-orm";
import { z } from "zod";

const LIMITS: Record<string, number> = { "2dias": 2, "3dias": 3 };

const bodySchema = z.object({ action: z.enum(["enroll", "unenroll"]) });

export async function POST(req: Request, { params }: { params: Promise<{ slotId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slotId } = await params;
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { action } = body.data;
  const db = getDb();
  const clientId = session.user.id;

  if (action === "enroll") {
    const [me] = await db
      .select({ membershipType: schema.user.membershipType })
      .from(schema.user)
      .where(eq(schema.user.id, clientId))
      .limit(1);

    const membershipType = me?.membershipType ?? null;
    const limit = membershipType ? LIMITS[membershipType] : undefined;

    // Check weekly limit
    if (limit !== undefined) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(schema.slotEnrollment)
        .where(eq(schema.slotEnrollment.clientId, clientId));
      if (total >= limit) {
        return NextResponse.json(
          { error: "limit", message: `Tu plan permite ${limit} turno${limit !== 1 ? "s" : ""} por semana.` },
          { status: 409 },
        );
      }
    }

    // Check same-day rule: only pase_libre can have multiple slots on the same day
    if (membershipType !== "pase_libre") {
      const [targetSlot] = await db
        .select({ dayOfWeek: schema.classSlot.dayOfWeek })
        .from(schema.classSlot)
        .where(eq(schema.classSlot.id, slotId))
        .limit(1);

      if (targetSlot) {
        // Find other slots the client is enrolled in on the same day
        const sameDay = await db
          .select({ slotId: schema.slotEnrollment.slotId })
          .from(schema.slotEnrollment)
          .innerJoin(schema.classSlot, eq(schema.slotEnrollment.slotId, schema.classSlot.id))
          .where(
            and(
              eq(schema.slotEnrollment.clientId, clientId),
              eq(schema.classSlot.dayOfWeek, targetSlot.dayOfWeek),
            ),
          );

        if (sameDay.length > 0) {
          return NextResponse.json(
            { error: "same_day", message: "Solo podés tener un turno por día. El pase libre permite combinar clases el mismo día." },
            { status: 409 },
          );
        }
      }
    }

    const existing = await db
      .select()
      .from(schema.slotEnrollment)
      .where(and(eq(schema.slotEnrollment.slotId, slotId), eq(schema.slotEnrollment.clientId, clientId)));

    if (existing.length === 0) {
      await db.insert(schema.slotEnrollment).values({ slotId, clientId });
    }
  } else {
    await db
      .delete(schema.slotEnrollment)
      .where(and(eq(schema.slotEnrollment.slotId, slotId), eq(schema.slotEnrollment.clientId, clientId)));
  }

  return NextResponse.json({ ok: true });
}
