"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, ClipboardList, TrendingUp, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/my-plan", label: "Mi plan", icon: ClipboardList },
  { href: "/progress", label: "Progreso", icon: TrendingUp },
];

export function ClientNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-64 hidden md:flex flex-col z-30"
        style={{ background: "var(--bg-subtle)", borderRight: "1px solid var(--border)" }}
      >
        <div className="px-5 py-6 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Dumbbell className="h-5 w-5" style={{ color: "var(--accent-fg)" }} />
          </div>
          <div>
            <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>Gym Fitness</p>
            <p className="text-xs truncate max-w-[120px]" style={{ color: "var(--text-3)" }}>{userName}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: active ? "var(--accent-soft)" : "transparent", color: active ? "var(--accent)" : "var(--text-2)" }}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{ color: "var(--text-3)", cursor: "pointer", touchAction: "manipulation" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.background = "#2a0a0a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}>
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-30 md:hidden"
        style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Dumbbell className="h-4 w-4" style={{ color: "var(--accent-fg)" }} />
          </div>
          <span className="font-extrabold text-sm" style={{ color: "var(--text)" }}>Gym Fitness</span>
        </div>
        <button onClick={handleSignOut} className="p-2 rounded-xl" style={{ color: "var(--text-3)", cursor: "pointer" }}>
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around px-4 z-30 md:hidden"
        style={{ background: "var(--bg-subtle)", borderTop: "1px solid var(--border)" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl"
              style={{ color: active ? "var(--accent)" : "var(--text-3)" }}>
              <Icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
