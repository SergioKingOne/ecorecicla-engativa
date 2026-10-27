const rateLimit = require('express-rate-limit');
const { isTest } = require('../config/env');

/** Basic rate limit on /auth to slow down brute-force attempts. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.' },
});

module.exports = { authLimiter };
