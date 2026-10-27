const { applyDatabase, resolveDatabaseUrl } = require('../scripts/db-setup');

/** Re-applies schema + seed to the TEST database so every run is deterministic. */
module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  await applyDatabase(resolveDatabaseUrl());
};
