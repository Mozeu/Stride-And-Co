'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');

describe('E2E Roles', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let userToken;
  let createdRoleId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    userToken = await loginAs('user');
  });

  afterAll(async () => {
    if (createdRoleId) {
      await request(baseUrl)
        .delete(`/api/roles/${createdRoleId}`)
        .set(authHeader(adminToken));
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/roles');
      expect(res.status).toBe(401);
    });

    test('Usuario sin permisos responde 403 Forbidden al listar roles', async () => {
      const res = await request(baseUrl)
        .get('/api/roles')
        .set(authHeader(userToken));
      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos responde 403 Forbidden al crear rol', async () => {
      const res = await request(baseUrl)
        .post('/api/roles')
        .set(authHeader(userToken))
        .send({ name: `forbidden_role_${Date.now()}` });
      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos responde 403 Forbidden al eliminar rol', async () => {
      const res = await request(baseUrl)
        .delete('/api/roles/1')
        .set(authHeader(userToken));
      expect(res.status).toBe(403);
    });
  });

  describe('Operaciones CRUD y validaciones con Admin', () => {
    test('Crear rol (POST /api/roles) responde 201', async () => {
      const uniqueRoleName = `role_e2e_${Date.now()}`;
      const res = await request(baseUrl)
        .post('/api/roles')
        .set(authHeader(adminToken))
        .send({
          name: uniqueRoleName,
          description: 'Rol creado para prueba E2E'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(uniqueRoleName);

      createdRoleId = res.body.data.id;
    });

    test('Consultar rol por ID (GET /api/roles/:id) responde 200', async () => {
      expect(createdRoleId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/roles/${createdRoleId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(createdRoleId);
    });

    test('Listar roles (GET /api/roles) responde 200', async () => {
      const res = await request(baseUrl)
        .get('/api/roles')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((r) => r.id === createdRoleId);
      expect(found).toBeDefined();
    });

    test('Actualizar rol (PUT /api/roles/:id) responde 200', async () => {
      expect(createdRoleId).toBeDefined();

      const updatedDesc = 'Descripcion actualizada E2E';
      const res = await request(baseUrl)
        .put(`/api/roles/${createdRoleId}`)
        .set(authHeader(adminToken))
        .send({
          description: updatedDesc
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.description).toBe(updatedDesc);
    });

    test('Validar datos incorrectos al crear rol responde 500 (SequelizeValidationError)', async () => {
      const res = await request(baseUrl)
        .post('/api/roles')
        .set(authHeader(adminToken))
        .send({
          name: ''
        });

      expect(res.status).toBe(400);
    });

    test('Actualizar rol inexistente responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .put('/api/roles/999999')
        .set(authHeader(adminToken))
        .send({
          name: 'NonExistentRole'
        });

      expect(res.status).toBe(404);
    });

    test('Eliminar rol (DELETE /api/roles/:id) responde 200', async () => {
      expect(createdRoleId).toBeDefined();

      const res = await request(baseUrl)
        .delete(`/api/roles/${createdRoleId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
    });

    test('Verificar que el rol eliminado ya no existe', async () => {
      expect(createdRoleId).toBeDefined();

      // Al consultar por ID, el rol eliminado retorna data null
      const getRes = await request(baseUrl)
        .get(`/api/roles/${createdRoleId}`)
        .set(authHeader(adminToken));

      expect(getRes.status).toBe(200);
      expect(getRes.body.data).toBeNull();

      // Al intentar actualizar un rol eliminado, responde 404
      const putRes = await request(baseUrl)
        .put(`/api/roles/${createdRoleId}`)
        .set(authHeader(adminToken))
        .send({ description: 'ShouldFail' });

      expect(putRes.status).toBe(404);

      createdRoleId = null;
    });
  });
});
