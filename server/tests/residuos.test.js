const { app, request } = require('./helpers');

describe('Guía de clasificación (RF-01, RF-02, RF-03)', () => {
  it('finds a waste item by name', async () => {
    const response = await request(app).get('/api/v1/residuos?buscar=tetrapak');

    expect(response.status).toBe(200);
    expect(response.body.resultados.length).toBeGreaterThan(0);
    expect(response.body.resultados[0].nombre).toBe('Tetrapak');
    expect(response.body.resultados[0].color_bolsa).toBe('blanca');
  });

  it('finds a waste item by synonym (caja de leche → Tetrapak)', async () => {
    const response = await request(app).get(
      `/api/v1/residuos?buscar=${encodeURIComponent('caja de leche')}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.resultados.map((r) => r.nombre)).toContain('Tetrapak');
  });

  it('suggests the closest item when nothing matches', async () => {
    const response = await request(app).get('/api/v1/residuos?buscar=xyzresiduoquenoexiste');

    expect(response.status).toBe(200);
    expect(response.body.resultados).toHaveLength(0);
    expect(response.body.sugerencia).not.toBeNull();
    expect(response.body.sugerencia.residuo.color_bolsa).toMatch(/^(blanca|verde|negra)$/);
    expect(response.body.sugerencia.mensaje).toContain('No encontramos');
  });

  it('filters the catalog by category (RF-02)', async () => {
    const response = await request(app).get('/api/v1/residuos?categoria=2');

    expect(response.status).toBe(200);
    expect(response.body.resultados.length).toBeGreaterThan(0);
    expect(response.body.resultados.every((r) => r.color_bolsa === 'verde')).toBe(true);
  });

  it('returns the complete ficha with bag color and frequent error (RF-03)', async () => {
    const search = await request(app).get('/api/v1/residuos?buscar=icopor');
    const icopor = search.body.resultados[0];

    const response = await request(app).get(`/api/v1/residuos/${icopor.id}`);

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Icopor');
    expect(response.body.color_bolsa).toBe('negra');
    expect(response.body.preparacion_previa).toBeTruthy();
    expect(response.body.error_frecuente).toBeTruthy();
  });

  it('returns 404 for a non-existing ficha', async () => {
    const response = await request(app).get('/api/v1/residuos/99999');
    expect(response.status).toBe(404);
  });

  it('lists the 3 national color-code categories', async () => {
    const response = await request(app).get('/api/v1/categorias');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body.map((c) => c.color_bolsa).sort()).toEqual(['blanca', 'negra', 'verde']);
  });

  it('accepts a "sugerir residuo" submission (RF-01)', async () => {
    const response = await request(app)
      .post('/api/v1/residuos/sugerencias')
      .send({ nombre: 'cápsulas de café', descripcion: 'No sé si el aluminio se recicla.' });

    expect(response.status).toBe(201);
    expect(response.body.sugerencia.nombre).toBe('cápsulas de café');
  });
});

describe('Puntos y rutas (RF-05, RF-06, RF-08)', () => {
  it('returns points ordered by distance from the given location', async () => {
    const response = await request(app).get('/api/v1/puntos?lat=4.70&lng=-74.09');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(8);
    const distances = response.body.map((p) => Number(p.distancia_km));
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  it('filters points by accepted material (RF-06)', async () => {
    const response = await request(app).get('/api/v1/puntos?material=aceite');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((p) =>
        p.materiales_aceptados.some((m) => m.toLowerCase().includes('aceite')),
      ),
    ).toBe(true);
  });

  it('returns the route for a UPZ (RF-08)', async () => {
    const response = await request(app).get('/api/v1/rutas?upz=3');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].upz_nombre).toBe('Boyacá Real');
    expect(response.body[0].dia_semana).toBeTruthy();
    expect(response.body[0].franja_horaria).toBeTruthy();
  });

  it('lists the 9 UPZ of Engativá', async () => {
    const response = await request(app).get('/api/v1/upz');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(9);
    expect(response.body.map((u) => u.nombre)).toContain('Garcés Navas');
  });
});
