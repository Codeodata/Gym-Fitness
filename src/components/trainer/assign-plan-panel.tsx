"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ClipboardList } from "lucide-react";
import type { Plan } from "@/lib/db/schema";

const DOW_LABELS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Props = {
  clientId: string;
  plans: Plan[];
  currentPlanId: string | null;
};

type PlanDayInfo = {
  id: string;
  dayNumber: number;
  name: string | null;
  dayOfWeek: number | null;
};

export function AssignPlanPanel({ clientId, plans, currentPlanId }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [planDays, setPlanDays] = useState<PlanDayInfo[]>([]);
  const [daySchedule, setDaySchedule] = useState<Record<string, number>>({}); // planDayId → dayOfWeek
  const [loadingDays, setLoadingDays] = useState(false);

  useEffect(() => {
    if (!selected) {
      setPlanDays([]);
      setDaySchedule({});
      return;
    }
    setLoadingDays(true);
    fetch(`/api/trainer/plans/${selected}`)
      .then((r) => r.json())
      .then((data) => {
        setPlanDays((data as { days?: PlanDayInfo[] }).days ?? []);
        setLoadingDays(false);
      })
      .catch(() => setLoadingDays(false));
  }, [selected]);

  async function assign() {
    if (!selected) return;
    setLoading(true);
    await fetch("/api/trainer/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        planId: selected,
        trainerNotes: notes || null,
        daySchedule:
          JSON.stringify(
            Object.entries(daySchedule)
              .filter(([, dow]) => dow > 0)
              .map(([planDayId, dayOfWeek]) => ({ planDayId, dayOfWeek }))
          ) || null,
      }),
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      router.refresh();
    }, 1500);
  }

  function toggleDayDow(planDayId: string, dow: number) {
    setDaySchedule((prev) => {
      if (prev[planDayId] === dow) {
        const next = { ...prev };
        delete next[planDayId];
        return next;
      }
      return { ...prev, [planDayId]: dow };
    });
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
        Asignar plan
      </h2>

      {plans.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          No hay planes creados.{" "}
          <a href="/trainer/plans/new" style={{ color: "var(--accent)" }}>
            Crear uno →
          </a>
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plans.map((p) => {
              const isCurrent = p.id === currentPlanId;
              const isSelected = p.id === selected;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(isSelected ? null : p.id)}
                  className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isSelected ? "var(--accent-soft)" : "var(--bg-hover)",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    touchAction: "manipulation",
                  }}
                >
                  <ClipboardList
                    className="h-4 w-4 mt-0.5 shrink-0"
                    style={{ color: isSelected ? "var(--accent)" : "var(--text-3)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: isSelected ? "var(--accent)" : "var(--text)" }}
                    >
                      {p.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {p.daysPerWeek}d/sem
                      {p.durationWeeks ? ` · ${p.durationWeeks} sem` : ""}
                    </p>
                    {isCurrent && (
                      <span className="text-xs font-bold" style={{ color: "var(--success)" }}>
                        ✓ Activo ahora
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex flex-col gap-3 pt-1">
              {/* Day schedule section */}
              {loadingDays ? (
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Cargando días…
                </p>
              ) : planDays.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                    Asignar días de la semana
                  </p>
                  {planDays.map((pd) => {
                    const selectedDow = daySchedule[pd.id];
                    return (
                      <div key={pd.id} className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold min-w-[80px]" style={{ color: "var(--text)" }}>
                          {pd.name ?? `Día ${pd.dayNumber}`}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {([1, 2, 3, 4, 5, 6] as const).map((dow) => {
                            const isActive = selectedDow === dow;
                            return (
                              <button
                                key={dow}
                                onClick={() => toggleDayDow(pd.id, dow)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                                style={{
                                  background: isActive ? "var(--accent)" : "var(--bg-hover)",
                                  color: isActive ? "var(--accent-fg)" : "var(--text-3)",
                                  border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                                  cursor: "pointer",
                                }}
                              >
                                {DOW_LABELS[dow]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <textarea
                placeholder="Nota para el alumno (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl text-sm resize-none"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  padding: "10px 14px",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <button
                onClick={assign}
                disabled={loading || success}
                className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: success
                    ? "var(--success)"
                    : loading
                    ? "var(--bg-hover)"
                    : "var(--accent)",
                  color: success ? "#fff" : loading ? "var(--text-3)" : "var(--accent-fg)",
                  cursor: loading ? "default" : "pointer",
                  touchAction: "manipulation",
                }}
              >
                {success ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> Plan asignado
                  </>
                ) : loading ? (
                  "Asignando…"
                ) : (
                  "Confirmar asignación"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
