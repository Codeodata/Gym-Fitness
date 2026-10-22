"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";

export function TrainerNotesEditor({
  assignmentId,
  initialNotes,
}: {
  assignmentId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/trainer/assign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, trainerNotes: value.trim() || null }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2 group">
        <p className="text-xs flex-1" style={{ color: "var(--text-3)" }}>
          {value || <span style={{ fontStyle: "italic" }}>Sin notas para este alumno</span>}
        </p>
        <button
          onClick={() => setEditing(true)}
          className="w-6 h-6 flex items-center justify-center rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
          title="Editar notas"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Notas para este alumno…"
        className="w-full text-xs rounded-xl px-3 py-2 resize-none"
        style={{
          background: "var(--bg-hover)",
          border: "1px solid var(--border-strong)",
          color: "var(--text)",
          outline: "none",
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Check className="h-3 w-3" />
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={() => { setValue(initialNotes ?? ""); setEditing(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
        >
          <X className="h-3 w-3" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
