const request = require('supertest');
const app = require('../app');

describe('API /api/permissions', () => {

  // CREATE
  test('POST /api/permissions crea un permiso y responde 201', async () => {
    const res = await request(app)
      .post('/api/permissions')
      .send({
        name: 'Editar productos'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Permission Created',
      data: expect.any(Object)
    });
  });

  // READ (list)
  test('GET /api/permissions responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/permissions');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // READ (find by id) 
  test('GET /api/permissions/:id responde 200', async () => {
    const res = await request(app).get('/api/permissions/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Permission by ID');
  });

  // UPDATE
  test('PUT /api/permissions/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/permissions/1')
      .send({
        name: 'Editar inventario'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Permission Updated');
  });

  // DELETE
  test('DELETE /api/permissions/:id responde 200 con mensaje de eliminación', async () => {
    const res = await request(app).delete('/api/permissions/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Permission Deleted');
  });

  // RECURSO INEXISTENTE
  test('GET /api/permissions/:id con un id inexistente mantiene el comportamiento actual del mock', async () => {
    const res = await request(app).get('/api/permissions/999999');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({});
  });

  // SOLICITUD INCORRECTA
  test('POST /api/permissions sin body mantiene el comportamiento actual del mock', async () => {
    const res = await request(app)
      .post('/api/permissions')
      .send({});

    expect(res.statusCode).toBe(201);
  });

});
