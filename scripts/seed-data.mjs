import pg from "pg";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

const envLocal = readFileSync(".env.local", "utf8");
const dbUrl = envLocal.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const parsed = new URL(dbUrl);
parsed.searchParams.delete("sslmode");

const pool = new pg.Pool({ connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } });

// ─── Ejercicios ───────────────────────────────────────────────────────────────

const exercises = [
  // Pecho
  { name: "Press de Banca", description: "Ejercicio básico de pecho con barra", muscleGroup: "chest", difficulty: "intermediate" },
  { name: "Press Inclinado con Mancuernas", description: "Press inclinado para la parte alta del pecho", muscleGroup: "chest", difficulty: "intermediate" },
  { name: "Aperturas con Mancuernas", description: "Aperturas en banco plano para pecho", muscleGroup: "chest", difficulty: "beginner" },
  { name: "Fondos en Paralelas", description: "Ejercicio de peso corporal para pecho y tríceps", muscleGroup: "chest", difficulty: "intermediate" },
  { name: "Press con Mancuernas Plano", description: "Press de pecho con mancuernas en banco plano", muscleGroup: "chest", difficulty: "beginner" },
  // Espalda
  { name: "Dominadas", description: "Ejercicio de peso corporal para espalda ancha", muscleGroup: "back", difficulty: "intermediate" },
  { name: "Remo con Barra", description: "Remo inclinado con barra para espalda media", muscleGroup: "back", difficulty: "intermediate" },
  { name: "Jalón al Pecho", description: "Jalón en polea alta para dorsal", muscleGroup: "back", difficulty: "beginner" },
  { name: "Remo en Polea Baja", description: "Remo en cable para espalda media y baja", muscleGroup: "back", difficulty: "beginner" },
  { name: "Remo con Mancuerna", description: "Remo unilateral para espalda y core", muscleGroup: "back", difficulty: "beginner" },
  // Hombros
  { name: "Press Militar con Barra", description: "Press de hombros con barra sobre la cabeza", muscleGroup: "shoulders", difficulty: "intermediate" },
  { name: "Elevaciones Laterales", description: "Elevaciones laterales con mancuernas para deltoides medio", muscleGroup: "shoulders", difficulty: "beginner" },
  { name: "Press Arnold", description: "Press con rotación para hombros completos", muscleGroup: "shoulders", difficulty: "intermediate" },
  { name: "Pájaro con Mancuernas", description: "Elevaciones posteriores para deltoides trasero", muscleGroup: "shoulders", difficulty: "beginner" },
  { name: "Elevaciones Frontales", description: "Elevaciones frontales con mancuernas", muscleGroup: "shoulders", difficulty: "beginner" },
  // Brazos
  { name: "Curl con Barra", description: "Curl de bíceps con barra", muscleGroup: "arms", difficulty: "beginner" },
  { name: "Curl Martillo", description: "Curl neutro para bíceps y braquiorradial", muscleGroup: "arms", difficulty: "beginner" },
  { name: "Tríceps en Polea Alta", description: "Extensión de tríceps en cable con cuerda", muscleGroup: "arms", difficulty: "beginner" },
  { name: "Tríceps Francés", description: "Extensión de tríceps sobre la cabeza con mancuerna", muscleGroup: "arms", difficulty: "intermediate" },
  { name: "Curl en Polea", description: "Curl de bíceps en cable para tensión constante", muscleGroup: "arms", difficulty: "beginner" },
  // Piernas
  { name: "Sentadilla con Barra", description: "Sentadilla libre con barra, ejercicio básico de piernas", muscleGroup: "legs", difficulty: "intermediate" },
  { name: "Prensa de Piernas", description: "Prensa en máquina para cuádriceps y glúteos", muscleGroup: "legs", difficulty: "beginner" },
  { name: "Extensiones de Cuádriceps", description: "Extensiones en máquina para cuádriceps", muscleGroup: "legs", difficulty: "beginner" },
  { name: "Curl Femoral", description: "Curl en máquina para isquiotibiales", muscleGroup: "legs", difficulty: "beginner" },
  { name: "Peso Muerto Rumano", description: "Peso muerto con rodillas semiflexionadas para isquios y glúteos", muscleGroup: "legs", difficulty: "intermediate" },
  { name: "Sentadilla Búlgara", description: "Sentadilla unilateral con pie elevado", muscleGroup: "legs", difficulty: "advanced" },
  { name: "Hip Thrust", description: "Empuje de cadera para glúteos con barra", muscleGroup: "legs", difficulty: "intermediate" },
  { name: "Zancadas con Mancuernas", description: "Estocadas caminando con mancuernas", muscleGroup: "legs", difficulty: "beginner" },
  // Core
  { name: "Plancha Abdominal", description: "Plancha isométrica para core", muscleGroup: "core", difficulty: "beginner" },
  { name: "Crunch Abdominal", description: "Crunch básico para abdominales superiores", muscleGroup: "core", difficulty: "beginner" },
  { name: "Rodillas al Pecho", description: "Elevación de rodillas colgado en barra", muscleGroup: "core", difficulty: "intermediate" },
  { name: "Russian Twist", description: "Rotación de tronco para oblicuos", muscleGroup: "core", difficulty: "beginner" },
  // Cardio / Calentamiento
  { name: "Saltos de Tijera", description: "Jumping jacks para activación cardiovascular", muscleGroup: "cardio", difficulty: "beginner" },
  { name: "Burpees", description: "Ejercicio completo de alta intensidad", muscleGroup: "full_body", difficulty: "advanced" },
  { name: "Sentadilla Aire", description: "Sentadilla libre sin peso para movilidad", muscleGroup: "legs", difficulty: "beginner" },
  { name: "Rotación de Hombros", description: "Movilización de hombros en círculos", muscleGroup: "shoulders", difficulty: "beginner" },
  { name: "Movilización de Cadera", description: "Círculos de cadera para articulación", muscleGroup: "legs", difficulty: "beginner" },
  { name: "Estiramiento de Isquiotibiales", description: "Estiramiento dinámico de isquios", muscleGroup: "legs", difficulty: "beginner" },
  { name: "Marcha en el Lugar", description: "Marcha elevando rodillas para activar", muscleGroup: "cardio", difficulty: "beginner" },
  { name: "Sentadilla con Salto", description: "Jump squat para explosividad", muscleGroup: "legs", difficulty: "intermediate" },
  { name: "Plancha con Rotación", description: "Plancha dinámica con giro de cadera", muscleGroup: "core", difficulty: "intermediate" },
];

console.log("Insertando ejercicios...");
const exIds = {};
for (const ex of exercises) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO "exercise" (id, name, description, muscle_group, difficulty, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT DO NOTHING`,
    [id, ex.name, ex.description, ex.muscleGroup, ex.difficulty]
  );
  const { rows } = await pool.query(`SELECT id FROM "exercise" WHERE name = $1`, [ex.name]);
  exIds[ex.name] = rows[0].id;
}
console.log(`✓ ${exercises.length} ejercicios`);

// ─── Helper ────────────────────────────────────────────────────────────────────

async function createPlan({ name, description, category, daysPerWeek, durationWeeks, days }) {
  const planId = randomUUID();
  await pool.query(
    `INSERT INTO "plan" (id, name, description, category, days_per_week, duration_weeks, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [planId, name, description, category, daysPerWeek, durationWeeks ?? null]
  );
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dayId = randomUUID();
    await pool.query(
      `INSERT INTO "plan_day" (id, plan_id, day_number, name, day_of_week) VALUES ($1, $2, $3, $4, $5)`,
      [dayId, planId, i + 1, day.name, day.dayOfWeek ?? null]
    );
    for (let j = 0; j < day.exercises.length; j++) {
      const ex = day.exercises[j];
      await pool.query(
        `INSERT INTO "plan_exercise" (id, plan_day_id, exercise_id, section, order_index, sets, reps, rest_seconds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [randomUUID(), dayId, exIds[ex.name], ex.section ?? "main", j, ex.sets ?? 3, ex.reps ?? "10", ex.rest ?? 90]
      );
    }
  }
  console.log(`  ✓ "${name}"`);
}

// ─── Planes de Musculación ────────────────────────────────────────────────────

console.log("\nPlanes de musculación:");

await createPlan({
  name: "Full Body Principiantes",
  description: "Plan de cuerpo completo 3 días por semana, ideal para comenzar en el gimnasio",
  category: "musculación", daysPerWeek: 3, durationWeeks: 8,
  days: [
    { name: "Día A - Cuerpo Completo", dayOfWeek: 1, exercises: [
      { name: "Sentadilla con Barra", sets: 3, reps: "10" },
      { name: "Press de Banca", sets: 3, reps: "10" },
      { name: "Remo con Mancuerna", sets: 3, reps: "10" },
      { name: "Press Militar con Barra", sets: 3, reps: "10" },
      { name: "Curl con Barra", sets: 3, reps: "12", rest: 60 },
      { name: "Tríceps en Polea Alta", sets: 3, reps: "12", rest: 60 },
      { name: "Plancha Abdominal", sets: 3, reps: "30s", rest: 60 },
    ]},
    { name: "Día B - Cuerpo Completo", dayOfWeek: 3, exercises: [
      { name: "Prensa de Piernas", sets: 3, reps: "12" },
      { name: "Press con Mancuernas Plano", sets: 3, reps: "10" },
      { name: "Jalón al Pecho", sets: 3, reps: "10" },
      { name: "Elevaciones Laterales", sets: 3, reps: "12", rest: 60 },
      { name: "Curl Martillo", sets: 3, reps: "12", rest: 60 },
      { name: "Crunch Abdominal", sets: 3, reps: "15", rest: 60 },
    ]},
    { name: "Día C - Cuerpo Completo", dayOfWeek: 5, exercises: [
      { name: "Zancadas con Mancuernas", sets: 3, reps: "10" },
      { name: "Press Inclinado con Mancuernas", sets: 3, reps: "10" },
      { name: "Remo en Polea Baja", sets: 3, reps: "10" },
      { name: "Press Arnold", sets: 3, reps: "10" },
      { name: "Tríceps Francés", sets: 3, reps: "12", rest: 60 },
      { name: "Russian Twist", sets: 3, reps: "20", rest: 60 },
    ]},
  ],
});

await createPlan({
  name: "Torso - Pierna",
  description: "División torso-pierna de 4 días, excelente para ganar masa muscular",
  category: "musculación", daysPerWeek: 4, durationWeeks: 10,
  days: [
    { name: "Torso A", dayOfWeek: 1, exercises: [
      { name: "Press de Banca", sets: 4, reps: "8-10", rest: 120 },
      { name: "Remo con Barra", sets: 4, reps: "8-10", rest: 120 },
      { name: "Press Inclinado con Mancuernas", sets: 3, reps: "10-12" },
      { name: "Jalón al Pecho", sets: 3, reps: "10-12" },
      { name: "Press Militar con Barra", sets: 3, reps: "10" },
      { name: "Curl con Barra", sets: 3, reps: "12", rest: 60 },
      { name: "Tríceps en Polea Alta", sets: 3, reps: "12", rest: 60 },
    ]},
    { name: "Pierna A", dayOfWeek: 2, exercises: [
      { name: "Sentadilla con Barra", sets: 4, reps: "8-10", rest: 120 },
      { name: "Prensa de Piernas", sets: 3, reps: "12" },
      { name: "Extensiones de Cuádriceps", sets: 3, reps: "12-15" },
      { name: "Curl Femoral", sets: 3, reps: "12" },
      { name: "Hip Thrust", sets: 3, reps: "12" },
      { name: "Plancha Abdominal", sets: 3, reps: "40s", rest: 60 },
    ]},
    { name: "Torso B", dayOfWeek: 4, exercises: [
      { name: "Press con Mancuernas Plano", sets: 4, reps: "10-12" },
      { name: "Dominadas", sets: 4, reps: "6-8", rest: 120 },
      { name: "Aperturas con Mancuernas", sets: 3, reps: "12-15" },
      { name: "Remo en Polea Baja", sets: 3, reps: "12" },
      { name: "Elevaciones Laterales", sets: 3, reps: "15", rest: 60 },
      { name: "Curl Martillo", sets: 3, reps: "12", rest: 60 },
      { name: "Fondos en Paralelas", sets: 3, reps: "10" },
    ]},
    { name: "Pierna B", dayOfWeek: 5, exercises: [
      { name: "Peso Muerto Rumano", sets: 4, reps: "8-10", rest: 120 },
      { name: "Sentadilla Búlgara", sets: 3, reps: "10" },
      { name: "Prensa de Piernas", sets: 3, reps: "15" },
      { name: "Curl Femoral", sets: 3, reps: "15" },
      { name: "Hip Thrust", sets: 4, reps: "12" },
      { name: "Rodillas al Pecho", sets: 3, reps: "15", rest: 60 },
    ]},
  ],
});

await createPlan({
  name: "Push Pull Legs",
  description: "División push-pull-legs de 6 días para máxima hipertrofia",
  category: "musculación", daysPerWeek: 6, durationWeeks: 12,
  days: [
    { name: "Push - Empuje", dayOfWeek: 1, exercises: [
      { name: "Press de Banca", sets: 4, reps: "6-8", rest: 120 },
      { name: "Press Inclinado con Mancuernas", sets: 3, reps: "10-12" },
      { name: "Aperturas con Mancuernas", sets: 3, reps: "12-15" },
      { name: "Press Militar con Barra", sets: 4, reps: "8-10" },
      { name: "Elevaciones Laterales", sets: 4, reps: "15-20", rest: 60 },
      { name: "Tríceps en Polea Alta", sets: 3, reps: "12-15", rest: 60 },
      { name: "Tríceps Francés", sets: 3, reps: "12", rest: 60 },
    ]},
    { name: "Pull - Tracción", dayOfWeek: 2, exercises: [
      { name: "Dominadas", sets: 4, reps: "6-8", rest: 120 },
      { name: "Remo con Barra", sets: 4, reps: "8-10", rest: 120 },
      { name: "Jalón al Pecho", sets: 3, reps: "10-12" },
      { name: "Remo en Polea Baja", sets: 3, reps: "12" },
      { name: "Curl con Barra", sets: 3, reps: "10-12", rest: 60 },
      { name: "Curl Martillo", sets: 3, reps: "12", rest: 60 },
    ]},
    { name: "Legs - Piernas", dayOfWeek: 3, exercises: [
      { name: "Sentadilla con Barra", sets: 4, reps: "6-8", rest: 120 },
      { name: "Prensa de Piernas", sets: 3, reps: "10-12" },
      { name: "Extensiones de Cuádriceps", sets: 3, reps: "15" },
      { name: "Peso Muerto Rumano", sets: 4, reps: "8-10" },
      { name: "Curl Femoral", sets: 3, reps: "12-15" },
      { name: "Hip Thrust", sets: 3, reps: "12" },
    ]},
    { name: "Push B", dayOfWeek: 4, exercises: [
      { name: "Press con Mancuernas Plano", sets: 4, reps: "10-12" },
      { name: "Fondos en Paralelas", sets: 3, reps: "10-12" },
      { name: "Press Arnold", sets: 4, reps: "10-12" },
      { name: "Pájaro con Mancuernas", sets: 3, reps: "15", rest: 60 },
      { name: "Tríceps en Polea Alta", sets: 4, reps: "15", rest: 60 },
    ]},
    { name: "Pull B", dayOfWeek: 5, exercises: [
      { name: "Dominadas", sets: 4, reps: "AMRAP", rest: 120 },
      { name: "Jalón al Pecho", sets: 4, reps: "10-12" },
      { name: "Remo con Mancuerna", sets: 3, reps: "12" },
      { name: "Curl en Polea", sets: 3, reps: "15", rest: 60 },
      { name: "Curl Martillo", sets: 3, reps: "12", rest: 60 },
    ]},
    { name: "Legs B", dayOfWeek: 6, exercises: [
      { name: "Sentadilla Búlgara", sets: 4, reps: "10" },
      { name: "Peso Muerto Rumano", sets: 4, reps: "10" },
      { name: "Curl Femoral", sets: 3, reps: "15" },
      { name: "Hip Thrust", sets: 3, reps: "12" },
      { name: "Zancadas con Mancuernas", sets: 3, reps: "12" },
      { name: "Russian Twist", sets: 3, reps: "20", rest: 60 },
    ]},
  ],
});

await createPlan({
  name: "Glúteos y Piernas",
  description: "Plan enfocado en glúteos y tren inferior, 4 días por semana",
  category: "musculación", daysPerWeek: 4, durationWeeks: 10,
  days: [
    { name: "Glúteos y Cuádriceps A", dayOfWeek: 1, exercises: [
      { name: "Hip Thrust", sets: 4, reps: "12-15" },
      { name: "Sentadilla con Barra", sets: 4, reps: "10-12" },
      { name: "Prensa de Piernas", sets: 3, reps: "15" },
      { name: "Extensiones de Cuádriceps", sets: 3, reps: "15-20" },
      { name: "Zancadas con Mancuernas", sets: 3, reps: "12" },
      { name: "Plancha Abdominal", sets: 3, reps: "40s", rest: 60 },
    ]},
    { name: "Torso Superior", dayOfWeek: 2, exercises: [
      { name: "Press con Mancuernas Plano", sets: 3, reps: "12" },
      { name: "Remo en Polea Baja", sets: 3, reps: "12" },
      { name: "Elevaciones Laterales", sets: 3, reps: "15", rest: 60 },
      { name: "Jalón al Pecho", sets: 3, reps: "12" },
      { name: "Curl con Barra", sets: 3, reps: "12", rest: 60 },
      { name: "Crunch Abdominal", sets: 3, reps: "20", rest: 60 },
    ]},
    { name: "Glúteos e Isquiotibiales B", dayOfWeek: 4, exercises: [
      { name: "Peso Muerto Rumano", sets: 4, reps: "10-12" },
      { name: "Hip Thrust", sets: 4, reps: "15" },
      { name: "Sentadilla Búlgara", sets: 3, reps: "12" },
      { name: "Curl Femoral", sets: 3, reps: "15" },
      { name: "Prensa de Piernas", sets: 3, reps: "20" },
      { name: "Russian Twist", sets: 3, reps: "20", rest: 60 },
    ]},
    { name: "Full Body", dayOfWeek: 6, exercises: [
      { name: "Sentadilla con Barra", sets: 3, reps: "12" },
      { name: "Press de Banca", sets: 3, reps: "12" },
      { name: "Hip Thrust", sets: 3, reps: "15" },
      { name: "Dominadas", sets: 3, reps: "AMRAP" },
      { name: "Elevaciones Laterales", sets: 3, reps: "15", rest: 60 },
      { name: "Plancha Abdominal", sets: 3, reps: "45s", rest: 60 },
    ]},
  ],
});

await createPlan({
  name: "Fuerza y Volumen Avanzado",
  description: "Plan de fuerza-hipertrofia para intermedios y avanzados, 5 días",
  category: "musculación", daysPerWeek: 5, durationWeeks: 16,
  days: [
    { name: "Pecho y Tríceps", dayOfWeek: 1, exercises: [
      { name: "Press de Banca", sets: 5, reps: "5", rest: 180 },
      { name: "Press Inclinado con Mancuernas", sets: 4, reps: "8-10", rest: 120 },
      { name: "Aperturas con Mancuernas", sets: 3, reps: "12-15" },
      { name: "Fondos en Paralelas", sets: 4, reps: "10-12" },
      { name: "Tríceps Francés", sets: 4, reps: "10-12" },
      { name: "Tríceps en Polea Alta", sets: 3, reps: "15", rest: 60 },
    ]},
    { name: "Espalda y Bíceps", dayOfWeek: 2, exercises: [
      { name: "Dominadas", sets: 5, reps: "5", rest: 180 },
      { name: "Remo con Barra", sets: 4, reps: "6-8", rest: 120 },
      { name: "Jalón al Pecho", sets: 4, reps: "10-12" },
      { name: "Remo en Polea Baja", sets: 3, reps: "12" },
      { name: "Curl con Barra", sets: 4, reps: "8-10" },
      { name: "Curl en Polea", sets: 3, reps: "15", rest: 60 },
    ]},
    { name: "Piernas", dayOfWeek: 3, exercises: [
      { name: "Sentadilla con Barra", sets: 5, reps: "5", rest: 180 },
      { name: "Peso Muerto Rumano", sets: 4, reps: "8", rest: 120 },
      { name: "Prensa de Piernas", sets: 4, reps: "10-12" },
      { name: "Extensiones de Cuádriceps", sets: 3, reps: "15" },
      { name: "Curl Femoral", sets: 3, reps: "12-15" },
      { name: "Hip Thrust", sets: 4, reps: "10" },
      { name: "Plancha Abdominal", sets: 4, reps: "45s", rest: 60 },
    ]},
    { name: "Hombros", dayOfWeek: 5, exercises: [
      { name: "Press Militar con Barra", sets: 5, reps: "5", rest: 150 },
      { name: "Press Arnold", sets: 3, reps: "10-12" },
      { name: "Elevaciones Laterales", sets: 4, reps: "15-20", rest: 60 },
      { name: "Pájaro con Mancuernas", sets: 3, reps: "15", rest: 60 },
      { name: "Elevaciones Frontales", sets: 3, reps: "12", rest: 60 },
    ]},
    { name: "Espalda B", dayOfWeek: 6, exercises: [
      { name: "Dominadas", sets: 4, reps: "AMRAP", rest: 120 },
      { name: "Remo con Mancuerna", sets: 4, reps: "10" },
      { name: "Jalón al Pecho", sets: 3, reps: "12" },
      { name: "Curl Martillo", sets: 4, reps: "12" },
      { name: "Rodillas al Pecho", sets: 3, reps: "15", rest: 60 },
    ]},
  ],
});

// ─── Planes de Calentamiento ───────────────────────────────────────────────────

console.log("\nPlanes de calentamiento:");

await createPlan({
  name: "Calentamiento General",
  description: "Calentamiento completo de 10-15 minutos para preparar el cuerpo antes del entrenamiento",
  category: "calentamiento", daysPerWeek: 5, durationWeeks: null,
  days: [
    { name: "Activación Cardiovascular", exercises: [
      { name: "Marcha en el Lugar", section: "warmup", sets: 1, reps: "3 min", rest: 0 },
      { name: "Saltos de Tijera", section: "warmup", sets: 2, reps: "30", rest: 30 },
      { name: "Sentadilla Aire", section: "warmup", sets: 2, reps: "15", rest: 30 },
      { name: "Rotación de Hombros", section: "warmup", sets: 2, reps: "15 c/lado", rest: 20 },
      { name: "Movilización de Cadera", section: "warmup", sets: 2, reps: "10 c/lado", rest: 20 },
      { name: "Estiramiento de Isquiotibiales", section: "warmup", sets: 2, reps: "30s c/lado", rest: 15 },
    ]},
  ],
});

await createPlan({
  name: "Calentamiento Tren Inferior",
  description: "Activación específica para piernas y glúteos antes de entrenar el tren inferior",
  category: "calentamiento", daysPerWeek: 3, durationWeeks: null,
  days: [
    { name: "Movilización y Activación", exercises: [
      { name: "Marcha en el Lugar", section: "warmup", sets: 1, reps: "2 min", rest: 0 },
      { name: "Sentadilla Aire", section: "warmup", sets: 3, reps: "15", rest: 30 },
      { name: "Movilización de Cadera", section: "warmup", sets: 2, reps: "15 c/lado", rest: 20 },
      { name: "Zancadas con Mancuernas", section: "warmup", sets: 2, reps: "10 c/lado", rest: 30 },
      { name: "Estiramiento de Isquiotibiales", section: "warmup", sets: 2, reps: "30s c/lado", rest: 20 },
      { name: "Sentadilla con Salto", section: "warmup", sets: 2, reps: "10", rest: 45 },
    ]},
  ],
});

await createPlan({
  name: "Calentamiento Tren Superior",
  description: "Activación de hombros, pecho y espalda para preparar el tren superior",
  category: "calentamiento", daysPerWeek: 3, durationWeeks: null,
  days: [
    { name: "Movilización y Activación", exercises: [
      { name: "Marcha en el Lugar", section: "warmup", sets: 1, reps: "2 min", rest: 0 },
      { name: "Rotación de Hombros", section: "warmup", sets: 3, reps: "15 c/lado", rest: 20 },
      { name: "Plancha con Rotación", section: "warmup", sets: 2, reps: "10 c/lado", rest: 30 },
      { name: "Saltos de Tijera", section: "warmup", sets: 2, reps: "20", rest: 30 },
      { name: "Elevaciones Laterales", section: "warmup", sets: 2, reps: "15", rest: 30 },
      { name: "Plancha Abdominal", section: "warmup", sets: 2, reps: "30s", rest: 30 },
    ]},
  ],
});

console.log("\n✓ Seed completo: 41 ejercicios + 5 planes musculación + 3 planes calentamiento");
await pool.end();
