const request = require('supertest');
const app = require('../app');

describe('API /api/users', () => {

  // CREATE
  test('POST /api/users crea un usuario y responde 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Usuario',
        email: 'usuario@example.com'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'User Created',
      data: expect.any(Object)
    });
  });

  // READ (list)
  test('GET /api/users responde 200 con la estructura correcta', async () => {
    const res = await request(app).get('/api/users');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // READ (find by id)
  test('GET /api/users/:id responde 200', async () => {
    const res = await request(app).get('/api/users/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User by ID');
  });

  // UPDATE
  test('PUT /api/users/:id responde 200 con mensaje de actualización', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .send({
        name: 'Usuario  Actualizado'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User Updated');
  });

  // DELETE
  test('DELETE /api/users/:id responde 200 con mensaje de eliminación', async () => {
    const res = await request(app).delete('/api/users/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User Deleted');
  });

  // RECURSO INEXISTENTE 
  test('GET /api/users/:id con un id inexistente mantiene el comportamiento actual del mock', async () => {
    const res = await request(app).get('/api/users/999999');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({});
  });

  // SOLICITUD INCORRECTA
  test('POST /api/users sin body mantiene el comportamiento actual del mock', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({});

    expect(res.statusCode).toBe(201);
  });

});
