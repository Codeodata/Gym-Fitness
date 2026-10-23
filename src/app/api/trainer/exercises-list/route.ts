import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "trainer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const exercises = await db
    .select({
      id: schema.exercise.id,
      name: schema.exercise.name,
      muscleGroup: schema.exercise.muscleGroup,
    })
    .from(schema.exercise)
    .orderBy(schema.exercise.muscleGroup, schema.exercise.name);

  return NextResponse.json({ exercises });
}
