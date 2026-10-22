"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  Search,
  Flame,
  Dumbbell,
} from "lucide-react";

const DOW_FULL = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type ExerciseItem = {
  id: string;
  planDayId: string;
  section: "warmup" | "main";
  sets: number;
  reps: string;
  weightKg: string | null;
  notes: string | null;
  exerciseName: string;
  muscleGroup: string;
  orderIndex: number;
};

type DayItem = {
  id: string;
  dayNumber: number;
  name: string | null;
  dayOfWeek: number | null;
  exercises: ExerciseItem[];
};

type ExerciseCatalogItem = {
  id: string;
  name: string;
  muscleGroup: string;
};

type Props = {
  planId: string;
  initialName: string;
  initialDays: DayItem[];
};

export function PlanEditorClient({ planId, initialName, initialDays }: Props) {
  const [planName, setPlanName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const [days, setDays] = useState<DayItem[]>(initialDays);

  // Catalog of exercises for search
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Per-day add panel state
  const [addingToDayId, setAddingToDayId] = useState<string | null>(null);
  const [addSection, setAddSection] = useState<"main" | "warmup">("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);

  // Load catalog once
  useEffect(() => {
    if (catalogLoaded) return;
    fetch("/api/trainer/exercises")
      .then((r) => r.json())
      .then((data: ExerciseCatalogItem[]) => {
        setCatalog(data);
        setCatalogLoaded(true);
      })
      .catch(() => setCatalogLoaded(true));
  }, [catalogLoaded]);

  const openAddPanel = useCallback(
    (dayId: string) => {
      setAddingToDayId(dayId);
      setAddSection("main");
      setSearchQuery("");
      if (!catalogLoaded) {
        fetch("/api/trainer/exercises")
          .then((r) => r.json())
          .then((data: ExerciseCatalogItem[]) => {
            setCatalog(data);
            setCatalogLoaded(true);
          })
          .catch(() => setCatalogLoaded(true));
      }
    },
    [catalogLoaded]
  );

  // ── Rename plan ────────────────────────────────────────────────
  function startEditName() {
    setNameInput(planName);
    setEditingName(true);
  }

  async function saveName() {
    if (!nameInput.trim() || nameInput === planName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/trainer/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (res.ok) {
        setPlanName(nameInput.trim());
      }
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }

  function cancelEditName() {
    setEditingName(false);
    setNameInput(planName);
  }

  // ── Remove exercise ────────────────────────────────────────────
  async function removeExercise(planExerciseId: string, dayId: string) {
    // Optimistic removal
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.filter((e) => e.id !== planExerciseId) }
          : d
      )
    );
    try {
      await fetch(`/api/trainer/plans/${planId}/exercises`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planExerciseId }),
      });
    } catch {
      // On error, we could restore but for simplicity we leave it removed
    }
  }

  // ── Add exercise ───────────────────────────────────────────────
  async function addExercise(item: ExerciseCatalogItem) {
    if (!addingToDayId || addingExercise) return;
    setAddingExercise(true);
    try {
      const defaultSets = addSection === "main" ? 3 : 1;
      const res = await fetch(`/api/trainer/plans/${planId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planDayId: addingToDayId,
          exerciseName: item.name,
          section: addSection,
          sets: defaultSets,
          reps: "10",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { exercise: ExerciseItem };
        setDays((prev) =>
          prev.map((d) =>
            d.id === addingToDayId
              ? { ...d, exercises: [...d.exercises, data.exercise] }
              : d
          )
        );
        setAddingToDayId(null);
      }
    } finally {
      setAddingExercise(false);
    }
  }

  // ── Filtered catalog ───────────────────────────────────────────
  const filteredCatalog = searchQuery.trim()
    ? catalog.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : catalog.slice(0, 20);

  return (
    <div className="flex flex-col gap-4">
      {/* Rename heading */}
      <div className="group flex items-center gap-2 mb-2">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") cancelEditName();
              }}
              className="text-xl font-extrabold flex-1 bg-transparent outline-none"
              style={{
                color: "var(--text)",
                fontFamily: "'Barlow Condensed', sans-serif",
                borderBottom: "2px solid var(--accent)",
                paddingBottom: "2px",
              }}
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="p-1.5 rounded-lg"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEditName}
              className="p-1.5 rounded-lg"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <h2
              className="text-xl font-extrabold"
              style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {planName}
            </h2>
            <button
              onClick={startEditName}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Day cards */}
      {days.map((day) => {
        const warmup = day.exercises
          .filter((e) => e.section === "warmup")
          .sort((a, b) => a.orderIndex - b.orderIndex);
        const main = day.exercises
          .filter((e) => e.section === "main")
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const dow = day.dayOfWeek ?? null;
        const dayLabel = dow
          ? `${DOW_FULL[dow]} — ${day.name ?? `Día ${day.dayNumber}`}`
          : day.name ?? `Día ${day.dayNumber}`;

        const isAddingHere = addingToDayId === day.id;

        return (
          <div
            key={day.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            {/* Day header */}
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-hover)" }}
            >
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                D{day.dayNumber}
              </span>
              <span
                className="font-extrabold text-sm"
                style={{ color: "var(--text)" }}
              >
                {dayLabel}
              </span>
              <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>
                {day.exercises.length} ejercicio{day.exercises.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Warmup section */}
              {warmup.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Flame className="h-3.5 w-3.5" style={{ color: "var(--c-orange)" }} />
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: "var(--c-orange)" }}
                    >
                      Entrada en calor
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {warmup.map((ex) => (
                      <ExerciseRowEditable
                        key={ex.id}
                        ex={ex}
                        accent="var(--c-orange)"
                        onRemove={() => removeExercise(ex.id, day.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Main section */}
              {main.length > 0 && (
                <div>
                  {warmup.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Dumbbell className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{ color: "var(--accent)" }}
                      >
                        Trabajo principal
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {main.map((ex) => (
                      <ExerciseRowEditable
                        key={ex.id}
                        ex={ex}
                        accent="var(--accent)"
                        onRemove={() => removeExercise(ex.id, day.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add exercise panel or button */}
              {isAddingHere ? (
                <div
                  className="rounded-xl p-3 flex flex-col gap-3 mt-1"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-hover)" }}
                >
                  {/* Section toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddSection("main")}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: addSection === "main" ? "var(--accent)" : "var(--bg-panel)",
                        color: addSection === "main" ? "var(--accent-fg)" : "var(--text-3)",
                        border: `1px solid ${addSection === "main" ? "var(--accent)" : "var(--border)"}`,
                      }}
                    >
                      <Dumbbell className="h-3 w-3 inline mr-1" />
                      Ejercicio
                    </button>
                    <button
                      onClick={() => setAddSection("warmup")}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        background: addSection === "warmup" ? "var(--c-orange)" : "var(--bg-panel)",
                        color: addSection === "warmup" ? "#fff" : "var(--text-3)",
                        border: `1px solid ${addSection === "warmup" ? "var(--c-orange)" : "var(--border)"}`,
                      }}
                    >
                      <Flame className="h-3 w-3 inline mr-1" />
                      Calentamiento
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                      style={{ color: "var(--text-3)" }}
                    />
                    <input
                      autoFocus
                      placeholder="Buscar ejercicio…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                      style={{
                        background: "var(--bg-panel)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                    />
                  </div>

                  {/* Results */}
                  <div
                    className="flex flex-col gap-1 max-h-48 overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {filteredCatalog.length === 0 && (
                      <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>
                        {catalogLoaded ? "Sin resultados" : "Cargando…"}
                      </p>
                    )}
                    {filteredCatalog.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addExercise(item)}
                        disabled={addingExercise}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-semibold transition-colors"
                        style={{
                          background: "var(--bg-panel)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        <span className="flex-1 truncate">{item.name}</span>
                        <span
                          className="text-[10px] font-bold uppercase"
                          style={{ color: "var(--text-3)" }}
                        >
                          {item.muscleGroup}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setAddingToDayId(null)}
                    className="text-xs text-center"
                    style={{ color: "var(--text-3)" }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAddPanel(day.id)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mt-1"
                  style={{
                    border: "1.5px dashed var(--border)",
                    color: "var(--text-3)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-3)";
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar ejercicio
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExerciseRowEditable({
  ex,
  accent,
  onRemove,
}: {
  ex: ExerciseItem;
  accent: string;
  onRemove: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
    >
      <span
        className="flex-1 text-sm font-semibold truncate"
        style={{ color: "var(--text)" }}
      >
        {ex.exerciseName}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>
          {ex.sets}×{ex.reps}
        </span>
        {ex.weightKg && (
          <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
            {ex.weightKg} kg
          </span>
        )}
      </div>
      {ex.notes && (
        <span
          className="text-xs truncate max-w-[100px] hidden sm:block"
          style={{ color: "var(--text-3)" }}
        >
          {ex.notes}
        </span>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shrink-0"
        style={{ color: "var(--text-3)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger, #ef4444)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
