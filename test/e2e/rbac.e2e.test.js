'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader, deleteProduct } = require('./helpers');

describe('E2E RBAC', () => {
  const baseUrl = getBaseUrl();

  let adminToken;
  let salesToken;
  let userToken;
  let ownOrder;
  let foreignOrder;

  beforeAll(async () => {
    adminToken = await loginAs('admin');
    salesToken = await loginAs('sales');
    userToken = await loginAs('user');

    const userProfileRes = await request(baseUrl)
      .get('/api/auth/me')
      .set(authHeader(userToken));

    const userId = userProfileRes.body.id;
    const userEmail = userProfileRes.body.email;

    const ordersRes = await request(baseUrl)
      .get('/api/orders')
      .set(authHeader(adminToken));

    const orders = ordersRes.body.data || [];

    ownOrder = orders.find(
      (order) => order.customerId && (order.customerId.userId === userId || order.customerId.email === userEmail)
    );

    foreignOrder = orders.find(
      (order) => order.customerId && order.customerId.userId !== userId && order.customerId.email !== userEmail
    );
  });

  test('ADMIN puede eliminar productos', async () => {
    const createRes = await request(baseUrl)
      .post('/api/products')
      .set(authHeader(adminToken))
      .send({
        name: 'Producto Temp Admin E2E',
        price: 199.99
      });

    expect(createRes.status).toBe(201);
    const productId = createRes.body.data.id;

    const deleteRes = await deleteProduct(productId, adminToken);
    expect(deleteRes.status).toBe(200);
  });

  test('SALES no puede eliminar productos: 403', async () => {
    const createRes = await request(baseUrl)
      .post('/api/products')
      .set(authHeader(adminToken))
      .send({
        name: 'Producto Temp Sales E2E',
        price: 199.99
      });

    expect(createRes.status).toBe(201);
    const productId = createRes.body.data.id;

    try {
      const deleteRes = await request(baseUrl)
        .delete(`/api/products/${productId}`)
        .set(authHeader(salesToken));

      expect(deleteRes.status).toBe(403);
    } finally {
      await deleteProduct(productId, adminToken);
    }
  });

  test('USER puede consultar su propia orden', async () => {
    expect(ownOrder).toBeDefined();

    const response = await request(baseUrl)
      .get(`/api/orders/${ownOrder._id}`)
      .set(authHeader(userToken));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data._id).toBe(ownOrder._id);
  });

  test('USER no puede consultar órdenes ajenas: 403', async () => {
    expect(foreignOrder).toBeDefined();

    const response = await request(baseUrl)
      .get(`/api/orders/${foreignOrder._id}`)
      .set(authHeader(userToken));

    expect(response.status).toBe(403);
  });

  test('USER no puede listar todas las órdenes: 403', async () => {
    const response = await request(baseUrl)
      .get('/api/orders')
      .set(authHeader(userToken));

    expect(response.status).toBe(403);
  });
});
