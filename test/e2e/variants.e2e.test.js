'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader, deleteProduct, deleteVariant } = require('./helpers');

describe('E2E Variants', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let salesToken;
  let userToken;
  let suiteProductId;
  let createdVariantId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    salesToken = await loginAs('sales');
    userToken = await loginAs('user');

    // Crear un producto base con admin para asociar las variantes durante la suite
    const productRes = await request(baseUrl)
      .post('/api/products')
      .set(authHeader(adminToken))
      .send({
        name: `Producto_Suite_Variantes_${Date.now()}`,
        description: 'Producto base para suite E2E de variantes',
        brand: 'Stride Shoes',
        price: 150.00
      });

    expect(productRes.status).toBe(201);
    suiteProductId = productRes.body.data.id;
  });

  afterAll(async () => {
    if (createdVariantId) {
      await deleteVariant(createdVariantId, adminToken);
    }
    if (suiteProductId) {
      await deleteProduct(suiteProductId, adminToken);
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/variants');
      expect(res.status).toBe(401);
    });

    test('Usuarios sin permisos suficientes (user y sales) responden 403 Forbidden al crear variante', async () => {
      expect(suiteProductId).toBeDefined();

      const userRes = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(userToken))
        .send({
          product_id: suiteProductId,
          size: '42',
          color: 'Forbidden User Color',
          sku: `SKU_FORBIDDEN_USER_${Date.now()}`
        });
      expect(userRes.status).toBe(403);

      const salesRes = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(salesToken))
        .send({
          product_id: suiteProductId,
          size: '42',
          color: 'Forbidden Sales Color',
          sku: `SKU_FORBIDDEN_SALES_${Date.now()}`
        });
      expect(salesRes.status).toBe(403);
    });

    test('Usuarios sin permisos suficientes (user y sales) responden 403 Forbidden al actualizar o eliminar variante', async () => {
      expect(suiteProductId).toBeDefined();

      // 1. Crear una variante con admin usando el producto de la suite
      const createRes = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: suiteProductId,
          size: '41',
          color: 'Gris RBAC',
          sku: `SKU_FORBIDDEN_RBAC_${Date.now()}`
        });
      expect(createRes.status).toBe(201);
      const testVariantId = createRes.body.data.id;

      try {
        // 2. Intentar actualizar (PUT) con user y sales
        const putUserRes = await request(baseUrl)
          .put(`/api/variants/${testVariantId}`)
          .set(authHeader(userToken))
          .send({ color: 'Color Modificado User' });
        expect(putUserRes.status).toBe(403);

        const putSalesRes = await request(baseUrl)
          .put(`/api/variants/${testVariantId}`)
          .set(authHeader(salesToken))
          .send({ color: 'Color Modificado Sales' });
        expect(putSalesRes.status).toBe(403);

        // 3. Intentar eliminar (DELETE) con user y sales
        const deleteUserRes = await request(baseUrl)
          .delete(`/api/variants/${testVariantId}`)
          .set(authHeader(userToken));
        expect(deleteUserRes.status).toBe(403);

        const deleteSalesRes = await request(baseUrl)
          .delete(`/api/variants/${testVariantId}`)
          .set(authHeader(salesToken));
        expect(deleteSalesRes.status).toBe(403);
      } finally {
        // 4. Borrar la variante con admin al finalizar la prueba
        await deleteVariant(testVariantId, adminToken);
      }
    });
  });

  describe('Validación de solicitudes y datos inválidos', () => {
    test('Petición con cuerpo de datos inválido (JSON malformado) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .set('Content-Type', 'application/json')
        .send('{ "size": "Invalid JSON Payload');

      expect(res.status).toBe(400);
    });

    test('Crear variante sin product_id responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          size: '42',
          color: 'Negro',
          sku: `SKU_NOPROD_${Date.now()}`
        });

      expect(res.status).toBe(400);
    });

    test('Crear variante con product_id inexistente responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: 999999,
          size: '42',
          color: 'Negro',
          sku: `SKU_INEXISTENTPROD_${Date.now()}`
        });

      expect(res.status).toBe(400);
    });

    test('Crear variante sin size responde 400 Bad Request', async () => {
      expect(suiteProductId).toBeDefined();

      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: suiteProductId,
          color: 'Negro',
          sku: `SKU_NOSIZE_${Date.now()}`
        });

      expect(res.status).toBe(400);
    });

    test('Crear variante sin color responde 400 Bad Request', async () => {
      expect(suiteProductId).toBeDefined();

      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: suiteProductId,
          size: '42',
          sku: `SKU_NOCOLOR_${Date.now()}`
        });

      expect(res.status).toBe(400);
    });

    test('Crear variante sin sku responde 400 Bad Request', async () => {
      expect(suiteProductId).toBeDefined();

      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: suiteProductId,
          size: '42',
          color: 'Negro'
        });

      expect(res.status).toBe(400);
    });

    test('Crear variante con SKU duplicado responde 400 Bad Request', async () => {
      expect(suiteProductId).toBeDefined();

      const duplicateSku = `SKU_DUP_${Date.now()}`;
      const firstRes = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: suiteProductId,
          size: '40',
          color: 'Rojo',
          sku: duplicateSku
        });

      expect(firstRes.status).toBe(201);
      const firstVariantId = firstRes.body.data.id;

      try {
        const secondRes = await request(baseUrl)
          .post('/api/variants')
          .set(authHeader(adminToken))
          .send({
            product_id: suiteProductId,
            size: '42',
            color: 'Azul',
            sku: duplicateSku
          });

        expect(secondRes.status).toBe(400);
      } finally {
        await deleteVariant(firstVariantId, adminToken);
      }
    });

    test('Consultar variante con ID malformado (no numérico) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .get('/api/variants/abc')
        .set(authHeader(adminToken));

      expect(res.status).toBe(400);
    });
  });

  describe('Operaciones CRUD con Admin', () => {
    test('Crear variante (POST /api/variants) responde 201', async () => {
      expect(suiteProductId).toBeDefined();

      const uniqueSku = `SKU_E2E_${Date.now()}`;
      const res = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: suiteProductId,
          size: '42',
          color: 'Azul Marino',
          sku: uniqueSku
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.product_id).toBe(suiteProductId);
      expect(res.body.data.size).toBe('42');
      expect(res.body.data.color).toBe('Azul Marino');
      expect(res.body.data.sku).toBe(uniqueSku);

      createdVariantId = res.body.data.id;
    });

    test('Consultar variante por ID (GET /api/variants/:id) responde 200', async () => {
      expect(createdVariantId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/variants/${createdVariantId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(createdVariantId);
      expect(res.body.data.product_id).toBe(suiteProductId);
    });

    test('Listar variantes (GET /api/variants) responde 200 y contiene la variante creada', async () => {
      const res = await request(baseUrl)
        .get('/api/variants')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((v) => v.id === createdVariantId);
      expect(found).toBeDefined();
    });

    test('Actualizar variante (PUT /api/variants/:id) responde 200', async () => {
      expect(createdVariantId).toBeDefined();

      const updatedColor = 'Azul Petróleo';
      const updatedSize = '43';

      const res = await request(baseUrl)
        .put(`/api/variants/${createdVariantId}`)
        .set(authHeader(adminToken))
        .send({
          color: updatedColor,
          size: updatedSize
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.color).toBe(updatedColor);
      expect(res.body.data.size).toBe(updatedSize);
    });

    test('Actualizar variante inexistente responde 404 Not Found', async () => {
      const res = await request(baseUrl)
        .put('/api/variants/999999')
        .set(authHeader(adminToken))
        .send({
          color: 'Inexistente'
        });

      expect(res.status).toBe(404);
    });

    test('Eliminar variante (DELETE /api/variants/:id) responde 200', async () => {
      expect(createdVariantId).toBeDefined();

      const res = await request(baseUrl)
        .delete(`/api/variants/${createdVariantId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
    });

    test('Verificar que la variante eliminada ya no existe y responde 404 Not Found', async () => {
      expect(createdVariantId).toBeDefined();

      // Al consultar por ID, responde 404 Not Found
      const getRes = await request(baseUrl)
        .get(`/api/variants/${createdVariantId}`)
        .set(authHeader(adminToken));

      expect(getRes.status).toBe(404);

      // Al intentar actualizar una variante que ya no existe, responde 404
      const putRes = await request(baseUrl)
        .put(`/api/variants/${createdVariantId}`)
        .set(authHeader(adminToken))
        .send({ color: 'ShouldFail' });

      expect(putRes.status).toBe(404);

      // Al intentar eliminar una variante que ya no existe, responde 404
      const deleteRes = await request(baseUrl)
        .delete(`/api/variants/${createdVariantId}`)
        .set(authHeader(adminToken));

      expect(deleteRes.status).toBe(404);

      // Limpiar variable para que afterAll no intente borrarla nuevamente
      createdVariantId = null;
    });
  });

  describe('Relación con producto (Variante devuelve su producto)', () => {
    let relationProductId;
    let relationVariantId;
    let uniqueProductName;

    beforeAll(async () => {
      uniqueProductName = `Producto_Relacion_${Date.now()}`;

      // 1. Crear producto dedicado para verificar la relación
      const prodRes = await request(baseUrl)
        .post('/api/products')
        .set(authHeader(adminToken))
        .send({
          name: uniqueProductName,
          brand: 'Stride Relacion',
          price: 189.99
        });

      expect(prodRes.status).toBe(201);
      relationProductId = prodRes.body.data.id;

      // 2. Crear variante asociada a dicho producto
      const uniqueSku = `SKU_REL_${Date.now()}`;
      const varRes = await request(baseUrl)
        .post('/api/variants')
        .set(authHeader(adminToken))
        .send({
          product_id: relationProductId,
          size: '44',
          color: 'Blanco Perla',
          sku: uniqueSku
        });

      expect(varRes.status).toBe(201);
      relationVariantId = varRes.body.data.id;
    });

    afterAll(async () => {
      if (relationVariantId) {
        await deleteVariant(relationVariantId, adminToken);
      }
      if (relationProductId) {
        await deleteProduct(relationProductId, adminToken);
      }
    });

    test('Consultar variante por ID (GET /api/variants/:id) devuelve los datos de su producto asociado', async () => {
      expect(relationVariantId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/variants/${relationVariantId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(relationVariantId);
      expect(res.body.data).toHaveProperty('product');
      expect(res.body.data.product).not.toBeNull();
      expect(res.body.data.product.id).toBe(relationProductId);
      expect(res.body.data.product.name).toBe(uniqueProductName);
    });

    test('Listar variantes (GET /api/variants) incluye el producto asociado en la variante', async () => {
      expect(relationVariantId).toBeDefined();

      const res = await request(baseUrl)
        .get('/api/variants')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const foundVariant = res.body.data.find((v) => v.id === relationVariantId);
      expect(foundVariant).toBeDefined();
      expect(foundVariant).toHaveProperty('product');
      expect(foundVariant.product).not.toBeNull();
      expect(foundVariant.product.id).toBe(relationProductId);
      expect(foundVariant.product.name).toBe(uniqueProductName);
    });
  });
});
