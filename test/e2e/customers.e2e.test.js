'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader, deleteCustomer } = require('./helpers');

describe('E2E Customers', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let salesToken;
  let userToken;
  let currentUserId;

  let createdCustomerId;
  let ownCustomerId;
  let foreignCustomerId;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    salesToken = await loginAs('sales');
    userToken = await loginAs('user');

    // Obtener información del usuario autenticado para asociar recursos de prueba por propiedad (own)
    const meRes = await request(baseUrl)
      .get('/api/auth/me')
      .set(authHeader(userToken));

    expect(meRes.status).toBe(200);
    currentUserId = meRes.body.id;
  });

  afterAll(async () => {
    // Limpieza exclusiva de registros creados por la suite
    if (createdCustomerId) {
      await deleteCustomer(createdCustomerId, adminToken);
    }
    if (ownCustomerId) {
      await deleteCustomer(ownCustomerId, adminToken);
    }
    if (foreignCustomerId) {
      await deleteCustomer(foreignCustomerId, adminToken);
    }
  });

  describe('Control de acceso (Autenticación y RBAC)', () => {
    test('Petición sin token responde 401 Unauthorized', async () => {
      const res = await request(baseUrl).get('/api/customers');
      expect(res.status).toBe(401);
    });

    test('Usuario sin permisos suficientes (user) responde 403 Forbidden al listar clientes', async () => {
      const res = await request(baseUrl)
        .get('/api/customers')
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });

    test('Usuario sin permisos suficientes (user) responde 403 Forbidden al crear cliente', async () => {
      const res = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(userToken))
        .send({
          userId: currentUserId,
          email: `forbidden_user_${Date.now()}@stride.test`
        });

      expect(res.status).toBe(403);
    });

    test('Usuarios sin permisos de eliminación (sales y user) responden 403 Forbidden al eliminar cliente', async () => {
      // 1. Crear un cliente temporal con admin
      const tempEmail = `customer_delete_rbac_${Date.now()}@stride.test`;
      const tempRes = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(adminToken))
        .send({
          userId: 999,
          phone: '5550001111',
          email: tempEmail
        });

      expect(tempRes.status).toBe(201);
      const tempId = tempRes.body.data._id;

      try {
        // 2. Intentar eliminar con user -> 403
        const userDelRes = await request(baseUrl)
          .delete(`/api/customers/${tempId}`)
          .set(authHeader(userToken));
        expect(userDelRes.status).toBe(403);

        // 3. Intentar eliminar con sales -> 403 (sales solo tiene create, read, update en seed)
        const salesDelRes = await request(baseUrl)
          .delete(`/api/customers/${tempId}`)
          .set(authHeader(salesToken));
        expect(salesDelRes.status).toBe(403);
      } finally {
        // 4. Eliminar el cliente temporal con admin
        await deleteCustomer(tempId, adminToken);
      }
    });

    test('Usuario con rol "sales" tiene permisos para listar y crear clientes (alcance any)', async () => {
      // Sales lista clientes
      const listRes = await request(baseUrl)
        .get('/api/customers')
        .set(authHeader(salesToken));

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);

      // Sales crea cliente
      const salesEmail = `sales_created_${Date.now()}@stride.test`;
      const createRes = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(salesToken))
        .send({
          userId: 777,
          phone: '5557778888',
          email: salesEmail
        });

      expect(createRes.status).toBe(201);
      await deleteCustomer(createRes.body.data._id, adminToken);
    });
  });

  describe('Control de acceso por propiedad (Alcance own vs foreign)', () => {
    test('Usuario con rol "user" puede consultar su propio cliente (GET /api/customers/:id) responde 200', async () => {
      expect(currentUserId).toBeDefined();

      const ownEmail = `own_customer_${Date.now()}@stride.test`;
      const createRes = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(adminToken))
        .send({
          userId: currentUserId,
          phone: '5551112222',
          email: ownEmail
        });

      expect(createRes.status).toBe(201);
      ownCustomerId = createRes.body.data._id;

      // El usuario consulta su propio cliente
      const getRes = await request(baseUrl)
        .get(`/api/customers/${ownCustomerId}`)
        .set(authHeader(userToken));

      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveProperty('data');
      expect(getRes.body.data._id).toBe(ownCustomerId);
      expect(getRes.body.data.userId).toBe(currentUserId);
      expect(getRes.body.data.email).toBe(ownEmail);
    });

    test('Usuario con rol "user" puede actualizar su propio cliente (PUT /api/customers/:id) responde 200', async () => {
      expect(ownCustomerId).toBeDefined();

      const updatedPhone = '5559998888';
      const updateRes = await request(baseUrl)
        .put(`/api/customers/${ownCustomerId}`)
        .set(authHeader(userToken))
        .send({
          phone: updatedPhone
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body).toHaveProperty('data');
      expect(updateRes.body.data.phone).toBe(updatedPhone);
    });

    test('Usuario con rol "user" responde 403 Forbidden al consultar el cliente de otro usuario', async () => {
      // Cliente asociado a un usuario distinto (foreign)
      const foreignEmail = `foreign_customer_${Date.now()}@stride.test`;
      const createRes = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(adminToken))
        .send({
          userId: 99999,
          phone: '5553334444',
          email: foreignEmail
        });

      expect(createRes.status).toBe(201);
      foreignCustomerId = createRes.body.data._id;

      // User intenta consultar cliente ajeno
      const getRes = await request(baseUrl)
        .get(`/api/customers/${foreignCustomerId}`)
        .set(authHeader(userToken));

      expect(getRes.status).toBe(403);
    });

    test('Usuario con rol "user" responde 403 Forbidden al actualizar el cliente de otro usuario', async () => {
      expect(foreignCustomerId).toBeDefined();

      // User intenta actualizar cliente ajeno
      const putRes = await request(baseUrl)
        .put(`/api/customers/${foreignCustomerId}`)
        .set(authHeader(userToken))
        .send({
          phone: '5550000000'
        });

      expect(putRes.status).toBe(403);
    });
  });

  describe('Validación de solicitudes y datos inválidos', () => {
    test('Petición con cuerpo de datos inválido (JSON malformado) responde 400 Bad Request', async () => {
      const res = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(adminToken))
        .set('Content-Type', 'application/json')
        .send('{ "email": "malformed_json');

      expect(res.status).toBe(400);
    });

    test('Consultar cliente con ID malformado (ObjectId no válido) con rol user responde 403 Forbidden por checkOwnership', async () => {
      // El middleware getCustomerOwnerId comprueba mongoose.isValidObjectId.
      // Al ser inválido, retorna null y la autorización rechaza la petición con 403 sin invocar Mongoose.
      const res = await request(baseUrl)
        .get('/api/customers/123invalid')
        .set(authHeader(userToken));

      expect(res.status).toBe(403);
    });
  });

  describe('Operaciones CRUD y verificación de seguridad con Admin', () => {
    test('Crear cliente (POST /api/customers) responde 201 y no expone credenciales ni datos sensibles', async () => {
      const uniqueEmail = `customer_e2e_${Date.now()}@stride.test`;

      const res = await request(baseUrl)
        .post('/api/customers')
        .set(authHeader(adminToken))
        .send({
          userId: 50,
          phone: '5554443333',
          email: uniqueEmail,
          addresses: [{
            type: 'shipping',
            street: 'Av. Siempre Viva 742',
            city: 'Chihuahua',
            country: 'Mexico'
          }]
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.email).toBe(uniqueEmail);

      // Comprobar que no expone datos sensibles
      expect(res.body.data).not.toHaveProperty('password_hash');
      expect(res.body.data).not.toHaveProperty('salt_key');
      expect(res.body.data).not.toHaveProperty('password');

      createdCustomerId = res.body.data._id;
    });

    test('Consultar cliente por ID (GET /api/customers/:id) responde 200', async () => {
      expect(createdCustomerId).toBeDefined();

      const res = await request(baseUrl)
        .get(`/api/customers/${createdCustomerId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data._id).toBe(createdCustomerId);
    });

    test('Listar clientes (GET /api/customers) responde 200 y contiene el cliente creado', async () => {
      expect(createdCustomerId).toBeDefined();

      const res = await request(baseUrl)
        .get('/api/customers')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.find((c) => c._id === createdCustomerId);
      expect(found).toBeDefined();
    });

    test('Actualizar cliente (PUT /api/customers/:id) responde 200', async () => {
      expect(createdCustomerId).toBeDefined();

      const updatedPhone = '5558889999';
      const res = await request(baseUrl)
        .put(`/api/customers/${createdCustomerId}`)
        .set(authHeader(adminToken))
        .send({
          phone: updatedPhone
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.phone).toBe(updatedPhone);
    });

    test('Eliminar cliente (DELETE /api/customers/:id) responde 200', async () => {
      expect(createdCustomerId).toBeDefined();

      const res = await deleteCustomer(createdCustomerId, adminToken);
      expect(res.status).toBe(200);
    });

    test('Verificar que el cliente eliminado ya no existe en el sistema', async () => {
      expect(createdCustomerId).toBeDefined();

      // Al listar clientes con Admin, el cliente eliminado ya no se encuentra
      const listRes = await request(baseUrl)
        .get('/api/customers')
        .set(authHeader(adminToken));

      expect(listRes.status).toBe(200);
      const found = listRes.body.data.find((c) => c._id === createdCustomerId);
      expect(found).toBeUndefined();

      // Resetear para evitar re-intento de eliminación en afterAll
      createdCustomerId = null;
    });
  });
});
