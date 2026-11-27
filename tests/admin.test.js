jest.unmock('../middleware/authorize');
jest.mock('../models/mongo', () => ({
  Order: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(async () => [])
  }
}));

const request = require('supertest');
const app = require('../app');
const { signToken } = require('../services/auth.service');
const { User, Product, Variant, Inventory } = require('../models/sql');
const { Order } = require('../models/mongo');
const dashboardService = require('../services/dashboard.service');

const adminPath = '/admin';

function signedIn(path, keys) {
  User.findByPk.mockResolvedValueOnce({
    id: 1,
    active: true,
    first_name: 'Admin',
    role: { name: 'admin', permissions: keys.map(key => ({ key })) }
  });
  return request(app).get(path).set('Cookie', 'access_token=' + signToken({ id: 1 }));
}

function recentOrdersQuery(orders) {
  return {
    select: jest.fn(function () { return this; }),
    sort: jest.fn(function () { return this; }),
    limit: jest.fn(function () { return this; }),
    lean: jest.fn().mockResolvedValue(orders)
  };
}

describe('F7 admin dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects visitors to login and preserves the dashboard URL', async () => {
    await request(app).get(adminPath + '?lang=en')
      .expect(302)
      .expect('Location', '/login?returnTo=' + encodeURIComponent(adminPath + '?lang=en'))
      .expect('Cache-Control', 'private, no-store');
    expect(Product.count).not.toHaveBeenCalled();
  });

  test('shows account identity and hides administration from users without both grants', async () => {
    const response = await signedIn('/?lang=en', ['orders:read:own'])
      .expect(200);
    expect(response.text).toContain('★');
    expect(response.text).toContain('Admin');
    expect(response.text).not.toContain('href="/admin"');
  });

  test('requires both product and order read-any grants', async () => {
    const response = await signedIn(adminPath + '?lang=en', ['products:read:any'])
      .expect(403)
      .expect('Content-Type', /text\/html/);
    expect(response.text).toContain('Access denied');
    expect(Product.count).not.toHaveBeenCalled();

    await signedIn(adminPath + '?lang=es', ['orders:read:any']).expect(403);
  });

  test('renders real dashboard metrics and recent orders in Spanish', async () => {
    Product.count.mockResolvedValueOnce(12);
    Product.findAll.mockResolvedValueOnce([
      { id: 1, name: 'Product without variants', variants: [] },
      {
        id: 2,
        name: 'Product with variants',
        variants: [
          { inventory: { stock: 10, reserved: 2 } },
          { inventory: { stock: 5, reserved: 1 } }
        ]
      }
    ]);
    Variant.count.mockResolvedValueOnce(28);
    Inventory.findAll.mockResolvedValueOnce([
      { stock: 20, reserved: 3 },
      { stock: 15, reserved: 5 }
    ]);
    Order.countDocuments.mockResolvedValueOnce(34);
    Order.find.mockReturnValueOnce(recentOrdersQuery([{
      _id: '650002000000000000000001',
      items: [{ quantity: 2 }, { quantity: 1 }],
      totals: { total: '3798.00' },
      statusHistory: [{ status: 'confirmed' }, { status: 'shipped' }],
      createdAt: new Date('2026-05-01T12:00:00Z')
    }]));

    const response = await signedIn(adminPath + '?lang=es',
      ['products:read:any', 'orders:read:any'])
      .expect(200)
      .expect('Cache-Control', 'private, no-store')
      .expect('Content-Type', /text\/html/);

    expect(response.text).toContain('<html lang="es">');
    expect(response.text).toContain('Dashboard administrativo');
    expect(response.text).toContain('Unidades disponibles');
    expect(response.text).toContain('27');
    expect(response.text).toContain('34');
    expect(response.text).toContain('650002000000000000000001');
    expect(response.text).toContain('Enviado');
    expect(response.text).toMatch(/Product without variants<\/td>\s*<td>0<\/td>\s*<td>0<\/td>\s*<td>0<\/td>/);
    expect(response.text).toMatch(/Product with variants<\/td>\s*<td>15<\/td>\s*<td>3<\/td>\s*<td>12<\/td>/);
    expect(response.text).not.toContain('password_hash');
    expect(response.text).not.toContain('salt_key');
  });

  test('renders the dashboard in English', async () => {
    Product.count.mockResolvedValueOnce(3);
    Product.findAll.mockResolvedValueOnce([]);
    Variant.count.mockResolvedValueOnce(8);
    Inventory.findAll.mockResolvedValueOnce([]);
    Order.countDocuments.mockResolvedValueOnce(0);
    Order.find.mockReturnValueOnce(recentOrdersQuery([]));

    const response = await signedIn(adminPath + '?lang=en',
      ['products:read:any', 'orders:read:any']).expect(200);
    expect(response.text).toContain('<html lang="en">');
    expect(response.text).toContain('Admin dashboard');
    expect(response.text).toContain('Available units');
    expect(response.text).toContain('No orders have been recorded.');
    expect(response.text).toContain('No products are registered.');
  });

  test('shows a safe 500 page if dashboard metrics fail', async () => {
    jest.spyOn(dashboardService, 'getDashboard')
      .mockRejectedValueOnce(new Error('private SQL details'));

    const response = await signedIn(adminPath + '?lang=en',
      ['products:read:any', 'orders:read:any']).expect(500);
    expect(response.text).toContain('Something went wrong');
    expect(response.text).not.toContain('private SQL details');
  });
});
