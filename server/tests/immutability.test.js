const { app, request, login } = require('./helpers');

/**
 * RF-14: RECOLECCION is immutable — the API exposes no UPDATE/DELETE.
 * Every mutating verb must answer 405 (Method Not Allowed).
 */
describe('Inmutabilidad de RECOLECCION', () => {
  it.each([
    ['patch', '/api/v1/recolecciones/1'],
    ['put', '/api/v1/recolecciones/1'],
    ['delete', '/api/v1/recolecciones/1'],
    ['patch', '/api/v1/recolecciones'],
    ['put', '/api/v1/recolecciones'],
    ['delete', '/api/v1/recolecciones'],
  ])('%s %s responds 405', async (method, path) => {
    const response = await request(app)[method](path);

    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('POST');
    expect(response.body.error).toContain('inmutable');
  });

  it('responds 405 even with a valid reciclador token', async () => {
    const token = await login('reciclador@demo.co');
    const response = await request(app)
      .patch('/api/v1/recolecciones/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ peso_kg: 99 });

    expect(response.status).toBe(405);
  });

  it('the seeded collection stays intact', async () => {
    const hogarToken = await login('hogar@demo.co');
    const historial = await request(app)
      .get('/api/v1/hogares/historial')
      .set('Authorization', `Bearer ${hogarToken}`);

    const seeded = historial.body.recolecciones.find((r) => r.recoleccion_id === 1);
    expect(seeded).toBeDefined();
    expect(Number(seeded.peso_kg)).toBe(9.5);
  });
});
