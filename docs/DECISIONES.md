# Registro de decisiones técnicas (ADR)

Formato breve: **Contexto → Decisión → Consecuencias**. Las restricciones duras de la
especificación (costo $0, mobile-first, guía sin registro, WCAG 2.1 AA, Ley 1581) son
el marco de todas las decisiones.

---

## ADR-01 · Monorepo con npm workspaces

- **Contexto:** la especificación exige un repositorio único con `client/`, `server/` y
  `database/`, y un `npm test` en la raíz que corra ambas suites.
- **Decisión:** npm workspaces (sin Turborepo/Nx): `npm install` único, scripts
  agregadores en la raíz (`dev`, `lint`, `test`, `db:setup`).
- **Consecuencias:** cero herramientas extra; los `node_modules` se comparten; CI simple
  con `npm ci` en la raíz.

## ADR-02 · Distancias con Haversine en SQL (sin PostGIS)

- **Contexto:** `GET /puntos` debe ordenar por cercanía. PostGIS complica el setup local
  y las capas gratuitas (la especificación lo permite explícitamente).
- **Decisión:** columnas `lat`/`lng` (`DOUBLE PRECISION`) y fórmula de Haversine
  calculada en la consulta SQL (`server/src/services/pointService.js`).
- **Consecuencias:** instalación con `postgres:16-alpine` estándar; precisión de metros,
  suficiente para ~9 puntos en una localidad; si el catálogo creciera a miles de puntos
  habría que migrar a PostGIS + índices espaciales.

## ADR-03 · `pg` con SQL parametrizado, sin ORM

- **Contexto:** el modelo (12 entidades) está fijado por la especificación y el esquema
  se entrega como `database/schema.sql` + `seed.sql` versionados.
- **Decisión:** driver `pg` con consultas parametrizadas en servicios; sin ORM ni
  migraciones automáticas. `npm run db:setup` aplica esquema + seed.
- **Consecuencias:** el SQL entregado es exactamente lo que corre; menos dependencias y
  arranque más simple para evaluar; se renuncia a migraciones incrementales (aceptable
  en TRL5).

## ADR-04 · Validación de entrada con `zod`

- **Contexto:** la especificación permite `express-validator` o `zod`.
- **Decisión:** `zod` 4 con mensajes personalizados en español, aplicado por un middleware
  genérico `validate(schema, source)`. Los mensajes por defecto de zod usan su
  traducción al español (`z.locales.es()`).
- **Consecuencias:** esquemas declarativos junto a cada ruta; los errores 400 devuelven
  `{ error, detalles: [{campo, mensaje}] }`, que el cliente muestra tal cual.

## ADR-05 · `bcryptjs` (JavaScript puro) con 10 rondas

- **Contexto:** RNF-07 exige bcrypt ≥ 10 rondas. El paquete `bcrypt` nativo requiere
  compilación (fricción en CI y en máquinas de los evaluadores).
- **Decisión:** `bcryptjs` con 10 rondas (hashes `$2a$` compatibles).
- **Consecuencias:** instalación sin toolchain de C++; rendimiento menor que el nativo,
  irrelevante para el volumen del prototipo.

## ADR-06 · JWT de 8 h + verificación de cuenta activa en cada petición

- **Contexto:** la revocatoria de la Ley 1581 debe ser efectiva de inmediato, pero un
  JWT ya emitido seguiría siendo válido hasta su expiración.
- **Decisión:** el middleware de autenticación consulta el usuario en BD y rechaza
  cuentas con `activo = false`; expiración del token en 8 h.
- **Consecuencias:** una consulta extra por petición autenticada (aceptable); revocar la
  autorización invalida las sesiones al instante, sin listas negras de tokens.

## ADR-07 · Inmutabilidad de RECOLECCION por diseño de la API (405)

- **Contexto:** RF-14: la recolección soporta la remuneración del Decreto 596 de 2016 y
  no debe poder alterarse.
- **Decisión:** el recurso `/recolecciones` solo expone `POST`; `PUT/PATCH/DELETE` (con
  o sin id) responden **405 Method Not Allowed** con cabecera `Allow: POST` y mensaje
  explicativo. Restricción `UNIQUE (solicitud_id)` en BD contra duplicados.
- **Consecuencias:** la garantía queda probada por tests dedicados; una corrección
  legítima exigiría intervención directa en BD, que es el comportamiento deseado.

## ADR-08 · Recordatorio .ics generado en el cliente (RF-09)

- **Contexto:** las notificaciones push están fuera de alcance; el recordatorio debe
  funcionar con costo $0.
- **Decisión:** generar el texto `VCALENDAR` con `RRULE:FREQ=WEEKLY` en el navegador
  (`client/src/utils/ics.js`, sin librerías) + tarjeta de recordatorio visible en el
  dashboard del hogar.
- **Consecuencias:** compatible con Google Calendar/Outlook/calendario del móvil; sin
  servicios externos; probado con test unitario.

## ADR-09 · Pruebas del backend contra PostgreSQL real

- **Contexto:** el ciclo crear→aceptar→recolectar→calificar y la inmutabilidad dependen
  de transacciones, restricciones UNIQUE y arrays de PostgreSQL; con mocks se probaría
  poco.
- **Decisión:** Jest + Supertest contra la base `ecorecicla_test` (mismo contenedor);
  `globalSetup` re-aplica esquema + seed en cada corrida; `--runInBand`.
- **Consecuencias:** pruebas deterministas y realistas (49 casos, >90 % de líneas); CI
  usa un *service container* `postgres:16-alpine`.

## ADR-10 · Guía pública y minimización de datos

- **Contexto:** decisión central del proyecto: resolver «¿en qué bolsa va?» debe tomar
  < 30 s sin fricción; la Ley 1581 exige minimización.
- **Decisión:** todos los endpoints de la guía, mapa y rutas son públicos; el registro
  solo pide nombre, correo, contraseña y (opcional) barrio aproximado + UPZ. Nunca se
  pide dirección exacta; el reciclador ve barrio/UPZ, no direcciones.
- **Consecuencias:** el flujo principal funciona sin cuenta (2 interacciones: escribir +
  tocar la sugerencia); menor riesgo de datos personales en un prototipo académico.

## ADR-11 · Casos especiales dentro de las 3 categorías nacionales

- **Contexto:** el aceite de cocina usado y las pilas no van en ninguna bolsa (van a
  punto limpio/posconsumo), pero el modelo de la especificación clasifica todo residuo
  en las 3 categorías de la Resolución 2184.
- **Decisión:** se asignan a la categoría más coherente (aceite → aprovechables, pilas →
  no aprovechables) y la **preparación previa y el error frecuente** de la ficha indican
  explícitamente el manejo especial («nunca va en ninguna bolsa: llévalo a un punto
  limpio»).
- **Consecuencias:** el modelo se mantiene simple y fiel a la especificación; el texto de
  la ficha —siempre visible— evita el error práctico. Una futura versión podría añadir
  una marca `manejo_especial`.

## ADR-12 · Accesibilidad: color de bolsa siempre con texto

- **Contexto:** WCAG 2.1 criterio 1.4.1 (no comunicar solo con color); usuarios con
  daltonismo no distinguen la bolsa verde de la negra por color.
- **Decisión:** componente único `BagBadge` que muestra siempre «BOLSA BLANCA/VERDE/
  NEGRA — Categoría» sobre el color; texto oscuro sobre blanca/verde y claro sobre negra
  para contraste ≥ 4,5:1; foco visible global y fuente base 16 px.
- **Consecuencias:** imposible introducir una pantalla que comunique solo con color (el
  badge es el único punto de render del color de bolsa); verificado en tests de RTL.
