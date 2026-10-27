const pool = require('../config/db');
const HttpError = require('../utils/httpError');

/** RF-08: selective collection route(s), optionally filtered by UPZ. */
async function listRutas(upzId) {
  const params = [];
  let where = '';
  if (upzId) {
    params.push(upzId);
    where = 'WHERE r.upz_id = $1';
  }
  const { rows } = await pool.query(
    `SELECT r.id, r.upz_id, u.codigo AS upz_codigo, u.nombre AS upz_nombre,
            r.dia_semana, r.franja_horaria, r.operador
     FROM ruta_recoleccion r
     JOIN upz u ON u.id = r.upz_id
     ${where}
     ORDER BY u.nombre`,
    params,
  );
  return rows;
}

async function listUpz() {
  const { rows } = await pool.query('SELECT id, codigo, nombre FROM upz ORDER BY nombre');
  return rows;
}

// ---- Admin CRUD (RF-17) ----

async function createRuta({ upz_id, dia_semana, franja_horaria, operador }) {
  const { rows } = await pool.query(
    `INSERT INTO ruta_recoleccion (upz_id, dia_semana, franja_horaria, operador)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [upz_id, dia_semana, franja_horaria, operador || null],
  );
  return rows[0];
}

async function updateRuta(id, { upz_id, dia_semana, franja_horaria, operador }) {
  const { rows } = await pool.query(
    `UPDATE ruta_recoleccion
     SET upz_id = $2, dia_semana = $3, franja_horaria = $4, operador = $5
     WHERE id = $1 RETURNING *`,
    [id, upz_id, dia_semana, franja_horaria, operador || null],
  );
  if (rows.length === 0) throw new HttpError(404, 'La ruta no existe.');
  return rows[0];
}

async function deleteRuta(id) {
  const result = await pool.query('DELETE FROM ruta_recoleccion WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new HttpError(404, 'La ruta no existe.');
}

module.exports = { listRutas, listUpz, createRuta, updateRuta, deleteRuta };
