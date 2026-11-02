const mongoose = require('mongoose');
const { Order, Customer } = require('../models/mongo');

// Dueño de un usuario: es el propio usuario (el id de la URL)
async function getUserOwnerId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) ? id : null;
}

/* async function getOrderOwnerId(req) {
    if (!mongoose.isValidObjectId(req.params.id)) return null;

    const order = await Order.findById(req.params.id)
        .populate('customerId');

    if (!order || !order.customerId) return null;

    return order.customerId.userId;
} */

// Dueño de una orden: Order.customerId -> Customer.userId
async function getOrderOwnerId(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;

  const order = await Order.findById(req.params.id).populate('customerId', 'userId');
  if (!order || !order.customerId) return null;

  return order.customerId.userId;
}

// Dueño de un cliente: Customer.userId
async function getCustomerOwnerId(req) {
  if (!mongoose.isValidObjectId(req.params.id)) return null;

  const customer = await Customer.findById(req.params.id, 'userId');
  return customer ? customer.userId : null;
}

// Para crear una orden: el dueño es el del cliente que viene en el body
async function getBodyCustomerOwnerId(req) {
  const customerId = req.body && req.body.customerId;
  if (!mongoose.isValidObjectId(customerId)) return null;

  const customer = await Customer.findById(customerId, 'userId');
  return customer ? customer.userId : null;
}

module.exports = { getUserOwnerId, getOrderOwnerId, getCustomerOwnerId, getBodyCustomerOwnerId };