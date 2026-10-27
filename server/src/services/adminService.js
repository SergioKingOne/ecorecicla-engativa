const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');

/** RF-11: public registration of a waste-picker organization (starts pending). */
async function createOrganizacion({ nombre, nit, telefono }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO organizacion_recicladores (nombre, nit, telefono)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, nit, telefono || null],
    );
    return rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'Ya existe una organización registrada con ese NIT.');
    }
    throw error;
  }
}

async function listOrganizaciones() {
  const { rows } = await pool.query(
    `SELECT o.*, count(r.id)::int AS total_recicladores
     FROM organizacion_recicladores o
     LEFT JOIN reciclador r ON r.organizacion_id = o.id
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
  );
  return rows;
}

/** RF-11: manual verification by the admin. */
async function verifyOrganizacion(id) {
  const { rows } = await pool.query(
    `UPDATE organizacion_recicladores SET estado = 'verificada' WHERE id = $1 RETURNING *`,
    [id],
  );
  if (rows.length === 0) {
    throw new HttpError(404, 'La organización no existe.');
  }
  return rows[0];
}

/** RF-11: the admin creates reciclador accounts tied to a verified organization. */
async function createReciclador({ nombre, email, password, organizacion_id, upz_cobertura }) {
  const org = await pool.query(
    'SELECT id, estado FROM organizacion_recicladores WHERE id = $1',
    [organizacion_id],
  );
  if (org.rowCount === 0) {
    throw new HttpError(404, 'La organización no existe.');
  }
  if (org.rows[0].estado !== 'verificada') {
    throw new HttpError(409, 'La organización aún no ha sido verificada.');
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await pool.query('SELECT id FROM usuario WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: userRows } = await client.query(
      `INSERT INTO usuario (nombre, email, password_hash, rol, autorizacion_datos, fecha_autorizacion)
       VALUES ($1, $2, $3, 'reciclador', TRUE, now())
       RETURNING id, nombre, email, rol`,
      [nombre, normalizedEmail, passwordHash],
    );
    const { rows: recRows } = await client.query(
      `INSERT INTO reciclador (usuario_id, organizacion_id, upz_cobertura)
       VALUES ($1, $2, $3) RETURNING *`,
      [userRows[0].id, organizacion_id, upz_cobertura],
    );
    await client.query('COMMIT');
    return { usuario: userRows[0], reciclador: recRows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createOrganizacion, listOrganizaciones, verifyOrganizacion, createReciclador };
