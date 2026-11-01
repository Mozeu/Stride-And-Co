const { Product, Variant, Inventory } = require('../models/sql');

const variantIncludes = [
    { model: Product, as: 'product' },
    { model: Inventory, as: 'inventory' }
];

async function create(req, res, next) {
    try {
        const variant = await Variant.create(req.body);
        return res.status(201).json({ message: 'Variant Created', data: variant });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const variants = await Variant.findAll({ include: variantIncludes });
        return res.json({ message: 'Variant List', data: variants });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const variant = await Variant.findByPk(req.params.id, { include: variantIncludes });
        if (!variant) return res.status(404).json({ message: 'Variant not found' });
        return res.json({ message: 'Variant by ID', data: variant });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) return res.status(404).json({ message: 'Variant not found' });
        await variant.update(req.body);
        return res.json({ message: 'Variant Updated', data: variant });
    } catch (error) {
        return next(error);
    }
}

async function destroy(req, res, next) {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) return res.status(404).json({ message: 'Variant not found' });
        await variant.destroy();
        return res.json({ message: 'Variant Deleted', data: variant });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };