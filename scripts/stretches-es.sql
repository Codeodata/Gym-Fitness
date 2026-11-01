-- Estiramientos para PROD (dataset free-exercise-db-api, nombres y descripciones en español).
-- Correr en el Supabase SQL editor DESPUÉS de la migración 0002 (columna is_stretch).
-- Idempotente: inserta los que falten y actualiza las descripciones de los existentes.

INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de columna con rotación de pie', 'Estiramiento dinámico: llevás los brazos arriba y rotás para abrir el pecho y la espalda alta.', 'chest', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-standing-reach-up-back-rotation-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-standing-reach-up-back-rotation-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de columna con rotación de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de pecho con brazos arriba', 'Estiramiento estático que abre el pecho extendiendo los brazos arriba y llevándolos hacia atrás.', 'chest', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-above-head-chest-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-above-head-chest-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de pecho con brazos arriba');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento dinámico de pecho', 'Movimiento rítmico de brazos para ganar movilidad en el pecho y entrar en calor los pectorales.', 'chest', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-dynamic-chest-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-dynamic-chest-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento dinámico de pecho');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Rotación de espalda arrodillado', 'Movilidad que mejora la rotación de la columna dorsal arrodillado, abriendo también pecho y hombros.', 'chest', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-kneeling-back-rotation-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-kneeling-back-rotation-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Rotación de espalda arrodillado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de columna', 'Estiramiento en el piso que alarga la columna y mejora la flexibilidad de la zona lumbar e isquiotibiales.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-spine-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-spine-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de columna');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de dorsales arrodillado', 'Estiramiento en el piso para alargar el dorsal ancho y mejorar la movilidad del hombro.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-kneeling-lat-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-kneeling-lat-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de dorsales arrodillado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de espalda baja sentado', 'Estiramiento suave sentado, llevando el torso hacia adelante para aliviar la tensión lumbar.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-seated-lower-back-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-seated-lower-back-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de espalda baja sentado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de espalda media', 'Estiramiento estático para alargar los músculos de la espalda media (zona dorsal).', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/male/stretching-middle-back-stretch-1.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/male/stretching-middle-back-stretch-1.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de espalda media');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de espalda sentado inclinado', 'Estiramiento estático sentado, inclinándote hacia adelante para alargar la espalda baja y alta.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-sitting-bent-over-back-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-sitting-bent-over-back-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de espalda sentado inclinado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de inclinación lateral', 'Inclinación lateral de pie para alargar los oblicuos y los músculos del costado del cuerpo.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-slopes-towards-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-slopes-towards-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de inclinación lateral');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento lateral de cuello', 'Estiramiento estático suave para los músculos laterales del cuello; mejora la movilidad y reduce tensión.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-neck-side-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-neck-side-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento lateral de cuello');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento lateral de pie', 'Inclinación lateral de pie para trabajar los oblicuos y alargar el costado del torso.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/male/stretching-standing-lateral-stretch-1.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/male/stretching-standing-lateral-stretch-1.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento lateral de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Rotación de espalda de pie', 'Estiramiento de pie con rotación para trabajar los oblicuos y los músculos rotadores de la espalda.', 'back', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-standing-back-rotation-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-standing-back-rotation-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Rotación de espalda de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de deltoides posterior', 'Estiramiento del hombro posterior para ganar flexibilidad y reducir tensión.', 'shoulders', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-rear-deltoid-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-rear-deltoid-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de deltoides posterior');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de hombros sentado', 'Estiramiento sentado para mejorar la flexibilidad y movilidad de los hombros (anterior, inferior y posterior).', 'shoulders', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-seated-shoulder-flexor-depresor-retractor.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-seated-shoulder-flexor-depresor-retractor.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de hombros sentado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Movilidad de hombros con banda', 'Estiramiento y movilidad de hombros con banda elástica para entrar en calor deltoides y manguito rotador.', 'shoulders', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-band-warm-up-shoulder-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-band-warm-up-shoulder-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Movilidad de hombros con banda');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de hombros en fondo invertido', 'Estiramiento de tríceps y hombros extendiendo los brazos por detrás del cuerpo y bajando el torso.', 'arms', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-reverse-dip.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-reverse-dip.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de hombros en fondo invertido');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de muñeca', 'Estiramiento de muñeca y antebrazo, de pie o sentado, extendiendo el brazo y traccionando suavemente.', 'arms', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-side-wrist-pull-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-side-wrist-pull-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de muñeca');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de tríceps arrodillado', 'Estiramiento estático de tríceps y dorsales flexionando el codo por encima de la cabeza, arrodillado.', 'arms', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-kneeling-triceps-extension.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-kneeling-triceps-extension.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de tríceps arrodillado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Círculos de cadera', 'Estiramiento dinámico para ganar movilidad en la cadera mediante movimientos circulares de la pierna.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-hip-circles-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-hip-circles-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Círculos de cadera');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de aductores de pie', 'Estiramiento estático para la cara interna del muslo: hacés una zancada hacia el costado y sostenés.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-adductor-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-adductor-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de aductores de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de aductores en cuadrupedia', 'Estiramiento en el piso, en cuatro apoyos, para aductores y zona inguinal.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-all-fours-squad-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-all-fours-squad-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de aductores en cuadrupedia');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de cuádriceps de pie', 'Estiramiento de pie que trabaja el cuádriceps para mejorar la flexibilidad.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-quadriceps-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-quadriceps-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de cuádriceps de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de cuádriceps tumbado', 'Estiramiento de cuádriceps boca abajo, con máxima flexión de rodilla.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-quadriceps-lying-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-quadriceps-lying-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de cuádriceps tumbado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de flexor de cadera y abdomen de pie', 'Estiramiento de pie que abre la cadera y alarga el abdomen llevando los brazos arriba e inclinándote hacia atrás.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-ceiling-look-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-ceiling-look-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de flexor de cadera y abdomen de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de flexor de cadera y cuádriceps', 'Estiramiento que alarga flexores de cadera y cuádriceps en posición arrodillada o de zancada.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-hip-flexor-and-quad-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-hip-flexor-and-quad-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de flexor de cadera y cuádriceps');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de gemelos con cinta', 'Estiramiento sentado usando una banda o cinta para alargar los gemelos.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-calf-stretch-with-strap.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-calf-stretch-with-strap.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de gemelos con cinta');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de gemelos con soga', 'Estiramiento estático de gemelos usando una soga o cinta para llevar el pie a flexión dorsal.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-calf-stretch-with-rope.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-calf-stretch-with-rope.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de gemelos con soga');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de gemelos en banco', 'Estiramiento estático apoyado en un banco para alargar los gemelos.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-standing-bench-calf-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-standing-bench-calf-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de gemelos en banco');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de gemelos en escalón', 'Estiramiento usando un escalón para alargar y ganar flexibilidad en los gemelos.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-stairs-calf-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-stairs-calf-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de gemelos en escalón');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de gemelos sentado', 'Estiramiento sentado enfocado en alargar los gemelos.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-seated-calf-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-seated-calf-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de gemelos sentado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de isquiotibiales de pie', 'Estiramiento estático para los isquiotibiales, en la parte posterior del muslo.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-hamstring-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-hamstring-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de isquiotibiales de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de peroneos', 'Estiramiento estático para los músculos externos de la pierna (peroneos).', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-peroneals-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-peroneals-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de peroneos');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de pies y tobillos', 'Estiramiento para ganar flexibilidad y movilidad en los pies y tobillos.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-feet-and-ankles-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-feet-and-ankles-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de pies y tobillos');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de rodilla al pecho de pie', 'Estiramiento de flexores de cadera y glúteos llevando una rodilla hacia el pecho, de pie.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-knee-raise.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-knee-raise.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de rodilla al pecho de pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento del corredor', 'Estiramiento de flexores de cadera e isquiotibiales dando un paso al frente hacia una zancada profunda.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-runners-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-runners-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento del corredor');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento sentado (posición del barco)', 'Estiramiento de flexibilidad sentado enfocado en la cara interna del muslo y la cadera.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-boat-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-boat-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento sentado (posición del barco)');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento tocando la punta del pie', 'Estiramiento clásico: te inclinás hacia adelante para tocar la punta del pie, alargando isquiotibiales y espalda baja.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-front-toe-touch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-front-toe-touch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento tocando la punta del pie');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Rotación de tobillos', 'Movilidad con círculos de tobillo para los gemelos y mejorar la flexibilidad del tobillo.', 'legs', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-feet-and-ankles-rotation-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-feet-and-ankles-rotation-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Rotación de tobillos');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de columna en pelota', 'Extensión y estiramiento suave de la espalda apoyando el cuerpo sobre una pelota para movilizar la columna.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-spinal-stretch-on-exercise-ball.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-spinal-stretch-on-exercise-ball.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de columna en pelota');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de cuello (mentón al pecho)', 'Estiramiento estático suave para liberar tensión en el cuello llevando el mentón hacia el pecho.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-chin-to-chest-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-chin-to-chest-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de cuello (mentón al pecho)');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de espalda baja (flexión de piernas)', 'Estiramiento que combina flexión del tronco con movimiento de piernas para alargar abdominales y flexores de cadera.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-flexion-leg-sit-up.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-flexion-leg-sit-up.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de espalda baja (flexión de piernas)');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de extensión de cadera', 'Estiramiento enfocado en extender la cadera para trabajar los flexores de cadera tensos.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-hip-extension-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-hip-extension-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de extensión de cadera');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de flexor de cadera (pie elevado)', 'Estiramiento profundo del flexor de cadera con el pie de atrás elevado para mayor flexibilidad.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-hip-flexor-stretch-rear-foot-elevated.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-hip-flexor-stretch-rear-foot-elevated.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de flexor de cadera (pie elevado)');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de flexor de cadera arrodillado', 'Estiramiento arrodillado para los flexores de cadera, con rotación del tronco.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-crossover-kneeling-hip-flexor-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-crossover-kneeling-hip-flexor-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de flexor de cadera arrodillado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de torsión sentado', 'Rotación del tronco sentado para estirar oblicuos y espalda baja.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-seated-twist-straight-arm.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-seated-twist-straight-arm.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de torsión sentado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento lateral de pie (brazo flexionado)', 'Inclinación lateral de pie para alargar oblicuos y dorsales.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-standing-side-bend-bent-arm.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-standing-side-bend-bent-arm.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento lateral de pie (brazo flexionado)');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento rotacional de columna tumbado', 'Estiramiento rotacional tumbado que mejora la movilidad de la columna y estira oblicuos y espalda baja.', 'core', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-iron-cross-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-iron-cross-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento rotacional de columna tumbado');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de una pierna (rodilla flexionada)', 'Estiramiento en el piso para flexores de cadera e isquiotibiales llevando una pierna flexionada hacia el pecho.', 'cardio', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-single-leg-stretch-bent-knee.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-single-leg-stretch-bent-knee.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de una pierna (rodilla flexionada)');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento de una pierna estirada', 'Estiramiento en el piso para isquiotibiales elevando y sosteniendo una pierna estirada hacia el cuerpo.', 'cardio', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-single-straight-leg-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-single-straight-leg-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento de una pierna estirada');
INSERT INTO exercise (name, description, muscle_group, image_url, video_url, difficulty, is_stretch)
SELECT 'Estiramiento en zancada lateral', 'Estiramiento dinámico para entrar en calor y movilizar cadera, cara interna del muslo y piernas.', 'cardio', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-posters/female/stretching-plyo-side-lunge-stretch.jpg', 'https://pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev/exercise-videos/female/stretching-plyo-side-lunge-stretch.mp4', 'beginner', true
WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE name = 'Estiramiento en zancada lateral');

-- Actualiza descripciones (y marca is_stretch) en las filas ya existentes.
UPDATE exercise SET description = 'Estiramiento dinámico: llevás los brazos arriba y rotás para abrir el pecho y la espalda alta.', is_stretch = true WHERE name = 'Estiramiento de columna con rotación de pie';
UPDATE exercise SET description = 'Estiramiento estático que abre el pecho extendiendo los brazos arriba y llevándolos hacia atrás.', is_stretch = true WHERE name = 'Estiramiento de pecho con brazos arriba';
UPDATE exercise SET description = 'Movimiento rítmico de brazos para ganar movilidad en el pecho y entrar en calor los pectorales.', is_stretch = true WHERE name = 'Estiramiento dinámico de pecho';
UPDATE exercise SET description = 'Movilidad que mejora la rotación de la columna dorsal arrodillado, abriendo también pecho y hombros.', is_stretch = true WHERE name = 'Rotación de espalda arrodillado';
UPDATE exercise SET description = 'Estiramiento en el piso que alarga la columna y mejora la flexibilidad de la zona lumbar e isquiotibiales.', is_stretch = true WHERE name = 'Estiramiento de columna';
UPDATE exercise SET description = 'Estiramiento en el piso para alargar el dorsal ancho y mejorar la movilidad del hombro.', is_stretch = true WHERE name = 'Estiramiento de dorsales arrodillado';
UPDATE exercise SET description = 'Estiramiento suave sentado, llevando el torso hacia adelante para aliviar la tensión lumbar.', is_stretch = true WHERE name = 'Estiramiento de espalda baja sentado';
UPDATE exercise SET description = 'Estiramiento estático para alargar los músculos de la espalda media (zona dorsal).', is_stretch = true WHERE name = 'Estiramiento de espalda media';
UPDATE exercise SET description = 'Estiramiento estático sentado, inclinándote hacia adelante para alargar la espalda baja y alta.', is_stretch = true WHERE name = 'Estiramiento de espalda sentado inclinado';
UPDATE exercise SET description = 'Inclinación lateral de pie para alargar los oblicuos y los músculos del costado del cuerpo.', is_stretch = true WHERE name = 'Estiramiento de inclinación lateral';
UPDATE exercise SET description = 'Estiramiento estático suave para los músculos laterales del cuello; mejora la movilidad y reduce tensión.', is_stretch = true WHERE name = 'Estiramiento lateral de cuello';
UPDATE exercise SET description = 'Inclinación lateral de pie para trabajar los oblicuos y alargar el costado del torso.', is_stretch = true WHERE name = 'Estiramiento lateral de pie';
UPDATE exercise SET description = 'Estiramiento de pie con rotación para trabajar los oblicuos y los músculos rotadores de la espalda.', is_stretch = true WHERE name = 'Rotación de espalda de pie';
UPDATE exercise SET description = 'Estiramiento del hombro posterior para ganar flexibilidad y reducir tensión.', is_stretch = true WHERE name = 'Estiramiento de deltoides posterior';
UPDATE exercise SET description = 'Estiramiento sentado para mejorar la flexibilidad y movilidad de los hombros (anterior, inferior y posterior).', is_stretch = true WHERE name = 'Estiramiento de hombros sentado';
UPDATE exercise SET description = 'Estiramiento y movilidad de hombros con banda elástica para entrar en calor deltoides y manguito rotador.', is_stretch = true WHERE name = 'Movilidad de hombros con banda';
UPDATE exercise SET description = 'Estiramiento de tríceps y hombros extendiendo los brazos por detrás del cuerpo y bajando el torso.', is_stretch = true WHERE name = 'Estiramiento de hombros en fondo invertido';
UPDATE exercise SET description = 'Estiramiento de muñeca y antebrazo, de pie o sentado, extendiendo el brazo y traccionando suavemente.', is_stretch = true WHERE name = 'Estiramiento de muñeca';
UPDATE exercise SET description = 'Estiramiento estático de tríceps y dorsales flexionando el codo por encima de la cabeza, arrodillado.', is_stretch = true WHERE name = 'Estiramiento de tríceps arrodillado';
UPDATE exercise SET description = 'Estiramiento dinámico para ganar movilidad en la cadera mediante movimientos circulares de la pierna.', is_stretch = true WHERE name = 'Círculos de cadera';
UPDATE exercise SET description = 'Estiramiento estático para la cara interna del muslo: hacés una zancada hacia el costado y sostenés.', is_stretch = true WHERE name = 'Estiramiento de aductores de pie';
UPDATE exercise SET description = 'Estiramiento en el piso, en cuatro apoyos, para aductores y zona inguinal.', is_stretch = true WHERE name = 'Estiramiento de aductores en cuadrupedia';
UPDATE exercise SET description = 'Estiramiento de pie que trabaja el cuádriceps para mejorar la flexibilidad.', is_stretch = true WHERE name = 'Estiramiento de cuádriceps de pie';
UPDATE exercise SET description = 'Estiramiento de cuádriceps boca abajo, con máxima flexión de rodilla.', is_stretch = true WHERE name = 'Estiramiento de cuádriceps tumbado';
UPDATE exercise SET description = 'Estiramiento de pie que abre la cadera y alarga el abdomen llevando los brazos arriba e inclinándote hacia atrás.', is_stretch = true WHERE name = 'Estiramiento de flexor de cadera y abdomen de pie';
UPDATE exercise SET description = 'Estiramiento que alarga flexores de cadera y cuádriceps en posición arrodillada o de zancada.', is_stretch = true WHERE name = 'Estiramiento de flexor de cadera y cuádriceps';
UPDATE exercise SET description = 'Estiramiento sentado usando una banda o cinta para alargar los gemelos.', is_stretch = true WHERE name = 'Estiramiento de gemelos con cinta';
UPDATE exercise SET description = 'Estiramiento estático de gemelos usando una soga o cinta para llevar el pie a flexión dorsal.', is_stretch = true WHERE name = 'Estiramiento de gemelos con soga';
UPDATE exercise SET description = 'Estiramiento estático apoyado en un banco para alargar los gemelos.', is_stretch = true WHERE name = 'Estiramiento de gemelos en banco';
UPDATE exercise SET description = 'Estiramiento usando un escalón para alargar y ganar flexibilidad en los gemelos.', is_stretch = true WHERE name = 'Estiramiento de gemelos en escalón';
UPDATE exercise SET description = 'Estiramiento sentado enfocado en alargar los gemelos.', is_stretch = true WHERE name = 'Estiramiento de gemelos sentado';
UPDATE exercise SET description = 'Estiramiento estático para los isquiotibiales, en la parte posterior del muslo.', is_stretch = true WHERE name = 'Estiramiento de isquiotibiales de pie';
UPDATE exercise SET description = 'Estiramiento estático para los músculos externos de la pierna (peroneos).', is_stretch = true WHERE name = 'Estiramiento de peroneos';
UPDATE exercise SET description = 'Estiramiento para ganar flexibilidad y movilidad en los pies y tobillos.', is_stretch = true WHERE name = 'Estiramiento de pies y tobillos';
UPDATE exercise SET description = 'Estiramiento de flexores de cadera y glúteos llevando una rodilla hacia el pecho, de pie.', is_stretch = true WHERE name = 'Estiramiento de rodilla al pecho de pie';
UPDATE exercise SET description = 'Estiramiento de flexores de cadera e isquiotibiales dando un paso al frente hacia una zancada profunda.', is_stretch = true WHERE name = 'Estiramiento del corredor';
UPDATE exercise SET description = 'Estiramiento de flexibilidad sentado enfocado en la cara interna del muslo y la cadera.', is_stretch = true WHERE name = 'Estiramiento sentado (posición del barco)';
UPDATE exercise SET description = 'Estiramiento clásico: te inclinás hacia adelante para tocar la punta del pie, alargando isquiotibiales y espalda baja.', is_stretch = true WHERE name = 'Estiramiento tocando la punta del pie';
UPDATE exercise SET description = 'Movilidad con círculos de tobillo para los gemelos y mejorar la flexibilidad del tobillo.', is_stretch = true WHERE name = 'Rotación de tobillos';
UPDATE exercise SET description = 'Extensión y estiramiento suave de la espalda apoyando el cuerpo sobre una pelota para movilizar la columna.', is_stretch = true WHERE name = 'Estiramiento de columna en pelota';
UPDATE exercise SET description = 'Estiramiento estático suave para liberar tensión en el cuello llevando el mentón hacia el pecho.', is_stretch = true WHERE name = 'Estiramiento de cuello (mentón al pecho)';
UPDATE exercise SET description = 'Estiramiento que combina flexión del tronco con movimiento de piernas para alargar abdominales y flexores de cadera.', is_stretch = true WHERE name = 'Estiramiento de espalda baja (flexión de piernas)';
UPDATE exercise SET description = 'Estiramiento enfocado en extender la cadera para trabajar los flexores de cadera tensos.', is_stretch = true WHERE name = 'Estiramiento de extensión de cadera';
UPDATE exercise SET description = 'Estiramiento profundo del flexor de cadera con el pie de atrás elevado para mayor flexibilidad.', is_stretch = true WHERE name = 'Estiramiento de flexor de cadera (pie elevado)';
UPDATE exercise SET description = 'Estiramiento arrodillado para los flexores de cadera, con rotación del tronco.', is_stretch = true WHERE name = 'Estiramiento de flexor de cadera arrodillado';
UPDATE exercise SET description = 'Rotación del tronco sentado para estirar oblicuos y espalda baja.', is_stretch = true WHERE name = 'Estiramiento de torsión sentado';
UPDATE exercise SET description = 'Inclinación lateral de pie para alargar oblicuos y dorsales.', is_stretch = true WHERE name = 'Estiramiento lateral de pie (brazo flexionado)';
UPDATE exercise SET description = 'Estiramiento rotacional tumbado que mejora la movilidad de la columna y estira oblicuos y espalda baja.', is_stretch = true WHERE name = 'Estiramiento rotacional de columna tumbado';
UPDATE exercise SET description = 'Estiramiento en el piso para flexores de cadera e isquiotibiales llevando una pierna flexionada hacia el pecho.', is_stretch = true WHERE name = 'Estiramiento de una pierna (rodilla flexionada)';
UPDATE exercise SET description = 'Estiramiento en el piso para isquiotibiales elevando y sosteniendo una pierna estirada hacia el cuerpo.', is_stretch = true WHERE name = 'Estiramiento de una pierna estirada';
UPDATE exercise SET description = 'Estiramiento dinámico para entrar en calor y movilizar cadera, cara interna del muslo y piernas.', is_stretch = true WHERE name = 'Estiramiento en zancada lateral';

-- Verificación: SELECT count(*) FROM exercise WHERE is_stretch;  -- 51
