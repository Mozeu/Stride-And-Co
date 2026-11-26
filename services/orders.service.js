const { isObjectIdOrHexString } = require('mongoose');
const createError = require('http-errors');
const { Customer, Order } = require('../models/mongo');
const { Product } = require('../models/sql');

function list() {
  return Order.find().populate('customerId');
}

function find(id) {
  return Order.findById(id).populate('customerId');
}

async function listForUser(userId) {
  const customerIds = await Customer.distinct('_id', { userId });
  if (!customerIds.length) return [];

  return Order.find({ customerId: { $in: customerIds } })
    .select('items.quantity totals.total statusHistory.status createdAt')
    .sort({ createdAt: -1, _id: -1 })
    .lean();
}

async function findForUser(userId, id) {
  if (!isObjectIdOrHexString(id)) throw createError(404);

  const customerIds = await Customer.distinct('_id', { userId });
  const order = customerIds.length
    ? await Order.findOne({ _id: id, customerId: { $in: customerIds } })
      .select('items.productId items.quantity items.unitPrice totals paymentMethod shippingAddress statusHistory.status statusHistory.changedAt createdAt')
      .lean()
    : null;

  if (!order) throw createError(await Order.exists({ _id: id }) ? 403 : 404);

  const items = order.items || [];
  const productIds = [...new Set(items.map(item => item.productId))];
  const products = productIds.length
    ? await Product.findAll({ attributes: ['id', 'name'], where: { id: productIds }, raw: true })
    : [];
  const productNames = new Map(products.map(product => [product.id, product.name]));
  return {
    ...order,
    items: items.map(item => ({ ...item, name: productNames.get(item.productId) }))
  };
}

module.exports = { list, find, listForUser, findForUser };
