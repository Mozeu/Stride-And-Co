const request = require('supertest');
const app = require('../app');

// NOTA: las órdenes no exponen DELETE 

describe('API /api/orders', () => {

  // ---- CREATE ----
  test('POST /api/orders crea una orden y responde 201', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ customerId: 1, items: [{ productId: 1, quantity: 2 }] });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Order Created',
      data: expect.any(Object)
    });
  });

  // ---- READ (list) ----
  test('GET /api/orders responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/orders');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---- READ (find by id) ----
  test('GET /api/orders/:id responde 200 y usa el parámetro recibido', async () => {
    const res = await request(app).get('/api/orders/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Order by ID');
  });

  // ---- UPDATE ----
  test('PUT /api/orders/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/orders/1')
      .send({ status: 'shipped' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Order Updated');
  });

// ---- MANEJO DE RECURSOS INEXISTENTES ----
  // NOTA: el controlador actual (find/update/destroy) no valida si el ID
  // existe realmente -- siempre responde 200 con data: {}. Este test documenta
  // ese comportamiento actual. Si agregan validación real (404 cuando no
  // existe), hay que cambiar este test para esperar 404.
  test('GET /api/orders/:id con un id inexistente (comportamiento actual del mock)', async () => {
    const res = await request(app).get('/api/orders/999999');

    expect(res.statusCode).toBe(200); // Debería ser 404 si hubiera validación real
    expect(res.body.data).toEqual({});
  });

 // ---- COMPORTAMIENTO ANTE SOLICITUDES INCORRECTAS ----
  // NOTA: igual que arriba, create/update no validan el body. Este test
  // documenta que hoy en día un body vacío igual "funciona" (201/200).
  // Si agregan validación (400 cuando el body es inválido), cambiar aquí.
  test('POST /api/orders sin body (comportamiento actual del mock)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({});

    expect(res.statusCode).toBe(201); // Debería ser 400 si hubiera validación real
  });

});