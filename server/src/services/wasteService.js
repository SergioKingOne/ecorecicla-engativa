const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const levenshtein = require('../utils/levenshtein');

const BASE_SELECT = `
  SELECT r.id, r.nombre, r.preparacion_previa, r.error_frecuente, r.sinonimos,
         c.id AS categoria_id, c.nombre AS categoria, c.color_bolsa
  FROM residuo r
  JOIN categoria_residuo c ON c.id = r.categoria_id
`;

/**
 * RF-01: search by name or synonym. When nothing matches, suggest the closest
 * item (Levenshtein over names and synonyms) so the user still gets a category.
 */
async function searchResiduos({ buscar, categoriaId }) {
  const conditions = [];
  const params = [];

  if (buscar) {
    params.push(`%${buscar}%`);
    conditions.push(
      `(r.nombre ILIKE $${params.length}
        OR EXISTS (SELECT 1 FROM unnest(r.sinonimos) s WHERE s ILIKE $${params.length}))`,
    );
  }
  if (categoriaId) {
    params.push(categoriaId);
    conditions.push(`r.categoria_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`${BASE_SELECT} ${where} ORDER BY r.nombre LIMIT 60`, params);

  if (rows.length > 0 || !buscar) {
    return { resultados: rows, sugerencia: null };
  }
  return { resultados: [], sugerencia: await findClosest(buscar) };
}

async function findClosest(term) {
  const { rows } = await pool.query(`${BASE_SELECT}`);
  let best = null;
  let bestDistance = Infinity;
  for (const row of rows) {
    for (const candidate of [row.nombre, ...row.sinonimos]) {
      const distance = levenshtein(term, candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = row;
      }
    }
  }
  if (!best) return null;
  return {
    residuo: best,
    mensaje: `No encontramos «${term}». El residuo más parecido es «${best.nombre}» (bolsa ${best.color_bolsa}).`,
  };
}

async function getResiduo(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE r.id = $1`, [id]);
  if (rows.length === 0) {
    throw new HttpError(404, 'El residuo no existe.');
  }
  return rows[0];
}

async function listCategorias() {
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre, c.color_bolsa, c.descripcion, count(r.id)::int AS total_residuos
     FROM categoria_residuo c
     LEFT JOIN residuo r ON r.categoria_id = c.id
     GROUP BY c.id
     ORDER BY c.id`,
  );
  return rows;
}

/** RF-01: "sugerir residuo" form when the search finds nothing. */
async function createSuggestion({ nombre, descripcion }) {
  const { rows } = await pool.query(
    'INSERT INTO sugerencia_residuo (nombre, descripcion) VALUES ($1, $2) RETURNING *',
    [nombre, descripcion || null],
  );
  return rows[0];
}

// ---- Admin CRUD (RF-17) ----

async function createResiduo({ nombre, categoria_id, preparacion_previa, error_frecuente, sinonimos }) {
  const { rows } = await pool.query(
    `INSERT INTO residuo (nombre, categoria_id, preparacion_previa, error_frecuente, sinonimos)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, categoria_id, preparacion_previa, error_frecuente, sinonimos || []],
  );
  return rows[0];
}

async function updateResiduo(id, { nombre, categoria_id, preparacion_previa, error_frecuente, sinonimos }) {
  const { rows } = await pool.query(
    `UPDATE residuo
     SET nombre = $2, categoria_id = $3, preparacion_previa = $4, error_frecuente = $5, sinonimos = $6
     WHERE id = $1 RETURNING *`,
    [id, nombre, categoria_id, preparacion_previa, error_frecuente, sinonimos || []],
  );
  if (rows.length === 0) throw new HttpError(404, 'El residuo no existe.');
  return rows[0];
}

async function deleteResiduo(id) {
  const result = await pool.query('DELETE FROM residuo WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new HttpError(404, 'El residuo no existe.');
}

module.exports = {
  searchResiduos,
  getResiduo,
  listCategorias,
  createSuggestion,
  createResiduo,
  updateResiduo,
  deleteResiduo,
};
