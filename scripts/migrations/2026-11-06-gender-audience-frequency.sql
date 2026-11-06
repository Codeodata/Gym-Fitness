-- Plantillas por género/frecuencia + aviso de nuevo registro.
-- Columnas text nullable (los enums se validan en la app con Drizzle, no en Postgres).
-- Correr en el SQL editor de Supabase (PROD) ANTES de deployar el código.
ALTER TABLE "user"       ADD COLUMN IF NOT EXISTS gender    text;  -- 'chica' | 'chico'
ALTER TABLE plan         ADD COLUMN IF NOT EXISTS audience  text;  -- 'chicas' | 'chicos' (null = general)
ALTER TABLE plan         ADD COLUMN IF NOT EXISTS frequency text;  -- '2dias' | '3dias' | 'pase_libre'
ALTER TABLE notification ADD COLUMN IF NOT EXISTS type      text;  -- 'registration' = alta de alumno
