const request = require('supertest');
const app = require('../app');

describe('Pruebas de internacionalizacion', () => {

  test('responde en inglés cuando se solicita en', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Accept-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Products List');
  });

  test('responde en español cuando se solicita es', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Accept-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Lista de Productos');
  });

  test('traduce los errores de validacion al español', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Accept-Language', 'es')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message)
      .toBe('Se requieren email y contraseña');
  });

});