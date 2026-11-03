-- Etapa 2: desacoplar el registro de sesión del modelo viejo (plan_assignment).
-- La rutina del alumno ahora vive en client_day_block / client_day_exercise,
-- así que una sesión registrada puede no tener plan_assignment ni un único plan_day.
-- Correr en el SQL editor de Supabase (PROD) ANTES de deployar el código.
ALTER TABLE workout_log ALTER COLUMN assignment_id DROP NOT NULL;
ALTER TABLE workout_log ALTER COLUMN plan_day_id   DROP NOT NULL;
