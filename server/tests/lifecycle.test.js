const { app, request, login } = require('./helpers');

/**
 * RF-12..RF-16: full request lifecycle —
 * create → accept → confirm collection (weight) → rate → history.
 */
describe('Ciclo completo de solicitud', () => {
  let hogarToken;
  let recicladorToken;
  let solicitudId;
  let recoleccionId;

  beforeAll(async () => {
    hogarToken = await login('hogar@demo.co');
    recicladorToken = await login('reciclador@demo.co');
  });

  it('1. the household creates a request (RF-12)', async () => {
    const response = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({
        fecha_solicitada: '2026-08-01',
        franja_disponibilidad: 'Mañana (8:00 a. m. – 12:00 m.)',
        nota_acceso: 'Dejar en portería',
        detalles: [
          { categoria_id: 1, tamano_bolsa: 'grande', cantidad: 2 },
          { categoria_id: 1, tamano_bolsa: 'pequena', cantidad: 1 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.estado).toBe('pendiente');
    expect(response.body.detalles).toHaveLength(2);
    solicitudId = response.body.id;
  });

  it('2. the reciclador sees it in their zone and accepts it (RF-13)', async () => {
    const zone = await request(app)
      .get('/api/v1/solicitudes/zona')
      .set('Authorization', `Bearer ${recicladorToken}`);
    expect(zone.status).toBe(200);
    expect(zone.body.map((s) => s.id)).toContain(solicitudId);

    const accepted = await request(app)
      .patch(`/api/v1/solicitudes/${solicitudId}/estado`)
      .set('Authorization', `Bearer ${recicladorToken}`)
      .send({ estado: 'aceptada' });

    expect(accepted.status).toBe(200);
    expect(accepted.body.estado).toBe('aceptada');
  });

  it('3. the reciclador confirms the collection with the real weight (RF-14)', async () => {
    const response = await request(app)
      .post('/api/v1/recolecciones')
      .set('Authorization', `Bearer ${recicladorToken}`)
      .send({ solicitud_id: solicitudId, peso_kg: 12.5, tipo_material: 'Cartón y PET' });

    expect(response.status).toBe(201);
    expect(Number(response.body.peso_kg)).toBe(12.5);
    recoleccionId = response.body.id;

    // The request is now completed for the household.
    const mias = await request(app)
      .get('/api/v1/solicitudes/mias')
      .set('Authorization', `Bearer ${hogarToken}`);
    const solicitud = mias.body.find((s) => s.id === solicitudId);
    expect(solicitud.estado).toBe('completada');
  });

  it('4. the collection appears in the history with accumulated kg (RF-15)', async () => {
    const response = await request(app)
      .get('/api/v1/hogares/historial')
      .set('Authorization', `Bearer ${hogarToken}`);

    expect(response.status).toBe(200);
    const ids = response.body.recolecciones.map((r) => r.recoleccion_id);
    expect(ids).toContain(recoleccionId);
    // Seeded collection (9.5 kg) + this one (12.5 kg)
    expect(response.body.total_kg).toBeGreaterThanOrEqual(22);
  });

  it('5. the household rates the service (RF-16)', async () => {
    const response = await request(app)
      .post('/api/v1/calificaciones')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({ recoleccion_id: recoleccionId, estrellas: 5, comentario: 'Excelente servicio.' });

    expect(response.status).toBe(201);
    expect(response.body.estrellas).toBe(5);
  });

  it('6. a second rating for the same collection is rejected (409)', async () => {
    const response = await request(app)
      .post('/api/v1/calificaciones')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({ recoleccion_id: recoleccionId, estrellas: 1 });

    expect(response.status).toBe(409);
  });

  it('7. a completed request can no longer be managed (409)', async () => {
    const response = await request(app)
      .patch(`/api/v1/solicitudes/${solicitudId}/estado`)
      .set('Authorization', `Bearer ${recicladorToken}`)
      .send({ estado: 'rechazada' });

    expect(response.status).toBe(409);
  });

  it('8. a duplicated collection for the same request is rejected (409)', async () => {
    const response = await request(app)
      .post('/api/v1/recolecciones')
      .set('Authorization', `Bearer ${recicladorToken}`)
      .send({ solicitud_id: solicitudId, peso_kg: 3, tipo_material: 'Vidrio' });

    expect(response.status).toBe(409);
  });
});

describe('Gestión adicional de solicitudes', () => {
  it('allows the reciclador to reschedule with a new date', async () => {
    const hogarToken = await login('hogar@demo.co');
    const recicladorToken = await login('reciclador@demo.co');

    const created = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({
        fecha_solicitada: '2026-08-10',
        franja_disponibilidad: 'Tarde (12:00 m. – 5:00 p. m.)',
        detalles: [{ categoria_id: 2, tamano_bolsa: 'mediana', cantidad: 1 }],
      });

    const response = await request(app)
      .patch(`/api/v1/solicitudes/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${recicladorToken}`)
      .send({ estado: 'reprogramada', fecha_solicitada: '2026-08-12' });

    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('reprogramada');
    expect(response.body.fecha_solicitada).toContain('2026-08-12');
  });

  it('allows the household to cancel an open request', async () => {
    const hogarToken = await login('hogar@demo.co');

    const created = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({
        fecha_solicitada: '2026-08-15',
        franja_disponibilidad: 'Mañana (8:00 a. m. – 12:00 m.)',
        detalles: [{ categoria_id: 1, tamano_bolsa: 'pequena', cantidad: 1 }],
      });

    const response = await request(app)
      .patch(`/api/v1/solicitudes/${created.body.id}/cancelar`)
      .set('Authorization', `Bearer ${hogarToken}`);

    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('cancelada');
  });

  it('rejects an out-of-zone reciclador (403)', async () => {
    const hogarToken = await login('hogar@demo.co');
    // reciclador2 covers UPZ 4,5,6,8,9 — the demo household lives in UPZ 3.
    const reciclador2Token = await login('reciclador2@demo.co');

    const created = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${hogarToken}`)
      .send({
        fecha_solicitada: '2026-08-20',
        franja_disponibilidad: 'Mañana (8:00 a. m. – 12:00 m.)',
        detalles: [{ categoria_id: 1, tamano_bolsa: 'mediana', cantidad: 1 }],
      });

    const response = await request(app)
      .patch(`/api/v1/solicitudes/${created.body.id}/estado`)
      .set('Authorization', `Bearer ${reciclador2Token}`)
      .send({ estado: 'aceptada' });

    expect(response.status).toBe(403);
  });
});
