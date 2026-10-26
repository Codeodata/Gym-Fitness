/**
 * Seed completo: 1 entrenador + 20 clientes + turnos + 5 planes + asignaciones + logs
 * Uso: node --env-file=.env scripts/seed.mjs
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;

const useSSL = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("127.0.0.1");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}) });
const db = drizzle(pool);

function uid() { return crypto.randomUUID(); }

// Hashes generados con better-auth (scrypt)
const TRAINER_HASH = "d704c7e0f718a0bae820929992e3914b:92ce6b16186975bbd532397a152053c4ce9ae4dd159fc5b60d1f25a4243da62dc3bbbc6af8067af479d96ce77c5f96df21e29ddbff37ac7df333c5ae0c6e4e81"; // "Galileo26"
const DEMO_HASH    = "625edf2ca0f799607bd136a53703dc2d:405815820107b5250ab97cedb55cf467a9dff983de1fd6e0d8ce089b1b9d343e749db25ae2289c6f6b5ba6a989f40eeb0d8b58efef654e6aaf4313a32d895792"; // "password"

async function seed() {
  console.log("🌱 Sembrando datos de demo...\n");

  // ─── 1. Limpiar ──────────────────────────────────────────────────────────
  await db.execute(`
    DELETE FROM exercise_log;
    DELETE FROM workout_log;
    DELETE FROM body_weight;
    DELETE FROM attendance;
    DELETE FROM client_day_block;
    DELETE FROM slot_enrollment;
    DELETE FROM class_slot;
    DELETE FROM plan_assignment;
    DELETE FROM plan_exercise;
    DELETE FROM plan_day;
    DELETE FROM plan;
    DELETE FROM exercise;
    DELETE FROM notification;
    DELETE FROM verification;
    DELETE FROM session;
    DELETE FROM account;
    DELETE FROM "user";
  `);
  console.log("✓ Tablas limpias");

  // ─── 2. Entrenador ───────────────────────────────────────────────────────
  const trainerId = uid();
  await db.execute(`
    INSERT INTO "user" (id, name, email, email_verified, role, approved, created_at, updated_at)
    VALUES ('${trainerId}', 'Trainer', 'trainer@gym.com', true, 'trainer', true, now(), now());
  `);
  await db.execute(`
    INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
    VALUES ('${uid()}', '${trainerId}', 'credential', '${trainerId}', '${TRAINER_HASH}', now(), now());
  `);

  // ─── 3. 20 Clientes ──────────────────────────────────────────────────────
  const CLIENTS = [
    { name: "Lucas Fernández",    email: "lucas@gym.com",    membership: "3dias"     },
    { name: "Sofía Martínez",     email: "sofia@gym.com",    membership: "pase_libre" },
    { name: "Mateo Rodríguez",    email: "mateo@gym.com",    membership: "2dias"     },
    { name: "Valentina López",    email: "vale@gym.com",     membership: "3dias"     },
    { name: "Nicolás García",     email: "nico@gym.com",     membership: "pase_libre" },
    { name: "Camila Torres",      email: "cami@gym.com",     membership: "2dias"     },
    { name: "Tomás Herrera",      email: "tomas@gym.com",    membership: "3dias"     },
    { name: "Agustina Flores",    email: "agus@gym.com",     membership: "pase_libre" },
    { name: "Santiago Moreno",    email: "santi@gym.com",    membership: "3dias"     },
    { name: "Lucía Ramírez",      email: "lucia@gym.com",    membership: "2dias"     },
    { name: "Facundo Díaz",       email: "facu@gym.com",     membership: "pase_libre" },
    { name: "Martina Álvarez",    email: "martina@gym.com",  membership: "3dias"     },
    { name: "Bruno Castillo",     email: "bruno@gym.com",    membership: "2dias"     },
    { name: "Florencia Méndez",   email: "flor@gym.com",     membership: "3dias"     },
    { name: "Ignacio Suárez",     email: "nacho@gym.com",    membership: "pase_libre" },
    { name: "Delfina Vargas",     email: "delfi@gym.com",    membership: "2dias"     },
    { name: "Maximiliano Ruiz",   email: "maxi@gym.com",     membership: "3dias"     },
    { name: "Julieta Acosta",     email: "juli@gym.com",     membership: "pase_libre" },
    { name: "Rodrigo Molina",     email: "rodri@gym.com",    membership: "2dias"     },
    { name: "Emilia Sosa",        email: "emilia@gym.com",   membership: "3dias"     },
    { name: "Pedro Vargas",       email: "pedro@gym.com",    membership: "3dias"     },
    { name: "Carolina Ibáñez",    email: "caro@gym.com",     membership: "pase_libre" },
    { name: "Hernán Paz",         email: "hernan@gym.com",   membership: "2dias"     },
    { name: "Natalia Ferreyra",   email: "nati@gym.com",     membership: "3dias"     },
    { name: "Diego Suárez",       email: "diego@gym.com",    membership: "pase_libre" },
  ];

  const clientIds = [];
  for (const c of CLIENTS) {
    const id = uid();
    clientIds.push(id);
    await db.execute(`
      INSERT INTO "user" (id, name, email, email_verified, role, approved, membership_type, created_at, updated_at)
      VALUES ('${id}', '${c.name}', '${c.email}', true, 'client', true, '${c.membership}', now(), now());
    `);
    await db.execute(`
      INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES ('${uid()}', '${id}', 'credential', '${id}', '${DEMO_HASH}', now(), now());
    `);
  }
  console.log(`✓ ${CLIENTS.length} clientes (contraseña: password)`);

  // ─── 4. Turnos ───────────────────────────────────────────────────────────
  // dayOfWeek: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie
  const SLOTS_DEF = [
    { day: 1, time: "18:00", type: "musculación" },
    { day: 1, time: "19:00", type: "funcional"   },
    { day: 1, time: "20:00", type: "musculación" },
    { day: 2, time: "17:00", type: "musculación" },
    { day: 2, time: "19:00", type: "musculación" },
    { day: 2, time: "20:00", type: "funcional"   },
    { day: 3, time: "18:00", type: "funcional"   },
    { day: 3, time: "19:00", type: "musculación" },
    { day: 3, time: "20:00", type: "musculación" },
    { day: 4, time: "17:00", type: "funcional"   },
    { day: 4, time: "19:00", type: "musculación" },
    { day: 4, time: "20:00", type: "musculación" },
    { day: 5, time: "18:00", type: "musculación" },
    { day: 5, time: "19:00", type: "funcional"   },
    { day: 5, time: "20:00", type: "musculación" },
  ];

  const slotIds = [];
  for (const s of SLOTS_DEF) {
    const id = uid();
    slotIds.push(id);
    await db.execute(`
      INSERT INTO class_slot (id, day_of_week, start_time, type, max_capacity)
      VALUES ('${id}', ${s.day}, '${s.time}', '${s.type}', 12);
    `);
  }
  console.log(`✓ ${SLOTS_DEF.length} turnos creados`);

  // slotIds index:
  // 0=Lun18mus, 1=Lun19fun, 2=Lun20mus
  // 3=Mar17mus, 4=Mar19mus, 5=Mar20fun
  // 6=Mié18fun, 7=Mié19mus, 8=Mié20mus
  // 9=Jue17fun, 10=Jue19mus, 11=Jue20mus
  // 12=Vie18mus, 13=Vie19fun, 14=Vie20mus

  // ─── 5. Inscripciones a turnos ────────────────────────────────────────────
  // [clientIndex, slotIndex]
  // Índices: 0=Lun18mus, 1=Lun19fun, 2=Lun20mus
  //          3=Mar17mus, 4=Mar19mus, 5=Mar20fun
  //          6=Mié18fun, 7=Mié19mus, 8=Mié20mus
  //          9=Jue17fun, 10=Jue19mus, 11=Jue20mus
  //          12=Vie18mus, 13=Vie19fun, 14=Vie20mus
  const ENROLLMENTS = [
    // Lucas (3dias): Lun18, Mié20, Vie18
    [0,  0], [0,  8], [0, 12],
    // Sofía (pase_libre): Lun18, Mar17, Mié19, Jue20, Vie18
    [1,  0], [1,  3], [1,  7], [1, 11], [1, 12],
    // Mateo (2dias): Mar19, Jue19
    [2,  4], [2, 10],
    // Valentina (3dias): Lun20, Mié18, Vie19
    [3,  2], [3,  6], [3, 13],
    // Nicolás (pase_libre): Lun19, Mar20, Mié18, Jue17, Vie20
    [4,  1], [4,  5], [4,  6], [4,  9], [4, 14],
    // Camila (2dias): Lun18, Jue19
    [5,  0], [5, 10],
    // Tomás (3dias): Mar17, Jue20, Vie18
    [6,  3], [6, 11], [6, 12],
    // Agustina (pase_libre): Lun20, Mar17, Mié19, Jue20, Vie18
    [7,  2], [7,  3], [7,  7], [7, 11], [7, 12],
    // Santiago (3dias): Mar20, Mié20, Vie19
    [8,  5], [8,  8], [8, 13],
    // Lucía (2dias): Mié19, Vie18
    [9,  7], [9, 12],
    // Facundo (pase_libre): Lun18, Mar19, Mié20, Jue19, Vie18
    [10, 0], [10, 4], [10, 8], [10,10], [10,12],
    // Martina (3dias): Lun19, Mié18, Vie20
    [11, 1], [11, 6], [11,14],
    // Bruno (2dias): Mar17, Jue17
    [12, 3], [12, 9],
    // Florencia (3dias): Lun20, Jue20, Vie19
    [13, 2], [13,11], [13,13],
    // Ignacio (pase_libre): Lun18, Mar20, Mié20, Jue19, Vie18
    [14, 0], [14, 5], [14, 8], [14,10], [14,12],
    // Delfina (2dias): Mar19, Vie18
    [15, 4], [15,12],
    // Maximiliano (3dias): Lun20, Mié20, Vie18
    [16, 2], [16, 8], [16,12],
    // Julieta (pase_libre): Lun19, Mar17, Mié18, Jue17, Vie19
    [17, 1], [17, 3], [17, 6], [17, 9], [17,13],
    // Rodrigo (2dias): Lun18, Jue20
    [18, 0], [18,11],
    // Emilia (3dias): Mar20, Mié20, Vie18
    [19, 5], [19, 8], [19,12],
    // Pedro (3dias): Lun18, Mié19, Vie20
    [20, 0], [20, 7], [20,14],
    // Carolina (pase_libre): Lun20, Mar19, Mié18, Jue20, Vie19
    [21, 2], [21, 4], [21, 6], [21,11], [21,13],
    // Hernán (2dias): Mar17, Jue17
    [22, 3], [22, 9],
    // Natalia (3dias): Lun19, Mié20, Vie18
    [23, 1], [23, 8], [23,12],
    // Diego (pase_libre): Lun18, Mar20, Mié19, Jue19, Vie20
    [24, 0], [24, 5], [24, 7], [24,10], [24,14],
  ];

  for (const [ci, si] of ENROLLMENTS) {
    await db.execute(`
      INSERT INTO slot_enrollment (id, slot_id, client_id, enrolled_at)
      VALUES ('${uid()}', '${slotIds[si]}', '${clientIds[ci]}', now());
    `);
  }
  console.log(`✓ ${ENROLLMENTS.length} inscripciones a turnos`);

  // ─── 6. Ejercicios ───────────────────────────────────────────────────────
  const EX = {};
  const exercises = [
    // Pecho
    ["Press de banca", "chest", "intermediate"],
    ["Press inclinado mancuernas", "chest", "intermediate"],
    ["Press plano mancuernas", "chest", "intermediate"],
    ["Aperturas con mancuernas", "chest", "beginner"],
    ["Fondos en paralelas", "chest", "intermediate"],
    // Espalda
    ["Peso muerto", "back", "advanced"],
    ["Dominadas", "back", "intermediate"],
    ["Remo con barra", "back", "intermediate"],
    ["Remo en polea sentado", "back", "beginner"],
    ["Face pull", "shoulders", "beginner"],
    ["Jalón al pecho", "back", "beginner"],
    // Hombros
    ["Press militar", "shoulders", "intermediate"],
    ["Elevaciones laterales", "shoulders", "beginner"],
    ["Elevaciones frontales", "shoulders", "beginner"],
    ["Press Arnold", "shoulders", "intermediate"],
    // Brazos
    ["Curl de bíceps con barra", "arms", "beginner"],
    ["Curl martillo", "arms", "beginner"],
    ["Extensión de tríceps en polea", "arms", "beginner"],
    ["Press francés", "arms", "intermediate"],
    ["Curl concentrado", "arms", "beginner"],
    // Piernas
    ["Sentadilla con barra", "legs", "advanced"],
    ["Prensa de piernas", "legs", "beginner"],
    ["Peso muerto rumano", "legs", "intermediate"],
    ["Hip thrust", "legs", "intermediate"],
    ["Zancadas", "legs", "beginner"],
    ["Extensión de cuádriceps", "legs", "beginner"],
    ["Curl femoral", "legs", "beginner"],
    ["Sentadilla goblet", "legs", "beginner"],
    // Core
    ["Plancha", "core", "beginner"],
    ["Crunch abdominal", "core", "beginner"],
    ["Rueda abdominal", "core", "intermediate"],
    ["Elevación de piernas colgado", "core", "intermediate"],
    // Cardio
    ["Caminata en cinta", "cardio", "beginner"],
    ["Salto a la soga", "cardio", "beginner"],
  ];

  for (const [name, mg, diff] of exercises) {
    const id = uid();
    EX[name] = id;
    await db.execute(`
      INSERT INTO exercise (id, name, muscle_group, difficulty, created_at)
      VALUES ('${id}', '${name.replace(/'/g, "''")}', '${mg}', '${diff}', now());
    `);
  }
  console.log(`✓ ${exercises.length} ejercicios`);

  // ─── 7. Planes ───────────────────────────────────────────────────────────

  async function createPlan(name, description, category, daysPerWeek, durationWeeks, days) {
    const planId = uid();
    await db.execute(`
      INSERT INTO plan (id, name, description, category, days_per_week, duration_weeks, created_at, updated_at)
      VALUES ('${planId}', '${name.replace(/'/g,"''")}', '${description.replace(/'/g,"''")}',
              '${category}', ${daysPerWeek}, ${durationWeeks}, now(), now());
    `);
    const dayIds = [];
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const dayId = uid();
      dayIds.push(dayId);
      await db.execute(`
        INSERT INTO plan_day (id, plan_id, day_number, name)
        VALUES ('${dayId}', '${planId}', ${i + 1}, '${d.name.replace(/'/g,"''")}');
      `);
      for (let j = 0; j < d.exercises.length; j++) {
        const ex = d.exercises[j];
        const exId = EX[ex.name];
        if (!exId) { console.warn(`  ⚠ ejercicio no encontrado: ${ex.name}`); continue; }
        const w = ex.weight ? `'${ex.weight}'` : "NULL";
        const sec = ex.section ?? "main";
        await db.execute(`
          INSERT INTO plan_exercise (id, plan_day_id, exercise_id, section, order_index, sets, reps, weight_kg, notes)
          VALUES ('${uid()}', '${dayId}', '${exId}', '${sec}', ${j},
                  ${ex.sets}, '${ex.reps}', ${w},
                  ${ex.notes ? `'${ex.notes.replace(/'/g,"''")}'` : "NULL"});
        `);
      }
    }
    return { planId, dayIds };
  }

  // ── Plan 1: Fuerza PPL — 3 días ─────────────────────────────────────────
  const { planId: p1Id, dayIds: p1Days } = await createPlan(
    "Fuerza PPL — 3 días",
    "Push/Pull/Legs clásico enfocado en fuerza base. Progresión lineal en los movimientos principales.",
    "musculación", 3, 4,
    [
      { name: "Push — Pecho, Hombros, Tríceps", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Salto a la soga",                    section: "warmup", sets: 2, reps: "2 min",   weight: null },
        { name: "Press de banca",                     section: "main",   sets: 4, reps: "5",        weight: "80" },
        { name: "Press inclinado mancuernas",         section: "main",   sets: 3, reps: "8-10",     weight: "30" },
        { name: "Press militar",                      section: "main",   sets: 3, reps: "6",        weight: "50" },
        { name: "Elevaciones laterales",              section: "main",   sets: 4, reps: "12-15",    weight: "10" },
        { name: "Extensión de tríceps en polea",      section: "main",   sets: 3, reps: "12",       weight: "25" },
      ]},
      { name: "Pull — Espalda y Bíceps", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "8 min",   weight: null },
        { name: "Peso muerto",                        section: "main",   sets: 4, reps: "4",        weight: "100" },
        { name: "Dominadas",                          section: "main",   sets: 4, reps: "6-8",      weight: null },
        { name: "Remo con barra",                     section: "main",   sets: 3, reps: "8",        weight: "70" },
        { name: "Face pull",                          section: "main",   sets: 3, reps: "15",       weight: "15" },
        { name: "Curl de bíceps con barra",           section: "main",   sets: 3, reps: "10-12",    weight: "30" },
      ]},
      { name: "Legs — Piernas", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Sentadilla goblet",                  section: "warmup", sets: 2, reps: "15",       weight: "12" },
        { name: "Sentadilla con barra",               section: "main",   sets: 4, reps: "5",        weight: "90" },
        { name: "Prensa de piernas",                  section: "main",   sets: 3, reps: "10",       weight: "150" },
        { name: "Hip thrust",                         section: "main",   sets: 3, reps: "12",       weight: "80" },
        { name: "Zancadas",                           section: "main",   sets: 3, reps: "10 c/p",   weight: "20" },
        { name: "Plancha",                            section: "main",   sets: 3, reps: "45 seg",   weight: null },
      ]},
    ]
  );
  console.log("✓ Plan 1: Fuerza PPL 3 días");

  // ── Plan 2: Volumen Upper/Lower — 4 días ──────────────────────────────────
  const { planId: p2Id, dayIds: p2Days } = await createPlan(
    "Volumen Upper/Lower — 4 días",
    "División upper/lower para maximizar volumen y frecuencia por grupo muscular. Ideal para intermedios.",
    "musculación", 4, 4,
    [
      { name: "Upper A — Fuerza", exercises: [
        { name: "Salto a la soga",                    section: "warmup", sets: 2, reps: "90 seg",  weight: null },
        { name: "Elevaciones laterales",              section: "warmup", sets: 2, reps: "15",       weight: "6"  },
        { name: "Press de banca",                     section: "main",   sets: 4, reps: "6",        weight: "75" },
        { name: "Remo con barra",                     section: "main",   sets: 4, reps: "6",        weight: "65" },
        { name: "Press militar",                      section: "main",   sets: 3, reps: "8",        weight: "45" },
        { name: "Dominadas",                          section: "main",   sets: 3, reps: "AMRAP",    weight: null },
      ]},
      { name: "Lower A — Fuerza", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "8 min",   weight: null },
        { name: "Sentadilla goblet",                  section: "warmup", sets: 2, reps: "12",       weight: "14" },
        { name: "Sentadilla con barra",               section: "main",   sets: 4, reps: "6",        weight: "85" },
        { name: "Peso muerto rumano",                 section: "main",   sets: 3, reps: "8",        weight: "70" },
        { name: "Prensa de piernas",                  section: "main",   sets: 3, reps: "10",       weight: "140" },
        { name: "Plancha",                            section: "main",   sets: 3, reps: "60 seg",   weight: null },
      ]},
      { name: "Upper B — Volumen", exercises: [
        { name: "Salto a la soga",                    section: "warmup", sets: 2, reps: "2 min",   weight: null },
        { name: "Press inclinado mancuernas",         section: "main",   sets: 4, reps: "10-12",    weight: "28" },
        { name: "Jalón al pecho",                     section: "main",   sets: 4, reps: "10",       weight: "55" },
        { name: "Face pull",                          section: "main",   sets: 4, reps: "15",       weight: "12" },
        { name: "Elevaciones laterales",              section: "main",   sets: 4, reps: "15",       weight: "8"  },
        { name: "Curl de bíceps con barra",           section: "main",   sets: 3, reps: "12",       weight: "26" },
        { name: "Extensión de tríceps en polea",      section: "main",   sets: 3, reps: "12",       weight: "22" },
      ]},
      { name: "Lower B — Volumen", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Hip thrust",                         section: "main",   sets: 4, reps: "12",       weight: "90" },
        { name: "Zancadas",                           section: "main",   sets: 3, reps: "12 c/p",   weight: "18" },
        { name: "Curl femoral",                       section: "main",   sets: 3, reps: "12",       weight: "40" },
        { name: "Extensión de cuádriceps",            section: "main",   sets: 3, reps: "15",       weight: "35" },
        { name: "Rueda abdominal",                    section: "main",   sets: 3, reps: "10",       weight: null },
      ]},
    ]
  );
  console.log("✓ Plan 2: Volumen Upper/Lower 4 días");

  // ── Plan 3: Iniciación — 2 días ───────────────────────────────────────────
  const { planId: p3Id, dayIds: p3Days } = await createPlan(
    "Iniciación Full Body — 2 días",
    "Rutina de cuerpo completo para principiantes. Movimientos simples con énfasis en aprender la técnica.",
    "musculación", 2, 4,
    [
      { name: "Full Body A", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Sentadilla goblet",                  section: "main",   sets: 3, reps: "12",       weight: "10" },
        { name: "Press plano mancuernas",             section: "main",   sets: 3, reps: "10",       weight: "14" },
        { name: "Remo en polea sentado",              section: "main",   sets: 3, reps: "12",       weight: "35" },
        { name: "Press Arnold",                       section: "main",   sets: 3, reps: "12",       weight: "10" },
        { name: "Plancha",                            section: "main",   sets: 3, reps: "30 seg",   weight: null },
        { name: "Crunch abdominal",                   section: "main",   sets: 3, reps: "15",       weight: null },
      ]},
      { name: "Full Body B", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Peso muerto rumano",                 section: "main",   sets: 3, reps: "10",       weight: "30" },
        { name: "Jalón al pecho",                     section: "main",   sets: 3, reps: "12",       weight: "40" },
        { name: "Aperturas con mancuernas",           section: "main",   sets: 3, reps: "12",       weight: "8"  },
        { name: "Curl martillo",                      section: "main",   sets: 3, reps: "12",       weight: "10" },
        { name: "Extensión de tríceps en polea",      section: "main",   sets: 3, reps: "12",       weight: "15" },
        { name: "Elevación de piernas colgado",       section: "main",   sets: 3, reps: "10",       weight: null },
      ]},
    ]
  );
  console.log("✓ Plan 3: Iniciación Full Body 2 días");

  // ── Plan 4: Pase libre — 5 días ───────────────────────────────────────────
  const { planId: p4Id, dayIds: p4Days } = await createPlan(
    "Hipertrofia 5 días",
    "Programa completo de 5 días por semana para máxima hipertrofia. Cada músculo con alta frecuencia y volumen.",
    "musculación", 5, 4,
    [
      { name: "Lunes — Pecho + Tríceps", exercises: [
        { name: "Salto a la soga",                    section: "warmup", sets: 3, reps: "1 min",   weight: null },
        { name: "Press de banca",                     section: "main",   sets: 4, reps: "8-10",     weight: "70" },
        { name: "Press inclinado mancuernas",         section: "main",   sets: 3, reps: "10-12",    weight: "26" },
        { name: "Fondos en paralelas",                section: "main",   sets: 3, reps: "AMRAP",    weight: null },
        { name: "Aperturas con mancuernas",           section: "main",   sets: 3, reps: "12-15",    weight: "12" },
        { name: "Press francés",                      section: "main",   sets: 3, reps: "12",       weight: "18" },
        { name: "Extensión de tríceps en polea",      section: "main",   sets: 3, reps: "15",       weight: "20" },
      ]},
      { name: "Martes — Espalda + Bíceps", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "8 min",   weight: null },
        { name: "Peso muerto",                        section: "main",   sets: 3, reps: "5",        weight: "90" },
        { name: "Dominadas",                          section: "main",   sets: 4, reps: "6-8",      weight: null },
        { name: "Remo con barra",                     section: "main",   sets: 3, reps: "8-10",     weight: "60" },
        { name: "Jalón al pecho",                     section: "main",   sets: 3, reps: "10-12",    weight: "50" },
        { name: "Remo en polea sentado",              section: "main",   sets: 3, reps: "12",       weight: "45" },
        { name: "Curl de bíceps con barra",           section: "main",   sets: 3, reps: "10-12",    weight: "26" },
        { name: "Curl concentrado",                   section: "main",   sets: 2, reps: "12 c/p",   weight: "10" },
      ]},
      { name: "Miércoles — Piernas", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Sentadilla goblet",                  section: "warmup", sets: 2, reps: "15",       weight: "16" },
        { name: "Sentadilla con barra",               section: "main",   sets: 4, reps: "8-10",     weight: "80" },
        { name: "Prensa de piernas",                  section: "main",   sets: 3, reps: "12",       weight: "130" },
        { name: "Peso muerto rumano",                 section: "main",   sets: 3, reps: "10",       weight: "65" },
        { name: "Hip thrust",                         section: "main",   sets: 3, reps: "12-15",    weight: "85" },
        { name: "Extensión de cuádriceps",            section: "main",   sets: 3, reps: "15",       weight: "30" },
        { name: "Curl femoral",                       section: "main",   sets: 3, reps: "12",       weight: "35" },
      ]},
      { name: "Jueves — Hombros + Core", exercises: [
        { name: "Salto a la soga",                    section: "warmup", sets: 2, reps: "2 min",   weight: null },
        { name: "Press militar",                      section: "main",   sets: 4, reps: "8-10",     weight: "42" },
        { name: "Press Arnold",                       section: "main",   sets: 3, reps: "10-12",    weight: "14" },
        { name: "Elevaciones laterales",              section: "main",   sets: 4, reps: "15",       weight: "9"  },
        { name: "Elevaciones frontales",              section: "main",   sets: 3, reps: "12",       weight: "8"  },
        { name: "Face pull",                          section: "main",   sets: 3, reps: "15",       weight: "14" },
        { name: "Plancha",                            section: "main",   sets: 3, reps: "60 seg",   weight: null },
        { name: "Rueda abdominal",                    section: "main",   sets: 3, reps: "10",       weight: null },
        { name: "Elevación de piernas colgado",       section: "main",   sets: 3, reps: "12",       weight: null },
      ]},
      { name: "Viernes — Piernas + Glúteos", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Hip thrust",                         section: "main",   sets: 5, reps: "15",       weight: "90" },
        { name: "Sentadilla goblet",                  section: "main",   sets: 3, reps: "15",       weight: "20" },
        { name: "Zancadas",                           section: "main",   sets: 4, reps: "12 c/p",   weight: "16" },
        { name: "Curl femoral",                       section: "main",   sets: 3, reps: "15",       weight: "38" },
        { name: "Prensa de piernas",                  section: "main",   sets: 3, reps: "15",       weight: "110" },
        { name: "Crunch abdominal",                   section: "main",   sets: 3, reps: "20",       weight: null },
      ]},
    ]
  );
  console.log("✓ Plan 4: Hipertrofia 5 días (pase libre)");

  // ── Plan 5: Funcional — 3 días ────────────────────────────────────────────
  const { planId: p5Id, dayIds: p5Days } = await createPlan(
    "Funcional + Cardio — 3 días",
    "Combinación de trabajo funcional y cardiovascular. Ideal para mejorar la condición física general.",
    "funcional", 3, 4,
    [
      { name: "Día A — Potencia", exercises: [
        { name: "Salto a la soga",                    section: "warmup", sets: 3, reps: "2 min",   weight: null },
        { name: "Sentadilla goblet",                  section: "main",   sets: 4, reps: "15",       weight: "14" },
        { name: "Fondos en paralelas",                section: "main",   sets: 3, reps: "AMRAP",    weight: null },
        { name: "Dominadas",                          section: "main",   sets: 3, reps: "AMRAP",    weight: null },
        { name: "Zancadas",                           section: "main",   sets: 3, reps: "12 c/p",   weight: "12" },
        { name: "Plancha",                            section: "main",   sets: 3, reps: "45 seg",   weight: null },
        { name: "Crunch abdominal",                   section: "main",   sets: 3, reps: "20",       weight: null },
      ]},
      { name: "Día B — Resistencia", exercises: [
        { name: "Caminata en cinta",                  section: "warmup", sets: 1, reps: "10 min",  weight: null },
        { name: "Hip thrust",                         section: "main",   sets: 3, reps: "15",       weight: "50" },
        { name: "Remo en polea sentado",              section: "main",   sets: 3, reps: "15",       weight: "40" },
        { name: "Press plano mancuernas",             section: "main",   sets: 3, reps: "12",       weight: "16" },
        { name: "Elevaciones laterales",              section: "main",   sets: 3, reps: "15",       weight: "7"  },
        { name: "Rueda abdominal",                    section: "main",   sets: 3, reps: "8",        weight: null },
        { name: "Salto a la soga",                    section: "main",   sets: 3, reps: "3 min",    weight: null },
      ]},
      { name: "Día C — Full", exercises: [
        { name: "Salto a la soga",                    section: "warmup", sets: 3, reps: "90 seg",  weight: null },
        { name: "Sentadilla con barra",               section: "main",   sets: 3, reps: "10",       weight: "50" },
        { name: "Press de banca",                     section: "main",   sets: 3, reps: "10",       weight: "50" },
        { name: "Peso muerto",                        section: "main",   sets: 3, reps: "8",        weight: "60" },
        { name: "Dominadas",                          section: "main",   sets: 3, reps: "AMRAP",    weight: null },
        { name: "Plancha",                            section: "main",   sets: 3, reps: "60 seg",   weight: null },
        { name: "Elevación de piernas colgado",       section: "main",   sets: 3, reps: "12",       weight: null },
      ]},
    ]
  );
  console.log("✓ Plan 5: Funcional + Cardio 3 días");

  // ─── 8. Asignaciones ─────────────────────────────────────────────────────
  // [clientIndex, planId, trainerNotes]
  const ASSIGNMENTS = [
    [0,  p1Id, "Lucas: enfocate en la técnica del press antes de subir peso. Descansá 2 min entre series pesadas."],
    [1,  p4Id, "Sofía: el hip thrust es tu ejercicio clave. Si podés, grabate el último set para revisar la técnica."],
    [2,  p3Id, "Mateo: empezamos suave para aprender los patrones. Priorizá la forma sobre el peso."],
    [3,  p2Id, "Valentina: el upper/lower te va a dar buena frecuencia. Avisame si sentís mucho volumen al principio."],
    [4,  p4Id, "Nicolás: con pase libre podés aprovechar todos los días. Tratá de no fallar ningún día de piernas."],
    [5,  p3Id, "Camila: este plan es perfecto para arrancar. En 4 semanas pasamos a algo más exigente."],
    [6,  p1Id, "Tomás: el PPL es muy completo. Prestá atención al día de pull, el peso muerto es el rey."],
    [7,  p4Id, "Agustina: sos de las más constantes del gym. Con este plan de 5 días vas a ver grandes cambios."],
    [8,  p2Id, "Santiago: el upper/lower te va bien con tu horario de martes/miércoles/viernes."],
    [9,  p3Id, "Lucía: empezamos con 2 días para construir el hábito. Mucha atención a la postura."],
    [10, p4Id, "Facundo: aprovechá el pase libre. Los días de espalda son fundamentales para tu objetivo."],
    [11, p5Id, "Martina: el funcional te va a dar una condición física increíble. Disfrutalo."],
    [12, p3Id, "Bruno: vamos despacio y bien. La técnica primero, el peso después."],
    [13, p2Id, "Florencia: el upper/lower es ideal para tu objetivo de tono muscular general."],
    [14, p4Id, "Ignacio: 5 días son muchos para algunos pero vos tenés la disciplina. Igual avisame si te sentís cansado."],
    [15, p3Id, "Delfina: 2 días para arrancar. Si te adaptás bien, en el próximo ciclo subimos a 3."],
    [16, p1Id, "Maximiliano: el PPL clásico para vos. En la sentadilla del día legs quiero que llegues a 100kg."],
    [17, p4Id, "Julieta: pase libre con hipertrofia. El viernes de glúteos es tu favorito, ya sé."],
    [18, p3Id, "Rodrigo: empezamos de cero pero vas a progresar rápido. Prestá atención al peso muerto."],
    [19, p5Id, "Emilia: funcional puro. Vas a mejorar tu cardio y fuerza al mismo tiempo."],
    [20, p1Id, "Pedro: el PPL es ideal para tu objetivo de fuerza. Enfocate en los tres grandes levantamientos."],
    [21, p4Id, "Carolina: con pase libre y 5 días tenés todo el tiempo del mundo. Aprovechalo bien."],
    [22, p3Id, "Hernán: comenzamos suave para construir base. Dos días son suficientes para arrancar bien."],
    [23, p2Id, "Natalia: el upper/lower con 4 días te va a dar la frecuencia necesaria para progresar rápido."],
    [24, p5Id, "Diego: funcional + cardio es lo que necesitás para mejorar tu condición general. Disfrutalo."],
  ];

  const assignIds = [];
  for (const [ci, planId, notes] of ASSIGNMENTS) {
    const id = uid();
    assignIds.push({ id, clientId: clientIds[ci], planId });
    const startDaysAgo = 7 + Math.floor(Math.random() * 21); // 7-28 días atrás
    await db.execute(`
      INSERT INTO plan_assignment (id, plan_id, client_id, start_date, active, trainer_notes, created_at)
      VALUES ('${id}', '${planId}', '${clientIds[ci]}',
              now() - interval '${startDaysAgo} days', true,
              '${notes.replace(/'/g, "''")}', now());
    `);
  }
  console.log(`✓ ${ASSIGNMENTS.length} asignaciones`);

  // ─── 9. Semana del alumno (client_day_block) ─────────────────────────────
  // Asigna qué día de la semana entrena cada alumno y qué día del plan hace
  // dayOfWeek: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie
  // Formato: [clientIndex, planDays, [dayIndex, dayOfWeek], ...]
  const CLIENT_BLOCKS = [
    [0,  p1Days, [0,1],[1,3],[2,5]],            // Lucas: PPL → Lun/Mié/Vie
    [1,  p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Sofía: 5días → Lun-Vie
    [2,  p3Days, [0,1],[1,4]],                   // Mateo: 2días → Lun/Jue
    [3,  p2Days, [0,1],[1,2],[2,4],[3,5]],        // Valentina: UL → Lun/Mar/Jue/Vie
    [4,  p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Nicolás: 5días → Lun-Vie
    [5,  p3Days, [0,1],[1,4]],                   // Camila: 2días → Lun/Jue
    [6,  p1Days, [0,2],[1,4],[2,5]],              // Tomás: PPL → Mar/Jue/Vie
    [7,  p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Agustina: 5días → Lun-Vie
    [8,  p2Days, [0,2],[1,3],[2,4],[3,5]],        // Santiago: UL → Mar/Mié/Jue/Vie
    [9,  p3Days, [0,2],[1,5]],                   // Lucía: 2días → Mar/Vie
    [10, p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Facundo: 5días → Lun-Vie
    [11, p5Days, [0,1],[1,3],[2,5]],              // Martina: Func → Lun/Mié/Vie
    [12, p3Days, [0,2],[1,5]],                   // Bruno: 2días → Mar/Vie
    [13, p2Days, [0,1],[1,2],[2,4],[3,5]],        // Florencia: UL → Lun/Mar/Jue/Vie
    [14, p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Ignacio: 5días → Lun-Vie
    [15, p3Days, [0,1],[1,3]],                   // Delfina: 2días → Lun/Mié
    [16, p1Days, [0,1],[1,3],[2,5]],              // Maximiliano: PPL → Lun/Mié/Vie
    [17, p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Julieta: 5días → Lun-Vie
    [18, p3Days, [0,1],[1,3]],                   // Rodrigo: 2días → Lun/Mié
    [19, p5Days, [0,2],[1,4],[2,5]],              // Emilia: Func → Mar/Jue/Vie
    [20, p1Days, [0,1],[1,3],[2,5]],              // Pedro: PPL → Lun/Mié/Vie
    [21, p4Days, [0,1],[1,2],[2,3],[3,4],[4,5]], // Carolina: 5días → Lun-Vie
    [22, p3Days, [0,2],[1,4]],                   // Hernán: 2días → Mar/Jue
    [23, p2Days, [0,1],[1,2],[2,4],[3,5]],        // Natalia: UL → Lun/Mar/Jue/Vie
    [24, p5Days, [0,1],[1,3],[2,5]],              // Diego: Func → Lun/Mié/Vie
  ];

  let totalBlocks = 0;
  for (const [ci, planDays, ...dayMappings] of CLIENT_BLOCKS) {
    for (let i = 0; i < dayMappings.length; i++) {
      const [dayIdx, dow] = dayMappings[i];
      await db.execute(`
        INSERT INTO client_day_block (id, client_id, day_of_week, plan_day_id, order_index, created_at)
        VALUES ('${uid()}', '${clientIds[ci]}', ${dow}, '${planDays[dayIdx]}', ${i}, now());
      `);
      totalBlocks++;
    }
  }
  console.log(`✓ ${totalBlocks} bloques semanales (client_day_block)`);

  // ─── 11. Logs de entrenamiento (últimas 4 semanas) ───────────────────────
  // Para los primeros 8 clientes generamos historial realista

  const planDaysMap = {
    [p1Id]: p1Days,
    [p2Id]: p2Days,
    [p3Id]: p3Days,
    [p4Id]: p4Days,
    [p5Id]: p5Days,
  };

  // Lucas: 3 días/sem × 4 semanas = ~12 sesiones con progresión en press
  async function logSessions(assignInfo, sessionsCount, startWeight, weightIncrement) {
    const { id: assignId, clientId, planId } = assignInfo;
    const days = planDaysMap[planId];
    if (!days || days.length === 0) return 0;

    const exercises = await db.execute(`
      SELECT pe.id, e.name, pe.section FROM plan_exercise pe
      JOIN exercise e ON e.id = pe.exercise_id
      WHERE pe.plan_day_id = '${days[0]}' AND pe.section = 'main'
      ORDER BY pe.order_index;
    `);

    let sessionsLogged = 0;
    for (let s = 0; s < sessionsCount; s++) {
      const daysAgo = Math.max(1, (sessionsCount - s) * 2 + Math.floor(Math.random() * 2));
      const logDate = new Date(Date.now() - daysAgo * 86400000);
      const logId = uid();
      const dayId = days[s % days.length];
      await db.execute(`
        INSERT INTO workout_log (id, client_id, assignment_id, plan_day_id, logged_at)
        VALUES ('${logId}', '${clientId}', '${assignId}', '${dayId}', '${logDate.toISOString()}');
      `);
      const currentWeight = startWeight + s * weightIncrement;
      for (const row of exercises.rows) {
        const isMainLift = s === 0 || row.name.includes("Press") || row.name.includes("Sentadilla") || row.name.includes("Peso muerto");
        const w = isMainLift && currentWeight > 0 ? `'${currentWeight.toFixed(1)}'` : "NULL";
        await db.execute(`
          INSERT INTO exercise_log (id, workout_log_id, plan_exercise_id, sets_done, reps_done, weight_kg)
          VALUES ('${uid()}', '${logId}', '${row.id}', 3, '10', ${w});
        `);
      }
      sessionsLogged++;
    }
    return sessionsLogged;
  }

  let totalLogs = 0;
  totalLogs += await logSessions(assignIds[0],  12, 75, 2.5);  // Lucas
  totalLogs += await logSessions(assignIds[1],  16, 0,  0);    // Sofía
  totalLogs += await logSessions(assignIds[2],   6, 0,  0);    // Mateo
  totalLogs += await logSessions(assignIds[3],  10, 60, 1.25); // Valentina
  totalLogs += await logSessions(assignIds[4],  18, 70, 2.5);  // Nicolás
  totalLogs += await logSessions(assignIds[5],   4, 0,  0);    // Camila
  totalLogs += await logSessions(assignIds[6],   9, 80, 2.5);  // Tomás
  totalLogs += await logSessions(assignIds[7],  20, 40, 1.25); // Agustina
  console.log(`✓ ${totalLogs} logs de sesiones`);

  // ─── 12. Peso corporal ───────────────────────────────────────────────────
  const WEIGHT_HISTORIES = [
    [0,  [ [28,"83.5"],[21,"83.2"],[14,"82.8"],[7,"82.4"],[0,"82.0"] ]],  // Lucas  ↓
    [1,  [ [21,"61.0"],[14,"60.8"],[7,"60.5"],[0,"60.2"] ]],              // Sofía  ↓
    [2,  [ [14,"79.0"],[7,"79.2"],[0,"79.4"] ]],                          // Mateo  ↑
    [3,  [ [21,"58.5"],[14,"58.3"],[7,"58.2"],[0,"58.0"] ]],              // Valentina ↓
    [4,  [ [28,"88.0"],[21,"87.5"],[14,"87.0"],[7,"86.5"],[0,"86.2"] ]],  // Nicolás ↓
    [6,  [ [14,"78.0"],[7,"78.2"],[0,"78.5"] ]],                          // Tomás ↑
    [7,  [ [21,"64.0"],[14,"63.8"],[7,"63.5"],[0,"63.2"] ]],              // Agustina ↓
    [11, [ [14,"55.0"],[7,"55.2"],[0,"55.1"] ]],                          // Martina ~
    [16, [ [21,"90.0"],[14,"90.5"],[7,"91.0"],[0,"91.5"] ]],              // Maxi ↑
    [17, [ [14,"57.5"],[7,"57.3"],[0,"57.0"] ]],                          // Julieta ↓
  ];

  let totalWeightRecords = 0;
  for (const [ci, history] of WEIGHT_HISTORIES) {
    for (const [daysAgo, kg] of history) {
      const d = new Date(Date.now() - daysAgo * 86400000);
      await db.execute(`
        INSERT INTO body_weight (id, client_id, weight_kg, recorded_at)
        VALUES ('${uid()}', '${clientIds[ci]}', ${kg}, '${d.toISOString()}');
      `);
      totalWeightRecords++;
    }
  }
  console.log(`✓ ${totalWeightRecords} registros de peso corporal`);

  // ─── Resumen ─────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completo!\n");
  console.log("┌────────────────────────────────────────────────────────────┐");
  console.log("│  ACCESOS                                                   │");
  console.log("│                                                            │");
  console.log("│  Entrenador:  trainer@gym.com    contraseña: Galileo26    │");
  console.log("│  Clientes:    lucas@gym.com      contraseña: password     │");
  console.log("│               sofia@gym.com      contraseña: password     │");
  console.log("│               (y otros 23 más)   contraseña: password     │");
  console.log("│                                                            │");
  console.log("│  PLANES CREADOS                                            │");
  console.log("│  1. Fuerza PPL — 3 días           (musculación)           │");
  console.log("│  2. Volumen Upper/Lower — 4 días  (musculación)           │");
  console.log("│  3. Iniciación Full Body — 2 días (musculación)           │");
  console.log("│  4. Hipertrofia 5 días            (pase libre)            │");
  console.log("│  5. Funcional + Cardio — 3 días   (funcional)             │");
  console.log("└────────────────────────────────────────────────────────────┘");

  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
