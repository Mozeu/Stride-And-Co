'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');

describe('E2E Permissions', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let userToken;
  let createdPermissionId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    userToken = await loginAs('user');
  });

  afterAll(async () => {
    if (createdPermissionId) {
      await request(baseUrl)
        .delete(`/api/permissions/${createdPermissionId}`)
        .set(authHeader(adminToken));
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/permissions');
      expect(res.status).toBe(401);
    });

    test('Usuario sin permisos responde 403 Forbidden al listar permisos', async () => {
      const res = await request(baseUrl)
        .get('/api/permissions')
        .set(authHeader(userToken));
      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos responde 403 Forbidden al crear permiso', async () => {
      const res = await request(baseUrl)
        .post('/api/permissions')
        .set(authHeader(userToken))
        .send({
          key: `forbidden:perm:${Date.now()}`,
          description: 'Forbidden test'
        });
      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos responde 403 Forbidden al eliminar permiso', async () => {
      const res = await request(baseUrl)
        .delete('/api/permissions/1')
        .set(authHeader(userToken));
      expect(res.status).toBe(403);
    });
  });

  describe('Operaciones CRUD y validaciones con Admin', () => {
    test('Crear permiso (POST /api/permissions) responde 201', async () => {
      const uniqueKey = `e2e:test:${Date.now()}`;
      const res = await request(baseUrl)
        .post('/api/permissions')
        .set(authHeader(adminToken))
        .send({
          key: uniqueKey,
          description: 'Permiso creado para prueba E2E'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.key).toBe(uniqueKey);

      createdPermissionId = res.body.data.id;
    });

    test('Consultar permiso por ID (GET /api/permissions/:id) responde 200', async () => {
      expect(createdPermissionId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/permissions/${createdPermissionId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(createdPermissionId);
    });

    test('Listar permisos (GET /api/permissions) responde 200', async () => {
      const res = await request(baseUrl)
        .get('/api/permissions')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((p) => p.id === createdPermissionId);
      expect(found).toBeDefined();
    });

    test('Actualizar permiso (PUT /api/permissions/:id) responde 200', async () => {
      expect(createdPermissionId).toBeDefined();

      const updatedDesc = 'Descripcion actualizada E2E';
      const res = await request(baseUrl)
        .put(`/api/permissions/${createdPermissionId}`)
        .set(authHeader(adminToken))
        .send({
          description: updatedDesc
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.description).toBe(updatedDesc);
    });

    test('Consultar permiso inexistente responde 200 con data null', async () => {
      const res = await request(baseUrl)
        .get('/api/permissions/999999')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    test('Consultar subruta inexistente en permisos responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .get('/api/permissions/inexistente/subruta')
        .set(authHeader(adminToken));

      expect(res.status).toBe(404);
    });

    test('Eliminar permiso (DELETE /api/permissions/:id) responde 200', async () => {
      expect(createdPermissionId).toBeDefined();

      const res = await request(baseUrl)
        .delete(`/api/permissions/${createdPermissionId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
    });

    test('Verificar que el permiso eliminado ya no existe', async () => {
      expect(createdPermissionId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/permissions/${createdPermissionId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();

      createdPermissionId = null;
    });
  });
});
