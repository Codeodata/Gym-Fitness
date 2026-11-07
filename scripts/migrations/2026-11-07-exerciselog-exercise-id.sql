-- Registro de pesos para la rutina real del alumno.
-- La rutina asignada vive en client_day_exercise (sin plan_exercise), así que
-- exercise_log pasa a guardar el ejercicio directo (exercise_id) y
-- plan_exercise_id queda opcional. Aditivo e idempotente.
-- Correr en el SQL editor de Supabase (PROD) ANTES de deployar el código.
ALTER TABLE exercise_log ALTER COLUMN plan_exercise_id DROP NOT NULL;
ALTER TABLE exercise_log ADD COLUMN IF NOT EXISTS exercise_id uuid REFERENCES exercise(id) ON DELETE CASCADE;
-- Completar los registros viejos desde su plan_exercise.
UPDATE exercise_log el SET exercise_id = pe.exercise_id
  FROM plan_exercise pe
  WHERE el.plan_exercise_id = pe.id AND el.exercise_id IS NULL;
CREATE INDEX IF NOT EXISTS exercise_log_exercise_id_idx ON exercise_log (exercise_id);
