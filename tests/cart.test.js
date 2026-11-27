const request = require('supertest');
const app = require('../app');
const { User, Variant } = require('../models/sql');

function variant(overrides = {}) {
  return {
    id: 8,
    sku: 'RUN-8',
    size: '27',
    color: 'Black',
    product: { name: 'Daily Runner', price: '499.20' },
    inventory: { stock: 5, reserved: 2 },
    ...overrides
  };
}

describe('F4 shopping bag', () => {
  beforeEach(() => Variant.findAll.mockResolvedValue([variant()]));

  test('renders the empty bag and current variant choices in both languages', async () => {
    const agent = request.agent(app);
    const spanish = await agent.get('/cart?lang=es').expect(200).expect('Content-Type', /text\/html/);
    expect(spanish.text).toContain('Tu bolsa está vacía.');
    expect(spanish.text).toContain('aria-label="Bolsa de compra"');
    expect(spanish.text).toContain('bi bi-bag');
    expect(spanish.text).toContain('Daily Runner');
    expect(spanish.text).toContain('<meta name="description"');
    await agent.get('/cart?lang=en').expect(200);
    const english = await agent.get('/cart').expect(200);
    expect(english.text).toContain('<html lang="en">');
    expect(english.text).toContain('Your bag is empty.');
  });

  test('adds, updates and removes using POST redirects and a one-time confirmation', async () => {
    const agent = request.agent(app);
    const add = await agent.post('/cart/items?lang=en').type('form')
      .send({ variantId: 8, quantity: 2, price: 0.01 }).expect(302);
    expect(add.headers.location).toBe('/cart?lang=en');
    expect(add.headers['set-cookie'][0]).toMatch(/stride_cart=s%3A/);
    expect(add.headers['set-cookie'][0]).toMatch(/HttpOnly; SameSite=Lax/);

    const added = await agent.get(add.headers.location).expect(200);
    expect(added.text).toContain('Item added to your bag.');
    expect(added.text).toContain('998.40');
    expect((await agent.get(add.headers.location)).text).not.toContain('Item added to your bag.');

    await agent.post('/cart/items/8').type('form').send({ quantity: 3 }).expect(302);
    Variant.findAll.mockResolvedValue([variant({ product: { name: 'Daily Runner', price: '400.00' } })]);
    expect((await agent.get('/cart')).text).toContain('1,200.00');

    await agent.post('/cart/items/8/delete').expect(302);
    expect((await agent.get('/cart?lang=en')).text).toContain('Your bag is empty.');
  });

  test('validates quantities and available stock on the server', async () => {
    const agent = request.agent(app);
    const invalid = await agent.post('/cart/items?lang=en').type('form')
      .send({ variantId: 8, quantity: '2.5' }).expect(400);
    expect(invalid.text).toContain('Enter a whole number between 1 and 999.');
    expect(invalid.text).toContain('value="2.5"');
    await agent.post('/cart/items').type('form').send({ variantId: 8, quantity: 2 }).expect(302);
    const excess = await agent.post('/cart/items?lang=en').type('form')
      .send({ variantId: 8, quantity: 2 }).expect(400);
    expect(excess.text).toContain('The quantity exceeds the available stock.');
    expect(excess.text).toContain('998.40');

    Variant.findAll.mockResolvedValue([variant({ inventory: { stock: 2, reserved: 2 } })]);
    const changed = await agent.get('/cart?lang=en').expect(200);
    expect(changed.text).toContain('This line is excluded from the subtotal.');
    expect(changed.text).not.toContain('998.40');
  });

  test('returns 404 for a missing variant and ignores an unsigned bag', async () => {
    Variant.findAll.mockResolvedValue([]);
    await request(app).post('/cart/items').type('form').send({ variantId: 10, quantity: 1 }).expect(404);
    const response = await request(app).get('/cart?lang=en')
      .set('Cookie', 'stride_cart=j%3A%5B%7B%22variantId%22%3A8%2C%22quantity%22%3A99%7D%5D')
      .expect(200);
    expect(response.text).toContain('Your bag is empty.');
  });
});

test('keeps the signed bag through staging login and logout', async () => {
  Variant.findAll.mockResolvedValue([variant()]);
  const agent = request.agent(app);
  await agent.post('/cart/items?lang=en').type('form').send({ variantId: 8, quantity: 2 }).expect(302);

  User.findOne.mockResolvedValueOnce({ id: 1, active: true, password_hash: 'test-hash' });
  User.findByPk.mockResolvedValueOnce({ id: 1, active: true, first_name: 'Cart Tester' });
  await agent.post('/login').type('form').send({
    email: 'cart@example.com',
    password: 'test-password',
    returnTo: '/cart?lang=en'
  }).expect(302).expect('Location', '/cart?lang=en');

  const signedIn = await agent.get('/cart?lang=en').expect(200);
  expect(signedIn.text).toContain('Cart Tester');
  expect(signedIn.text).toContain('998.40');
  expect(signedIn.text).toContain('Sign out');
  expect(signedIn.text).not.toContain('test-hash');

  await agent.post('/logout').expect(302).expect('Location', '/');
  const signedOut = await agent.get('/cart?lang=en').expect(200);
  expect(signedOut.text).toContain('Sign in');
  expect(signedOut.text).toContain('998.40');
});
