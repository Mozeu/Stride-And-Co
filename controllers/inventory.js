const { Product, Variant, Inventory } = require('../models/sql');

const inventoryIncludes = [{
    model: Variant,
    as: 'variant',
    include: [{ model: Product, as: 'product' }]
}];

async function list(req, res, next) {
    try {
        const inventory = await Inventory.findAll({ include: inventoryIncludes });
        return res.json({ message: 'Inventory List', data: inventory });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const inventory = await Inventory.findByPk(req.params.id, { include: inventoryIncludes });
        if (!inventory) return res.status(404).json({ message: 'Inventory not found' });
        return res.json({ message: 'Inventory by ID', data: inventory });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const inventory = await Inventory.findByPk(req.params.id);
        if (!inventory) return res.status(404).json({ message: 'Inventory not found' });
        await inventory.update(req.body);
        return res.json({ message: 'Inventory Updated', data: inventory });
    } catch (error) {
        return next(error);
    }
}

module.exports = { list, find, update };