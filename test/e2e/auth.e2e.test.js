'use strict';

const request = require('supertest');
const { getBaseUrl, getCredentials } = require('./helpers');

describe('E2E Auth', () => {
  const baseUrl = getBaseUrl();

  test('Login correcto devuelve un JWT', async () => {
    const credentials = getCredentials('admin');

    const response = await request(baseUrl)
      .post('/api/auth/login')
      .send(credentials);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.token).toBeDefined();
    expect(typeof response.body.data.token).toBe('string');
  });

  test('Credenciales incorrectas responden 401', async () => {
    const response = await request(baseUrl)
      .post('/api/auth/login')
      .send({
        email: 'inexistente@stride.test',
        password: 'PasswordIncorrecto123!'
      });

    expect(response.status).toBe(401);
  });

  test('Las rutas protegidas responden 401 sin token o con token inválido', async () => {
    const responseWithoutToken = await request(baseUrl)
      .get('/api/auth/me');

    expect(responseWithoutToken.status).toBe(401);

    const responseWithInvalidToken = await request(baseUrl)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token_invalido');

    expect(responseWithInvalidToken.status).toBe(401);
  });
});
