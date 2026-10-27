const { app, request, login } = require('./helpers');

describe('Reglas de autorización por rol', () => {
  let hogarToken;
  let recicladorToken;

  beforeAll(async () => {
    hogarToken = await login('hogar@demo.co');
    recicladorToken = await login('reciclador@demo.co');
  });

  it('a household cannot access /solicitudes/zona (403)', async () => {
    const response = await request(app)
      .get('/api/v1/solicitudes/zona')
      .set('Authorization', `Bearer ${hogarToken}`);
    expect(response.status).toBe(403);
  });

  it('a reciclador cannot create requests (403)', async () => {
    const response = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${recicladorToken}`)
      .send({
        fecha_solicitada: '2026-08-01',
        franja_disponibilidad: 'Mañana',
        detalles: [{ categoria_id: 1, tamano_bolsa: 'grande', cantidad: 1 }],
      });
    expect(response.status).toBe(403);
  });

  it('a household cannot register collections (403)', async () => {
    const response = await request(app)
      .post('/api/v1/recolecciones')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({ solicitud_id: 2, peso_kg: 5, tipo_material: 'Cartón' });
    expect(response.status).toBe(403);
  });

  it('a non-admin cannot access the admin panel (403)', async () => {
    const response = await request(app)
      .get('/api/v1/admin/organizaciones')
      .set('Authorization', `Bearer ${hogarToken}`);
    expect(response.status).toBe(403);
  });
});

describe('Panel administrativo (RF-11, RF-17)', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await login('admin@ecorecicla.co');
  });

  it('lists organizations with their reciclador count', async () => {
    const response = await request(app)
      .get('/api/v1/admin/organizaciones')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  it('verifies a pending organization (RF-11)', async () => {
    const response = await request(app)
      .patch('/api/v1/admin/organizaciones/2/verificar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('verificada');
  });

  it('registers a new organization publicly (starts pending)', async () => {
    const response = await request(app).post('/api/v1/organizaciones').send({
      nombre: 'Precooperativa Ambiental Las Ferias',
      nit: `9012345${Date.now() % 100}-1`,
      telefono: '3005556677',
    });

    expect(response.status).toBe(201);
    expect(response.body.organizacion.estado).toBe('pendiente');
  });

  it('creates a reciclador account tied to a verified organization', async () => {
    const email = `reciclador-${Date.now()}@test.co`;
    const response = await request(app)
      .post('/api/v1/admin/recicladores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Reciclador de Prueba',
        email,
        password: 'ClaveSegura1!',
        organizacion_id: 1,
        upz_cobertura: [5, 6],
      });

    expect(response.status).toBe(201);
    expect(response.body.usuario.rol).toBe('reciclador');
    expect(response.body.reciclador.upz_cobertura).toEqual([5, 6]);

    const token = await login(email, 'ClaveSegura1!');
    const zone = await request(app)
      .get('/api/v1/solicitudes/zona')
      .set('Authorization', `Bearer ${token}`);
    expect(zone.status).toBe(200);
  });

  it('runs the waste CRUD (create, update, delete)', async () => {
    const created = await request(app)
      .post('/api/v1/admin/residuos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Residuo de prueba',
        categoria_id: 1,
        preparacion_previa: 'Limpiar y secar.',
        error_frecuente: 'Se bota húmedo.',
        sinonimos: ['prueba'],
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/v1/admin/residuos/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Residuo de prueba editado',
        categoria_id: 3,
        preparacion_previa: 'Limpiar bien.',
        error_frecuente: 'Se confunde de bolsa.',
        sinonimos: [],
      });
    expect(updated.status).toBe(200);
    expect(updated.body.nombre).toBe('Residuo de prueba editado');

    const deleted = await request(app)
      .delete(`/api/v1/admin/residuos/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);
  });

  it('runs the recycling point and route CRUD', async () => {
    const punto = await request(app)
      .post('/api/v1/admin/puntos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Punto de prueba',
        tipo: 'punto',
        lat: 4.7,
        lng: -74.1,
        direccion: 'Calle falsa 123',
        materiales_aceptados: ['papel'],
        horario: 'Lunes a viernes',
      });
    expect(punto.status).toBe(201);

    const puntoDeleted = await request(app)
      .delete(`/api/v1/admin/puntos/${punto.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(puntoDeleted.status).toBe(204);

    const ruta = await request(app)
      .post('/api/v1/admin/rutas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        upz_id: 1,
        dia_semana: 'Domingo',
        franja_horaria: '7:00 a. m. – 9:00 a. m.',
        operador: 'Operador de prueba',
      });
    expect(ruta.status).toBe(201);

    const rutaUpdated = await request(app)
      .put(`/api/v1/admin/rutas/${ruta.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        upz_id: 1,
        dia_semana: 'Lunes',
        franja_horaria: '8:00 a. m. – 10:00 a. m.',
        operador: 'Operador de prueba',
      });
    expect(rutaUpdated.status).toBe(200);
    expect(rutaUpdated.body.dia_semana).toBe('Lunes');

    const rutaDeleted = await request(app)
      .delete(`/api/v1/admin/rutas/${ruta.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(rutaDeleted.status).toBe(204);
  });
});
