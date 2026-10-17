"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signUp.email({ name, email, password });
      if (res.error) { setError(res.error.message ?? "Error al registrarte"); return; }
      setDone(true);
    } catch {
      setError("Error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-svh flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "var(--accent-soft)" }}>
            ✓
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>¡Registro exitoso!</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            Tu cuenta fue creada. El entrenador tiene que aprobarte para que puedas acceder a tus planes.
            Te avisamos cuando esté listo.
          </p>
          <Link href="/login"
            className="mt-2 px-6 py-3 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Dumbbell className="h-7 w-7" style={{ color: "var(--accent-fg)" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Crear cuenta</h1>
          <p className="text-sm text-center" style={{ color: "var(--text-2)" }}>
            Registrate y esperá la aprobación del entrenador
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Nombre completo", type: "text", value: name, setter: setName, placeholder: "Juan Pérez" },
            { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "tu@email.com" },
            { label: "Contraseña", type: "password", value: password, setter: setPassword, placeholder: "Mínimo 8 caracteres" },
          ].map(({ label, type, value, setter, placeholder }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                minLength={type === "password" ? 8 : 1}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              />
            </div>
          ))}

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#2a0a0a", color: "var(--destructive)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm mt-1"
            style={{
              background: loading ? "var(--bg-hover)" : "var(--accent)",
              color: loading ? "var(--text-3)" : "var(--accent-fg)",
              cursor: loading ? "default" : "pointer",
              touchAction: "manipulation",
            }}
          >
            {loading ? "Registrando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-3)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }} className="font-semibold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
