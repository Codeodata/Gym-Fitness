"use client";

type Props = {
  year: number;
  month: number; // 1-12
  activeDays: number[]; // day numbers with activity
};

const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export function WorkoutCalendar({ year, month, activeDays }: Props) {
  const activeSet = new Set(activeDays);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday-first offset (0=Mon…6=Sun)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : -1;

  const monthName = firstDay.toLocaleDateString("es-AR", { month: "long" });

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
        {monthName} {year}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold pb-1" style={{ color: "var(--text-3)" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isActive = activeSet.has(day);
          const isToday = day === todayDay;
          return (
            <div
              key={day}
              className="aspect-square rounded-lg flex items-center justify-center relative text-xs font-bold"
              style={{
                background: isActive ? "var(--accent-soft)" : isToday ? "var(--bg-hover)" : "transparent",
                color: isActive ? "var(--accent)" : isToday ? "var(--text)" : "var(--text-3)",
                border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
              }}
            >
              {day}
              {isActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
