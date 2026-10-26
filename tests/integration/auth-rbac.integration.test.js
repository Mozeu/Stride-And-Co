const process = require('node:process');
const { URL } = require('node:url');
const { afterAll, beforeAll } = require('@jest/globals');

const testDatabaseName = process.env.TEST_DB_NAME || 'stride_co_test';
const testMongoUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/stride_co_test';
const mysqlConfig = {
  host: process.env.TEST_DB_HOST || '127.0.0.1',
  port: Number(process.env.TEST_DB_PORT) || 3306,
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || 'abcd1234'
};
const mongoDatabaseName = new URL(testMongoUri).pathname.slice(1);

if (!/^[a-zA-Z0-9_]+_test$/.test(testDatabaseName) ||
    mongoDatabaseName !== testDatabaseName) {
  throw new Error('Integration tests require matching MySQL and MongoDB databases ending in _test');
}

process.env.NODE_ENV = 'test';
process.env.DB_NAME = testDatabaseName;
process.env.DB_USER = mysqlConfig.user;
process.env.DB_PASSWORD = mysqlConfig.password;
process.env.DB_HOST = mysqlConfig.host;
process.env.DB_PORT = String(mysqlConfig.port);
process.env.DB_DIALECT = 'mysql';
process.env.MONGO_URI = testMongoUri;
process.env.JWT_SECRET = 'integration-test-only-secret-change-me';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_ISSUER = 'stride-co-test';
process.env.JWT_AUDIENCE = 'stride-co-test-api';
process.env.BCRYPT_SALT_ROUNDS = '4';

const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const connectMongo = require('../../config/mongoose');
const { sequelize, User, Role, Permission } = require('../../models/relationals');
const { Customer, Order } = require('../../models/documents');
const { hashPassword } = require('../../utils/password');
const { loginAndGetToken, withToken } = require('../helpers/authenticated-request');

const permissionMatrix = {
  admin: [
    'products:read:any',
    'products:create:any',
    'products:update:any',
    'products:delete:any',
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
let mysqlReady = false;
let mongoReady = false;

beforeAll(async () => {
  const adminConnection = await mysql.createConnection({
    ...mysqlConfig,
    database: 'mysql'
  });
  try {
    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${testDatabaseName}\` CHARACTER SET utf8mb4`
    );
  } finally {
    await adminConnection.end();
  }

  await sequelize.authenticate();
  mysqlReady = true;
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
  if (mysqlReady) {
    await sequelize.drop();
    await sequelize.close();
  }
});

describe('JWT and RBAC integration with test databases', () => {
  test('rejects API requests without a JWT', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(401);
  });

  test('authenticates through login and allows admin product deletion', async () => {
    const response = await withToken(
      request(app).delete('/api/products/1'),
      tokens.admin
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product Deleted');
  });

  test('denies sales users product deletion', async () => {
    const response = await withToken(
      request(app).delete('/api/products/1'),
      tokens.sales
    );

    expect(response.status).toBe(403);
  });

  test('allows a user to read their own order', async () => {
    const response = await withToken(
      request(app).get(`/api/orders/${ownOrderId}`),
      tokens.user
    );

    expect(response.status).toBe(200);
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
