"use client";
import { useState } from "react";
import { Plus, Pencil, Check, X, ImageIcon, Trash2 } from "lucide-react";
import type { Exercise } from "@/lib/db/schema";

const MUSCLE_GROUPS = [
  { value: "chest", label: "Pecho" },
  { value: "back", label: "Espalda" },
  { value: "shoulders", label: "Hombros" },
  { value: "arms", label: "Brazos" },
  { value: "legs", label: "Piernas" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Cuerpo completo" },
] as const;

const DIFFICULTIES = [
  { value: "beginner", label: "Principiante", cls: "badge-beginner" },
  { value: "intermediate", label: "Intermedio", cls: "badge-intermediate" },
  { value: "advanced", label: "Avanzado", cls: "badge-advanced" },
] as const;

type ExerciseRow = Exercise & { difficulty?: string | null };

export function ExerciseManager({ initialExercises }: { initialExercises: ExerciseRow[] }) {
  const [exercises, setExercises] = useState<ExerciseRow[]>(initialExercises);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ExerciseRow>>({});
  const [showNew, setShowNew] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", muscleGroup: "chest" as string, description: "", imageUrl: "", difficulty: "intermediate" });
  const [filterGroup, setFilterGroup] = useState("all");
  const [saving, setSaving] = useState(false);

  const filtered = filterGroup === "all" ? exercises : exercises.filter((e) => e.muscleGroup === filterGroup);

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/trainer/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editData,
        imageUrl: editData.imageUrl || null,
      }),
    });
    const updated = await res.json() as ExerciseRow;
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, ...updated } : e));
    setEditId(null);
    setEditData({});
    setSaving(false);
  }

  async function deleteEx(id: string) {
    if (!confirm("¿Eliminar ejercicio? Los planes que lo usen pueden quedar inconsistentes.")) return;
    await fetch(`/api/trainer/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  async function createEx() {
    if (!newEx.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/trainer/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEx, imageUrl: newEx.imageUrl || null }),
    });
    const created = await res.json() as ExerciseRow;
    setExercises((prev) => [...prev, created]);
    setNewEx({ name: "", muscleGroup: "chest", description: "", imageUrl: "", difficulty: "intermediate" });
    setShowNew(false);
    setSaving(false);
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: "var(--bg-hover)", border: "1px solid var(--border-strong)",
    color: "var(--text)", borderRadius: "10px", padding: "8px 12px",
    fontSize: "14px", outline: "none", width: "100%", ...extra,
  });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Biblioteca de ejercicios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            {exercises.length} ejercicios · Editá imágenes, descripciones y dificultad
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold btn-accent cursor-pointer"
          style={{ touchAction: "manipulation" }}
        >
          <Plus className="h-4 w-4" /> Nuevo ejercicio
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setFilterGroup("all")}
          className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          style={{
            background: filterGroup === "all" ? "var(--accent)" : "var(--bg-panel)",
            color: filterGroup === "all" ? "var(--accent-fg)" : "var(--text-3)",
            border: "1px solid var(--border)",
          }}
        >Todos ({exercises.length})</button>
        {MUSCLE_GROUPS.map((g) => {
          const count = exercises.filter((e) => e.muscleGroup === g.value).length;
          if (count === 0) return null;
          return (
            <button
              key={g.value}
              onClick={() => setFilterGroup(g.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              style={{
                background: filterGroup === g.value ? "var(--accent)" : "var(--bg-panel)",
                color: filterGroup === g.value ? "var(--accent-fg)" : "var(--text-3)",
                border: "1px solid var(--border)",
              }}
            >{g.label} ({count})</button>
          );
        })}
      </div>

      {/* New exercise form */}
      {showNew && (
        <div className="rounded-2xl p-5 mb-4 flex flex-col gap-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)" }}>
          <h3 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Nuevo ejercicio</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Nombre del ejercicio *" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} style={inp()} />
            <select value={newEx.muscleGroup} onChange={(e) => setNewEx({ ...newEx, muscleGroup: e.target.value })} style={{ ...inp(), cursor: "pointer" }}>
              {MUSCLE_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            <select value={newEx.difficulty} onChange={(e) => setNewEx({ ...newEx, difficulty: e.target.value })} style={{ ...inp(), cursor: "pointer" }}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input placeholder="URL de imagen (opcional)" value={newEx.imageUrl} onChange={(e) => setNewEx({ ...newEx, imageUrl: e.target.value })} style={inp()} />
            <textarea placeholder="Descripción (opcional)" value={newEx.description} onChange={(e) => setNewEx({ ...newEx, description: e.target.value })} rows={2} style={{ ...inp(), resize: "vertical", gridColumn: "1 / -1" }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
              Cancelar
            </button>
            <button onClick={createEx} disabled={saving || !newEx.name.trim()} className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer btn-accent">
              {saving ? "Guardando…" : "Crear ejercicio"}
            </button>
          </div>
        </div>
      )}

      {/* Exercise grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => {
          const isEditing = editId === ex.id;
          const diff = DIFFICULTIES.find((d) => d.value === (ex.difficulty ?? "intermediate"));
          return (
            <div
              key={ex.id}
              className="exercise-card rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
            >
              {/* Info / Edit */}
              <div className="flex-1 p-4">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={editData.name ?? ex.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      style={inp({ fontSize: "13px", padding: "6px 10px" })}
                    />
                    <select
                      value={editData.muscleGroup ?? ex.muscleGroup}
                      onChange={(e) => setEditData({ ...editData, muscleGroup: e.target.value as typeof ex.muscleGroup })}
                      style={{ ...inp({ fontSize: "13px", padding: "6px 10px" }), cursor: "pointer" }}
                    >
                      {MUSCLE_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <select
                      value={editData.difficulty ?? ex.difficulty ?? "intermediate"}
                      onChange={(e) => setEditData({ ...editData, difficulty: e.target.value as typeof ex.difficulty })}
                      style={{ ...inp({ fontSize: "13px", padding: "6px 10px" }), cursor: "pointer" }}
                    >
                      {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <div className="relative">
                      <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: "var(--text-3)" }} />
                      <input
                        placeholder="URL de imagen"
                        value={editData.imageUrl ?? ex.imageUrl ?? ""}
                        onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value || null })}
                        style={{ ...inp({ fontSize: "13px", padding: "6px 10px 6px 28px" }) }}
                      />
                    </div>
                    <textarea
                      placeholder="Descripción"
                      value={editData.description ?? ex.description ?? ""}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={2}
                      style={{ ...inp({ fontSize: "13px", padding: "6px 10px", resize: "none" }) }}
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setEditId(null); setEditData({}); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
                      >
                        <X className="h-3 w-3" /> Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(ex.id)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer btn-accent"
                      >
                        <Check className="h-3 w-3" /> Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm leading-snug" style={{ color: "var(--text)" }}>{ex.name}</p>
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg ${diff?.cls ?? "badge-intermediate"}`}>
                        {diff?.label ?? "Intermedio"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {MUSCLE_GROUPS.find((g) => g.value === ex.muscleGroup)?.label ?? ex.muscleGroup}
                    </p>
                    {ex.description && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-3)" }}>{ex.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <button
                        onClick={() => { setEditId(ex.id); setEditData({}); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => deleteEx(ex.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ml-auto"
                        style={{ color: "var(--destructive)", background: "var(--bg-hover)" }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-3)" }}>
          <p className="text-sm">Sin ejercicios en esta categoría.</p>
        </div>
      )}
    </div>
  );
}
