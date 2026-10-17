import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClientNav } from "@/components/client/client-nav";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role === "trainer") redirect("/trainer/dashboard");
  if (!session.user.approved) {
    return (
      <div className="min-h-svh flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "var(--bg-panel)" }}>
            ⏳
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Cuenta pendiente</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Tu cuenta fue creada correctamente. El entrenador tiene que aprobarte para que puedas acceder a tus planes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100svh" }}>
      <ClientNav userName={session.user.name} />
      <main className="pb-24 md:pb-8 pt-16 md:pt-0 md:pl-64 px-4 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
