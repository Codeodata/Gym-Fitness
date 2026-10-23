export const dynamic = "force-dynamic";
import { MySchedule } from "@/components/client/my-schedule";

export default function MySchedulePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold uppercase" style={{ color: "var(--text)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          Mis turnos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Anotate a los turnos disponibles según tu plan
        </p>
      </div>
      <MySchedule />
    </div>
  );
}
