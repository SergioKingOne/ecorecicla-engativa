const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { getRecicladorProfile } = require('./requestService');

/**
 * RF-14: the assigned reciclador confirms a pickup with the real weight.
 * The resulting RECOLECCION row is immutable: the API only exposes POST
 * (it backs remuneration under Decreto 596 de 2016).
 */
async function createRecoleccion(usuarioId, { solicitud_id, peso_kg, tipo_material }) {
  const profile = await getRecicladorProfile(usuarioId);

  const { rows } = await pool.query(
    'SELECT id, estado, reciclador_id FROM solicitud_recoleccion WHERE id = $1',
    [solicitud_id],
  );
  const solicitud = rows[0];
  if (!solicitud) {
    throw new HttpError(404, 'La solicitud no existe.');
  }
  if (solicitud.reciclador_id !== profile.id) {
    throw new HttpError(403, 'Solo el reciclador asignado puede confirmar esta recolección.');
  }
  if (!['aceptada', 'reprogramada'].includes(solicitud.estado)) {
    throw new HttpError(409, `La solicitud no está en un estado confirmable (estado actual: ${solicitud.estado}).`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: created } = await client.query(
      `INSERT INTO recoleccion (solicitud_id, reciclador_id, peso_kg, tipo_material)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [solicitud_id, profile.id, peso_kg, tipo_material],
    );
    await client.query(
      `UPDATE solicitud_recoleccion SET estado = 'completada' WHERE id = $1`,
      [solicitud_id],
    );
    await client.query('COMMIT');
    return created[0];
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      throw new HttpError(409, 'Esta solicitud ya tiene una recolección registrada.');
    }
    throw error;
  } finally {
    client.release();
  }
}

/** RF-15: household history with accumulated recovered kilograms. */
async function getHistorial(hogarId) {
  const { rows } = await pool.query(
    `SELECT r.id AS recoleccion_id, r.solicitud_id, r.peso_kg, r.tipo_material,
            r.fecha_recoleccion, ur.nombre AS reciclador_nombre,
            c.estrellas, c.comentario
     FROM recoleccion r
     JOIN solicitud_recoleccion s ON s.id = r.solicitud_id
     JOIN reciclador rec ON rec.id = r.reciclador_id
     JOIN usuario ur ON ur.id = rec.usuario_id
     LEFT JOIN calificacion c ON c.recoleccion_id = r.id
     WHERE s.hogar_id = $1
     ORDER BY r.fecha_recoleccion DESC`,
    [hogarId],
  );
  const totalKg = rows.reduce((sum, row) => sum + Number(row.peso_kg), 0);
  return { total_kg: Math.round(totalKg * 100) / 100, recolecciones: rows };
}

/** RF-16: 1–5 star rating with optional comment, one per collection. */
async function createCalificacion(hogarId, { recoleccion_id, estrellas, comentario }) {
  const { rows } = await pool.query(
    `SELECT r.id
     FROM recoleccion r
     JOIN solicitud_recoleccion s ON s.id = r.solicitud_id
     WHERE r.id = $1 AND s.hogar_id = $2`,
    [recoleccion_id, hogarId],
  );
  if (rows.length === 0) {
    throw new HttpError(404, 'La recolección no existe o no pertenece a tu hogar.');
  }

  try {
    const { rows: created } = await pool.query(
      `INSERT INTO calificacion (recoleccion_id, estrellas, comentario)
       VALUES ($1, $2, $3) RETURNING *`,
      [recoleccion_id, estrellas, comentario || null],
    );
    return created[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Ya calificaste esta recolección.');
    }
    throw error;
  }
}

module.exports = { createRecoleccion, getHistorial, createCalificacion };
