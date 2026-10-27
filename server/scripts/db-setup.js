/**
 * Applies database/schema.sql and database/seed.sql to the configured database.
 *
 * Usage:
 *   npm run db:setup                 # uses DATABASE_URL (.env)
 *   NODE_ENV=test npm run db:setup   # uses TEST_DATABASE_URL
 *   node scripts/db-setup.js <url>   # explicit connection string
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DEFAULT_URL = 'postgres://ecorecicla:ecorecicla@localhost:5432/ecorecicla';
const DEFAULT_TEST_URL = 'postgres://ecorecicla:ecorecicla@localhost:5432/ecorecicla_test';

function resolveDatabaseUrl() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_DATABASE_URL || DEFAULT_TEST_URL;
  }
  return process.env.DATABASE_URL || DEFAULT_URL;
}

async function applyDatabase(databaseUrl) {
  const databaseDir = path.join(__dirname, '..', '..', 'database');
  const schema = fs.readFileSync(path.join(databaseDir, 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(databaseDir, 'seed.sql'), 'utf8');

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(schema);
    await client.query(seed);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  const url = process.argv[2] || resolveDatabaseUrl();
  applyDatabase(url)
    .then(() => {
      console.log(`Base de datos lista: ${url.replace(/:[^:@/]+@/, ':***@')}`);
    })
    .catch((error) => {
      console.error('Error preparando la base de datos:', error.message);
      process.exit(1);
    });
}

module.exports = { applyDatabase, resolveDatabaseUrl };
