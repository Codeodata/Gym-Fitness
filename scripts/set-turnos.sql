-- Grilla de turnos del gimnasio (con el orden de tipos que ya tenían).
--   Lunes/Miércoles/Viernes (1,3,5): 16:00, 19:00, 20:00
--   Martes/Jueves          (2,4):    15:00, 18:00, 20:00
-- Tipo por turno (musculación/funcional) según el orden previo. Sin cupo máximo (NULL = ilimitado).
-- Correr en el SQL editor de Supabase (PROD). Seguro: tras vaciar alumnos no hay inscripciones.
DELETE FROM class_slot;
INSERT INTO class_slot (day_of_week, start_time, type, max_capacity) VALUES
  (1,'16:00','musculación',NULL),(1,'19:00','funcional',NULL),(1,'20:00','musculación',NULL),
  (3,'16:00','funcional',NULL),  (3,'19:00','musculación',NULL),(3,'20:00','musculación',NULL),
  (5,'16:00','musculación',NULL),(5,'19:00','funcional',NULL),(5,'20:00','musculación',NULL),
  (2,'15:00','musculación',NULL),(2,'18:00','musculación',NULL),(2,'20:00','funcional',NULL),
  (4,'15:00','funcional',NULL),  (4,'18:00','musculación',NULL),(4,'20:00','musculación',NULL);
