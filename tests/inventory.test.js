const request = require('supertest');
const app = require('../app');

// NOTA: el inventario no expone CREATE ni DELETE 

describe('API /api/inventory', () => {

  // ---- READ (list) ----
  test('GET /api/inventory responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/inventory');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ---- READ (find by id) ----
  test('GET /api/inventory/:id responde 200 y usa el parámetro recibido', async () => {
    const res = await request(app).get('/api/inventory/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Inventory by ID');
  });

  // ---- UPDATE ----
  test('PUT /api/inventory/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/inventory/1')
      .send({ stock: 25 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Inventory Updated');
  });

  // ---- MANEJO DE RECURSOS INEXISTENTES ----
  // NOTA: el controlador actual (find/update/destroy) no valida si el ID
  // existe realmente -- siempre responde 200 con data: {}. Este test documenta
  // ese comportamiento actual. Si agregan validación real (404 cuando no
  // existe), hay que cambiar este test para esperar 404.
  test('GET /api/inventory/:id con un id inexistente (comportamiento actual del mock)', async () => {
    const res = await request(app).get('/api/inventory/999999');

    expect(res.statusCode).toBe(200); // Debería ser 404 si hubiera validación real
    expect(res.body.data).toEqual({});
  });

  // ---- COMPORTAMIENTO ANTE SOLICITUDES INCORRECTAS ----
  // NOTA: igual que arriba, create/update no validan el body. Este test
  // documenta que hoy en día un body vacío igual "funciona" (201/200).
  // Si agregan validación (400 cuando el body es inválido), cambiar aquí.
  test('PUT /api/inventory/:id sin body (comportamiento actual del mock)', async () => {
    const res = await request(app)
      .put('/api/inventory/1')
      .send({});

    expect(res.statusCode).toBe(200); // Debería ser 400 si hubiera validación real
  });

});