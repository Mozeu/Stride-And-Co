const { Product, Variant, Inventory } = require('../models/sql');

const productIncludes = [{
    model: Variant,
    as: 'variants',
    include: [{ model: Inventory, as: 'inventory' }]
}];

async function create(req, res, next) {
    try {
        const product = await Product.create(req.body);
        return res.status(201).json({ message: 'Product Created', data: product });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const products = await Product.findAll({ include: productIncludes });
        return res.json({ message: 'Products List', data: products });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id, { include: productIncludes });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        return res.json({ message: 'Product by ID', data: product });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await product.update(req.body);
        return res.json({ message: 'Product Updated', data: product });
    } catch (error) {
        return next(error);
    }
}

async function destroy(req, res, next) {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await product.destroy();
        return res.json({ message: 'Product Deleted', data: product });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };