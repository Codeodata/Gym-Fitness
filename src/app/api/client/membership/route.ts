import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  membershipType: z.enum(["2dias", "3dias", "pase_libre"]),
});

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const db = getDb();
  await db.update(schema.user).set({ membershipType: body.data.membershipType }).where(eq(schema.user.id, session.user.id));

  return NextResponse.json({ ok: true });
}
