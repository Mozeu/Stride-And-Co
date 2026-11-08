const { Customer } = require('../models/mongo');

// CREATE
async function create(req, res, next) {
    try {
        const customer = await Customer.create(req.body);
        return res.status(201).json({
            message: req.__('customerCreated.created'),
            data: customer
        });
    } catch (error) {
        return next(error);
    }
}

// READ
async function list(req, res, next) {
    try {
        const customers = await Customer.find();
        return res.json({
            message: req.__("CustomerList.listCostumer"),
            data: customers
        });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: req.__("CustomerList.customerNotFound") });

        return res.json({
            message: req.__("CustomerList.CustomerById"),
            data: customer
        });
    } catch (error) {
        return next(error);
    }
}

// UPDATE
async function update(req, res, next) {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!customer) return res.status(404).json({ message: req.__("CustomerList.customerNotFound") });

        return res.json({
            message: req.__("CustomerList.CustomerUpdated"),
            data: customer
        });
    } catch (error) {
        return next(error);
    }
}

// DELETE
async function destroy(req, res, next) {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ message: req.__("CustomerList.customerNotFound") });

        return res.json({
            message: req.__("CustomerList.CustomerDeleted"),
            data: customer._id
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };
