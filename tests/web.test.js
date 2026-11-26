const request = require('supertest');
const app = require('../app');
const { Product, User } = require('../models/sql');

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

describe('F2 storefront', () => {
  test('renders active featured products on the home page', async () => {
    Product.findAll.mockResolvedValueOnce([{ name: '<Runner>', brand: 'Stride', price: '599.50' }]);
    const response = await request(app).get('/?lang=es').expect(200).expect('Content-Type', /text\/html/);
    expect(response.text).toContain('Productos destacados');
    expect(response.text).toContain('&lt;Runner&gt;');
    expect(response.text).toContain('<meta name="description"');
    expect(Product.findAll).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { active: true },
      limit: 4
    }));
  });

  test('filters the catalog server-side and preserves filters and language in pagination', async () => {
    const { Op } = require('sequelize');
    Product.count.mockResolvedValueOnce(25);
    Product.findAll.mockResolvedValueOnce([{ category_id: 7 }])
      .mockResolvedValueOnce([{ name: 'Runner V2', price: '599.00' }]);

    const response = await request(app).get('/products').query({
      q: 'RUN_%', category: '7', page: 2, lang: 'en'
    }).expect(200).expect('Content-Type', /text\/html/);

    expect(response.text).toContain('<html lang="en">');
    expect(response.text).toContain('Runner V2');
    expect(response.text).toContain('Category 7');
    expect(response.text).toContain('lang=en&amp;q=RUN_%25&amp;category=7&amp;page=3');
    expect(Product.count).toHaveBeenLastCalledWith({
      where: {
        active: true,
        category_id: 7,
        [Op.or]: [
          { name: { [Op.iLike]: '%RUN\\_\\%%' } },
          { brand: { [Op.iLike]: '%RUN\\_\\%%' } }
        ]
      }
    });
    expect(Product.findAll).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 12, limit: 12 }));
  });

  test('keeps the selected language and handles invalid filter inputs', async () => {
    const agent = request.agent(app);
    await agent.get('/?lang=en').expect(200);
    const response = await agent.get('/products?q[]=one&category=invalid&page=-7').expect(200);

    expect(response.text).toContain('<html lang="en">');
    expect(response.text).toContain('No products found.');
    expect(Product.count).toHaveBeenLastCalledWith({ where: { active: true } });
    expect(Product.findAll).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }));
  });
});

test('keeps the staging login, flash message and user navigation on the catalog', async () => {
  User.findOne.mockResolvedValueOnce({ id: 1, active: true, password_hash: 'test-hash' });
  User.findByPk.mockResolvedValueOnce({ id: 1, active: true, first_name: 'Catalog Tester' });

  const agent = request.agent(app);
  await agent.post('/login').type('form').send({
    email: 'catalog@example.com',
    password: 'test-password',
    returnTo: '/products?lang=en'
  }).expect(302).expect('Location', '/products?lang=en');

  const page = await agent.get('/products?lang=en').expect(200);
  expect(page.text).toContain('Catalog Tester');
  expect(page.text).toContain('Sign out');
  expect(page.text).toContain('alert-success');
  expect(page.text).not.toContain('test-hash');
});
