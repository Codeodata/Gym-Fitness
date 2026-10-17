"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Users, ClipboardList, LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/trainer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainer/clients", label: "Clientes", icon: Users },
  { href: "/trainer/plans", label: "Planes", icon: ClipboardList },
];

export function TrainerNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-64 hidden md:flex flex-col z-30"
      style={{ background: "var(--bg-subtle)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
          <Dumbbell className="h-5 w-5" style={{ color: "var(--accent-fg)" }} />
        </div>
        <div>
          <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>Gym Fitness</p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Entrenador</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-2)",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            {userName[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{userName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ color: "var(--text-3)", cursor: "pointer", touchAction: "manipulation" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.background = "#2a0a0a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
