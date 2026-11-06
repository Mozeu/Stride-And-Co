const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const { User, Role } = require('../models/sql');
const jwtConfig = require('../config/jwt');

const authenticate = jest.requireActual(
  '../middleware/authenticate'
);

const {
  authorize,
  loadAccessControl
} = jest.requireActual('../middleware/authorize');

function createToken() {
  return jwt.sign(
    { sub: '7' },
    jwtConfig.secret,
    {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );
}

function createAuthenticationApp() {
  const app = express();

  app.use((req, res, next) => {
    req.__ = (key) => key;
    next();
  });

  app.use(authenticate);

  app.get('/api/private', (req, res) => {
    res.status(200).json({ userId: req.user.id });
  });

  return app;
}

function createAuthorizationApp(roleName, possession, ownerId) {
  const app = express();

  app.use((req, res, next) => {
    req.__ = () => 'Forbidden';

    req.user = {
      id: 7,
      role: { name: roleName }
    };

    next();
  });

  const getOwnerId = ownerId === undefined
    ? undefined
    : async () => ownerId;

  app.get(
    '/api/orders/:id',
    authorize('orders', 'read', possession, getOwnerId),
    (req, res) => {
      res.status(200).json({ message: 'Acceso permitido' });
    }
  );

  return app;
}

describe('Autenticacion JWT', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    User.findByPk.mockResolvedValue({
      id: 7,
      active: true,
      role: { name: 'admin' }
    });
  });

  test('rechaza solicitudes sin JWT', async () => {
    const app = createAuthenticationApp();

    const response = await request(app).get('/api/private');

    expect(response.status).toBe(401);
  });

  test('rechaza un JWT invalido', async () => {
    const app = createAuthenticationApp();

    const response = await request(app)
      .get('/api/private')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
  });

  test('permite acceder con un JWT valido', async () => {
    const app = createAuthenticationApp();

    const response = await request(app)
      .get('/api/private')
      .set('Authorization', `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(7);
  });

});

describe('Autorizacion RBAC', () => {

  beforeEach(async () => {
    jest.clearAllMocks();

    Role.findAll.mockResolvedValue([
      {
        name: 'admin',
        permissions: [
          { key: 'orders:read:any' }
        ]
      },
      {
        name: 'user',
        permissions: [
          { key: 'orders:read:own' }
        ]
      }
    ]);

    await loadAccessControl();
  });

  test('permite al administrador leer cualquier orden', async () => {
    const app = createAuthorizationApp('admin', 'any');

    const response = await request(app).get('/api/orders/15');

    expect(response.status).toBe(200);
  });

  test('permite al usuario leer su propia orden', async () => {
    const app = createAuthorizationApp('user', 'own', 7);

    const response = await request(app).get('/api/orders/15');

    expect(response.status).toBe(200);
  });

  test('rechaza el acceso a ordenes ajenas', async () => {
    const app = createAuthorizationApp('user', 'own', 8);

    const response = await request(app).get('/api/orders/15');

    expect(response.status).toBe(403);
  });

  test('impide que un usuario lea todas las orrdenes', async () => {
    const app = createAuthorizationApp('user', 'any');

    const response = await request(app).get('/api/orders/15');

    expect(response.status).toBe(403);
  });

});