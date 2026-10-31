import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  muscleGroup: z.enum(["chest","back","shoulders","arms","legs","core","cardio","full_body"]).optional(),
  imageUrl: z.string().url().nullable().optional(),
  difficulty: z.enum(["beginner","intermediate","advanced"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const [updated] = await getDb()
    .update(schema.exercise)
    .set(parsed.data)
    .where(eq(schema.exercise.id, id))
    .returning();

  revalidateTag("exercises", { expire: 0 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await getDb().delete(schema.exercise).where(eq(schema.exercise.id, id));
  revalidateTag("exercises", { expire: 0 });
  return NextResponse.json({ ok: true });
}
