import { redirect } from "next/navigation";

// Estiramientos ahora vive dentro de "Ejercicios" (toggle). Redirige por compatibilidad.
export default function StretchesPage() {
  redirect("/trainer/exercises");
}
