jest.unmock('../middleware/authorize');
jest.mock('../models/mongo', () => ({
  Customer: { distinct: jest.fn() },
  Order: { find: jest.fn(), findOne: jest.fn(), exists: jest.fn() }
}));

const request = require('supertest');
const app = require('../app');
const { signToken } = require('../services/auth.service');
const { Customer, Order } = require('../models/mongo');
const { Product, User } = require('../models/sql');

const customerId = '650001000000000000000001';
const orderId = '650002000000000000000001';
const otherOrderId = '650002000000000000000002';
const myOrders = '/my/orders';

function signedIn(path, keys = ['orders:read:own']) {
  User.findByPk.mockResolvedValueOnce({
    id: 1, active: true, first_name: 'Shopper',
    role: { permissions: keys.map(key => ({ key })) }
  });
  return request(app).get(path).set('Cookie', 'access_token=' + signToken({ id: 1 }));
}

function listQuery(orders) {
  return {
    select: jest.fn(function () { return this; }),
    sort: jest.fn(function () { return this; }),
    lean: jest.fn().mockResolvedValue(orders)
  };
}

function detailQuery(order) {
  return {
    select: jest.fn(function () { return this; }),
    lean: jest.fn().mockResolvedValue(order)
  };
}

describe('F6 my orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Customer.distinct.mockResolvedValue([customerId]);
    Order.exists.mockResolvedValue(null);
  });

  test('redirects visitors to login and preserves the requested order URL', async () => {
    const path = myOrders + '/' + orderId + '?lang=en';
    await request(app).get(path)
      .expect(302)
      .expect('Location', '/login?returnTo=' + encodeURIComponent(path))
      .expect('Cache-Control', 'private, no-store');
    expect(Customer.distinct).not.toHaveBeenCalled();
  });

  test('requires the explicit read-own grant before querying orders', async () => {
    const response = await signedIn(myOrders + '?lang=en', ['orders:read:any'])
      .expect(403).expect('Content-Type', /text\/html/);
    expect(response.text).toContain('Access denied');
    expect(Customer.distinct).not.toHaveBeenCalled();
    expect(Order.find).not.toHaveBeenCalled();
  });

  test('lists only orders for customer records linked to the authenticated user', async () => {
    const query = listQuery([{
      _id: orderId,
      items: [{ quantity: 2 }],
      totals: { total: '3798.00' },
      statusHistory: [{ status: 'confirmed' }, { status: 'shipped' }],
      createdAt: new Date('2026-05-01T12:00:00Z')
    }]);
    Order.find.mockReturnValue(query);

    const response = await signedIn(myOrders + '?lang=es&userId=55')
      .expect(200).expect('Cache-Control', 'private, no-store');
    expect(Customer.distinct).toHaveBeenCalledWith('_id', { userId: 1 });
    expect(Order.find).toHaveBeenCalledWith({ customerId: { $in: [customerId] } });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(response.text).toContain('Mis pedidos');
    expect(response.text).toContain(orderId);
    expect(response.text).toContain('3,798.00');
    expect(response.text).toContain('Enviado');
    expect(response.text).not.toContain(otherOrderId);
  });

  test('shows an empty state if the user has no linked customer', async () => {
    Customer.distinct.mockResolvedValueOnce([]);
    const response = await signedIn(myOrders + '?lang=en').expect(200);
    expect(response.text).toContain('You have no orders yet.');
    expect(Order.find).not.toHaveBeenCalled();
  });

  test('renders the owner’s saved prices, item names and history', async () => {
    Order.findOne.mockReturnValue(detailQuery({
      _id: orderId,
      items: [
        { productId: 8, quantity: 2, unitPrice: '499.20' },
        { productId: 9, quantity: 1, unitPrice: '101.60' }
      ],
      totals: { subtotal: '1100.00', shipping: '25.00', discount: '5.00', total: '1120.00' },
      paymentMethod: 'card',
      shippingAddress: { street: 'Own Street', number: '12', city: 'Chihuahua' },
      statusHistory: [{ status: 'delivered', changedAt: new Date('2026-05-01T12:00:00Z') }]
    }));
    Product.findAll.mockResolvedValueOnce([{ id: 8, name: '<Runner>' }]);

    const response = await signedIn(myOrders + '/' + orderId + '?lang=en').expect(200);
    expect(Order.findOne).toHaveBeenCalledWith({ _id: orderId, customerId: { $in: [customerId] } });
    expect(Product.findAll).toHaveBeenCalledWith({
      attributes: ['id', 'name'], where: { id: [8, 9] }, raw: true
    });
    expect(response.text).toContain('Order details');
    expect(response.text).toContain('&lt;Runner&gt;');
    expect(response.text).toContain('Product #9');
    expect(response.text).toContain('499.20');
    expect(response.text).toContain('1,120.00');
    expect(response.text).toContain('Delivered');
    expect(response.text).toContain('Own Street');
  });

  test('returns 403 for another customer’s order even with read-any granted', async () => {
    Order.findOne.mockReturnValue(detailQuery(null));
    Order.exists.mockResolvedValueOnce({ _id: otherOrderId });
    const response = await signedIn(myOrders + '/' + otherOrderId + '?lang=es',
      ['orders:read:own', 'orders:read:any']).expect(403);
    expect(Order.findOne).toHaveBeenCalledWith({ _id: otherOrderId, customerId: { $in: [customerId] } });
    expect(response.text).toContain('Acceso denegado');
    expect(response.text.match(/<main[\s\S]*?<\/main>/)[0]).not.toContain(otherOrderId);
    expect(Product.findAll).not.toHaveBeenCalled();
  });

  test('returns 404 for an absent order and rejects a malformed ID before querying', async () => {
    Order.findOne.mockReturnValue(detailQuery(null));
    await signedIn(myOrders + '/' + orderId + '?lang=en').expect(404);
    expect(Order.exists).toHaveBeenCalledWith({ _id: orderId });
    expect(Customer.distinct).toHaveBeenCalledTimes(1);

    await signedIn(myOrders + '/not-an-object-id?lang=en').expect(404);
    expect(Customer.distinct).toHaveBeenCalledTimes(1);
    expect(Order.findOne).toHaveBeenCalledTimes(1);
  });
});
