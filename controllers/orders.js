const { Order } = require('../models/mongo');

async function create(req, res, next) {
    try {
        const order = await Order.create(req.body);

        return res.status(201).json({ message: 'Order Created', data: order });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const orders = await Order.find().populate('customerId');
        return res.json({ message: 'Orders List', data: orders });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const order = await Order.findById(req.params.id).populate('customerId');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        return res.json({ message: 'Order by ID', data: order });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('customerId');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        return res.json({ message: 'Order Updated', data: order });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update };