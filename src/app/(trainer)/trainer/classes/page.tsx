import { ClassSchedule } from "@/components/trainer/class-schedule";

export default function ClassesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Turnos</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Asigná alumnos a cada turno semanal — hacé clic en cualquier turno para gestionar
        </p>
      </div>
      <ClassSchedule />
    </div>
  );
}
