"use client";
import { useState } from "react";
import { Plus, Pencil, Check, X, ImageIcon, Trash2, Video, Play, Search } from "lucide-react";
import type { Exercise } from "@/lib/db/schema";
import { VideoModal } from "@/components/client/video-modal";

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
  const [newEx, setNewEx] = useState({ name: "", muscleGroup: "chest" as string, description: "", imageUrl: "", videoUrl: "", difficulty: "intermediate" });
  const [type, setType] = useState<"ejercicios" | "estiramientos">("ejercicios");
  const [filterGroup, setFilterGroup] = useState("all");
  const [q, setQ] = useState("");
  const [noVideoOnly, setNoVideoOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string; poster?: string } | null>(null);

  const isStretchMode = type === "estiramientos";
  const newLabel = isStretchMode ? "Nuevo estiramiento" : "Nuevo ejercicio";
  const singular = isStretchMode ? "estiramiento" : "ejercicio";
  const plural = isStretchMode ? "estiramientos" : "ejercicios";

  // Primero separo por tipo (ejercicios vs estiramientos) y después por grupo muscular.
  const byType = exercises.filter((e) => (isStretchMode ? e.isStretch : !e.isStretch));
  const term = q.trim().toLowerCase();
  const filtered = byType.filter((e) =>
    (filterGroup === "all" || e.muscleGroup === filterGroup) &&
    (!term || e.name.toLowerCase().includes(term)) &&
    (!noVideoOnly || !e.videoUrl));
  const noVideoCount = byType.filter((e) => !e.videoUrl).length;
  const countEjercicios = exercises.filter((e) => !e.isStretch).length;
  const countEstiramientos = exercises.filter((e) => e.isStretch).length;

  async function saveEdit(id: string) {
    setSaving(true);
    const patch: Record<string, unknown> = { ...editData };
    if ("imageUrl" in patch) patch.imageUrl = patch.imageUrl || null;
    if ("videoUrl" in patch) patch.videoUrl = patch.videoUrl || null;
    const res = await fetch(`/api/trainer/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const updated = await res.json() as ExerciseRow;
    // Actualizo en la lista única; si cambió de tipo, el toggle lo reubica solo.
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, ...updated } : e));
    setEditId(null);
    setEditData({});
    setSaving(false);
  }

  async function deleteEx(id: string) {
    if (!confirm(`¿Eliminar ${singular}? Los planes que lo usen pueden quedar inconsistentes.`)) return;
    await fetch(`/api/trainer/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  async function createEx() {
    if (!newEx.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/trainer/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEx, imageUrl: newEx.imageUrl || null, videoUrl: newEx.videoUrl || null, isStretch: isStretchMode }),
    });
    const created = await res.json() as ExerciseRow;
    setExercises((prev) => [...prev, created]);
    setNewEx({ name: "", muscleGroup: "chest", description: "", imageUrl: "", videoUrl: "", difficulty: "intermediate" });
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
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-extrabold" style={{ color: "var(--text)" }}>Ejercicios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Biblioteca de {plural}: video, descripción y dificultad.
          </p>
        </div>
        <div className="inline-flex p-1 rounded-xl" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
          {([
            { id: "ejercicios", label: "Ejercicios", n: countEjercicios },
            { id: "estiramientos", label: "Estiramientos", n: countEstiramientos },
          ] as const).map((t) => {
            const active = type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setType(t.id); setFilterGroup("all"); setShowNew(false); setNoVideoOnly(false); }}
                className="px-3.5 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-colors"
                style={{
                  background: active ? "var(--bg-hover)" : "transparent",
                  color: active ? "var(--text)" : "var(--text-3)",
                  touchAction: "manipulation",
                }}
              >
                {t.label} <span className="tabular-nums font-semibold" style={{ color: "var(--text-3)" }}>{t.n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Búsqueda + crear */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${singular}…`}
            className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 px-3.5 rounded-xl text-sm font-bold btn-accent cursor-pointer shrink-0"
          style={{ touchAction: "manipulation" }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{newLabel}</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Filtros: músculo (una fila deslizable) + sin video */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto flex-1 min-w-0 pb-0.5" style={{ scrollbarWidth: "none", maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)", WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)" }}>
          {[{ value: "all", label: "Todos" }, ...MUSCLE_GROUPS].map((g) => {
            const count = g.value === "all" ? byType.length : byType.filter((e) => e.muscleGroup === g.value).length;
            if (count === 0) return null;
            const sel = filterGroup === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setFilterGroup(g.value)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
                style={{
                  background: sel ? "var(--accent)" : "var(--bg-panel)",
                  color: sel ? "var(--accent-fg)" : "var(--text-3)",
                  border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                  touchAction: "manipulation",
                }}
              >
                {g.label} <span className="tabular-nums font-semibold" style={{ opacity: 0.75 }}>{count}</span>
              </button>
            );
          })}
        </div>
        {noVideoCount > 0 && (
          <button
            onClick={() => setNoVideoOnly((v) => !v)}
            className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
            style={{
              background: noVideoOnly ? "var(--bg-hover)" : "transparent",
              color: noVideoOnly ? "var(--text)" : "var(--text-3)",
              border: `1px solid ${noVideoOnly ? "var(--border-strong)" : "var(--border)"}`,
            }}
          >
            Sin video <span className="tabular-nums">{noVideoCount}</span>
          </button>
        )}
      </div>

      {/* New exercise form */}
      {showNew && (
        <div className="rounded-2xl p-5 mb-4 flex flex-col gap-3" style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)" }}>
          <h3 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--accent)" }}>{newLabel}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder={`Nombre del ${singular} *`} value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} style={inp()} />
            <select value={newEx.muscleGroup} onChange={(e) => setNewEx({ ...newEx, muscleGroup: e.target.value })} style={{ ...inp(), cursor: "pointer" }}>
              {MUSCLE_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            <select value={newEx.difficulty} onChange={(e) => setNewEx({ ...newEx, difficulty: e.target.value })} style={{ ...inp(), cursor: "pointer" }}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <input placeholder="URL de imagen (opcional)" value={newEx.imageUrl} onChange={(e) => setNewEx({ ...newEx, imageUrl: e.target.value })} style={inp()} />
            <input placeholder="URL de video (opcional)" value={newEx.videoUrl} onChange={(e) => setNewEx({ ...newEx, videoUrl: e.target.value })} style={{ ...inp(), gridColumn: "1 / -1" }} />
            <textarea placeholder="Descripción (opcional)" value={newEx.description} onChange={(e) => setNewEx({ ...newEx, description: e.target.value })} rows={2} style={{ ...inp(), resize: "vertical", gridColumn: "1 / -1" }} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
              Cancelar
            </button>
            <button onClick={createEx} disabled={saving || !newEx.name.trim()} className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer btn-accent">
              {saving ? "Guardando…" : isStretchMode ? "Crear estiramiento" : "Crear ejercicio"}
            </button>
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: filtered.length ? "1px solid var(--border)" : "none", background: "var(--bg-panel)" }}>
        {filtered.map((ex, idx) => {
          const isEditing = editId === ex.id;
          const diff = DIFFICULTIES.find((d) => d.value === (ex.difficulty ?? "intermediate"));
          return (
            <div key={ex.id} style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}>
              <div className="px-3.5 py-2.5">
                {isEditing ? (
                  <div className="grid sm:grid-cols-2 gap-2 py-1">
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
                    <div className="relative">
                      <Video className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: "var(--text-3)" }} />
                      <input
                        placeholder="URL de video"
                        value={editData.videoUrl ?? ex.videoUrl ?? ""}
                        onChange={(e) => setEditData({ ...editData, videoUrl: e.target.value || null })}
                        style={{ ...inp({ fontSize: "13px", padding: "6px 10px 6px 28px" }) }}
                      />
                    </div>
                    <textarea
                      className="sm:col-span-2"
                      placeholder="Descripción"
                      value={editData.description ?? ex.description ?? ""}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={2}
                      style={{ ...inp({ fontSize: "13px", padding: "6px 10px", resize: "none" }) }}
                    />
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: "var(--text-2)" }}>
                      <input
                        type="checkbox"
                        checked={editData.isStretch ?? ex.isStretch}
                        onChange={(e) => setEditData({ ...editData, isStretch: e.target.checked })}
                      />
                      Es estiramiento
                    </label>
                    <div className="sm:col-span-2 flex gap-2 pt-1">
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
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{ex.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-3)" }} title={ex.description ?? undefined}>
                        {MUSCLE_GROUPS.find((g) => g.value === ex.muscleGroup)?.label ?? ex.muscleGroup}
                        {ex.description ? ` · ${ex.description}` : ""}
                      </p>
                    </div>
                    <span className={`hidden sm:inline shrink-0 text-2xs font-bold px-1.5 py-0.5 rounded-md ${diff?.cls ?? "badge-intermediate"}`}>
                      {diff?.label ?? "Intermedio"}
                    </span>
                    {ex.videoUrl ? (
                      <button
                        onClick={() => setActiveVideo({ url: ex.videoUrl!, title: ex.name, poster: ex.imageUrl ?? undefined })}
                        title="Ver video" aria-label={`Ver video de ${ex.name}`}
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg cursor-pointer"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)", touchAction: "manipulation" }}
                      >
                        <Play className="h-3.5 w-3.5" fill="currentColor" />
                      </button>
                    ) : (
                      <span title="Sin video" aria-label="Sin video"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg"
                        style={{ border: "1px dashed var(--border-strong)", color: "var(--text-3)" }}>
                        <Video className="h-3.5 w-3.5" style={{ opacity: 0.6 }} />
                      </span>
                    )}
                    <button
                      onClick={() => { setEditId(ex.id); setEditData({}); }}
                      title="Editar" aria-label={`Editar ${ex.name}`}
                      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg cursor-pointer"
                      style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEx(ex.id)}
                      title="Eliminar" aria-label={`Eliminar ${ex.name}`}
                      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg cursor-pointer"
                      style={{ color: "var(--destructive)", background: "var(--bg-hover)" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: "var(--text-3)" }}>
          <p className="text-sm">Ningún {singular} coincide con la búsqueda o los filtros.</p>
        </div>
      )}

      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}
