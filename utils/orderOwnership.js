const mongoose = require('mongoose');
const { Order } = require('../models/documents');

async function getOrderOwnerId(req) {
    if (!mongoose.isValidObjectId(req.params.id)) return null;

    const order = await Order.findById(req.params.id)
        .populate('customerId');

    if (!order || !order.customerId) return null;

    return order.customerId.userId;
}

module.exports = { getOrderOwnerId };