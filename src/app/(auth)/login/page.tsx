"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn.email({ email, password });
      if (res.error) { setError(res.error.message ?? "Error al iniciar sesión"); return; }
      window.location.href = "/dashboard";
    } catch {
      setError("Error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh flex" style={{ background: "#080808" }}>

      {/* ── Panel izquierdo: imagen de marca (desktop) ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: "#080808" }}>
        {/* next/image: Vercel la sirve optimizada (webp/resize); en mobile el panel
            está oculto, así que no se descarga. */}
        <Image
          src="/login-bg.png"
          alt="Claudia Duran Fitness"
          fill
          sizes="50vw"
          className="object-contain object-center"
        />
        {/* Borde derecho sutil */}
        <div className="absolute inset-y-0 right-0 w-px z-10" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div
        className="w-full lg:w-[420px] flex flex-col items-center justify-center px-8 py-12 relative"
        style={{ background: "#0d0d0d" }}
      >
        {/* Card del formulario */}
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "#000", boxShadow: "0 0 32px rgba(196,241,53,0.45)" }}
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" style={{ mixBlendMode: "lighten" }} />
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c4f135";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(196,241,53,0.1)";
                  e.currentTarget.style.background = "rgba(196,241,53,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                placeholder="tu@email.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c4f135";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(196,241,53,0.1)";
                  e.currentTarget.style.background = "rgba(196,241,53,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                className="text-xs px-4 py-3 rounded-xl"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-xl font-extrabold text-sm mt-1 transition-all uppercase tracking-widest"
              style={{
                background: loading ? "rgba(196,241,53,0.4)" : "#c4f135",
                color: "#0d1a00",
                cursor: loading ? "default" : "pointer",
                boxShadow: loading ? "none" : "0 0 32px rgba(196,241,53,0.3)",
                letterSpacing: "0.1em",
                height: "52px",
                fontSize: "13px",
              }}
            >
              {loading ? "Entrando…" : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-xs mt-8 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.22)" }}>
            ¿No tenés cuenta?{" "}
            <Link href="/register" style={{ color: "var(--accent)" }} className="font-bold">
              Registrate
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>
          Claudia Duran Fitness © 2024
        </p>
      </div>
    </div>
  );
}
