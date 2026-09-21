const request = require('supertest');
const app = require('../app');

describe('API /api/customers', () => {

  // ---- CREATE ----
  test('POST /api/customers crea un cliente y responde 201', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({
        name: 'Ana García',
        email: 'ana@example.com'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Customer Created',
      data: expect.any(Object)
    });
  });

  // ---- READ (list) ----
  test('GET /api/customers responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/customers');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---- READ (find by id) ----
  test('GET /api/customers/:id responde 200 y usa el parámetro recibido', async () => {
    const res = await request(app).get('/api/customers/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Customer by ID');
  });

  // ---- UPDATE ----
  test('PUT /api/customers/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/customers/1')
      .send({ name: 'Ana García Actualizada' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Customer Updated');
  });

  // ---- DELETE ----
  test('DELETE /api/customers/:id responde 200 con mensaje de eliminación', async () => {
    const res = await request(app).delete('/api/customers/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Customer Deleted');
  });

  // ---- MANEJO DE RECURSOS INEXISTENTES ----
  test('GET /api/customers/:id con un id inexistente (comportamiento actual del mock)', async () => {
    const res = await request(app).get('/api/customers/999999');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({});
  });

  // ---- COMPORTAMIENTO ANTE SOLICITUDES INCORRECTAS ----
  test('POST /api/customers sin body (comportamiento actual del mock)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({});

    expect(res.statusCode).toBe(201);
  });

});