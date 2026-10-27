const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { signToken } = require('../utils/jwt');

const BCRYPT_ROUNDS = 10;

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    barrio_aproximado: user.barrio_aproximado,
    upz_id: user.upz_id,
    autorizacion_datos: user.autorizacion_datos,
    fecha_autorizacion: user.fecha_autorizacion,
  };
}

/** RF-10 + RF-18: household signup, blocked without express consent (Ley 1581). */
async function registerHousehold({ nombre, email, password, barrio_aproximado, upz_id, autorizacion_datos }) {
  if (autorizacion_datos !== true) {
    throw new HttpError(
      400,
      'Debes autorizar el tratamiento de datos personales (Ley 1581 de 2012) para crear tu cuenta.',
    );
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await pool.query('SELECT id FROM usuario WHERE email = $1', [normalizedEmail]);
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo.');
  }

  if (upz_id) {
    const upz = await pool.query('SELECT id FROM upz WHERE id = $1', [upz_id]);
    if (upz.rowCount === 0) {
      throw new HttpError(400, 'La UPZ seleccionada no existe.');
    }
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO usuario (nombre, email, password_hash, rol, barrio_aproximado, upz_id,
                          autorizacion_datos, fecha_autorizacion)
     VALUES ($1, $2, $3, 'hogar', $4, $5, TRUE, now())
     RETURNING *`,
    [nombre, normalizedEmail, passwordHash, barrio_aproximado || null, upz_id || null],
  );

  const user = rows[0];
  return { usuario: publicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [
    email.toLowerCase(),
  ]);
  const user = rows[0];
  const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !passwordOk) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  if (!user.activo) {
    throw new HttpError(
      403,
      'Esta cuenta fue desactivada (por ejemplo, tras revocar la autorización de datos).',
    );
  }
  return { usuario: publicUser(user), token: signToken(user) };
}

/** RF-18: revoking the data-processing authorization deactivates the account. */
async function revokeAuthorization(userId) {
  await pool.query(
    'UPDATE usuario SET autorizacion_datos = FALSE, activo = FALSE WHERE id = $1',
    [userId],
  );
}

module.exports = { registerHousehold, login, revokeAuthorization };
