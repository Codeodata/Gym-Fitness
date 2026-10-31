export const instant = false;
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { ClientNav } from "@/components/client/client-nav";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
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

  if (!session.user.active) {
    return (
      <div className="min-h-svh flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "var(--bg-panel)" }}>
            🚫
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Cuenta desactivada</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Tu acceso a la plataforma fue desactivado. Contactá al entrenador para más información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-client-theme="" style={{ minHeight: "100svh", position: "relative" }}>
      {/* Content */}
      <div style={{ position: "relative", zIndex: 4 }}>
        <ClientNav userName={session.user.name} />
        <main className="pb-8 pt-16 lg:pt-0 lg:pl-64 px-4 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
