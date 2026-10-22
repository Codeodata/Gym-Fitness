"use client";

import { usePathname } from "next/navigation";
import {
  ClipboardList, TrendingUp, LogOut,
  Clock, LayoutDashboard, Sun, Moon, Menu, X,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/dashboard",   label: "Inicio",   icon: LayoutDashboard, image: "/trainer-bg.jpg" },
  { href: "/my-schedule", label: "Turnos",   icon: Clock,           image: "/turnos.jpg" },
  { href: "/my-plan",     label: "Mi Plan",  icon: ClipboardList,   image: "/miplan.jpg" },
  { href: "/progress",    label: "Progreso", icon: TrendingUp,      image: "/progreso.jpg" },
];

export function ClientNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [open]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  const activeImage = NAV.find((n) => isActive(n.href))?.image ?? NAV[0].image;

  const sidebarBg: React.CSSProperties = {
    backgroundImage: `url('${activeImage}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "background-image 0ms",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Overlay oscuro sobre la imagen */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: "#000", boxShadow: "0 0 20px rgba(196,241,53,0.35)" }}
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" style={{ mixBlendMode: "lighten" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-extrabold uppercase tracking-widest"
              style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Gym Fitness
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
              {userName}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2">
          <div className="flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }, i) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="nav-item-enter flex items-center gap-3 px-2 py-2 rounded-2xl text-sm"
                  style={{
                    animationDelay: `${i * 55}ms`,
                    background: active ? "rgba(196,241,53,0.15)" : "transparent",
                    border: active ? "1px solid rgba(196,241,53,0.3)" : "1px solid transparent",
                    transition: "background 180ms, border-color 180ms",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                    }
                  }}
                >
                  <span className="w-12 flex items-center justify-center shrink-0">
                    <span
                      className={active ? "nav-indicator rounded-full flex items-center justify-center" : "rounded-full flex items-center justify-center"}
                      style={
                        active
                          ? { width: 44, height: 44, background: "var(--accent)", boxShadow: "0 0 22px rgba(196,241,53,0.55), 0 0 4px rgba(196,241,53,0.8)" }
                          : { width: 36, height: 36, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }
                      }
                    >
                      <Icon
                        style={{ color: active ? "var(--accent-fg)" : "rgba(255,255,255,0.6)" }}
                        width={active ? 20 : 17}
                        height={active ? 20 : 17}
                      />
                    </span>
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {userName[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-medium truncate flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {userName}
            </span>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", touchAction: "manipulation" }}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer transition-all"
            style={{ color: "rgba(255,255,255,0.4)", touchAction: "manipulation" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-64 hidden lg:flex flex-col z-30 overflow-hidden"
        style={sidebarBg}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 gap-3 z-30 lg:hidden"
        style={{ background: "var(--bg-panel)", borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
          style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
        >
          <Menu className="h-5 w-5" />
        </button>
        <span
          className="font-extrabold text-sm uppercase tracking-widest flex-1"
          style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Gym Fitness
        </span>
        <button onClick={toggleTheme} className="p-2 rounded-xl cursor-pointer" style={{ color: "var(--text-3)", touchAction: "manipulation" }}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button onClick={handleSignOut} className="p-2 rounded-xl cursor-pointer" style={{ color: "var(--text-3)" }}>
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 lg:hidden transition-transform duration-300 overflow-hidden"
        style={{
          ...sidebarBg,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          willChange: "transform",
        }}
      >
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
