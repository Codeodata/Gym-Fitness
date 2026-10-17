"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";

type DayForm = { name: string; exercises: ExerciseForm[] };
type ExerciseForm = { exerciseName: string; sets: number; reps: string; weightKg: string; notes: string };

const emptyExercise = (): ExerciseForm => ({ exerciseName: "", sets: 3, reps: "10", weightKg: "", notes: "" });
const emptyDay = (): DayForm => ({ name: "", exercises: [emptyExercise()] });

export default function NewPlanPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState("");
  const [days, setDays] = useState<DayForm[]>([emptyDay()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addDay() { setDays((d) => [...d, emptyDay()]); }
  function removeDay(i: number) { setDays((d) => d.filter((_, idx) => idx !== i)); }
  function updateDay(i: number, field: keyof DayForm, value: string) {
    setDays((d) => d.map((day, idx) => idx === i ? { ...day, [field]: value } : day));
  }
  function addExercise(dayIdx: number) {
    setDays((d) => d.map((day, i) => i === dayIdx ? { ...day, exercises: [...day.exercises, emptyExercise()] } : day));
  }
  function removeExercise(dayIdx: number, exIdx: number) {
    setDays((d) => d.map((day, i) => i === dayIdx ? { ...day, exercises: day.exercises.filter((_, j) => j !== exIdx) } : day));
  }
  function updateExercise(dayIdx: number, exIdx: number, field: keyof ExerciseForm, value: string | number) {
    setDays((d) => d.map((day, i) =>
      i === dayIdx ? { ...day, exercises: day.exercises.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex) } : day
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/trainer/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, daysPerWeek, durationWeeks: durationWeeks ? Number(durationWeeks) : null, days }),
      });
      if (!res.ok) { setError("Error al guardar el plan"); return; }
      const data = await res.json() as { id: string };
      router.push(`/trainer/plans/${data.id}`);
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--bg-hover)",
    border: "1px solid var(--border-strong)",
    color: "var(--text)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Nuevo plan</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Definí los días y ejercicios del plan</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Info básica */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Info del plan</h2>
          <input
            required
            placeholder="Nombre del plan (ej: Fuerza 3 días)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-3)" }}>Días por semana</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {[2,3,4,5,6].map((n) => <option key={n} value={n}>{n} días</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-3)" }}>Duración (semanas, opcional)</label>
              <input
                type="number"
                min="1"
                placeholder="ej: 8"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
              />
            </div>
          </div>
        </div>

        {/* Días */}
        {days.map((day, dayIdx) => (
          <div
            key={dayIdx}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-extrabold w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent)", color: "var(--accent-fg)", fontSize: "11px" }}>
                  {dayIdx + 1}
                </span>
                <input
                  placeholder={`Nombre del día (ej: Pecho + Tríceps)`}
                  value={day.name}
                  onChange={(e) => updateDay(dayIdx, "name", e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                />
              </div>
              {days.length > 1 && (
                <button type="button" onClick={() => removeDay(dayIdx)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl"
                  style={{ background: "var(--bg-hover)", color: "var(--destructive)", cursor: "pointer" }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Ejercicios del día */}
            <div className="flex flex-col gap-2">
              {day.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="flex gap-2 items-start">
                  <GripVertical className="h-4 w-4 mt-3 shrink-0" style={{ color: "var(--text-3)" }} />
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      required
                      placeholder="Ejercicio"
                      value={ex.exerciseName}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "exerciseName", e.target.value)}
                      className="col-span-2 sm:col-span-2"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    />
                    <input
                      type="number" min="1" max="20"
                      placeholder="Series"
                      value={ex.sets}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "sets", Number(e.target.value))}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    />
                    <input
                      placeholder="Reps (ej: 10 o 8-12)"
                      value={ex.reps}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "reps", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    />
                    <input
                      placeholder="Peso kg (opcional)"
                      value={ex.weightKg}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "weightKg", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    />
                    <input
                      placeholder="Notas (opcional)"
                      value={ex.notes}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "notes", e.target.value)}
                      className="col-span-2"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                    />
                  </div>
                  {day.exercises.length > 1 && (
                    <button type="button" onClick={() => removeExercise(dayIdx, exIdx)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl mt-0.5 shrink-0"
                      style={{ background: "var(--bg-hover)", color: "var(--destructive)", cursor: "pointer" }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addExercise(dayIdx)}
              className="flex items-center gap-2 text-sm font-semibold w-fit px-3 py-2 rounded-xl"
              style={{ color: "var(--accent)", background: "var(--accent-soft)", cursor: "pointer", touchAction: "manipulation" }}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar ejercicio
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addDay}
          className="flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-2xl"
          style={{ border: "2px dashed var(--border-strong)", color: "var(--text-3)", cursor: "pointer", touchAction: "manipulation" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-3)"; }}
        >
          <Plus className="h-4 w-4" />
          Agregar día de entrenamiento
        </button>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "#2a0a0a", color: "var(--destructive)" }}>{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <a href="/trainer/plans" className="px-5 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl text-sm font-bold"
            style={{
              background: loading ? "var(--bg-hover)" : "var(--accent)",
              color: loading ? "var(--text-3)" : "var(--accent-fg)",
              cursor: loading ? "default" : "pointer",
              touchAction: "manipulation",
            }}
          >
            {loading ? "Guardando…" : "Guardar plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
