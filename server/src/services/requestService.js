const pool = require('../config/db');
const HttpError = require('../utils/httpError');

const DETALLES_JSON = `
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', d.id,
      'categoria_id', d.categoria_id,
      'categoria', c.nombre,
      'color_bolsa', c.color_bolsa,
      'tamano_bolsa', d.tamano_bolsa,
      'cantidad', d.cantidad
    ) ORDER BY d.id)
    FROM detalle_solicitud d
    JOIN categoria_residuo c ON c.id = d.categoria_id
    WHERE d.solicitud_id = s.id
  ), '[]'::json) AS detalles
`;

/** Loads the reciclador profile for an authenticated user. */
async function getRecicladorProfile(usuarioId) {
  const { rows } = await pool.query(
    'SELECT id, organizacion_id, upz_cobertura FROM reciclador WHERE usuario_id = $1',
    [usuarioId],
  );
  if (rows.length === 0) {
    throw new HttpError(403, 'Tu usuario no tiene un perfil de reciclador asociado.');
  }
  return rows[0];
}

/** RF-12: household schedules a pickup with materials, bag sizes and time slot. */
async function createSolicitud(hogarId, { fecha_solicitada, franja_disponibilidad, nota_acceso, detalles }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO solicitud_recoleccion (hogar_id, franja_disponibilidad, nota_acceso, fecha_solicitada)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [hogarId, franja_disponibilidad, nota_acceso || null, fecha_solicitada],
    );
    const solicitudId = rows[0].id;
    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO detalle_solicitud (solicitud_id, categoria_id, tamano_bolsa, cantidad)
         VALUES ($1, $2, $3, $4)`,
        [solicitudId, detalle.categoria_id, detalle.tamano_bolsa, detalle.cantidad],
      );
    }
    await client.query('COMMIT');
    return getSolicitudForHogar(hogarId, solicitudId);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23503') {
      throw new HttpError(400, 'Alguna de las categorías seleccionadas no existe.');
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getSolicitudForHogar(hogarId, solicitudId) {
  const { rows } = await pool.query(
    `SELECT s.*, ${DETALLES_JSON}
     FROM solicitud_recoleccion s
     WHERE s.id = $1 AND s.hogar_id = $2`,
    [solicitudId, hogarId],
  );
  return rows[0];
}

/** RF-12/RF-15: the household's own requests, newest first. */
async function listMine(hogarId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.estado, s.franja_disponibilidad, s.nota_acceso, s.fecha_solicitada,
            s.created_at, ur.nombre AS reciclador_nombre, ${DETALLES_JSON}
     FROM solicitud_recoleccion s
     LEFT JOIN reciclador r ON r.id = s.reciclador_id
     LEFT JOIN usuario ur ON ur.id = r.usuario_id
     WHERE s.hogar_id = $1
     ORDER BY s.created_at DESC`,
    [hogarId],
  );
  return rows;
}

/**
 * RF-13: requests visible to a reciclador — pending ones from households in
 * their coverage UPZs, plus those already assigned to them.
 */
async function listZone(usuarioId) {
  const profile = await getRecicladorProfile(usuarioId);
  const { rows } = await pool.query(
    `SELECT s.id, s.estado, s.franja_disponibilidad, s.nota_acceso, s.fecha_solicitada,
            s.created_at, s.reciclador_id,
            uh.nombre AS hogar_nombre, uh.barrio_aproximado, uz.nombre AS upz_nombre,
            ${DETALLES_JSON}
     FROM solicitud_recoleccion s
     JOIN usuario uh ON uh.id = s.hogar_id
     LEFT JOIN upz uz ON uz.id = uh.upz_id
     WHERE (s.estado = 'pendiente' AND uh.upz_id = ANY($1))
        OR (s.reciclador_id = $2 AND s.estado IN ('aceptada', 'reprogramada'))
     ORDER BY s.fecha_solicitada ASC, s.created_at ASC`,
    [profile.upz_cobertura, profile.id],
  );
  return rows;
}

const MANAGEABLE_STATES = ['pendiente', 'aceptada', 'reprogramada'];

/** RF-13: accept / reschedule / reject a request in the reciclador's zone. */
async function updateEstado(usuarioId, solicitudId, { estado, fecha_solicitada }) {
  const profile = await getRecicladorProfile(usuarioId);

  const { rows } = await pool.query(
    `SELECT s.id, s.estado, s.reciclador_id, uh.upz_id
     FROM solicitud_recoleccion s
     JOIN usuario uh ON uh.id = s.hogar_id
     WHERE s.id = $1`,
    [solicitudId],
  );
  const solicitud = rows[0];
  if (!solicitud) {
    throw new HttpError(404, 'La solicitud no existe.');
  }

  const inZone = profile.upz_cobertura.includes(solicitud.upz_id);
  const assignedToMe = solicitud.reciclador_id === profile.id;
  if (!inZone && !assignedToMe) {
    throw new HttpError(403, 'La solicitud no pertenece a tu zona de cobertura.');
  }
  if (!MANAGEABLE_STATES.includes(solicitud.estado)) {
    throw new HttpError(409, `La solicitud ya no se puede gestionar (estado actual: ${solicitud.estado}).`);
  }

  const recicladorId = estado === 'rechazada' ? null : profile.id;
  const { rows: updated } = await pool.query(
    `UPDATE solicitud_recoleccion
     SET estado = $2, reciclador_id = $3,
         fecha_solicitada = COALESCE($4, fecha_solicitada)
     WHERE id = $1 RETURNING *`,
    [solicitudId, estado, recicladorId, fecha_solicitada || null],
  );
  return updated[0];
}

/** A household may cancel its own request while it is still open. */
async function cancel(hogarId, solicitudId) {
  const { rows } = await pool.query(
    'SELECT id, estado FROM solicitud_recoleccion WHERE id = $1 AND hogar_id = $2',
    [solicitudId, hogarId],
  );
  const solicitud = rows[0];
  if (!solicitud) {
    throw new HttpError(404, 'La solicitud no existe.');
  }
  if (!MANAGEABLE_STATES.includes(solicitud.estado)) {
    throw new HttpError(409, `La solicitud no se puede cancelar (estado actual: ${solicitud.estado}).`);
  }
  const { rows: updated } = await pool.query(
    `UPDATE solicitud_recoleccion SET estado = 'cancelada' WHERE id = $1 RETURNING *`,
    [solicitudId],
  );
  return updated[0];
}

module.exports = {
  getRecicladorProfile,
  createSolicitud,
  listMine,
  listZone,
  updateEstado,
  cancel,
};
