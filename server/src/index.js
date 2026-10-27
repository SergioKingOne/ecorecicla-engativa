const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`API de EcoRecicla escuchando en http://localhost:${port}/api/v1`);
});
