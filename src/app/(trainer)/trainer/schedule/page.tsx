import { redirect } from "next/navigation";

// Asistencias ahora vive dentro de "Turnos" (toggle). Redirige por compatibilidad.
export default function SchedulePage() {
  redirect("/trainer/classes");
}
