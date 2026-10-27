const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function signToken(user) {
  return jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { signToken, verifyToken };
