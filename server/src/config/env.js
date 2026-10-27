const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const isTest = process.env.NODE_ENV === 'test';

const DEFAULT_URL = 'postgres://ecorecicla:ecorecicla@localhost:5432/ecorecicla';
const DEFAULT_TEST_URL = 'postgres://ecorecicla:ecorecicla@localhost:5432/ecorecicla_test';

module.exports = {
  isTest,
  port: Number(process.env.PORT) || 4000,
  databaseUrl: isTest
    ? process.env.TEST_DATABASE_URL || DEFAULT_TEST_URL
    : process.env.DATABASE_URL || DEFAULT_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-no-usar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
