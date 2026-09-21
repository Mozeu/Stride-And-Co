const request = require('supertest');
const app = require('../app');

describe('API /api/variants', () => {

  // ---- CREATE ----
  test('POST /api/variants crea una variante y responde 201', async () => {
    const res = await request(app)
      .post('/api/variants')
      .send({
        name: 'Color Negro',
        sku: 'SKU-NEGRO-01'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Variant Created',
      data: expect.any(Object)
    });
  });

  // ---- READ (list) ----
  test('GET /api/variants responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/variants');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---- READ (find by id) ----
  test('GET /api/variants/:id responde 200 y usa el parámetro recibido', async () => {
    const res = await request(app).get('/api/variants/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Variant by ID');
  });

  // ---- UPDATE ----
  test('PUT /api/variants/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/variants/1')
      .send({ name: 'Color Blanco' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Variant Updated');
  });

  // ---- DELETE ----
  test('DELETE /api/variants/:id responde 200 con mensaje de eliminación', async () => {
    const res = await request(app).delete('/api/variants/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Variant Deleted');
  });

  // ---- MANEJO DE RECURSOS INEXISTENTES ----
  test('GET /api/variants/:id con un id inexistente (comportamiento actual del mock)', async () => {
    const res = await request(app).get('/api/variants/999999');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({});
  });

  // ---- COMPORTAMIENTO ANTE SOLICITUDES INCORRECTAS ----
  test('POST /api/variants sin body (comportamiento actual del mock)', async () => {
    const res = await request(app)
      .post('/api/variants')
      .send({});

    expect(res.statusCode).toBe(201);
  });

});