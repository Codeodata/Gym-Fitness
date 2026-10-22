"use client";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

type ExerciseOption = { id: string; name: string; muscleGroup: string };

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  arms: "Brazos", legs: "Piernas", core: "Core",
  cardio: "Cardio", full_body: "Completo",
};

type Props = {
  value: string;
  onChange: (name: string) => void;
  exercises: ExerciseOption[];
  inputStyle: React.CSSProperties;
};

export function ExercisePicker({ value, onChange, exercises, inputStyle }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = query.length >= 1
    ? exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div ref={ref} className="relative col-span-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
          style={{ color: "var(--text-3)" }} />
        <input
          required
          placeholder="Buscar ejercicio…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{ ...inputStyle, paddingLeft: "2rem" }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50 shadow-xl"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-strong)", maxHeight: "240px", overflowY: "auto" }}
        >
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(ex.name);
                onChange(ex.name);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
              style={{ touchAction: "manipulation" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--text)" }}>
                {ex.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md shrink-0"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
