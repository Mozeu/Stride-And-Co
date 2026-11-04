const config = require('config');
const { URL } = require('node:url');
const { afterAll, beforeAll } = require('@jest/globals');

if (config.util.getEnv('NODE_ENV') !== 'test') {
  throw new Error('Las pruebas de integracion requieren el entorno test');
}

const testDatabaseName = config.get('postgres.database');
const testMongoUri = config.get('mongo.uri');

const postgresConfig = {
  host: config.get('postgres.host'),
  port: config.get('postgres.port'),
  user: config.get('postgres.user'),
  password: config.get('postgres.password')
};

const mongoDatabaseName = new URL(testMongoUri).pathname.slice(1);

if (!/^[a-zA-Z0-9_]+_test$/.test(testDatabaseName) ||
    mongoDatabaseName !== testDatabaseName) {
  throw new Error('Las bases de integración deben coincidir y terminar en _test');
}

const { Client } = require('pg');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const connectMongo = require('../../config/mongoose');
const {
  sequelize,
  User,
  Role,
  Permission,
  Product,
  Variant,
  Inventory
} = require('../../models/sql');
const { Customer, Order } = require('../../models/mongo');
const { hashPassword } = require('../../utils/password');
const { loginAndGetToken, withToken } = require('../helpers/authenticated-request');

const permissionMatrix = {
  admin: [
    'products:read:any',
    'products:create:any',
    'products:update:any',
    'products:delete:any',
    'variants:read:any',
    'inventory:read:any',
    'orders:create:any',
    'orders:read:own',
    'orders:read:any',
    'orders:update:own',
    'orders:update:any',
    'users:read:any'
  ],
  sales: [
    'products:read:any',
    'orders:create:any',
    'orders:read:own',
    'orders:read:any',
    'orders:update:own',
    'orders:update:any'
  ],
  user: [
    'products:read:any',
    'orders:create:any',
    'orders:read:own',
    'orders:update:own'
  ]
};

let tokens;
let ownOrderId;
let otherOrderId;
let productId;
let variantId;
let postgresReady = false;
let mongoReady = false;

beforeAll(async () => {
  const adminConnection = new Client({
    ...postgresConfig,
    database: 'postgres'
  });
  try {
    await adminConnection.connect();
    const databaseExists = await adminConnection.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [testDatabaseName]
    );
    if (databaseExists.rowCount === 0) {
      await adminConnection.query(`CREATE DATABASE "${testDatabaseName}"`);
    }
  } finally {
    await adminConnection.end();
  }

  await sequelize.authenticate();
  postgresReady = true;
  await sequelize.sync({ force: true });
  await connectMongo();
  mongoReady = true;
  await mongoose.connection.dropDatabase();

  const roleRecords = {};
  for (const roleName of Object.keys(permissionMatrix)) {
    roleRecords[roleName] = await Role.create({
      name: roleName,
      description: `Integration test ${roleName}`
    });
  }

  const permissionRecords = {};
  const keys = [...new Set(Object.values(permissionMatrix).flat())];
  for (const key of keys) {
    permissionRecords[key] = await Permission.create({
      key,
      description: key
    });
  }

  for (const [roleName, keysForRole] of Object.entries(permissionMatrix)) {
    await roleRecords[roleName].setPermissions(
      keysForRole.map((key) => permissionRecords[key])
    );
  }

  const userRecords = {};
  for (const [roleName, id] of [['admin', 101], ['sales', 102], ['user', 103]]) {
    const passwordData = await hashPassword('IntegrationPass123!');
    userRecords[roleName] = await User.create({
      id,
      first_name: roleName,
      last_name: 'Integration',
      email: `${roleName}@integration.test`,
      active: true,
      role_id: roleRecords[roleName].id,
      password_hash: passwordData.securePassword,
      salt_key: passwordData.saltKey
    });
  }

  const product = await Product.create({
    name: 'Integration product',
    brand: 'Stride',
    price: 599
  });
  productId = product.id;

  const variant = await Variant.create({
    product_id: product.id,
    size: 'M',
    color: 'Black',
    sku: 'INTEGRATION-PRODUCT-M'
  });
  variantId = variant.id;
  await Inventory.create({
    variant_id: variant.id,
    stock: 25,
    reserved: 2
  });

  tokens = {};
  for (const roleName of Object.keys(userRecords)) {
    tokens[roleName] = await loginAndGetToken(
      app,
      `${roleName}@integration.test`,
      'IntegrationPass123!'
    );
  }

  const ownCustomer = await Customer.create({ userId: userRecords.user.id });
  const otherCustomer = await Customer.create({ userId: userRecords.sales.id });
  const ownOrder = await Order.create({ customerId: ownCustomer._id });
  const otherOrder = await Order.create({ customerId: otherCustomer._id });
  ownOrderId = String(ownOrder._id);
  otherOrderId = String(otherOrder._id);
});

afterAll(async () => {
  if (mongoReady) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (postgresReady) {
    await sequelize.drop();
    await sequelize.close();
  }
});

describe('JWT and RBAC integration with test databases', () => {
  test('rejects API requests without a JWT', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(401);
  });

  test('returns persisted products with their variants and inventory', async () => {
    const productResponse = await withToken(
      request(app).get(`/api/products/${productId}`),
      tokens.admin
    );
    const variantResponse = await withToken(
      request(app).get(`/api/variants/${variantId}`),
      tokens.admin
    );
    const inventoryResponse = await withToken(
      request(app).get('/api/inventory'),
      tokens.admin
    );

    expect(productResponse.status).toBe(200);
    expect(productResponse.body.data.variants[0].inventory.stock).toBe(25);
    expect(variantResponse.status).toBe(200);
    expect(variantResponse.body.data.product.id).toBe(productId);
    expect(variantResponse.body.data.inventory.reserved).toBe(2);
    expect(inventoryResponse.status).toBe(200);
    expect(inventoryResponse.body.data[0].variant.product.id).toBe(productId);
  });

  test('validates required fields and ranges in relational models', async () => {
    await expect(Product.build({ name: '', price: -1 }).validate()).rejects.toThrow();
    await expect(Variant.build({
      product_id: 1,
      size: 'M',
      color: 'Black',
      sku: ''
    }).validate()).rejects.toThrow();
    await expect(Inventory.build({
      variant_id: 1,
      stock: -1,
      reserved: 0
    }).validate()).rejects.toThrow();
  });

  test('includes the user role when reading a user by ID', async () => {
    const response = await withToken(
      request(app).get('/api/users/101'),
      tokens.admin
    );

    expect(response.status).toBe(200);
    expect(response.body.data.role.name).toBe('admin');
  });

  test('validates standard payment and order status enums', async () => {
    const customerId = new mongoose.Types.ObjectId();
    await expect(new Order({
      customerId,
      paymentMethod: 'cryptocurrency'
    }).validate()).rejects.toThrow();
    await expect(new Order({
      customerId,
      statusHistory: [{ status: 'awaiting_magic' }]
    }).validate()).rejects.toThrow();
  });

  test('authenticates through login and allows admin product deletion', async () => {
    const response = await withToken(
      request(app)
      .delete(`/api/products/${productId}`)
      .set('Accept-Language', 'en'),
      tokens.admin
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product Deleted');
  });

  test('denies sales users product deletion', async () => {
    const response = await withToken(
      request(app).delete(`/api/products/${productId}`),
      tokens.sales
    );

    expect(response.status).toBe(403);
  });

  test('populates the customer when a user reads their own order', async () => {
    const response = await withToken(
      request(app).get(`/api/orders/${ownOrderId}`),
      tokens.user
    );

    expect(response.status).toBe(200);
    expect(response.body.data.customerId.userId).toBe(103);
  });

  test('denies a user access to another user’s order', async () => {
    const response = await withToken(
      request(app).get(`/api/orders/${otherOrderId}`),
      tokens.user
    );

    expect(response.status).toBe(403);
  });

  test('denies a user permission to list all orders', async () => {
    const response = await withToken(
      request(app).get('/api/orders'),
      tokens.user
    );

    expect(response.status).toBe(403);
  });
});
