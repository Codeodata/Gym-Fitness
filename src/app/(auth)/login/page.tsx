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
    <div
      className="relative min-h-svh flex items-end md:items-center justify-center px-5 pt-10 pb-14 md:py-10 overflow-hidden"
      style={{ background: "#080808" }}
    >
      {/* ── Fondo: imagen de marca a pantalla completa (desktop y mobile) ── */}
      {/* Celular: versión vertical (logo arriba, Claudia abajo). Desktop: la horizontal. */}
      <Image
        src="/clau-login-mobile.jpg"
        alt="Claudia Duran Fitness"
        fill
        priority
        sizes="100vw"
        className="object-cover object-top md:hidden"
      />
      <Image
        src="/clau-login.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center hidden md:block"
      />
      {/* Scrim: en celular deja ver el logo y oscurece solo donde va el formulario */}
      <div
        className="absolute inset-0 md:hidden"
        style={{ background: "linear-gradient(180deg, rgba(5,5,5,0) 0%, rgba(5,5,5,0.1) 40%, rgba(5,5,5,0.75) 100%)" }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.45) 0%, rgba(5,5,5,0.6) 55%, rgba(5,5,5,0.8) 100%)",
        }}
      />

      {/* ── Tarjeta del formulario (glass flotante) ── */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl px-6 py-7 md:px-7 md:py-9"
        style={{
          background: "rgba(13,13,13,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(244,114,182,0.12)",
        }}
      >
        {/* Logo */}
        <div className="hidden md:flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: "#000", boxShadow: "0 0 32px rgba(244,114,182,0.45)" }}
          >
            <img src="/logo-cd.png" alt="Claudia Duran Fitness" className="w-full h-full object-cover" />
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
                e.currentTarget.style.borderColor = "#f472b6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(244,114,182,0.1)";
                e.currentTarget.style.background = "rgba(244,114,182,0.04)";
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
                e.currentTarget.style.borderColor = "#f472b6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(244,114,182,0.1)";
                e.currentTarget.style.background = "rgba(244,114,182,0.04)";
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
              background: loading ? "rgba(244,114,182,0.4)" : "#f472b6",
              color: "#0d1a00",
              cursor: loading ? "default" : "pointer",
              boxShadow: loading ? "none" : "0 0 32px rgba(244,114,182,0.3)",
              letterSpacing: "0.1em",
              height: "52px",
              fontSize: "13px",
            }}
          >
            {loading ? "Entrando…" : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-xs mt-8 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
          ¿No tenés cuenta?{" "}
          <Link href="/register" style={{ color: "var(--accent)" }} className="font-bold">
            Registrate
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p
        className="absolute bottom-5 left-0 right-0 text-center z-10 text-2xs uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        Claudia Duran Fitness © 2026
      </p>
    </div>
  );
}
