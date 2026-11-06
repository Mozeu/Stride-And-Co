'use strict';

const request = require('supertest');
const { getBaseUrl, loginAs, authHeader } = require('./helpers');

describe('E2E i18n', () => {
  const baseUrl = getBaseUrl();
  let userToken;

  beforeAll(async () => {
    userToken = await loginAs('user');
  });

  test('responde en español cuando Accept-Language es es', async () => {
    const response = await request(baseUrl)
      .get('/api/products')
      .set(authHeader(userToken))
      .set('Accept-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Lista de Productos');
  });

  test('responde en inglés cuando Accept-Language es en', async () => {
    const response = await request(baseUrl)
      .get('/api/products')
      .set(authHeader(userToken))
      .set('Accept-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Products List');
  });

  test('traduce errores de validación según el idioma solicitado', async () => {
    const esResponse = await request(baseUrl)
      .post('/api/auth/login')
      .set('Accept-Language', 'es')
      .send({});

    expect(esResponse.status).toBe(400);
    expect(esResponse.body.message).toBe('Se requieren email y contraseña');

    const enResponse = await request(baseUrl)
      .post('/api/auth/login')
      .set('Accept-Language', 'en')
      .send({});

    expect(enResponse.status).toBe(400);
    expect(enResponse.body.message).toBe('Email and password are required');
  });

  test('traduce errores de autenticación según el idioma solicitado', async () => {
    const esResponse = await request(baseUrl)
      .get('/api/auth/me')
      .set('Accept-Language', 'es');

    expect(esResponse.status).toBe(401);
    expect(esResponse.body.message).toBe('No Autorizado');

    const enResponse = await request(baseUrl)
      .get('/api/auth/me')
      .set('Accept-Language', 'en');

    expect(enResponse.status).toBe(401);
    expect(enResponse.body.message).toBe('Unauthorized');
  });
});
