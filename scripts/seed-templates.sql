-- Plantillas base del profe: Mujeres/Hombres × (2, 3 y 5 días).
-- Las de 5 días traen los ejercicios del ejemplo (con su grupo muscular).
-- Las de 2 y 3 días se arman con los primeros 2 y 3 días de la de 5 días.
-- (Los valores de 'audience' siguen siendo chicas/chicos a nivel datos; la UI muestra Mujeres/Hombres.)
-- Reemplaza las plantillas anteriores. Correr en el SQL editor de Supabase (PROD),
-- DESPUÉS de la migración 2026-11-06-gender-audience-frequency.sql.

-- 1) Limpiar plantillas previas (con audiencia). No toca planes sin audiencia.
DELETE FROM plan WHERE audience IS NOT NULL;

-- 2) Helper: obtener o crear un ejercicio por nombre, fijando su grupo muscular.
CREATE OR REPLACE FUNCTION pg_temp.ex(p_name text, p_muscle text DEFAULT 'full_body') RETURNS uuid AS $fn$
  DECLARE r uuid; cur text;
  BEGIN
    SELECT id, muscle_group::text INTO r, cur FROM exercise WHERE name = p_name LIMIT 1;
    IF r IS NULL THEN
      INSERT INTO exercise (name, muscle_group) VALUES (p_name, p_muscle::muscle_group) RETURNING id INTO r;
    ELSIF cur = 'full_body' AND p_muscle <> 'full_body' THEN
      UPDATE exercise SET muscle_group = p_muscle::muscle_group WHERE id = r;
    END IF;
    RETURN r;
  END;
$fn$ LANGUAGE plpgsql;

-- 3) Helper: crea una plantilla copiando los primeros n días (con ejercicios) de otra.
CREATE OR REPLACE FUNCTION pg_temp.subset(src uuid, p_name text, aud text, freq text, dpw int, n int) RETURNS void AS $fn$
  DECLARE newpid uuid; d record; newdid uuid;
  BEGIN
    INSERT INTO plan (name, category, audience, frequency, days_per_week)
    VALUES (p_name, 'musculación', aud, freq, dpw) RETURNING id INTO newpid;
    FOR d IN SELECT * FROM plan_day WHERE plan_id = src AND day_number <= n ORDER BY day_number LOOP
      INSERT INTO plan_day (plan_id, day_number, name) VALUES (newpid, d.day_number, d.name) RETURNING id INTO newdid;
      INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, rest_seconds, notes)
      SELECT newdid, exercise_id, section, order_index, sets, reps, rest_seconds, notes
      FROM plan_exercise WHERE plan_day_id = d.id ORDER BY order_index;
    END LOOP;
  END;
$fn$ LANGUAGE plpgsql;

-- 4) Crear plantillas.
DO $$
DECLARE pid_f uuid; pid_m uuid; did uuid;
BEGIN
  -- ===================== MUJERES · 5 días =====================
  INSERT INTO plan (name, category, audience, frequency, days_per_week)
  VALUES ('Mujeres · 5 días', 'musculación', 'chicas', 'pase_libre', 5) RETURNING id INTO pid_f;

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_f,1,'Tren inferior (pesado)') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Sentadilla','legs'),'main',0,4,'10-15',NULL),
    (did, pg_temp.ex('Peso muerto rumano','legs'),'main',1,4,'10-15',NULL),
    (did, pg_temp.ex('Extensión de cadera (por pierna)','legs'),'main',2,3,'10-15',NULL),
    (did, pg_temp.ex('Prensa','legs'),'main',3,3,'12-15',NULL),
    (did, pg_temp.ex('Elevación de talones (barra)','legs'),'main',4,4,'12-15',NULL);

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_f,2,'Tren superior') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Press banca (1 mancuerna)','chest'),'main',0,4,'10-15',NULL),
    (did, pg_temp.ex('Remo con mancuerna','back'),'main',1,4,'10-15',NULL),
    (did, pg_temp.ex('Press militar sentado','shoulders'),'main',2,3,'10-15',NULL),
    (did, pg_temp.ex('Elevaciones laterales','shoulders'),'main',3,3,'12-15',NULL),
    (did, pg_temp.ex('Curl de bíceps','arms'),'main',4,3,'12-15',NULL),
    (did, pg_temp.ex('Extensión de tríceps','arms'),'main',5,3,'12-15',NULL);

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_f,3,'Piernas') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Sentadilla sumo','legs'),'main',0,4,'15',NULL),
    (did, pg_temp.ex('Hip thrust','legs'),'main',1,4,'15','Progresión: 15x75kg · 10x90kg · 5x100kg · 20x60kg'),
    (did, pg_temp.ex('Step up','legs'),'main',2,3,'15',NULL),
    (did, pg_temp.ex('Extensión de cuádriceps en máquina','legs'),'main',3,3,'12-15',NULL),
    (did, pg_temp.ex('Búlgaras (2 mancuernas)','legs'),'main',4,3,'10-15',NULL);

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_f,4,'Brazos / hombros') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Vuelos laterales','shoulders'),'main',0,4,'12-15',NULL),
    (did, pg_temp.ex('Press hombro unilateral','shoulders'),'main',1,4,'12-15',NULL),
    (did, pg_temp.ex('Elevaciones laterales parciales','shoulders'),'main',2,4,'12-15',NULL),
    (did, pg_temp.ex('Elevaciones frontales (banco)','shoulders'),'main',3,4,'12-15',NULL),
    (did, pg_temp.ex('Fondos paralelos','arms'),'main',4,4,'12-15',NULL),
    (did, pg_temp.ex('Tríceps unilateral en polea','arms'),'main',5,3,'15',NULL),
    (did, pg_temp.ex('Tríceps con cuerda a dos manos','arms'),'main',6,4,'12-15',NULL),
    (did, pg_temp.ex('Curl de bíceps','arms'),'main',7,4,'12-15',NULL),
    (did, pg_temp.ex('Curl de bíceps sentado','arms'),'main',8,4,'12-15',NULL);

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_f,5,'Día 5');

  -- ===================== HOMBRES · 5 días =====================
  INSERT INTO plan (name, category, audience, frequency, days_per_week)
  VALUES ('Hombres · 5 días', 'musculación', 'chicos', 'pase_libre', 5) RETURNING id INTO pid_m;

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_m,1,'Piernas / cuádriceps (pesado)') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Sentadilla','legs'),'main',0,5,'6-8','cluster 3+3+2 (20")'),
    (did, pg_temp.ex('Prensa','legs'),'main',1,4,'10-12','cluster 5+5+5 (15")'),
    (did, pg_temp.ex('Búlgaras','legs'),'main',2,3,'10','dropset'),
    (did, pg_temp.ex('Extensión de cuádriceps','legs'),'main',3,3,'12','rest-pause 12+6+4'),
    (did, pg_temp.ex('Gemelos de pie','legs'),'main',4,4,'15',NULL),
    (did, pg_temp.ex('Tibial','legs'),'main',5,3,'20',NULL);

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_m,2,'Pecho / hombros') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Press banca','chest'),'main',0,5,'5','cluster 2+2+2 (15")'),
    (did, pg_temp.ex('Press inclinado','chest'),'main',1,4,'8-10','dropset'),
    (did, pg_temp.ex('Cruces con bandas','chest'),'main',2,3,'12','fallo + fallo'),
    (did, pg_temp.ex('Press hombros sentado','shoulders'),'main',3,4,'8-10',NULL),
    (did, pg_temp.ex('Vuelos laterales','shoulders'),'main',4,4,'12-15','dropset'),
    (did, pg_temp.ex('Pájaros','shoulders'),'main',5,1,'15',NULL);

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_m,3,'Espalda / glúteos') RETURNING id INTO did;
  INSERT INTO plan_exercise (plan_day_id, exercise_id, section, order_index, sets, reps, notes) VALUES
    (did, pg_temp.ex('Peso muerto','back'),'main',0,5,'5-6',NULL),
    (did, pg_temp.ex('Dominadas lastradas','back'),'main',1,4,'6-8','cluster 3+3+2'),
    (did, pg_temp.ex('Remo T','back'),'main',2,5,'6-8',NULL),
    (did, pg_temp.ex('Hip thrust','legs'),'main',3,5,'6-8','cluster 3+3+3'),
    (did, pg_temp.ex('Femoral tumbado','legs'),'main',4,3,'10',NULL),
    (did, pg_temp.ex('Patada de glúteo','legs'),'main',5,3,'15','a definir series');

  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_m,4,'Brazos');
  INSERT INTO plan_day (plan_id, day_number, name) VALUES (pid_m,5,'Fullbody potencia');

  -- ===================== 2 y 3 días = primeros días de la de 5 =====================
  PERFORM pg_temp.subset(pid_f, 'Mujeres · 2 días', 'chicas', '2dias', 2, 2);
  PERFORM pg_temp.subset(pid_f, 'Mujeres · 3 días', 'chicas', '3dias', 3, 3);
  PERFORM pg_temp.subset(pid_m, 'Hombres · 2 días', 'chicos', '2dias', 2, 2);
  PERFORM pg_temp.subset(pid_m, 'Hombres · 3 días', 'chicos', '3dias', 3, 3);
END $$;
