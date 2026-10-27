# ♻️ EcoRecicla Engativá

![CI](https://github.com/SergioKingOne/ecorecicla-engativa/actions/workflows/ci.yml/badge.svg)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)

**Prototipo funcional (TRL5) para la gestión y promoción de la separación de residuos
sólidos en la fuente en la localidad de Engativá, Bogotá D.C.**

La aplicación resuelve en menos de 30 segundos la pregunta *«¿en qué bolsa va?»* —sin
exigir registro—, muestra puntos de reciclaje y rutas de recolección selectiva por UPZ,
y conecta a los hogares con organizaciones de recicladores de oficio para agendar
recolecciones de material aprovechable.

> La guía de clasificación, el módulo educativo, el mapa y la consulta de rutas son
> **100 % públicos**: el registro solo se necesita para agendar recolecciones.

## Capturas

Capturas móviles (360 px) y de escritorio en [`docs/screenshots/`](docs/screenshots/).

| Home móvil (360 px) | Ficha del residuo | Mapa de puntos |
|---|---|---|
| ![Home móvil con buscador y accesos directos](docs/screenshots/01-inicio.png) | ![Ficha de tetrapak con banda BOLSA BLANCA](docs/screenshots/02-ficha-tetrapak.png) | ![Mapa Leaflet con puntos de reciclaje](docs/screenshots/04-mapa.png) |

| Registro con Ley 1581 | Panel del reciclador | Historial con kg |
|---|---|---|
| ![Registro con aviso de privacidad y checkbox bloqueante](docs/screenshots/06-registro.png) | ![Panel del reciclador con solicitudes de zona](docs/screenshots/08-panel-reciclador.png) | ![Dashboard del hogar con kg acumulados](docs/screenshots/10-historial.png) |

## Arquitectura

```
                ┌─────────────────────────────┐
                │        Navegador (móvil)     │
                │  React 18 + Vite + Tailwind  │
                │  Leaflet/OSM (carga diferida)│
                └──────────────┬──────────────┘
                               │ HTTPS · JSON
                               ▼
                ┌─────────────────────────────┐
                │      API REST /api/v1        │
                │      Node.js 20 + Express    │
                │  JWT · bcrypt · zod · roles  │
                │  rate limit · helmet · CORS  │
                └──────────────┬──────────────┘
                               │ SQL parametrizado (pg)
                               ▼
                ┌─────────────────────────────┐
                │        PostgreSQL 16         │
                │  12 entidades · seed en      │
                │  español · Haversine en SQL  │
                └─────────────────────────────┘
```

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, react-leaflet (OpenStreetMap) |
| Backend | Node.js 20, Express, zod, JWT, bcryptjs (10 rondas) |
| Base de datos | PostgreSQL 16 (sin PostGIS: distancias con fórmula de Haversine) |
| Pruebas | Jest + Supertest (backend) · Vitest + React Testing Library (frontend) |
| CI | GitHub Actions (lint + pruebas + build + auditoría) |

## Requisitos previos

- **Node.js ≥ 20** y npm ≥ 10
- **Docker** (solo para levantar PostgreSQL local; también puedes usar un PostgreSQL 16 propio)
- Git

## Instalación local paso a paso

```bash
# 1. Clonar el repositorio
git clone https://github.com/SergioKingOne/ecorecicla-engativa.git
cd ecorecicla-engativa

# 2. Instalar dependencias (workspaces: server + client)
npm install

# 3. Levantar PostgreSQL 16 con Docker
docker compose up -d
# Crea las bases de datos "ecorecicla" (desarrollo) y "ecorecicla_test" (pruebas)

# 4. Configurar variables de entorno
cp server/.env.example server/.env
cp client/.env.example client/.env
# Los valores por defecto funcionan con el docker-compose incluido

# 5. Crear el esquema y cargar los datos semilla (español)
npm run db:setup

# 6. Iniciar API + cliente en modo desarrollo
npm run dev
# API:     http://localhost:4000/api/v1
# Cliente: http://localhost:5173
```

> Si prefieres correr cada servicio por separado: `npm run dev:server` y `npm run dev:client`.

## Usuarios demo

La contraseña de **todos** los usuarios demo es: **`Demo1234!`**

| Rol | Correo | Qué puedes probar |
|---|---|---|
| Administrador | `admin@ecorecicla.co` | CRUD de residuos/puntos/rutas, verificar organizaciones |
| Hogar | `hogar@demo.co` | Agendar recolección, historial con kg, calificar, revocatoria |
| Reciclador | `reciclador@demo.co` | Solicitudes de su zona, aceptar/reprogramar/rechazar, confirmar con peso |
| Reciclador (2) | `reciclador2@demo.co` | Cobertura en otras UPZ (para probar reglas de zona) |

## Pruebas

```bash
npm test              # backend + frontend
npm run test:server   # Jest + Supertest (usa la BD ecorecicla_test)
npm run test:client   # Vitest + React Testing Library
npm run lint          # ESLint en ambos workspaces
```

- La suite del backend **re-crea el esquema y el seed** en `ecorecicla_test` antes de
  correr, por lo que es determinista.
- Cobertura exigida en el backend: **≥ 60 %** (umbral bloqueante en Jest); la cobertura
  actual supera el 90 % de líneas.
- Detalles de la estrategia en [docs/PRUEBAS.md](docs/PRUEBAS.md).

## Despliegue en capa gratuita (costo $0)

La aplicación está diseñada para operar sin costo:

### 1. Base de datos — [Neon](https://neon.tech) o [Supabase](https://supabase.com)

1. Crea un proyecto PostgreSQL 16 gratuito y copia la cadena de conexión.
2. Ejecuta esquema y seed contra esa base:
   ```bash
   node server/scripts/db-setup.js "postgres://usuario:clave@host/db?sslmode=require"
   ```

### 2. API — [Render](https://render.com) (Web Service gratuito)

- **Root directory**: `server` · **Build**: `npm install` · **Start**: `npm start`
- Variables de entorno: `DATABASE_URL` (Neon/Supabase), `JWT_SECRET` (valor aleatorio
  largo), `CORS_ORIGIN` (URL del frontend).
- El plan gratuito «duerme» tras 15 min de inactividad; el primer acceso puede tardar
  unos segundos (aceptable para un prototipo TRL5).

### 3. Frontend — [Vercel](https://vercel.com) o [Netlify](https://netlify.com)

- **Root directory**: `client` · **Build**: `npm run build` · **Output**: `dist`
- Variable de entorno: `VITE_API_URL=https://<tu-api>.onrender.com/api/v1`
- Configura el *rewrite* de SPA (todas las rutas → `index.html`).

## Estructura del repositorio

```
ecorecicla-engativa/
├── client/              # React 18 + Vite + Tailwind (SPA, español)
├── server/              # API REST Express (código en inglés, mensajes en español)
├── database/            # schema.sql + seed.sql (9 UPZ, 46 residuos, puntos, demos)
├── docs/                # DECISIONES.md · PRUEBAS.md · capturas/
├── .github/workflows/   # CI: lint + pruebas + build + npm audit
└── docker-compose.yml   # PostgreSQL 16 local (única dependencia de Docker)
```

## Requisitos funcionales implementados

Los 18 RF de la especificación están implementados, incluidos los tres «Could»
(RF-07 cómo llegar, RF-16 calificación, RF-17 panel administrativo). La matriz
RF → pruebas está en [docs/PRUEBAS.md](docs/PRUEBAS.md) y las decisiones técnicas en
[docs/DECISIONES.md](docs/DECISIONES.md).

## Cumplimiento normativo del prototipo

- **Resolución 2184 de 2019**: código nacional de colores (blanca/verde/negra) en toda la guía.
- **Ley 1581 de 2012**: consentimiento expreso y bloqueante antes del registro, registro
  de fecha/hora de la autorización, minimización (solo barrio aproximado y UPZ) y
  revocatoria desde el perfil (desactiva la cuenta de inmediato).
- **Decreto 596 de 2016**: la recolección confirmada es un registro inmutable que
  soporta la remuneración del reciclador (la API no expone UPDATE/DELETE).
- **WCAG 2.1 AA**: el color de bolsa siempre se comunica con texto, contraste ≥ 4,5:1,
  fuente base de 16 px, foco visible y HTML semántico.

## Licencia

[MIT](LICENSE)

## Créditos académicos

Proyecto de grado — UNAD, Ingeniería de Sistemas (curso 202016907, Fase 4).

**Autores:** Sergio Mauricio Robayo Rojas (investigador principal) y Jorge Iván Ávila Pinilla (coinvestigador).
