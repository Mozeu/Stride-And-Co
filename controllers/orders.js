const { Order } = require('../models/mongo');

async function create(req, res, next) {
    try {
        const order = await Order.create(req.body);

        return res.status(201).json({ message:req.__("OrderList.OrderCreated"), data: order });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const orders = await Order.find().populate('customerId');
        return res.json({ message:req.__("OrderList.OrdersList"), data: orders });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const order = await Order.findById(req.params.id).populate('customerId');
        if (!order) return res.status(404).json({ message: req.__("OrderList.OrderNotFound") });
        return res.json({ message:req.__("OrderList.OrderById"), data: order });
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
        if (!order) return res.status(404).json({ message:req.__("OrderList.OrderNotFound")});
        return res.json({ message:req.__("OrderList.OrderUpdated"), data: order });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update };