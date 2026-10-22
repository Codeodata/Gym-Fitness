import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Better Auth core tables ───────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["trainer", "client"] }).notNull().default("client"),
  approved: boolean("approved").notNull().default(false),
  active: boolean("active").notNull().default(true),
  membershipType: text("membership_type", { enum: ["2dias", "3dias", "pase_libre"] }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Dominio: Ejercicios ───────────────────────────────────────────────────

export const muscleGroupEnum = pgEnum("muscle_group", [
  "chest", "back", "shoulders", "arms", "legs", "core", "cardio", "full_body",
]);

export const exercise = pgTable("exercise", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  muscleGroup: muscleGroupEnum("muscle_group").notNull().default("full_body"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).default("intermediate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Dominio: Planes de entrenamiento ─────────────────────────────────────

export const planCategoryEnum = pgEnum("plan_category", ["calentamiento", "funcional", "musculación"]);

export const plan = pgTable("plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["calentamiento", "funcional", "musculación"] }).notNull().default("musculación"),
  daysPerWeek: integer("days_per_week").notNull().default(3),
  durationWeeks: integer("duration_weeks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const planDay = pgTable("plan_day", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plan.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(), // 1, 2, 3…
  name: text("name"), // ej: "Pecho + Tríceps"
  dayOfWeek: integer("day_of_week"), // 1=Lun … 6=Sáb, null = sin día fijo
});

export const planExercise = pgTable("plan_exercise", {
  id: uuid("id").primaryKey().defaultRandom(),
  planDayId: uuid("plan_day_id")
    .notNull()
    .references(() => planDay.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercise.id),
  section: text("section", { enum: ["warmup", "main"] }).notNull().default("main"),
  orderIndex: integer("order_index").notNull().default(0),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("10"), // "10", "8-12", "AMRAP"
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  restSeconds: integer("rest_seconds").default(90),
  notes: text("notes"),
});

// ─── Dominio: Asignaciones ─────────────────────────────────────────────────

export const planAssignment = pgTable("plan_assignment", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plan.id),
  clientId: text("client_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
  trainerNotes: text("trainer_notes"),
  daySchedule: text("day_schedule"), // JSON: [{planDayId: string, dayOfWeek: number}]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Dominio: Registros de progreso ───────────────────────────────────────

export const workoutLog = pgTable("workout_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => planAssignment.id),
  planDayId: uuid("plan_day_id")
    .notNull()
    .references(() => planDay.id),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const exerciseLog = pgTable("exercise_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutLogId: uuid("workout_log_id")
    .notNull()
    .references(() => workoutLog.id, { onDelete: "cascade" }),
  planExerciseId: uuid("plan_exercise_id")
    .notNull()
    .references(() => planExercise.id),
  setsDone: integer("sets_done"),
  repsDone: text("reps_done"),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  notes: text("notes"),
});

// ─── Dominio: Peso corporal ────────────────────────────────────────────────

export const bodyWeight = pgTable("body_weight", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  notes: text("notes"),
});

// ─── Notificaciones ───────────────────────────────────────────────────────

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromId: text("from_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  toId: text("to_id").references(() => user.id, { onDelete: "set null" }), // null = todos
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

// ─── Turnos (clases recurrentes) ──────────────────────────────────────────

export const classSlot = pgTable("class_slot", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Lun … 5=Vie
  startTime: text("start_time").notNull(),     // "16:00"
  type: text("type").notNull(),                // "musculación" | "funcional"
  maxCapacity: integer("max_capacity"),
});

export const slotEnrollment = pgTable("slot_enrollment", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => classSlot.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});

// ─── Asistencias ──────────────────────────────────────────────────────────

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  present: boolean("present").notNull().default(true),
  notes: text("notes"),
});

// ─── Relations ────────────────────────────────────────────────────────────

export const planRelations = relations(plan, ({ many }) => ({
  planDays: many(planDay),
}));

export const planDayRelations = relations(planDay, ({ one, many }) => ({
  plan: one(plan, { fields: [planDay.planId], references: [plan.id] }),
  planExercises: many(planExercise),
}));

export const planExerciseRelations = relations(planExercise, ({ one }) => ({
  planDay: one(planDay, { fields: [planExercise.planDayId], references: [planDay.id] }),
  exercise: one(exercise, { fields: [planExercise.exerciseId], references: [exercise.id] }),
}));

export const exerciseRelations = relations(exercise, ({ many }) => ({
  planExercises: many(planExercise),
}));

// ─── Types ────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Plan = typeof plan.$inferSelect;
export type PlanDay = typeof planDay.$inferSelect;
export type PlanExercise = typeof planExercise.$inferSelect;
export type Exercise = typeof exercise.$inferSelect;
export type PlanAssignment = typeof planAssignment.$inferSelect;
