const request = require('supertest');
const app = require('../app');

describe('API /api/roles', () => {

  // CREATE
  test('POST /api/roles crea un rol y responde 201', async () => {
    const res = await request(app)
      .post('/api/roles')
      .send({
        name: 'Administrador'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Role Created',
      data: expect.any(Object)
    });
  });

  // READ (list)
  test('GET /api/roles responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/roles');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // READ (find by id)
 test('GET /api/roles/:id responde 200', async () => {
    const res = await request(app).get('/api/roles/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Role by ID');
  });

  // UPDATE
  test('PUT /api/roles/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/roles/1')
      .send({
        name: 'Administrador Actualizado'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Role Updated');
  });

  // DELETE
  test('DELETE /api/roles/:id responde 200 con mensaje de eliminación', async () => {
    const res = await request(app).delete('/api/roles/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Role Deleted');
  });

  // RECURSO INEXISTENTE
  test('GET /api/roles/:id con un id inexistente mantiene el comportamiento actual del mock', async () => {
    const res = await request(app).get('/api/roles/999999');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({});
  });

  // SOLICITUD INCORRECTA
  test('POST /api/roles sin body mantiene el comportamiento actual del mock', async () => {
    const res = await request(app)
      .post('/api/roles')
      .send({});

    expect(res.statusCode).toBe(201);
  });

});
