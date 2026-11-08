'use strict';

const request = require('supertest');
const { getBaseUrl } = require('./helpers');

describe('E2E Health', () => {
  const baseUrl = getBaseUrl();

  test('GET /health responde 200 y { "status": "UP" }', async () => {
    const response = await request(baseUrl).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP' });
  });
});
