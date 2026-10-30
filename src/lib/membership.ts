// Estado de la membresía / renovación de plan, compartido entre la vista del
// profe (ficha del alumno) y la del alumno (panel). El aviso se calcula solo a
// partir de la fecha de renovación: cuando faltan ≤5 días se enciende, y cuando
// vence pasa a "Renová tu membresía" (sin bloquear el acceso).

export type MembershipState = "none" | "ok" | "soon" | "due" | "overdue";

export type MembershipStatus = {
  state: MembershipState;
  daysLeft: number | null; // días hasta la renovación (negativo = vencida). null si no hay fecha.
  /** true cuando hay que mostrar el aviso (faltan ≤5 días o ya venció). */
  alert: boolean;
  /** Etiqueta corta para el profe (badge en la ficha). */
  trainerLabel: string;
  /** Mensaje para el alumno (banner + aviso). "" si no corresponde avisar. */
  clientMessage: string;
};

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function plural(n: number): string {
  return n !== 1 ? "s" : "";
}

export function getMembershipStatus(
  renewsAt: Date | string | null | undefined,
  now: Date = new Date(),
): MembershipStatus {
  if (!renewsAt) {
    return { state: "none", daysLeft: null, alert: false, trainerLabel: "Sin fecha de renovación", clientMessage: "" };
  }
  const daysLeft = Math.round((startOfDay(new Date(renewsAt)).getTime() - startOfDay(now).getTime()) / DAY_MS);

  if (daysLeft < 0) {
    const n = Math.abs(daysLeft);
    return {
      state: "overdue",
      daysLeft,
      alert: true,
      trainerLabel: `Vencida hace ${n} día${plural(n)}`,
      clientMessage: "Tu membresía venció. Renová tu plan para seguir entrenando.",
    };
  }
  if (daysLeft === 0) {
    return {
      state: "due",
      daysLeft,
      alert: true,
      trainerLabel: "Vence hoy",
      clientMessage: "Tu plan vence hoy. Acordate de renovar tu membresía.",
    };
  }
  if (daysLeft <= 5) {
    return {
      state: "soon",
      daysLeft,
      alert: true,
      trainerLabel: `Renueva en ${daysLeft} día${plural(daysLeft)}`,
      clientMessage: `Tu plan vence en ${daysLeft} día${plural(daysLeft)}. Coordiná la renovación con tu profe.`,
    };
  }
  return {
    state: "ok",
    daysLeft,
    alert: false,
    trainerLabel: `Renueva en ${daysLeft} días`,
    clientMessage: "",
  };
}
