'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader, deleteProduct, deleteVariant } = require('./helpers');

describe('E2E Products', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let salesToken;
  let userToken;
  let createdProductId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    salesToken = await loginAs('sales');
    userToken = await loginAs('user');
  });

  afterAll(async () => {
    if (createdProductId) {
      await deleteProduct(createdProductId, adminToken);
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/products');
      expect(res.status).toBe(401);
    });

    test('Usuario sin permisos suficientes responde 403 Forbidden al crear producto', async () => {
      const res = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(userToken))
        .send({
          name: 'Forbidden Product',
          price: 99.99
        });
      expect(res.status).toBe(403);
    });

    test('Usuarios sin permisos suficientes (user y sales) responden 403 Forbidden al actualizar o eliminar producto', async () => {
      // 1. Crear producto con admin
      const createRes = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          name: `Forbidden_RBAC_${Date.now()}`,
          price: 99.99
        });
      expect(createRes.status).toBe(201);
      const testProductId = createRes.body.data.id;

      try {
        // 2. Intentar actualizar (PUT) con user y sales
        const putUserRes = await request(baseUrl)
          .put(`/api/products/${testProductId}`)
          .set(authHeader(userToken))
          .send({ name: 'Forbidden Update User' });
        expect(putUserRes.status).toBe(403);

        const putSalesRes = await request(baseUrl)
          .put(`/api/products/${testProductId}`)
          .set(authHeader(salesToken))
          .send({ name: 'Forbidden Update Sales' });
        expect(putSalesRes.status).toBe(403);

        // 3. Intentar eliminar (DELETE) con user y sales
        const deleteUserRes = await request(baseUrl)
          .delete(`/api/products/${testProductId}`)
          .set(authHeader(userToken));
        expect(deleteUserRes.status).toBe(403);

        const deleteSalesRes = await request(baseUrl)
          .delete(`/api/products/${testProductId}`)
          .set(authHeader(salesToken));
        expect(deleteSalesRes.status).toBe(403);
      } finally {
        // 4. Borrar con admin al final
        await deleteProduct(testProductId, adminToken);
      }
    });
  });

  describe('Validación de solicitudes y datos inválidos', () => {
    test('Petición con cuerpo de datos inválido (JSON malformado) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .set('Content-Type', 'application/json')
        .send('{ "name": "Invalid JSON Payload');

      expect(res.status).toBe(400);
    });

    test('Crear producto sin name responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          price: 99.99
        });

      expect(res.status).toBe(400);
    });

    test('Crear producto con price negativo responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          name: 'Producto Precio Negativo',
          price: -10
        });

      expect(res.status).toBe(400);
    });

    test('Crear producto con price no numérico responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          name: 'Producto Precio No Numérico',
          price: 'no-es-un-numero'
        });

      expect(res.status).toBe(400);
    });

    test('Consultar producto con ID malformado (no numérico) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .get('/api/products/abc')
        .set(authHeader(adminToken));

      expect(res.status).toBe(400);
    });
  });

  describe('Operaciones CRUD con Admin', () => {
    test('Crear producto (POST /api/products) responde 201', async () => {
      const uniqueName = `Producto_E2E_${Date.now()}`;
      const res = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          name: uniqueName,
          description: 'Producto para pruebas E2E',
          brand: 'Stride',
          price: 199.99
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(uniqueName);
      expect(parseFloat(res.body.data.price)).toBe(199.99);

      createdProductId = res.body.data.id;
    });

    test('Consultar producto por ID (GET /api/products/:id) responde 200', async () => {
      expect(createdProductId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/products/${createdProductId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(createdProductId);
      expect(res.body.data).toHaveProperty('variants');
      expect(Array.isArray(res.body.data.variants)).toBe(true);
    });

    test('Listar productos (GET /api/products) responde 200 y contiene el producto creado', async () => {
      const res = await request(baseUrl)
        .get('/api/products')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((p) => p.id === createdProductId);
      expect(found).toBeDefined();
    });

    test('Actualizar producto (PUT /api/products/:id) responde 200', async () => {
      expect(createdProductId).toBeDefined();

      const updatedName = `Producto_E2E_Modificado_${Date.now()}`;
      const updatedPrice = 249.50;

      const res = await request(baseUrl)
        .put(`/api/products/${createdProductId}`)
        .set(authHeader(adminToken))
        .send({
          name: updatedName,
          price: updatedPrice
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.name).toBe(updatedName);
      expect(parseFloat(res.body.data.price)).toBe(updatedPrice);
    });

    test('Actualizar producto inexistente responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .put('/api/products/999999')
        .set(authHeader(adminToken))
        .send({
          name: 'ProductoInexistente'
        });

      expect(res.status).toBe(404);
    });

    test('Eliminar producto (DELETE /api/products/:id) responde 200', async () => {
      expect(createdProductId).toBeDefined();

      const res = await request(baseUrl)
        .delete(`/api/products/${createdProductId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
    });

    test('Verificar que el producto eliminado ya no existe y responde 404 Not Found', async () => {
      expect(createdProductId).toBeDefined();

      // Al consultar por ID, responde 404 Not Found
      const getRes = await request(baseUrl)
        .get(`/api/products/${createdProductId}`)
        .set(authHeader(adminToken));

      expect(getRes.status).toBe(404);

      // Al intentar actualizar un producto que ya no existe, responde 404
      const putRes = await request(baseUrl)
        .put(`/api/products/${createdProductId}`)
        .set(authHeader(adminToken))
        .send({ name: 'ShouldFail' });

      expect(putRes.status).toBe(404);

      // Limpiar variable para que afterAll no intente borrarlo nuevamente
      createdProductId = null;
    });
  });

  describe('Relación con variantes (Producto devuelve sus variantes)', () => {
    let productWithVariantsId;
    let createdVariantId;

    afterAll(async () => {
      if (createdVariantId) {
        await deleteVariant(createdVariantId, adminToken);
      }
      if (productWithVariantsId) {
        await deleteProduct(productWithVariantsId, adminToken);
      }
    });

    test('Consultar producto por ID (GET /api/products/:id) devuelve sus variantes asociadas', async () => {
      // 1. Crear producto base
      const prodRes = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          name: `Producto_Variantes_${Date.now()}`,
          brand: 'Stride Shoes',
          price: 159.99
        });

      expect(prodRes.status).toBe(201);
      expect(prodRes.body).toHaveProperty('data');
      productWithVariantsId = prodRes.body.data.id;

      // 2. Crear una variante asociada al producto
      const uniqueSku = `SKU-E2E-${Date.now()}`;
      const varRes = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: productWithVariantsId,
          size: '42',
          color: 'Azul Marino',
          sku: uniqueSku
        });

      expect(varRes.status).toBe(201);
      expect(varRes.body).toHaveProperty('data');
      createdVariantId = varRes.body.data.id;

      // 3. Consultar el producto por ID y verificar que incluye sus variantes
      const getRes = await request(baseUrl)
        .get(`/api/products/${productWithVariantsId}`)
        .set(authHeader(adminToken));

      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveProperty('data');
      expect(getRes.body.data.id).toBe(productWithVariantsId);
      expect(getRes.body.data).toHaveProperty('variants');
      expect(Array.isArray(getRes.body.data.variants)).toBe(true);
      expect(getRes.body.data.variants.length).toBeGreaterThanOrEqual(1);

      const foundVariant = getRes.body.data.variants.find((v) => v.id === createdVariantId);
      expect(foundVariant).toBeDefined();
      expect(foundVariant.sku).toBe(uniqueSku);
      expect(foundVariant.size).toBe('42');
      expect(foundVariant.color).toBe('Azul Marino');
    });

    test('Listar productos (GET /api/products) incluye variantes asociadas', async () => {
      expect(productWithVariantsId).toBeDefined();

      const res = await request(baseUrl)
        .get('/api/products')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const foundProduct = res.body.data.find((p) => p.id === productWithVariantsId);
      expect(foundProduct).toBeDefined();
      expect(foundProduct).toHaveProperty('variants');
      expect(Array.isArray(foundProduct.variants)).toBe(true);
      expect(foundProduct.variants.some((v) => v.id === createdVariantId)).toBe(true);
    });
  });
});
