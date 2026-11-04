const { Product, Variant, Inventory } = require('../models/sql');

const productIncludes = [{
    model: Variant,
    as: 'variants',
    include: [{ model: Inventory, as: 'inventory' }]
}];

async function create(req, res, next) {
    try {
        const product = await Product.create(req.body);
        return res.status(201).json({ message:req.__("ProductsList.ProductCreated"), data: product });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const products = await Product.findAll({ include: productIncludes });
        return res.json({ message: req.__("ProductsList.List"), data: products });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id, { include: productIncludes });
        if (!product) return res.status(404).json({ message: req.__("ProductsList.ProductNotFound") });
        return res.json({ message: req.__("ProductsList.ProductById"), data: product });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: req.__("ProductsList.ProductNotFound")});
        await product.update(req.body);
        return res.json({ message: req.__("ProductsList.ProductUpdated"), data: product });
    } catch (error) {
        return next(error);
    }
}

async function destroy(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: req.__("ProductsList.ProductNotFound")});
        await product.destroy();
        return res.json({ message: req.__("ProductsList.ProductDeleted"), data: product });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };