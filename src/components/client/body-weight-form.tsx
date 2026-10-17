"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function BodyWeightForm() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setLoading(true);
    try {
      await fetch("/api/client/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: weight }),
      });
      setWeight("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="number"
        step="0.1"
        min="20"
        max="300"
        required
        placeholder="Tu peso de hoy (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-strong)",
          color: "var(--text)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      />
      <button
        type="submit"
        disabled={loading || !weight}
        className="px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0"
        style={{
          background: loading || !weight ? "var(--bg-hover)" : "var(--accent)",
          color: loading || !weight ? "var(--text-3)" : "var(--accent-fg)",
          cursor: loading || !weight ? "default" : "pointer",
          touchAction: "manipulation",
        }}
      >
        <Plus className="h-4 w-4" />
        {loading ? "…" : "Registrar"}
      </button>
    </form>
  );
}
