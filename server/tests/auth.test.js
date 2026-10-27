const { app, request, login, DEMO_PASSWORD } = require('./helpers');

describe('Auth (RF-10, RF-18)', () => {
  describe('POST /api/v1/auth/registro', () => {
    it('creates a household account when consent is given', async () => {
      const response = await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Hogar Nuevo',
        email: `nuevo-${Date.now()}@test.co`,
        password: 'ClaveSegura1!',
        barrio_aproximado: 'Santa Cecilia',
        upz_id: 4,
        autorizacion_datos: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.usuario.rol).toBe('hogar');
      expect(response.body.usuario.autorizacion_datos).toBe(true);
      expect(response.body.usuario.fecha_autorizacion).toBeTruthy();
      expect(response.body.usuario.password_hash).toBeUndefined();
    });

    it('rejects the signup without the Ley 1581 consent (blocking checkbox)', async () => {
      const response = await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Sin Consentimiento',
        email: `sinconsent-${Date.now()}@test.co`,
        password: 'ClaveSegura1!',
        autorizacion_datos: false,
      });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toContain('Ley 1581');
    });

    it('rejects a duplicated email with 409', async () => {
      const response = await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Hogar Duplicado',
        email: 'hogar@demo.co',
        password: 'ClaveSegura1!',
        autorizacion_datos: true,
      });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns a JWT for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'hogar@demo.co', password: DEMO_PASSWORD });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.usuario.email).toBe('hogar@demo.co');
    });

    it('rejects wrong credentials with 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'hogar@demo.co', password: 'incorrecta123' });

      expect(response.status).toBe(401);
    });
  });

  describe('JWT protection', () => {
    it('rejects protected routes without token (401)', async () => {
      const response = await request(app).get('/api/v1/solicitudes/mias');
      expect(response.status).toBe(401);
    });

    it('rejects an invalid token (401)', async () => {
      const response = await request(app)
        .get('/api/v1/solicitudes/mias')
        .set('Authorization', 'Bearer token-invalido');
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/auth/autorizacion (revocatoria Ley 1581)', () => {
    it('revokes the authorization and deactivates the account', async () => {
      const email = `revoca-${Date.now()}@test.co`;
      await request(app).post('/api/v1/auth/registro').send({
        nombre: 'Hogar Revocador',
        email,
        password: 'ClaveSegura1!',
        autorizacion_datos: true,
      });
      const token = await login(email, 'ClaveSegura1!');

      const revoke = await request(app)
        .delete('/api/v1/auth/autorizacion')
        .set('Authorization', `Bearer ${token}`);
      expect(revoke.status).toBe(200);

      // The old token stops working immediately…
      const withOldToken = await request(app)
        .get('/api/v1/solicitudes/mias')
        .set('Authorization', `Bearer ${token}`);
      expect(withOldToken.status).toBe(401);

      // …and the deactivated account can no longer log in.
      const reLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'ClaveSegura1!' });
      expect(reLogin.status).toBe(403);
    });
  });
});
