const request = require('supertest');
const app = require('../app'); // Ajusta la ruta si tu app.js está en otra carpeta

describe('API /api/products', () => {

  // ---- CREATE ----
  test('POST /api/products crea un producto y responde 201', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Zapatillas Stride', price: 599 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Product Created',
      data: expect.any(Object)
    });
  });

  // ---- READ (list) ----
  test('GET /api/products responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/products');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---- READ (find by id) ----
  test('GET /api/products/:id responde 200 y usa el parámetro recibido', async () => {
    const res = await request(app).get('/api/products/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product by ID');
  });

  // ---- UPDATE ----
  test('PUT /api/products/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .send({ name: 'Zapatillas Stride v2' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product Updated');
  });

  // ---- DELETE ----
  test('DELETE /api/products/:id responde 200 con mensaje de eliminación', async () => {
    const res = await request(app).delete('/api/products/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product Deleted');
  });

  // ---- MANEJO DE RECURSOS INEXISTENTES ----
  // NOTA: el controlador actual (find/update/destroy) no valida si el ID
  // existe realmente -- siempre responde 200 con data: {}. Este test documenta
  // ese comportamiento actual. Si agregan validación real (404 cuando no
  // existe), hay que cambiar este test para esperar 404.
  test('GET /api/products/:id con un id inexistente (comportamiento actual del mock)', async () => {
    const res = await request(app).get('/api/products/999999');

    expect(res.statusCode).toBe(200); // Debería ser 404 si hubiera validación real
    expect(res.body.data).toEqual({});
  });

  // ---- COMPORTAMIENTO ANTE SOLICITUDES INCORRECTAS ----
  // NOTA: igual que arriba, create/update no validan el body. Este test
  // documenta que hoy en día un body vacío igual "funciona" (201/200).
  // Si agregan validación (400 cuando el body es inválido), cambiar aquí.
  test('POST /api/products sin body (comportamiento actual del mock)', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({});

    expect(res.statusCode).toBe(201); // Debería ser 400 si hubiera validación real
  });

});
