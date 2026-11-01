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

  test('GET /api/inventory/:id responde 404 cuando no existe', async () => {
    const res = await request(app).get('/api/inventory/999999');

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Inventory not found');
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