const { isTest } = require('../config/env');

function notFound(_req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' });
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500 && !isTest) {
    console.error(err);
  }
  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
