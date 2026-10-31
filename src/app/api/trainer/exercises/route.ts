import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const exercises = await getDb()
    .select()
    .from(schema.exercise)
    .orderBy(schema.exercise.muscleGroup, schema.exercise.name);
  return NextResponse.json(exercises);
}

const CreateBody = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  muscleGroup: z.enum(["chest","back","shoulders","arms","legs","core","cardio","full_body"]),
  imageUrl: z.string().url().nullable().optional(),
  difficulty: z.enum(["beginner","intermediate","advanced"]).default("intermediate"),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid", details: parsed.error }, { status: 400 });

  const [created] = await getDb().insert(schema.exercise).values(parsed.data).returning();
  revalidateTag("exercises", { expire: 0 });
  return NextResponse.json(created, { status: 201 });
}
