const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const { User } = require('../models/sql');
const { verifyPassword } = require('../utils/password');
const jwtConfig = require('../config/jwt');

describe('Pruebas de autenticacion', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockResolvedValue(null);
    verifyPassword.mockResolvedValue(true);
  });

  test('GET /health responde correctamente', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
  });

  test('GET /api/auth/me devuelve el usuario autenticado', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  test('rechaza un login sin credenciales', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'en')
      .send({});

    expect(response.status).toBe(400);
  });

  test('rechaza un usuario inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'en')
      .send({
        email: 'inexistente@test.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(401);
  });

  test('rechaza una contraseña incorrecta', async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      active: true,
      password_hash: 'hash'
    });

    verifyPassword.mockResolvedValue(false);

    const response = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'en')
      .send({
        email: 'usuario@test.com',
        password: 'Incorrecta'
      });

    expect(response.status).toBe(401);
  });

  test('permite iniciar sesión y genera un JWT vaido', async () => {
    User.findOne.mockResolvedValue({
      id: 101,
      active: true,
      password_hash: 'hash'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'en')
      .send({
        email: 'admin@test.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.tokenType).toBe('Bearer');

    const decoded = jwt.verify(
      response.body.data.token,
      jwtConfig.secret,
      {
        algorithms: ['HS256'],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }
    );

    expect(decoded.sub).toBe('101');
  });

});