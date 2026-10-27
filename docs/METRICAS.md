# Métricas del prototipo (medidas reales)

Todas las cifras de este documento provienen de la ejecución real de las herramientas
indicadas sobre este repositorio (no son estimaciones). Fecha de medición:
**26 de octubre de 2026**, entorno local macOS, Node v25, PostgreSQL 16 (Docker).

## Resumen

| Métrica | Valor | Herramienta / fuente |
|---|---|---|
| Casos de prueba automatizados | **62** (49 backend + 13 frontend) — **62 pasan (100 %)** | Jest 29 · Vitest 4 |
| Cobertura backend (sentencias) | **91,88 %** (líneas: 93,14 %) | `npm run test:server` (Jest `--coverage`) |
| Cobertura frontend (sentencias) | **75,59 %** (líneas: 76,92 %) | `npx vitest run --coverage` (@vitest/coverage-v8) |
| Residuos en el seed | **46** | `SELECT count(*) FROM residuo;` |
| UPZ en el seed | **9** (con **9** rutas de recolección) | `SELECT count(*) FROM upz;` / `ruta_recoleccion` |
| Puntos de reciclaje en el seed | **9** | `SELECT count(*) FROM punto_reciclaje;` |
| Lighthouse — Performance (home, móvil, build de producción) | **99 / 100** | Lighthouse CLI 13.4.0, Chrome headless, emulación móvil |
| Lighthouse — Accesibilidad (home) | **100 / 100** | Lighthouse CLI 13.4.0 |
| Carga inicial de la home | FCP **1,7 s** · LCP **1,8 s** · TTI **1,8 s** (4G simulado) · evento `load` en **26 ms** en red local sin throttling | Lighthouse (throttling 4G simulado) · Navigation Timing API |
| `npm audit` — vulnerabilidades altas | **0** | `npm audit --json` |
| `npm audit` — vulnerabilidades críticas | **0** (0 vulnerabilidades en total, en todas las severidades) | `npm audit --json` |
| Descripción de ficha más larga | **35 palabras** («Aceite de cocina usado», preparación + error frecuente). Por campo: preparación máx. **15**, error frecuente máx. **21** — todas ≤ 40 (RNF-11 ✓) | Consulta SQL sobre `residuo` |
| Violaciones axe (antes de correcciones) | **1 crítica + 4 serias** (12 nodos en 3 páginas) | axe-core 4.12 vía Playwright |
| Violaciones axe (después de correcciones) | **0** (ninguna, en ninguna severidad) | axe-core 4.12 vía Playwright |
| RF implementados | **18 de 18** (0 dejados como issue) | Revisión contra la especificación |

## Detalle de las mediciones

### 1. Pruebas automatizadas

- **Backend** (`npm run test:server`, Jest + Supertest contra PostgreSQL real):
  `Test Suites: 5 passed · Tests: 49 passed, 49 total`.
  Cobertura global: sentencias **91,88 %**, ramas 66,48 %, funciones 94,31 %,
  líneas **93,14 %** (umbral mínimo exigido: 60 %, configurado como bloqueante).
- **Frontend** (`npx vitest run --coverage`):
  `Test Files: 5 passed · Tests: 13 passed`.
  Cobertura de los módulos ejercitados por las pruebas: sentencias **75,59 %**,
  ramas 80,2 %, funciones 71,23 %, líneas 76,92 %.

### 2. Datos semilla (consultados en la base `ecorecicla`)

```
residuos = 46      (mínimo exigido: 40)
upz = 9            (las 9 UPZ de Engativá)
puntos = 9         (rango exigido: 8–10, coordenadas dentro de Engativá)
rutas = 9          (una ruta selectiva por UPZ)
```

### 3. Rendimiento (Lighthouse CLI 13.4.0)

Medido contra la **build de producción** (`npm run build` + `vite preview`), con
Chrome headless y la emulación móvil por defecto de Lighthouse (Moto G Power,
throttling de red 4G simulado):

| Métrica | Valor |
|---|---|
| Performance | **99** |
| Accessibility | **100** |
| First Contentful Paint | 1,7 s |
| Largest Contentful Paint | 1,8 s |
| Speed Index | 1,7 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0,034 |
| Time to Interactive | 1,8 s |

Cumple RNF-02 (carga < 3 s en 4G y Lighthouse ≥ 85). En red local sin throttling,
el evento `load` de la home se dispara a los **26 ms** (Navigation Timing API, sin
caché; transferencia inicial de 1,2 kB gracias a la separación del chunk de Leaflet).

El CLS de 0,034 (umbral «bueno»: ≤ 0,1) viene de la home: el conteo «N residuos en la
guía» de las tarjetas de bolsa llega después del primer render y desplaza el párrafo
del código de colores.

### 4. Seguridad de dependencias

`npm audit --json` sobre el árbol completo del monorepo (los workspaces `client` y
`server` comparten el `package-lock.json` de la raíz):

```
info: 0 · low: 0 · moderate: 0 · high: 0 · critical: 0 · total: 0
```

### 5. Accesibilidad (axe-core 4.12.1, vía Playwright)

Páginas auditadas: **home**, **ficha del residuo** (`/residuos/1`) y **registro**.

**Antes de las correcciones:**

| Página | Regla | Severidad | Nodos |
|---|---|---|---|
| Home | `aria-allowed-attr` (`aria-expanded` en un `searchbox`) | **Crítica** | 1 |
| Home | `color-contrast` (enlaces de navegación con opacidad 90 %ratio ≈ 4,49:1) | Seria | 3 |
| Ficha | `color-contrast` (mismos enlaces de navegación) | Seria | 4 |
| Registro | `color-contrast` (mismos enlaces de navegación) | Seria | 4 |
| Registro | `scrollable-region-focusable` (aviso de privacidad con scroll sin acceso por teclado) | Seria | 1 |

**Correcciones aplicadas:** se retiró el atributo ARIA no soportado del buscador
(la lista de sugerencias conserva su `aria-label`), los enlaces de navegación pasaron
a blanco con opacidad completa (ratio 5,13:1) y el aviso de privacidad recibió
`tabindex="0"` para ser desplazable con teclado.

**Después de las correcciones:** **0 violaciones** en las tres páginas (ninguna
severidad).

### 6. Requisitos funcionales

**18 de 18 implementados; ninguno quedó como issue documentado.** Incluye los tres
de prioridad «Could»: RF-07 (cómo llegar), RF-16 (calificación) y RF-17 (panel
administrativo). La matriz RF → prueba está en [PRUEBAS.md](PRUEBAS.md).
