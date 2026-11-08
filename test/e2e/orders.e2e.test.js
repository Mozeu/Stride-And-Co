'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');

describe('E2E Orders', () => {
  // NOTA: Por decisión de diseño del equipo y de negocio (auditoría y trazabilidad comercial),
  // el recurso /api/orders no expone una operación de borrado físico (DELETE).
  // Únicamente expone creación (POST), lectura (GET / y GET /:id) y actualización (PUT /:id).

  const baseUrl = getBaseUrl();

  let adminToken;
  let salesToken;
  let userToken;
  let currentUserId;
  let currentUserEmail;

  let ownCustomerId;
  let foreignCustomerId;
  let ownOrderId;
  let foreignOrderId;
  let originalPaymentMethod;

  let createdOrderId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    salesToken = await loginAs('sales');
    userToken = await loginAs('user');

    // Obtener información del usuario autenticado (rol 'user') para evaluar propiedad (own)
    const meRes = await request(baseUrl)
      .get('/api/auth/me')
      .set(authHeader(userToken));

    expect(meRes.status).toBe(200);
    currentUserId = meRes.body.id;
    currentUserEmail = meRes.body.email;

    // Obtener clientes existentes para identificar el cliente propio y uno ajeno
    const custRes = await request(baseUrl)
      .get('/api/customers')
      .set(authHeader(adminToken));

    expect(custRes.status).toBe(200);
    const customers = custRes.body.data || [];

    const ownCustomer = customers.find(
      (c) => c.userId === currentUserId || c.email === currentUserEmail
    );
    const foreignCustomer = customers.find(
      (c) => c.userId !== currentUserId && c.email !== currentUserEmail
    );

    expect(ownCustomer).toBeDefined();
    expect(foreignCustomer).toBeDefined();

    ownCustomerId = ownCustomer._id;
    foreignCustomerId = foreignCustomer._id;

    // Obtener órdenes existentes del seed para las pruebas de control de acceso por propiedad
    const ordersRes = await request(baseUrl)
      .get('/api/orders')
      .set(authHeader(adminToken));

    expect(ordersRes.status).toBe(200);
    const orders = ordersRes.body.data || [];

    const ownOrder = orders.find(
      (o) => o.customerId && (o.customerId.userId === currentUserId || o.customerId._id === ownCustomerId)
    );
    const foreignOrder = orders.find(
      (o) => o.customerId && (o.customerId.userId !== currentUserId && o.customerId._id !== ownCustomerId)
    );

    expect(ownOrder).toBeDefined();
    expect(foreignOrder).toBeDefined();

    ownOrderId = ownOrder._id;
    foreignOrderId = foreignOrder._id;
    originalPaymentMethod = ownOrder.paymentMethod || 'card';
  });

  afterAll(async () => {
    // Restaurar los datos modificados en la orden del seed al finalizar la suite
    if (ownOrderId && originalPaymentMethod) {
      await request(baseUrl)
        .put(`/api/orders/${ownOrderId}`)
        .set(authHeader(adminToken))
        .send({ paymentMethod: originalPaymentMethod });
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const getRes = await request(baseUrl).get('/api/orders');
      expect(getRes.status).toBe(401);

      const postRes = await request(baseUrl).post('/api/orders').send({});
      expect(postRes.status).toBe(401);
    });

    test('Petición con token inválido responde 401 Unauthorized', async () => {
      const res = await request(baseUrl)
        .get('/api/orders')
        .set('Authorization', 'Bearer token_invalido_123');

      expect(res.status).toBe(401);
    });

    test('Usuario sin permisos suficientes (user) responde 403 Forbidden al listar todas las órdenes', async () => {
      const res = await request(baseUrl)
        .get('/api/orders')
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });

    test('Usuarios con alcance any (sales y admin) pueden listar órdenes responde 200', async () => {
      const salesRes = await request(baseUrl)
        .get('/api/orders')
        .set(authHeader(salesToken));

      expect(salesRes.status).toBe(200);
      expect(Array.isArray(salesRes.body.data)).toBe(true);

      const adminRes = await request(baseUrl)
        .get('/api/orders')
        .set(authHeader(adminToken));

      expect(adminRes.status).toBe(200);
      expect(Array.isArray(adminRes.body.data)).toBe(true);
    });

    test('Usuario con rol "user" responde 403 Forbidden al intentar crear una orden para un cliente ajeno', async () => {
      expect(foreignCustomerId).toBeDefined();

      const res = await request(baseUrl)
        .post('/api/orders')
        .set(authHeader(userToken))
        .send({
          customerId: foreignCustomerId,
          paymentMethod: 'cash',
          items: [{ productId: 1, quantity: 1, unitPrice: 100 }]
        });

      expect(res.status).toBe(403);
    });

    test('Usuario con rol "user" responde 403 Forbidden al consultar orden de otro usuario', async () => {
      expect(foreignOrderId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/orders/${foreignOrderId}`)
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });

    test('Usuario con rol "user" responde 403 Forbidden al actualizar orden de otro usuario', async () => {
      expect(foreignOrderId).toBeDefined();

      const res = await request(baseUrl)
        .put(`/api/orders/${foreignOrderId}`)
        .set(authHeader(userToken))
        .send({
          paymentMethod: 'cash'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Control de acceso por propiedad (Alcance own)', () => {
    test('Usuario con rol "user" puede consultar su propia orden (GET /api/orders/:id) responde 200', async () => {
      expect(ownOrderId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/orders/${ownOrderId}`)
        .set(authHeader(userToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data._id).toBe(ownOrderId);
    });

    test('Usuario con rol "user" puede actualizar su propia orden (PUT /api/orders/:id) responde 200', async () => {
      expect(ownOrderId).toBeDefined();

      const res = await request(baseUrl)
        .put(`/api/orders/${ownOrderId}`)
        .set(authHeader(userToken))
        .send({
          paymentMethod: 'transfer'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.paymentMethod).toBe('transfer');
    });

    test('Usuario con rol "user" puede crear una orden para su propio cliente (POST /api/orders) responde 201', async () => {
      expect(ownCustomerId).toBeDefined();

      const res = await request(baseUrl)
        .post('/api/orders')
        .set(authHeader(userToken))
        .send({
          customerId: ownCustomerId,
          paymentMethod: 'card',
          items: [{ productId: 1, quantity: 1, unitPrice: 250 }]
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.customerId).toBe(ownCustomerId);
    });
  });

  describe('Validación de solicitudes y datos inválidos', () => {
    test('Petición con cuerpo de datos inválido (JSON malformado) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/orders')
        .set(authHeader(adminToken))
        .set('Content-Type', 'application/json')
        .send('{ "customerId": "malformed_json');

      expect(res.status).toBe(400);
    });

    test('Crear orden sin customerId requerido responde 400 Bad Request por validación del modelo', async () => {
      const res = await request(baseUrl)
        .post('/api/orders')
        .set(authHeader(adminToken))
        .send({
          paymentMethod: 'card',
          items: []
        });

      expect(res.status).toBe(400);
    });

    test('Consultar orden con ID malformado (ObjectId no válido) con Admin responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .get('/api/orders/123invalid')
        .set(authHeader(adminToken));

      expect(res.status).toBe(400);
    });

    test('Consultar orden con ID malformado con rol user responde 403 Forbidden por checkOwnership', async () => {
      // El middleware getOrderOwnerId valida mongoose.isValidObjectId.
      // Al ser inválido retorna null y el RBAC rechaza con 403 antes de llegar al controlador.
      const res = await request(baseUrl)
        .get('/api/orders/123invalid')
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });

    test('Consultar orden con ObjectId inexistente responde 404 Not Found', async () => {
      const nonExistentId = '000000000000000000000000';
      const res = await request(baseUrl)
        .get(`/api/orders/${nonExistentId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(404);
    });

    test('Actualizar orden con ObjectId inexistente responde 404 Not Found', async () => {
      const nonExistentId = '000000000000000000000000';
      const res = await request(baseUrl)
        .put(`/api/orders/${nonExistentId}`)
        .set(authHeader(adminToken))
        .send({ paymentMethod: 'cash' });

      expect(res.status).toBe(404);
    });
  });

  describe('Operaciones de ciclo de vida y verificación de relaciones con Admin', () => {
    test('Crear orden (POST /api/orders) responde 201 y no expone credenciales ni datos sensibles', async () => {
      expect(ownCustomerId).toBeDefined();

      const res = await request(baseUrl)
        .post('/api/orders')
        .set(authHeader(adminToken))
        .send({
          customerId: ownCustomerId,
          salesPersonId: 2,
          paymentMethod: 'transfer',
          totals: {
            subtotal: 599.00,
            shipping: 50.00,
            discount: 0.00,
            total: 649.00
          },
          shippingAddress: {
            street: 'Av. Tecnológico',
            number: '1234',
            city: 'Chihuahua',
            country: 'Mexico'
          },
          items: [{
            productId: 1,
            quantity: 2,
            unitPrice: 299.50
          }]
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.customerId).toBe(ownCustomerId);

      // Comprobar que no expone datos sensibles
      expect(res.body.data).not.toHaveProperty('password_hash');
      expect(res.body.data).not.toHaveProperty('salt_key');
      expect(res.body.data).not.toHaveProperty('password');

      createdOrderId = res.body.data._id;
    });

    test('Consultar orden por ID (GET /api/orders/:id) responde 200 y verifica la relación con el cliente (populate)', async () => {
      expect(createdOrderId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/orders/${createdOrderId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data._id).toBe(createdOrderId);

      // Verificación de la relación: customerId viene poblado como objeto del Cliente
      expect(typeof res.body.data.customerId).toBe('object');
      expect(res.body.data.customerId).toHaveProperty('_id');
      expect(res.body.data.customerId._id).toBe(ownCustomerId);
      expect(res.body.data.customerId).toHaveProperty('userId');
      expect(res.body.data.customerId.userId).toBe(currentUserId);
    });

    test('Listar órdenes (GET /api/orders) responde 200 y contiene la orden creada con cliente poblado', async () => {
      expect(createdOrderId).toBeDefined();

      const res = await request(baseUrl)
        .get('/api/orders')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((o) => o._id === createdOrderId);
      expect(found).toBeDefined();
      expect(typeof found.customerId).toBe('object');
      expect(found.customerId).toHaveProperty('_id');
    });

    test('Actualizar orden (PUT /api/orders/:id) responde 200', async () => {
      expect(createdOrderId).toBeDefined();

      const res = await request(baseUrl)
        .put(`/api/orders/${createdOrderId}`)
        .set(authHeader(adminToken))
        .send({
          paymentMethod: 'card'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.paymentMethod).toBe('card');
    });

    test('Intentar eliminar orden (DELETE /api/orders/:id) responde 404 Not Found (no expuesto por diseño)', async () => {
      expect(createdOrderId).toBeDefined();

      // Por decisión de negocio, las órdenes no admiten eliminación física para conservar trazabilidad
      const res = await request(baseUrl)
        .delete(`/api/orders/${createdOrderId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(404);
    });
  });
});
