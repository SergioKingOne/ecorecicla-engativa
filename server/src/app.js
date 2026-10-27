const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { corsOrigin } = require('./config/env');

const app = express();

// Behind the free-tier reverse proxy (Render) the client IP arrives in
// X-Forwarded-For; needed for the auth rate limit to work correctly.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
