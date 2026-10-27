-- ============================================================
-- EcoRecicla Engativá — esquema de base de datos (PostgreSQL 16)
-- 12 entidades según la especificación (§6) + tabla de sugerencias
-- de residuos que soporta el formulario "sugerir residuo" (RF-01).
-- ============================================================

DROP TABLE IF EXISTS calificacion CASCADE;
DROP TABLE IF EXISTS recoleccion CASCADE;
DROP TABLE IF EXISTS detalle_solicitud CASCADE;
DROP TABLE IF EXISTS solicitud_recoleccion CASCADE;
DROP TABLE IF EXISTS ruta_recoleccion CASCADE;
DROP TABLE IF EXISTS punto_reciclaje CASCADE;
DROP TABLE IF EXISTS residuo CASCADE;
DROP TABLE IF EXISTS categoria_residuo CASCADE;
DROP TABLE IF EXISTS reciclador CASCADE;
DROP TABLE IF EXISTS organizacion_recicladores CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS upz CASCADE;
DROP TABLE IF EXISTS sugerencia_residuo CASCADE;

-- Las 9 UPZ (Unidades de Planeamiento Zonal) de Engativá
CREATE TABLE upz (
  id     SERIAL PRIMARY KEY,
  codigo VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
  id                 SERIAL PRIMARY KEY,
  nombre             VARCHAR(120) NOT NULL,
  email              VARCHAR(160) UNIQUE NOT NULL,
  password_hash      VARCHAR(100) NOT NULL,
  rol                VARCHAR(20) NOT NULL CHECK (rol IN ('hogar', 'reciclador', 'admin')),
  -- Ley 1581 de 2012 — principio de minimización: solo barrio aproximado y UPZ,
  -- nunca la dirección exacta.
  barrio_aproximado  VARCHAR(120),
  upz_id             INTEGER REFERENCES upz (id),
  autorizacion_datos BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_autorizacion TIMESTAMPTZ,
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organizacion_recicladores (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(160) NOT NULL,
  nit        VARCHAR(20) UNIQUE NOT NULL,
  telefono   VARCHAR(20),
  estado     VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reciclador (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER UNIQUE NOT NULL REFERENCES usuario (id),
  organizacion_id INTEGER NOT NULL REFERENCES organizacion_recicladores (id),
  upz_cobertura   INTEGER[] NOT NULL DEFAULT '{}' -- ids de UPZ cubiertas
);

-- Código de colores nacional (Resolución 2184 de 2019)
CREATE TABLE categoria_residuo (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL,
  color_bolsa VARCHAR(10) NOT NULL CHECK (color_bolsa IN ('blanca', 'verde', 'negra')),
  descripcion TEXT
);

CREATE TABLE residuo (
  id                 SERIAL PRIMARY KEY,
  nombre             VARCHAR(120) NOT NULL,
  categoria_id       INTEGER NOT NULL REFERENCES categoria_residuo (id),
  preparacion_previa TEXT NOT NULL,
  error_frecuente    TEXT NOT NULL,
  sinonimos          TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_residuo_nombre ON residuo (lower(nombre));
CREATE INDEX idx_residuo_categoria ON residuo (categoria_id);

CREATE TABLE punto_reciclaje (
  id                   SERIAL PRIMARY KEY,
  nombre               VARCHAR(160) NOT NULL,
  tipo                 VARCHAR(20) NOT NULL CHECK (tipo IN ('punto', 'estacion', 'chatarreria')),
  lat                  DOUBLE PRECISION NOT NULL,
  lng                  DOUBLE PRECISION NOT NULL,
  direccion            VARCHAR(200),
  materiales_aceptados TEXT[] NOT NULL DEFAULT '{}',
  horario              VARCHAR(160)
);

CREATE TABLE ruta_recoleccion (
  id             SERIAL PRIMARY KEY,
  upz_id         INTEGER NOT NULL REFERENCES upz (id),
  dia_semana     VARCHAR(15) NOT NULL,
  franja_horaria VARCHAR(60) NOT NULL,
  operador       VARCHAR(120)
);

CREATE INDEX idx_ruta_upz ON ruta_recoleccion (upz_id);

CREATE TABLE solicitud_recoleccion (
  id                    SERIAL PRIMARY KEY,
  hogar_id              INTEGER NOT NULL REFERENCES usuario (id),
  estado                VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'aceptada', 'reprogramada', 'rechazada', 'completada', 'cancelada')),
  franja_disponibilidad VARCHAR(60) NOT NULL,
  nota_acceso           VARCHAR(300),
  fecha_solicitada      DATE NOT NULL,
  reciclador_id         INTEGER REFERENCES reciclador (id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_solicitud_hogar ON solicitud_recoleccion (hogar_id);
CREATE INDEX idx_solicitud_estado ON solicitud_recoleccion (estado);

CREATE TABLE detalle_solicitud (
  id           SERIAL PRIMARY KEY,
  solicitud_id INTEGER NOT NULL REFERENCES solicitud_recoleccion (id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES categoria_residuo (id),
  tamano_bolsa VARCHAR(10) NOT NULL CHECK (tamano_bolsa IN ('pequena', 'mediana', 'grande')),
  cantidad     INTEGER NOT NULL CHECK (cantidad > 0)
);

-- INMUTABLE: la API solo expone POST (soporta remuneración, Decreto 596 de 2016)
CREATE TABLE recoleccion (
  id                SERIAL PRIMARY KEY,
  solicitud_id      INTEGER UNIQUE NOT NULL REFERENCES solicitud_recoleccion (id),
  reciclador_id     INTEGER NOT NULL REFERENCES reciclador (id),
  peso_kg           NUMERIC(6, 2) NOT NULL CHECK (peso_kg > 0),
  tipo_material     VARCHAR(160) NOT NULL,
  fecha_recoleccion TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE calificacion (
  id             SERIAL PRIMARY KEY,
  recoleccion_id INTEGER UNIQUE NOT NULL REFERENCES recoleccion (id),
  estrellas      INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario     VARCHAR(500),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Soporta el formulario "sugerir residuo" cuando la búsqueda no encuentra
-- resultados (RF-01).
CREATE TABLE sugerencia_residuo (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  descripcion VARCHAR(300),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
