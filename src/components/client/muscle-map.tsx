"use client";

const ACCENT = "#b5ff4d";
const DIM = "#232323";
const BODY = "#1a1a1a";
const STROKE = "#333";

const LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  arms: "Brazos", legs: "Piernas", core: "Core",
  cardio: "Cardio", full_body: "Cuerpo completo",
};

function FrontFigure({ active }: { active: string }) {
  const h = (g: string) => (active === g || (active === "full_body" && g !== "cardio")) ? ACCENT : DIM;
  return (
    <svg viewBox="0 0 80 175" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="11" r="9" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
      <rect x="36" y="19" width="8" height="7" rx="2" fill={BODY} stroke={STROKE} strokeWidth="1" />
      <ellipse cx="18" cy="32" rx="9" ry="6" fill={h("shoulders")} stroke={STROKE} strokeWidth="1" />
      <ellipse cx="62" cy="32" rx="9" ry="6" fill={h("shoulders")} stroke={STROKE} strokeWidth="1" />
      <rect x="24" y="25" width="32" height="28" rx="5" fill={h("chest")} stroke={STROKE} strokeWidth="1" />
      <rect x="27" y="53" width="26" height="22" rx="4" fill={h("core")} stroke={STROKE} strokeWidth="1" />
      <rect x="9" y="28" width="10" height="28" rx="5" fill={h("arms")} stroke={STROKE} strokeWidth="1" />
      <rect x="61" y="28" width="10" height="28" rx="5" fill={h("arms")} stroke={STROKE} strokeWidth="1" />
      <rect x="10" y="57" width="9" height="20" rx="4" fill={h("arms")} stroke={STROKE} strokeWidth="0.8" />
      <rect x="61" y="57" width="9" height="20" rx="4" fill={h("arms")} stroke={STROKE} strokeWidth="0.8" />
      <rect x="23" y="75" width="34" height="14" rx="4" fill={BODY} stroke={STROKE} strokeWidth="1" />
      <rect x="23" y="89" width="15" height="48" rx="7" fill={h("legs")} stroke={STROKE} strokeWidth="1" />
      <rect x="42" y="89" width="15" height="48" rx="7" fill={h("legs")} stroke={STROKE} strokeWidth="1" />
      <rect x="24" y="137" width="13" height="30" rx="6" fill={h("legs")} stroke={STROKE} strokeWidth="0.8" />
      <rect x="43" y="137" width="13" height="30" rx="6" fill={h("legs")} stroke={STROKE} strokeWidth="0.8" />
    </svg>
  );
}

function BackFigure({ active }: { active: string }) {
  const h = (g: string) => (active === g || active === "full_body") ? ACCENT : DIM;
  return (
    <svg viewBox="0 0 80 175" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="11" r="9" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
      <rect x="36" y="19" width="8" height="7" rx="2" fill={BODY} stroke={STROKE} strokeWidth="1" />
      <ellipse cx="18" cy="32" rx="9" ry="6" fill={h("shoulders")} stroke={STROKE} strokeWidth="1" />
      <ellipse cx="62" cy="32" rx="9" ry="6" fill={h("shoulders")} stroke={STROKE} strokeWidth="1" />
      <rect x="24" y="25" width="32" height="28" rx="5" fill={h("back")} stroke={STROKE} strokeWidth="1" />
      <rect x="27" y="53" width="26" height="22" rx="4" fill={active === "back" ? "#8fcc30" : DIM} stroke={STROKE} strokeWidth="1" />
      <rect x="9" y="28" width="10" height="28" rx="5" fill={h("arms")} stroke={STROKE} strokeWidth="1" />
      <rect x="61" y="28" width="10" height="28" rx="5" fill={h("arms")} stroke={STROKE} strokeWidth="1" />
      <rect x="10" y="57" width="9" height="20" rx="4" fill={h("arms")} stroke={STROKE} strokeWidth="0.8" />
      <rect x="61" y="57" width="9" height="20" rx="4" fill={h("arms")} stroke={STROKE} strokeWidth="0.8" />
      <rect x="23" y="75" width="34" height="16" rx="6" fill={h("legs")} stroke={STROKE} strokeWidth="1" />
      <rect x="23" y="91" width="15" height="46" rx="7" fill={h("legs")} stroke={STROKE} strokeWidth="1" />
      <rect x="42" y="91" width="15" height="46" rx="7" fill={h("legs")} stroke={STROKE} strokeWidth="1" />
      <rect x="24" y="137" width="13" height="30" rx="6" fill={h("legs")} stroke={STROKE} strokeWidth="0.8" />
      <rect x="43" y="137" width="13" height="30" rx="6" fill={h("legs")} stroke={STROKE} strokeWidth="0.8" />
    </svg>
  );
}

const BACK_GROUPS = new Set(["back"]);

export function MuscleMap({ muscleGroup }: { muscleGroup: string }) {
  const useBack = BACK_GROUPS.has(muscleGroup);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32">
        {useBack ? <BackFigure active={muscleGroup} /> : <FrontFigure active={muscleGroup} />}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
        {LABELS[muscleGroup] ?? muscleGroup}
      </span>
    </div>
  );
}
