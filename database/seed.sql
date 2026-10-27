-- ============================================================
-- EcoRecicla Engativá — datos semilla (español)
-- Contraseña de TODOS los usuarios demo: Demo1234!
-- (hash bcrypt de 10 rondas, documentada en README.md)
-- ============================================================

BEGIN;

TRUNCATE calificacion, recoleccion, detalle_solicitud, solicitud_recoleccion,
  ruta_recoleccion, punto_reciclaje, residuo, categoria_residuo, reciclador,
  organizacion_recicladores, usuario, upz, sugerencia_residuo
  RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------
-- 1. Las 9 UPZ de Engativá
-- ------------------------------------------------------------
INSERT INTO upz (id, codigo, nombre) VALUES
  (1, '26',  'Las Ferias'),
  (2, '29',  'Minuto de Dios'),
  (3, '30',  'Boyacá Real'),
  (4, '31',  'Santa Cecilia'),
  (5, '72',  'Bolivia'),
  (6, '73',  'Garcés Navas'),
  (7, '74',  'Engativá'),
  (8, '105', 'Jardín Botánico'),
  (9, '116', 'Álamos');

-- ------------------------------------------------------------
-- 2. Rutas de recolección selectiva por UPZ (verosímiles)
-- ------------------------------------------------------------
INSERT INTO ruta_recoleccion (upz_id, dia_semana, franja_horaria, operador) VALUES
  (1, 'Martes',    '6:00 a. m. – 10:00 a. m.', 'Área Limpia D.C.'),
  (2, 'Miércoles', '7:00 a. m. – 11:00 a. m.', 'Área Limpia D.C.'),
  (3, 'Jueves',    '6:00 a. m. – 10:00 a. m.', 'Área Limpia D.C.'),
  (4, 'Viernes',   '7:00 a. m. – 11:00 a. m.', 'Área Limpia D.C.'),
  (5, 'Lunes',     '1:00 p. m. – 5:00 p. m.',  'Área Limpia D.C.'),
  (6, 'Martes',    '1:00 p. m. – 5:00 p. m.',  'Área Limpia D.C.'),
  (7, 'Sábado',    '6:00 a. m. – 10:00 a. m.', 'Área Limpia D.C.'),
  (8, 'Miércoles', '1:00 p. m. – 5:00 p. m.',  'Área Limpia D.C.'),
  (9, 'Sábado',    '1:00 p. m. – 5:00 p. m.',  'Área Limpia D.C.');

-- ------------------------------------------------------------
-- 3. Categorías — código de colores nacional (Resolución 2184 de 2019)
-- ------------------------------------------------------------
INSERT INTO categoria_residuo (id, nombre, color_bolsa, descripcion) VALUES
  (1, 'Aprovechables',    'blanca', 'Residuos limpios y secos que pueden reincorporarse a un ciclo productivo: plástico, vidrio, metales, papel y cartón.'),
  (2, 'Orgánicos',        'verde',  'Residuos orgánicos aprovechables: restos de comida y residuos de poda y jardín.'),
  (3, 'No aprovechables', 'negra',  'Residuos que no tienen cadena de aprovechamiento: papel higiénico, servilletas usadas, papeles contaminados con comida y demás residuos ordinarios.');

-- ------------------------------------------------------------
-- 4. Catálogo de residuos (46) con preparación previa y error frecuente
-- ------------------------------------------------------------
INSERT INTO residuo (nombre, categoria_id, preparacion_previa, error_frecuente, sinonimos) VALUES
  -- ===== BOLSA BLANCA — Aprovechables =====
  ('Tetrapak', 1,
   'Enjuagar y aplanar. Puedes dejar la tapa puesta.',
   '4 de cada 5 hogares lo disponen en bolsa negra; enjuagado y aplanado sí es aprovechable.',
   ARRAY['caja de leche', 'caja de jugo', 'tetra pak', 'tetrabrik', 'envase de leche']),
  ('Botella PET', 1,
   'Enjuagar, escurrir y aplastar para reducir volumen. Entregar con la tapa puesta.',
   'Entregarla con residuos de bebida la contamina y puede dañar todo el lote aprovechable.',
   ARRAY['botella plástica', 'botella de gaseosa', 'pet', 'botella de agua']),
  ('Papel de oficina', 1,
   'Mantener limpio y seco. No arrugar en exceso; retirar ganchos y clips grandes.',
   'Se bota junto con papel engrasado o mojado, lo que impide reciclarlo.',
   ARRAY['hojas', 'papel blanco', 'hojas de cuaderno', 'papel impreso']),
  ('Cartón', 1,
   'Desarmar y aplanar las cajas. Mantener seco y sin residuos de comida.',
   'Las cajas de pizza engrasadas NO van aquí: la grasa lo vuelve no aprovechable.',
   ARRAY['caja de cartón', 'cartón corrugado', 'caja']),
  ('Botella de vidrio', 1,
   'Enjuagar y escurrir. No es necesario retirar la etiqueta.',
   'Se dispone rota y sin protección, poniendo en riesgo a los recicladores de oficio.',
   ARRAY['vidrio', 'botella de licor', 'botella de cerveza']),
  ('Frasco de vidrio', 1,
   'Enjuagar, escurrir y entregar sin residuos. Puede ir con su tapa metálica.',
   'Se asume que todo vidrio va junto: la loza y los espejos NO son aprovechables.',
   ARRAY['frasco de mermelada', 'envase de vidrio', 'frasco de conservas']),
  ('Lata de aluminio', 1,
   'Enjuagar y aplastar para reducir volumen.',
   'Se bota en bolsa negra por pereza de enjuagarla, perdiendo un material muy cotizado.',
   ARRAY['lata de gaseosa', 'lata de cerveza', 'aluminio']),
  ('Lata de conservas', 1,
   'Enjuagar bien para retirar restos de comida y escurrir.',
   'Se dispone con residuos de comida adentro, contaminando el resto de la bolsa blanca.',
   ARRAY['lata de atún', 'enlatados', 'lata de acero']),
  ('Papel periódico', 1,
   'Mantener limpio y seco. Entregar doblado o amarrado.',
   'Usarlo para limpiar o envolver residuos húmedos lo convierte en no aprovechable.',
   ARRAY['periódico', 'prensa', 'diario']),
  ('Revistas y catálogos', 1,
   'Mantener limpios y secos. Pueden ir con grapas.',
   'Se cree que el papel brillante no se recicla; sí es aprovechable si está limpio.',
   ARRAY['revista', 'catálogo', 'folleto', 'volante']),
  ('Bolsa plástica limpia', 1,
   'Sacudir, verificar que esté limpia y seca, y agrupar varias en una sola.',
   'Se entregan con residuos adentro; una bolsa sucia contamina el material aprovechable.',
   ARRAY['bolsas', 'bolsa de mercado', 'bolsa plástica', 'empaque plástico']),
  ('Envase plástico de aseo', 1,
   'Enjuagar el envase de champú o detergente, escurrir y tapar.',
   'Se descarta con producto adentro; los restos químicos dificultan el aprovechamiento.',
   ARRAY['tarro de shampoo', 'envase de detergente', 'tarro de jabón', 'envase de suavizante']),
  ('Tapas plásticas', 1,
   'Juntar en un recipiente o bolsa pequeña para que no se pierdan.',
   'Se botan sueltas y se pierden en la clasificación por su tamaño pequeño.',
   ARRAY['tapa', 'tapitas', 'tapas de botella']),
  ('Chatarra metálica', 1,
   'Agrupar piezas pequeñas. Si tiene bordes cortantes, envolver y marcar el paquete.',
   'Se deja en el espacio público en vez de entregarla a recicladores o chatarrerías.',
   ARRAY['metal', 'hierro', 'cobre', 'varilla', 'ollas viejas']),
  ('Caja de cereal', 1,
   'Aplanar y mantener seca. Retirar la bolsa plástica interior.',
   'Se bota con la bolsa interior adentro; deben separarse los dos materiales.',
   ARRAY['cartulina', 'caja plegadiza', 'caja de pasta dental']),
  ('Sobres y papel kraft', 1,
   'Mantener limpios y secos. Retirar ventanas plásticas grandes si es fácil.',
   'Se descartan por tener tinta o pegante; aun así son aprovechables.',
   ARRAY['sobre de manila', 'papel kraft', 'bolsa de papel']),
  ('Aceite de cocina usado', 1,
   'Dejar enfriar, envasar en botella plástica con tapa y llevar a un punto limpio.',
   'Se vierte al desagüe: un litro contamina miles de litros de agua y daña las tuberías. Nunca va en ninguna bolsa.',
   ARRAY['aceite usado', 'aceite de fritura', 'aceite quemado', 'aceite de cocina']),

  -- ===== BOLSA VERDE — Orgánicos =====
  ('Cáscaras de frutas', 2,
   'Depositar sin bolsas plásticas ni etiquetas adhesivas.',
   'Se botan dentro de bolsas plásticas pequeñas que arruinan el compostaje.',
   ARRAY['cáscara de banano', 'cáscara de mango', 'cáscara de naranja', 'fruta dañada']),
  ('Cáscaras de verduras', 2,
   'Depositar directamente, escurriendo el exceso de líquido.',
   'Se mezclan con servilletas o empaques, contaminando el material orgánico.',
   ARRAY['residuos de verdura', 'cáscara de plátano', 'hojas de lechuga']),
  ('Cáscara de papa', 2,
   'Depositar directamente en la bolsa verde, sin empaques.',
   'Se asume basura ordinaria; es orgánico compostable de alto volumen en los hogares.',
   ARRAY['cáscaras de papa', 'papa dañada']),
  ('Restos de comida', 2,
   'Escurrir líquidos y depositar sin empaques, cubiertos ni servilletas.',
   'Se botan con la servilleta usada; la servilleta va en bolsa negra.',
   ARRAY['sobras de comida', 'restos de alimentos', 'comida dañada']),
  ('Borra de café', 2,
   'Depositar directamente; puede ir con el filtro de papel.',
   'Se bota al sifón del lavaplatos y con el tiempo lo tapona.',
   ARRAY['cuncho de café', 'café usado', 'residuo de café']),
  ('Bolsitas de té y aromáticas', 2,
   'Retirar la cuerda y la etiqueta si son plásticas; depositar la bolsita húmeda.',
   'Se cree que la bolsita es plástica y se manda a bolsa negra; la mayoría es compostable.',
   ARRAY['bolsa de té', 'aromática', 'infusión']),
  ('Cáscaras de huevo', 2,
   'Depositar directamente, sin el empaque de cartón (ese va en bolsa blanca).',
   'Se botan con la cubeta de cartón; los dos materiales van en bolsas distintas.',
   ARRAY['cascarón', 'cáscara de huevo']),
  ('Residuos de poda y jardín', 2,
   'Depositar sin tierra ni piedras. Ramas grandes: amarrar en manojos pequeños.',
   'Se dejan en el andén sin programar su recolección con el operador de aseo.',
   ARRAY['césped', 'pasto cortado', 'ramas', 'poda']),
  ('Hojas secas', 2,
   'Depositar sueltas o en bolsa verde, sin mezclar con barrido de polvo.',
   'Se mezclan con residuos de barrido (polvo y colillas), que van en bolsa negra.',
   ARRAY['hojarasca', 'hojas de árbol']),
  ('Flores marchitas', 2,
   'Retirar cintas, alambres y papel celofán antes de depositar.',
   'Se botan con el envoltorio plástico del ramo, contaminando la bolsa verde.',
   ARRAY['flores', 'ramo viejo']),
  ('Pan viejo', 2,
   'Depositar sin empaques ni bolsas plásticas.',
   'Se deja en el tejado «para las palomas», generando plagas; es orgánico compostable.',
   ARRAY['pan duro', 'restos de pan']),

  -- ===== BOLSA NEGRA — No aprovechables =====
  ('Icopor', 3,
   'Limpiar restos de comida y compactar para reducir volumen.',
   'Se asume aprovechable por ser «plástico», pero no tiene cadena de aprovechamiento local en Bogotá.',
   ARRAY['poliestireno', 'bandeja de icopor', 'vaso de icopor', 'espuma']),
  ('Servilletas usadas', 3,
   'Depositar directamente en la bolsa negra.',
   'Se botan en bolsa blanca con el papel; al estar contaminadas con comida no son aprovechables.',
   ARRAY['servilleta', 'servilletas sucias', 'papel de cocina usado']),
  ('Papel higiénico usado', 3,
   'Depositar en bolsa cerrada dentro de la bolsa negra.',
   'Se confunde con papel aprovechable; por ser residuo sanitario nunca se recicla.',
   ARRAY['papel higiénico', 'papel sanitario']),
  ('Pañales desechables', 3,
   'Enrollar, asegurar con las cintas y depositar en bolsa cerrada.',
   'Se disponen sueltos y abiertos, generando riesgo sanitario para los recicladores.',
   ARRAY['pañal', 'pañales']),
  ('Toallas sanitarias', 3,
   'Envolver y depositar en bolsa cerrada dentro de la bolsa negra.',
   'Se botan al inodoro y taponan las redes de alcantarillado.',
   ARRAY['toalla higiénica', 'protectores', 'tampones']),
  ('Colillas de cigarrillo', 3,
   'Apagar por completo antes de depositar.',
   'Se arrojan a la calle o a los sifones; una colilla contamina hasta 50 litros de agua.',
   ARRAY['colilla', 'cigarrillo']),
  ('Chicles', 3,
   'Envolver en un papel pequeño antes de depositar.',
   'Se pegan en andenes y mobiliario; su limpieza es costosa y no son aprovechables.',
   ARRAY['goma de mascar', 'chicle']),
  ('Envolturas de mecato', 3,
   'Sacudir los residuos y depositar en bolsa negra.',
   'Se botan en bolsa blanca por ser «plástico», pero el material metalizado no es aprovechable.',
   ARRAY['paquete de papas', 'envoltura de snacks', 'empaque de galletas', 'mecato']),
  ('Papel encerado o plastificado', 3,
   'Depositar directamente en la bolsa negra.',
   'Se confunde con papel reciclable; la capa de cera o plástico impide aprovecharlo.',
   ARRAY['papel parafinado', 'papel de mantequilla', 'vaso de papel plastificado']),
  ('Papel carbón', 3,
   'Depositar directamente en la bolsa negra.',
   'Se mezcla con papel de oficina aprovechable y contamina el lote.',
   ARRAY['papel carbónico', 'papel químico']),
  ('Esponja de cocina', 3,
   'Escurrir bien antes de depositar.',
   'Se asume reciclable por ser sintética; los materiales mixtos no se pueden aprovechar.',
   ARRAY['esponja', 'sabra', 'esponjilla']),
  ('Cepillo de dientes', 3,
   'Depositar directamente en la bolsa negra.',
   'Se bota en bolsa blanca por ser plástico, pero mezcla materiales sin cadena de aprovechamiento.',
   ARRAY['cepillo dental', 'cepillo de dientes viejo']),
  ('Desechables sucios', 3,
   'Retirar el exceso de comida y depositar en bolsa negra.',
   'Si están limpios y secos podrían aprovecharse; contaminados con comida ya no.',
   ARRAY['vasos desechables', 'cubiertos desechables', 'plato desechable']),
  ('Residuos de barrido', 3,
   'Recoger polvo y suciedad en bolsa cerrada.',
   'Se mezclan con hojas secas de jardín, que sí son aprovechables en bolsa verde.',
   ARRAY['polvo de barrer', 'basura del piso', 'barrido']),
  ('Tapabocas', 3,
   'Romper las tiras elásticas y depositar en bolsa cerrada.',
   'Se botan sueltos en la calle; son residuo sanitario y pueden enredar fauna urbana.',
   ARRAY['mascarilla', 'cubrebocas']),
  ('Cerámica y loza rota', 3,
   'Envolver en papel o cartón y marcar el paquete: «vidrio/loza rota».',
   'Se mezcla con el vidrio aprovechable; la cerámica daña los hornos de reciclaje de vidrio.',
   ARRAY['plato roto', 'taza rota', 'porcelana', 'loza']),
  ('Espejos y vidrio plano roto', 3,
   'Envolver muy bien en cartón y marcar el paquete para proteger a los recicladores.',
   'Se dispone junto a las botellas; el vidrio de espejo tiene otra composición y no se recicla junto.',
   ARRAY['espejo roto', 'vidrio de ventana', 'vidrio plano']),
  ('Pilas y baterías', 3,
   'Nunca mezclarlas con otros residuos: llevarlas a un punto de posconsumo «Pilas con el Ambiente».',
   'Se botan en la bolsa negra; sus metales pesados contaminan suelo y agua. Requieren punto especial.',
   ARRAY['pila', 'batería', 'pilas usadas', 'baterías']);

-- ------------------------------------------------------------
-- 5. Puntos de reciclaje dentro de Engativá (lat 4.69–4.73, lng -74.12 a -74.08)
-- ------------------------------------------------------------
INSERT INTO punto_reciclaje (nombre, tipo, lat, lng, direccion, materiales_aceptados, horario) VALUES
  ('ECA Engativá Pueblo', 'estacion', 4.7042, -74.1181, 'Calle 64 # 123-40',
   ARRAY['papel', 'cartón', 'plástico', 'vidrio', 'metal'], 'Lunes a sábado, 7:00 a. m. – 4:00 p. m.'),
  ('Punto limpio Las Ferias', 'punto', 4.6921, -74.0853, 'Avenida Calle 72 # 69-25',
   ARRAY['aceite usado', 'pilas', 'electrónicos'], 'Lunes a viernes, 9:00 a. m. – 5:00 p. m.'),
  ('Chatarrería El Progreso', 'chatarreria', 4.7148, -74.1052, 'Carrera 100 # 75-18',
   ARRAY['metal', 'chatarra', 'aluminio', 'cobre'], 'Lunes a sábado, 8:00 a. m. – 6:00 p. m.'),
  ('Punto de reciclaje Minuto de Dios', 'punto', 4.6963, -74.0928, 'Carrera 74 # 81B-30',
   ARRAY['papel', 'cartón', 'plástico'], 'Lunes a domingo, 24 horas (contenedores)'),
  ('Estación de clasificación Álamos', 'estacion', 4.6978, -74.1073, 'Carrera 96 # 70-12',
   ARRAY['papel', 'cartón', 'plástico', 'vidrio', 'tetrapak'], 'Lunes a sábado, 7:00 a. m. – 3:00 p. m.'),
  ('Punto posconsumo Portal 80', 'punto', 4.7113, -74.1129, 'Transversal 100A # 80A-20',
   ARRAY['pilas', 'bombillas', 'electrónicos', 'aceite usado'], 'Lunes a domingo, 10:00 a. m. – 7:00 p. m.'),
  ('Chatarrería Bolivia', 'chatarreria', 4.7207, -74.1178, 'Calle 90 # 111A-05',
   ARRAY['metal', 'chatarra', 'electrodomésticos'], 'Lunes a sábado, 8:00 a. m. – 5:00 p. m.'),
  ('Punto limpio Garcés Navas', 'punto', 4.7096, -74.1157, 'Calle 70B # 110-15',
   ARRAY['aceite usado', 'vidrio', 'pilas'], 'Martes a sábado, 9:00 a. m. – 4:00 p. m.'),
  ('Punto de reciclaje Santa Cecilia', 'punto', 4.6937, -74.1008, 'Calle 77 # 90-60',
   ARRAY['papel', 'cartón', 'vidrio', 'plástico', 'tetrapak'], 'Lunes a domingo, 24 horas (contenedores)');

-- ------------------------------------------------------------
-- 6. Organizaciones de recicladores
-- ------------------------------------------------------------
INSERT INTO organizacion_recicladores (id, nombre, nit, telefono, estado) VALUES
  (1, 'Asociación de Recicladores de Engativá', '900123456-7', '3011234567', 'verificada'),
  (2, 'Cooperativa Ambiental Bolivia',          '901987654-3', '3109876543', 'pendiente');

-- ------------------------------------------------------------
-- 7. Usuarios demo (contraseña: Demo1234!)
-- ------------------------------------------------------------
INSERT INTO usuario (id, nombre, email, password_hash, rol, barrio_aproximado, upz_id,
                     autorizacion_datos, fecha_autorizacion) VALUES
  (1, 'Administración EcoRecicla', 'admin@ecorecicla.co',
   '$2a$10$XNGFiJiRzEHSmPAKKWE59.HZDwKz1e/03gn12h9z7wXHFQb7YW4tK',
   'admin', NULL, NULL, TRUE, '2026-01-15 09:00:00-05'),
  (2, 'Camila Rodríguez', 'hogar@demo.co',
   '$2a$10$XNGFiJiRzEHSmPAKKWE59.HZDwKz1e/03gn12h9z7wXHFQb7YW4tK',
   'hogar', 'Boyacá Real', 3, TRUE, '2026-02-01 18:30:00-05'),
  (3, 'Jorge Ramírez', 'reciclador@demo.co',
   '$2a$10$XNGFiJiRzEHSmPAKKWE59.HZDwKz1e/03gn12h9z7wXHFQb7YW4tK',
   'reciclador', 'Las Ferias', 1, TRUE, '2026-01-20 10:00:00-05'),
  (4, 'Luz Marina Ortiz', 'reciclador2@demo.co',
   '$2a$10$XNGFiJiRzEHSmPAKKWE59.HZDwKz1e/03gn12h9z7wXHFQb7YW4tK',
   'reciclador', 'Garcés Navas', 6, TRUE, '2026-01-20 10:15:00-05');

-- ------------------------------------------------------------
-- 8. Recicladores asociados (cobertura por ids de UPZ)
-- ------------------------------------------------------------
INSERT INTO reciclador (id, usuario_id, organizacion_id, upz_cobertura) VALUES
  (1, 3, 1, ARRAY[1, 2, 3, 7]),  -- Las Ferias, Minuto de Dios, Boyacá Real, Engativá
  (2, 4, 1, ARRAY[4, 5, 6, 8, 9]); -- Santa Cecilia, Bolivia, Garcés Navas, Jardín Botánico, Álamos

-- ------------------------------------------------------------
-- 9. Solicitudes de ejemplo (hogar demo, UPZ Boyacá Real)
-- ------------------------------------------------------------
INSERT INTO solicitud_recoleccion (id, hogar_id, estado, franja_disponibilidad, nota_acceso,
                                   fecha_solicitada, reciclador_id, created_at) VALUES
  (1, 2, 'pendiente', 'Mañana (8:00 a. m. – 12:00 m.)', NULL,
   '2026-07-25', NULL, '2026-07-14 08:12:00-05'),
  (2, 2, 'aceptada', 'Tarde (2:00 p. m. – 6:00 p. m.)', 'Dejar en portería, torre 2.',
   '2026-07-18', 1, '2026-07-10 19:40:00-05'),
  (3, 2, 'completada', 'Mañana (8:00 a. m. – 12:00 m.)', 'Timbre del apartamento 201.',
   '2026-07-04', 1, '2026-07-01 07:55:00-05');

INSERT INTO detalle_solicitud (solicitud_id, categoria_id, tamano_bolsa, cantidad) VALUES
  (1, 1, 'mediana', 2),
  (2, 1, 'grande', 1),
  (2, 1, 'pequena', 1),
  (3, 1, 'grande', 1);

-- ------------------------------------------------------------
-- 10. Recolección completada (registro INMUTABLE) + calificación
-- ------------------------------------------------------------
INSERT INTO recoleccion (id, solicitud_id, reciclador_id, peso_kg, tipo_material, fecha_recoleccion) VALUES
  (1, 3, 1, 9.50, 'Cartón, PET y tetrapak', '2026-07-04 09:30:00-05');

INSERT INTO calificacion (recoleccion_id, estrellas, comentario) VALUES
  (1, 5, 'Muy puntual y amable. Me explicó cómo separar mejor el tetrapak.');

-- ------------------------------------------------------------
-- Ajustar secuencias tras los INSERT con id explícito
-- ------------------------------------------------------------
SELECT setval('upz_id_seq', (SELECT max(id) FROM upz));
SELECT setval('usuario_id_seq', (SELECT max(id) FROM usuario));
SELECT setval('organizacion_recicladores_id_seq', (SELECT max(id) FROM organizacion_recicladores));
SELECT setval('reciclador_id_seq', (SELECT max(id) FROM reciclador));
SELECT setval('categoria_residuo_id_seq', (SELECT max(id) FROM categoria_residuo));
SELECT setval('solicitud_recoleccion_id_seq', (SELECT max(id) FROM solicitud_recoleccion));
SELECT setval('recoleccion_id_seq', (SELECT max(id) FROM recoleccion));

COMMIT;
