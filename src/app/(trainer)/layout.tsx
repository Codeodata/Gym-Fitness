export const dynamic = "force-dynamic";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TrainerNav } from "@/components/trainer/trainer-nav";
import { getDb, schema } from "@/lib/db";
import { and, count, eq } from "drizzle-orm";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "trainer") redirect("/dashboard");

  const db = getDb();
  const [{ value: pendingCount }] = await db
    .select({ value: count() })
    .from(schema.user)
    .where(and(eq(schema.user.role, "client"), eq(schema.user.approved, false)));

  return (
    <div className="flex min-h-svh" style={{ background: "var(--bg)" }}>
      <TrainerNav userName={session.user.name} pendingCount={pendingCount} />
      <main className="flex-1 ml-0 lg:ml-64 px-4 pt-16 pb-8 lg:p-8 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
