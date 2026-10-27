const pool = require('../config/db');
const { verifyToken } = require('../utils/jwt');

/**
 * Validates the JWT and loads the active user from the database.
 * Checking `activo` on every request makes the Ley 1581 revocation
 * effective immediately, even for tokens issued before revoking.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, rol, barrio_aproximado, upz_id, autorizacion_datos, activo FROM usuario WHERE id = $1',
      [payload.id],
    );
    const user = rows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'La cuenta no existe o fue desactivada.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
