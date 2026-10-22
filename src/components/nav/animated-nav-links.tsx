"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function AnimatedNavLinks({
  items,
  isActive,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }, i) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="nav-item-enter flex items-center gap-3 px-2 py-2 rounded-2xl text-sm"
            style={{
              color: active ? "var(--text)" : "var(--text-2)",
              fontWeight: active ? 700 : 500,
              fontSize: active ? "15px" : "14px",
              animationDelay: `${i * 55}ms`,
              transition: "color 180ms",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-2)";
            }}
          >
            <span className="w-12 flex items-center justify-center shrink-0">
              <span
                className={active ? "nav-indicator rounded-full flex items-center justify-center" : "rounded-full flex items-center justify-center"}
                style={
                  active
                    ? {
                        width: 44,
                        height: 44,
                        background: "var(--accent)",
                        boxShadow: "0 0 22px rgba(196,241,53,0.55), 0 0 4px rgba(196,241,53,0.8)",
                      }
                    : {
                        width: 36,
                        height: 36,
                        border: "1px solid var(--border)",
                        background: "var(--bg-hover)",
                      }
                }
              >
                <Icon
                  style={{ color: active ? "var(--accent-fg)" : "var(--text-3)" }}
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
  );
}
