const pool = require('../config/db');
const HttpError = require('../utils/httpError');

// Center of Engativá, used as fallback when the client sends no coordinates.
const ENGATIVA_CENTER = { lat: 4.711, lng: -74.113 };

/**
 * RF-05/RF-06: recycling points ordered by distance (Haversine in SQL — the
 * spec allows avoiding PostGIS) with optional filter by accepted material.
 */
async function listPuntos({ material, lat, lng }) {
  const originLat = Number.isFinite(lat) ? lat : ENGATIVA_CENTER.lat;
  const originLng = Number.isFinite(lng) ? lng : ENGATIVA_CENTER.lng;

  const params = [originLat, originLng];
  let materialFilter = '';
  if (material) {
    params.push(`%${material}%`);
    materialFilter = `WHERE EXISTS (SELECT 1 FROM unnest(materiales_aceptados) m WHERE m ILIKE $${params.length})`;
  }

  const { rows } = await pool.query(
    `SELECT *,
            round((6371 * acos(least(1.0,
              cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2))
              + sin(radians($1)) * sin(radians(lat))
            )))::numeric, 2) AS distancia_km
     FROM punto_reciclaje
     ${materialFilter}
     ORDER BY distancia_km ASC`,
    params,
  );
  return rows;
}

// ---- Admin CRUD (RF-17) ----

async function createPunto({ nombre, tipo, lat, lng, direccion, materiales_aceptados, horario }) {
  const { rows } = await pool.query(
    `INSERT INTO punto_reciclaje (nombre, tipo, lat, lng, direccion, materiales_aceptados, horario)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [nombre, tipo, lat, lng, direccion || null, materiales_aceptados || [], horario || null],
  );
  return rows[0];
}

async function updatePunto(id, { nombre, tipo, lat, lng, direccion, materiales_aceptados, horario }) {
  const { rows } = await pool.query(
    `UPDATE punto_reciclaje
     SET nombre = $2, tipo = $3, lat = $4, lng = $5, direccion = $6,
         materiales_aceptados = $7, horario = $8
     WHERE id = $1 RETURNING *`,
    [id, nombre, tipo, lat, lng, direccion || null, materiales_aceptados || [], horario || null],
  );
  if (rows.length === 0) throw new HttpError(404, 'El punto de reciclaje no existe.');
  return rows[0];
}

async function deletePunto(id) {
  const result = await pool.query('DELETE FROM punto_reciclaje WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new HttpError(404, 'El punto de reciclaje no existe.');
}

module.exports = { listPuntos, createPunto, updatePunto, deletePunto, ENGATIVA_CENTER };
