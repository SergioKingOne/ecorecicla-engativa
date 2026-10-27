# Estrategia de pruebas

## Resumen

| Suite | Herramientas | Casos | Qué cubre |
|---|---|---|---|
| Backend | Jest + Supertest sobre PostgreSQL real (`ecorecicla_test`) | 49 | Auth y Ley 1581, guía de clasificación, puntos/rutas, ciclo completo de solicitud, inmutabilidad, reglas de rol, panel admin |
| Frontend | Vitest + React Testing Library (API simulada) | 13 | Autocompletado desde 3 caracteres, ficha con color+texto, checkbox de autorización bloqueante, wizard de 3 pasos, generación .ics |

Cobertura del backend exigida: **≥ 60 %** (umbral bloqueante en `jest.config.js`).
Cobertura obtenida: **≈ 93 % de líneas / 92 % de sentencias** (ver tabla al correr
`npm run test:server`).

## Cómo correr las pruebas

```bash
docker compose up -d      # PostgreSQL 16 (crea ecorecicla y ecorecicla_test)
npm install
npm test                  # backend + frontend
```

- `npm run test:server`: antes de los tests, el `globalSetup` de Jest **re-aplica
  esquema y seed** sobre `ecorecicla_test`, por lo que cada corrida parte del mismo
  estado (determinista). Los tests corren con `--runInBand` porque comparten la base.
- `npm run test:client`: no necesita base de datos ni API; el módulo `api/client.js` se
  simula con `vi.mock`.

## Cómo interpretar los resultados

- **Jest** imprime la tabla de cobertura por archivo (Stmts/Branch/Funcs/Lines). Si la
  cobertura global de sentencias o líneas cae por debajo del 60 %, el proceso termina
  con error (falla el CI).
- Un fallo en `lifecycle.test.js` indica una regresión en el flujo de negocio principal
  (agendamiento/recolección); un fallo en `immutability.test.js` indica que alguien
  expuso un método de escritura sobre RECOLECCION y **debe corregirse antes de
  desplegar**.
- **Vitest** lista cada archivo de test con sus casos.

## Matriz requisito → prueba

| RF | Prueba(s) | Archivo |
|---|---|---|
| RF-01 búsqueda + sugerencia | existente, por sinónimo, inexistente→sugerencia, formulario «sugerir residuo»; autocompletado desde 3 caracteres | `server/tests/residuos.test.js` · `client/src/tests/SearchBox.test.jsx` |
| RF-02 catálogo por categoría | filtro `?categoria=`, 3 categorías del código de colores | `server/tests/residuos.test.js` |
| RF-03 ficha del residuo | ficha completa (color, preparación, error frecuente), 404; color SIEMPRE con texto | `server/tests/residuos.test.js` · `client/src/tests/ResiduoDetalle.test.jsx` |
| RF-05/06 mapa y filtro | orden por distancia (Haversine), filtro por material | `server/tests/residuos.test.js` (bloque puntos) |
| RF-08 rutas por UPZ | ruta de una UPZ, listado de las 9 UPZ | `server/tests/residuos.test.js` (bloque rutas) |
| RF-09 recordatorio .ics | evento semanal `RRULE`, día correcto | `client/src/tests/ics.test.js` |
| RF-10 registro/login JWT | registro válido, login ok/fallido, token inválido, sin token | `server/tests/auth.test.js` |
| RF-11 organizaciones | registro público (pendiente), verificación admin, creación de reciclador | `server/tests/roles.test.js` |
| RF-12 agendamiento | creación con detalles (tamaños de bolsa en kg comprensibles), wizard de 3 pasos | `server/tests/lifecycle.test.js` · `client/src/tests/Agendar.test.jsx` |
| RF-13 gestión por zona | ver zona, aceptar, reprogramar, rechazo fuera de zona (403) | `server/tests/lifecycle.test.js` |
| RF-14 recolección inmutable | confirmación con peso; `PUT/PATCH/DELETE → 405`; duplicado → 409 | `server/tests/lifecycle.test.js` · `server/tests/immutability.test.js` |
| RF-15 historial con kg | acumulado de kg tras la recolección | `server/tests/lifecycle.test.js` |
| RF-16 calificación | calificar 1–5, doble calificación → 409 | `server/tests/lifecycle.test.js` |
| RF-17 panel admin | CRUD residuos/puntos/rutas, acceso denegado a no-admin | `server/tests/roles.test.js` |
| RF-18 Ley 1581 | registro sin autorización → 400; checkbox bloqueante en UI; revocatoria desactiva la cuenta e invalida el token | `server/tests/auth.test.js` · `client/src/tests/Registro.test.jsx` |

Reglas de rol adicionales (hogar no accede a `/solicitudes/zona`, reciclador no crea
solicitudes, etc.): `server/tests/roles.test.js`.

## Integración continua

`.github/workflows/ci.yml` ejecuta en cada push/PR: instalación (`npm ci`), lint de
ambos workspaces, pruebas del backend contra un *service container* `postgres:16-alpine`
(con el umbral de cobertura), pruebas del frontend, build de producción del cliente y
`npm audit --omit=dev --audit-level=high` (RNF-07: sin vulnerabilidades altas en
dependencias de producción).
