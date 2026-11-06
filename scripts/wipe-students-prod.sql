-- Vaciar la base de ALUMNOS (arranque real, sin datos de prueba).
-- Borra los usuarios role='client' y, por ON DELETE CASCADE, todo lo asociado:
-- sesiones, cuentas, asignaciones, semana (client_day_block / client_day_exercise),
-- logs (workout_log → exercise_log / workout_set), pesos, asistencias,
-- inscripciones a turnos y notificaciones enviadas por ellos.
--
-- SE CONSERVA: tu cuenta de profe (role='trainer'), la biblioteca de
-- ejercicios/estiramientos, las plantillas (plan / plan_day / plan_exercise)
-- y los turnos (class_slot).
--
-- Correr en el SQL editor de Supabase (PROD). Hacelo DESPUÉS de aplicar la
-- migración 2026-11-06-gender-audience-frequency.sql.

-- 1) Chequeo previo: cuántos alumnos hay.
SELECT count(*) AS alumnos_a_borrar FROM "user" WHERE role = 'client';

-- 2) Borrado (la cascada limpia el resto automáticamente).
DELETE FROM "user" WHERE role = 'client';

-- 3) Verificación: debería quedar solo el/los profe.
SELECT role, count(*) FROM "user" GROUP BY role;
