'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');

describe('E2E Inventory', () => {
  // NOTA: Por decisión de diseño del equipo, el recurso /api/inventory no expone operaciones POST ni DELETE;
  // únicamente permite lectura (GET / y GET /:id) y actualización de stock (PUT /:id).

  const baseUrl = getBaseUrl();

  let adminToken;
  let salesToken;
  let userToken;
  let targetInventoryId;
  let originalStock;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    salesToken = await loginAs('sales');
    userToken = await loginAs('user');

    // Dado que el backend no crea inventario automáticamente al crear una variante,
    // se utiliza un inventario existente del seed y se almacena su stock original para restaurarlo.
    const listRes = await request(baseUrl)
      .get('/api/inventory')
      .set(authHeader(adminToken));

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const seedInventory = listRes.body.data[0];
    targetInventoryId = seedInventory.id;
    originalStock = seedInventory.stock;
  });

  afterAll(async () => {
    // Restaurar el stock original del inventario del seed al finalizar la suite
    if (targetInventoryId && originalStock !== undefined) {
      await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken))
        .send({ stock: originalStock });
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/inventory');
      expect(res.status).toBe(401);
    });

    test('Usuario con rol "user" responde 403 Forbidden al listar inventario', async () => {
      const res = await request(baseUrl)
        .get('/api/inventory')
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });

    test('Usuario con rol "user" responde 403 Forbidden al consultar inventario por ID', async () => {
      const res = await request(baseUrl)
        .get(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });

    test('Usuario con rol "user" responde 403 Forbidden al actualizar stock de inventario', async () => {
      const res = await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(userToken))
        .send({ stock: 50 });

      expect(res.status).toBe(403);
    });

    test('Usuario con rol "sales" puede listar inventario', async () => {
      const res = await request(baseUrl)
        .get('/api/inventory')
        .set(authHeader(salesToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('Usuario con rol "sales" puede consultar inventario por ID', async () => {
      const res = await request(baseUrl)
        .get(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(salesToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(targetInventoryId);
    });

    test('Usuario con rol "sales" puede actualizar stock de inventario', async () => {
      const res = await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(salesToken))
        .send({ stock: originalStock });

      expect(res.status).toBe(200);
    });
  });

  describe('Validación de solicitudes y datos inválidos', () => {
    test('Petición con cuerpo de datos inválido (JSON malformado) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken))
        .set('Content-Type', 'application/json')
        .send('{ "stock": "Invalid JSON Payload');

      expect(res.status).toBe(400);
    });

    test('Actualizar inventario con stock negativo responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken))
        .send({ stock: -10 });

      expect(res.status).toBe(400);
    });

    test('Actualizar inventario con stock no numérico responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken))
        .send({ stock: 'no-es-un-numero' });

      expect(res.status).toBe(400);
    });

    test('Consultar inventario con ID malformado (no numérico) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .get('/api/inventory/abc')
        .set(authHeader(adminToken));

      expect(res.status).toBe(400);
    });
  });

  describe('Operaciones de lectura y actualización con Admin', () => {
    test('Consultar inventario con ID inexistente (GET /api/inventory/:id) responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .get('/api/inventory/999999')
        .set(authHeader(adminToken));

      expect(res.status).toBe(404);
    });

    test('Actualizar inventario con ID inexistente (PUT /api/inventory/:id) responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .put('/api/inventory/999999')
        .set(authHeader(adminToken))
        .send({ stock: 10 });

      expect(res.status).toBe(404);
    });

    test('Listar inventario (GET /api/inventory) devuelve un arreglo que contiene el inventario utilizado', async () => {
      const res = await request(baseUrl)
        .get('/api/inventory')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((item) => item.id === targetInventoryId);
      expect(found).toBeDefined();
      expect(found.id).toBe(targetInventoryId);
    });

    test('Actualizar stock (PUT /api/inventory/:id) responde 200 y persiste el nuevo stock al consultar con GET', async () => {
      const newStock = originalStock + 20;

      // 1. Actualizar stock mediante PUT
      const putRes = await request(baseUrl)
        .put(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken))
        .send({ stock: newStock });

      expect(putRes.status).toBe(200);
      expect(putRes.body).toHaveProperty('data');
      expect(putRes.body.data.stock).toBe(newStock);

      // 2. Realizar GET posterior para verificar que el nuevo stock quedó persistido
      const getRes = await request(baseUrl)
        .get(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken));

      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveProperty('data');
      expect(getRes.body.data.stock).toBe(newStock);
    });
  });

  describe('Relación con variante (Inventario devuelve su variante y producto)', () => {
    test('Consultar inventario por ID (GET /api/inventory/:id) devuelve su variante y el producto de la variante', async () => {
      const res = await request(baseUrl)
        .get(`/api/inventory/${targetInventoryId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(targetInventoryId);

      // Comprobar que devuelve su variante asociada
      expect(res.body.data).toHaveProperty('variant');
      expect(res.body.data.variant).not.toBeNull();
      expect(res.body.data.variant).toHaveProperty('id');
      expect(res.body.data.variant).toHaveProperty('sku');

      // Comprobar que devuelve el producto asociado a la variante
      expect(res.body.data.variant).toHaveProperty('product');
      expect(res.body.data.variant.product).not.toBeNull();
      expect(res.body.data.variant.product).toHaveProperty('id');
      expect(res.body.data.variant.product).toHaveProperty('name');
    });
  });
});
