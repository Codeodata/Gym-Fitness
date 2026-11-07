"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Pencil, Plus, Search, UserPlus, X } from "lucide-react";
import { dowsForFrequency } from "./weekly-schedule-builder";

type Gender = "chica" | "chico" | null;
type Frequency = "2dias" | "3dias" | "pase_libre" | null;

export type LibraryTemplate = {
  id: string;
  name: string;
  audience: string | null;
  frequency: string | null;
  days: { id: string; dayNumber: number; exerciseCount: number }[];
  exerciseCount: number;
  muscleGroups: string[];
};
type Client = { id: string; name: string; gender: Gender; membershipType: Frequency; hasRoutine: boolean };

const AUD: Record<string, { label: string; color: string }> = {
  chicas: { label: "Mujeres", color: "#f472b6" },
  chicos: { label: "Hombres", color: "#60a5fa" },
};
const FREQ_LABEL: Record<string, string> = { "2dias": "2 días", "3dias": "3 días", pase_libre: "Pase libre" };
const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros", arms: "Brazos",
  legs: "Piernas", core: "Core", cardio: "Cardio", full_body: "Cuerpo completo",
};
const MUSCLE_ORDER = Object.keys(MUSCLE_LABELS);

const GEN_CHIPS = [
  { id: "todas", label: "Todos" },
  { id: "chicas", label: "Mujeres" },
  { id: "chicos", label: "Hombres" },
] as const;
const FREQ_CHIPS = [
  { id: "todas", label: "Todas" },
  { id: "2dias", label: "2 días" },
  { id: "3dias", label: "3 días" },
  { id: "pase_libre", label: "Pase libre" },
] as const;

const clientAudience = (g: Gender) => (g === "chica" ? "chicas" : g === "chico" ? "chicos" : null);

export function TemplateLibrary({ templates, clients }: { templates: LibraryTemplate[]; clients: Client[] }) {
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<(typeof GEN_CHIPS)[number]["id"]>("todas");
  const [freq, setFreq] = useState<(typeof FREQ_CHIPS)[number]["id"]>("todas");
  const [muscle, setMuscle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const musclesPresent = useMemo(
    () => MUSCLE_ORDER.filter((m) => templates.some((t) => t.muscleGroups.includes(m))),
    [templates],
  );

  const term = q.trim().toLowerCase();
  const visible = templates.filter(
    (t) =>
      (!term || t.name.toLowerCase().includes(term)) &&
      (gender === "todas" || t.audience === gender) &&
      (freq === "todas" || t.frequency === freq) &&
      (!muscle || t.muscleGroups.includes(muscle)),
  );
  const filtered = !!term || gender !== "todas" || freq !== "todas" || !!muscle;

  if (templates.length === 0) {
    return (
      <div className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 text-xs font-bold" style={{ color: "var(--text-3)" }}>
          <Step n={1} label="Creá una plantilla" active />
          <span>→</span>
          <Step n={2} label="Asignala a alumnos" />
        </div>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Todavía no tenés plantillas. Empezá por armar una: después la copiás a la semana de cada alumno en un clic.
        </p>
        <Link href="/trainer/plans/new" className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
          <Plus className="h-4 w-4" /> Crear primera plantilla
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {toast && (
        <div className="toast-in fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--accent)", color: "var(--text)" }}>
          {toast}
        </div>
      )}

      {/* Búsqueda + crear */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar plantilla…"
            className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
        </div>
        <Link href="/trainer/plans/new"
          className="btn-accent flex items-center gap-1.5 px-3.5 rounded-xl text-sm font-bold shrink-0"
          style={{ touchAction: "manipulation" }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva plantilla</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      {/* Filtros compactos */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ChipGroup options={GEN_CHIPS} value={gender} onChange={setGender} />
        <ChipGroup options={FREQ_CHIPS} value={freq} onChange={setFreq} />
        {musclesPresent.length > 0 && (
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} aria-label="Filtrar por músculo"
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer"
            style={{ background: "var(--bg-panel)", border: `1px solid ${muscle ? "var(--accent)" : "var(--border)"}`, color: muscle ? "var(--text)" : "var(--text-3)" }}>
            <option value="">Todos los músculos</option>
            {musclesPresent.map((m) => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
          </select>
        )}
        {filtered && (
          <button type="button" onClick={() => { setQ(""); setGender("todas"); setFreq("todas"); setMuscle(""); }}
            className="text-xs font-bold cursor-pointer underline-offset-2 hover:underline" style={{ color: "var(--text-3)" }}>
            Limpiar
          </button>
        )}
        <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--text-3)" }}>
          {visible.length} de {templates.length}
        </span>
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
        {visible.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>Ninguna plantilla coincide con los filtros.</p>
        )}
        {visible.map((t, i) => {
          const aud = t.audience ? AUD[t.audience] : null;
          const open = openId === t.id;
          const empty = t.exerciseCount === 0;
          return (
            <div key={t.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <div className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" title={aud?.label}
                  style={{ background: aud?.color ?? "var(--border-strong)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{t.name}</p>
                  <p className="text-xs tabular-nums" style={{ color: empty ? "#f59e0b" : "var(--text-3)" }}>
                    {[t.frequency === "pase_libre" ? "Pase libre" : null, `${t.days.length} día${t.days.length !== 1 ? "s" : ""}`,
                      empty ? "sin ejercicios" : `${t.exerciseCount} ej.`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Link href={`/trainer/plans/${t.id}`} title="Editar plantilla" aria-label={`Editar ${t.name}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                  style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button type="button" disabled={empty} onClick={() => setOpenId(open ? null : t.id)}
                  className={`${open ? "" : "btn-accent"} flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-extrabold shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={open ? { background: "var(--bg-hover)", color: "var(--text-2)", touchAction: "manipulation" } : { touchAction: "manipulation" }}>
                  {open ? <X className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {open ? "Cerrar" : "Asignar"}
                </button>
              </div>
              {open && (
                <AssignToClients template={t} clients={clients}
                  onDone={(n) => { setOpenId(null); setToast(`"${t.name}" asignada a ${n} alumno${n !== 1 ? "s" : ""}`); }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Asignar una plantilla a varios alumnos ─────────────────────────────── */

function AssignToClients({ template, clients, onDone }: {
  template: LibraryTemplate;
  clients: Client[];
  onDone: (n: number) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coincide = mismo género y misma frecuencia que la plantilla (si la plantilla los define).
  const matches = (c: Client) =>
    (!template.audience || clientAudience(c.gender) === template.audience) &&
    (!template.frequency || c.membershipType === template.frequency);

  const term = q.trim().toLowerCase();
  const pool = clients.filter((c) => !term || c.name.toLowerCase().includes(term));
  const suggested = pool.filter(matches);
  const rest = pool.filter((c) => !matches(c));
  // Si busca por nombre, mostrar todo; si no, el resto queda plegado.
  const list = term || showAll || suggested.length === 0 ? [...suggested, ...rest] : suggested;

  const toggle = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const replacing = clients.filter((c) => selected.has(c.id) && c.hasRoutine).length;

  async function assign() {
    const targets = clients.filter((c) => selected.has(c.id));
    if (targets.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const results = await Promise.all(targets.map((c) => {
        const dows = dowsForFrequency(c.membershipType);
        const dayMap = template.days.slice(0, dows.length).map((d, i) => ({ planDayId: d.id, dayOfWeek: dows[i]! }));
        return fetch("/api/trainer/assign-template", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: c.id, dayMap, replace: true }),
        }).then((r) => r.ok);
      }));
      const ok = results.filter(Boolean).length;
      if (ok < targets.length) setError(`No se pudo asignar a ${targets.length - ok} alumno(s). Probá de nuevo.`);
      if (ok > 0) { router.refresh(); if (ok === targets.length) onDone(ok); }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reveal-down px-3.5 pb-3.5 pt-1 flex flex-col gap-2" style={{ background: "var(--bg)" }}>
      <div className="relative mt-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--text-3)" }} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alumno…"
          className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
          style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }} />
      </div>

      {!term && suggested.length > 0 && (
        <p className="text-2xs font-extrabold uppercase tracking-widest px-0.5" style={{ color: "var(--text-3)" }}>
          Sugeridos · mismo género y frecuencia
        </p>
      )}

      <div className="flex flex-col max-h-72 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border)", background: "var(--bg-panel)" }}>
        {list.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>No hay alumnos con ese nombre.</p>
        )}
        {list.map((c, i) => {
          const checked = selected.has(c.id);
          return (
            <button key={c.id} type="button" onClick={() => toggle(c.id)}
              className="flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", touchAction: "manipulation" }}>
              <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={{ background: checked ? "var(--accent)" : "var(--bg-hover)", border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}` }}>
                {checked && <Check className="h-3 w-3" style={{ color: "var(--accent-fg)" }} />}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{c.name}</span>
              {c.membershipType && (
                <span className="text-2xs shrink-0" style={{ color: "var(--text-3)" }}>{FREQ_LABEL[c.membershipType]}</span>
              )}
              {c.hasRoutine && (
                <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>con rutina</span>
              )}
            </button>
          );
        })}
      </div>

      {!term && !showAll && suggested.length > 0 && rest.length > 0 && (
        <button type="button" onClick={() => setShowAll(true)}
          className="flex items-center justify-center gap-1 text-xs font-bold py-1 cursor-pointer" style={{ color: "var(--text-3)" }}>
          <ChevronDown className="h-3.5 w-3.5" /> Ver otros alumnos ({rest.length})
        </button>
      )}

      {replacing > 0 && (
        <p className="text-xs" style={{ color: "#f59e0b" }}>
          {replacing} alumno{replacing !== 1 ? "s" : ""} ya tiene{replacing !== 1 ? "n" : ""} rutina: se reemplazan los días que cubre la plantilla.
        </p>
      )}
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}

      <button type="button" onClick={assign} disabled={selected.size === 0 || busy}
        className="btn-accent h-10 rounded-lg text-sm font-extrabold cursor-pointer disabled:opacity-40"
        style={{ touchAction: "manipulation" }}>
        {busy ? "Asignando…" : selected.size === 0 ? "Elegí alumnos" : `Asignar a ${selected.size} alumno${selected.size !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

function ChipGroup<T extends string>({ options, value, onChange }: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg p-0.5" style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}>
      {options.map((o) => {
        const sel = value === o.id;
        return (
          <button key={o.id} type="button" onClick={() => onChange(o.id)}
            className="px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
            style={{ background: sel ? "var(--bg-hover)" : "transparent", color: sel ? "var(--text)" : "var(--text-3)", touchAction: "manipulation" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Step({ n, label, active = false }: { n: number; label: string; active?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-extrabold"
        style={{ background: active ? "var(--accent)" : "var(--bg-hover)", color: active ? "var(--accent-fg)" : "var(--text-3)" }}>{n}</span>
      {label}
    </span>
  );
}
