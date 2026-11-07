import { redirect } from "next/navigation";

// Estiramientos ahora vive dentro de "Ejercicios" (selector). Redirige por compatibilidad.
export default function EstiramientosPage() {
  redirect("/biblioteca?tipo=estiramientos");
}
