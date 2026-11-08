'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');

describe('E2E Users', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let userToken;
  let createdUserId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    userToken = await loginAs('user');
  });

  afterAll(async () => {
    if (createdUserId) {
      await request(baseUrl)
        .delete(`/api/users/${createdUserId}`)
        .set(authHeader(adminToken));
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/users');
      expect(res.status).toBe(401);
    });

    test('Usuario sin permisos suficientes responde 403 Forbidden al listar usuarios', async () => {
      const res = await request(baseUrl)
        .get('/api/users')
        .set(authHeader(userToken));
      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos suficientes responde 403 Forbidden al crear usuario', async () => {
      const res = await request(baseUrl)
        .post('/api/users')
        .set(authHeader(userToken))
        .send({
          name: 'Forbidden',
          lastName: 'User',
          email: `forbidden_${Date.now()}@stride.test`,
          password: 'Password123!'
        });
      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos suficientes responde 403 Forbidden al eliminar usuario', async () => {
      const res = await request(baseUrl)
        .delete('/api/users/1')
        .set(authHeader(userToken));
      expect(res.status).toBe(403);
    });
  });

  describe('Operaciones CRUD y validaciones con Admin', () => {
    test('Crear usuario (POST /api/users) responde 201 y no expone password_hash ni salt_key', async () => {
      const uniqueEmail = `user_e2e_${Date.now()}@stride.test`;
      const res = await request(baseUrl)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({
          name: 'E2E_First',
          lastName: 'E2E_Last',
          email: uniqueEmail,
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(uniqueEmail);

      // Verificación de seguridad: no exponer credenciales
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.salt_key).toBeUndefined();

      createdUserId = res.body.data.id;
    });

    test('Consultar usuario por ID (GET /api/users/:id) responde 200 y no expone password_hash ni salt_key', async () => {
      expect(createdUserId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/users/${createdUserId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(createdUserId);

      // Verificación de seguridad
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.salt_key).toBeUndefined();
    });

    test('Listar usuarios (GET /api/users) responde 200 y ninguna entrada expone password_hash ni salt_key', async () => {
      const res = await request(baseUrl)
        .get('/api/users')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((u) => u.id === createdUserId);
      expect(found).toBeDefined();

      // Verificar en toda la lista que no se expongan hashes ni salts
      res.body.data.forEach((user) => {
        expect(user.password_hash).toBeUndefined();
        expect(user.salt_key).toBeUndefined();
      });
    });

    test('Actualizar usuario (PUT /api/users/:id) responde 200 y no expone password_hash ni salt_key', async () => {
      expect(createdUserId).toBeDefined();

      const updatedName = 'E2E_Updated_First';
      const res = await request(baseUrl)
        .put(`/api/users/${createdUserId}`)
        .set(authHeader(adminToken))
        .send({
          name: updatedName
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.first_name).toBe(updatedName);

      // Verificación de seguridad
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.salt_key).toBeUndefined();
    });

    test('Actualizar usuario inexistente responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .put('/api/users/999999')
        .set(authHeader(adminToken))
        .send({
          name: 'NonExistent'
        });

      expect(res.status).toBe(404);
    });

    test('Eliminar usuario (DELETE /api/users/:id) responde 200', async () => {
      expect(createdUserId).toBeDefined();

      const res = await request(baseUrl)
        .delete(`/api/users/${createdUserId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
    });

    test('Verificar que el usuario eliminado ya no existe', async () => {
      expect(createdUserId).toBeDefined();

      // Al consultar por ID, el recurso eliminado retorna data null
      const getRes = await request(baseUrl)
        .get(`/api/users/${createdUserId}`)
        .set(authHeader(adminToken));

      expect(getRes.status).toBe(200);
      expect(getRes.body.data).toBeNull();

      // Al intentar actualizar un usuario que ya no existe, responde 404
      const putRes = await request(baseUrl)
        .put(`/api/users/${createdUserId}`)
        .set(authHeader(adminToken))
        .send({ name: 'ShouldFail' });

      expect(putRes.status).toBe(404);

      // Limpiar variable para que afterAll no intente borrarlo nuevamente
      createdUserId = null;
    });
  });
});
