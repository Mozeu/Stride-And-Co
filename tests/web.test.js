const request = require('supertest');
const app = require('../app');
const { Product } = require('../models/sql');

describe('SSR web error pages', () => {
  test('renders the server-side home page with the shared layout', async () => {
    const response = await request(app).get('/?lang=es');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('<html lang="es">');
    expect(response.text).toContain('No hay productos disponibles.');
    expect(response.text).toContain('STRIDE');
  });

  test('renders the Spanish not-found page with a 404 response', async () => {
    const response = await request(app).get('/missing-page?lang=es');

    expect(response.statusCode).toBe(404);
    expect(response.text).toContain('<html lang="es">');
    expect(response.text).toContain('Página no encontrada');
    expect(response.text).toContain('href="/"');
  });

  test('renders the not-found page in the requested language', async () => {
    const response = await request(app).get('/missing-page?lang=en');

    expect(response.statusCode).toBe(404);
    expect(response.text).toContain('<html lang="en">');
    expect(response.text).toContain('Page not found');
  });

  test('renders a safe server-error page when the product query fails', async () => {
    Product.findAll.mockRejectedValueOnce(new Error('private database details'));

    const response = await request(app).get('/?lang=en');

    expect(response.statusCode).toBe(500);
    expect(response.text).toContain('Something went wrong');
    expect(response.text).not.toContain('private database details');
  });
});
