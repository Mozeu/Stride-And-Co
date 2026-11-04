const { Product, Variant, Inventory } = require('../models/sql');

const inventoryIncludes = [{
    model: Variant,
    as: 'variant',
    include: [{ model: Product, as: 'product' }]
}];

async function list(req, res, next) {
    try {
        const inventory = await Inventory.findAll({ include: inventoryIncludes });
        return res.json({ message: req.__("InventoryList.InventoryList"), data: inventory });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const inventory = await Inventory.findByPk(req.params.id, { include: inventoryIncludes });
        if (!inventory) return res.status(404).json({ message: req.__("InventoryList.InventoryNotFound") });
        return res.json({ message: req.__("InventoryList.InventoryById"), data: inventory });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const inventory = await Inventory.findByPk(req.params.id);
        if (!inventory) return res.status(404).json({ message: req.__("InventoryList.InventoryNotFound") });
        await inventory.update(req.body);
        return res.json({ message: req.__("InventoryList.InventoryUpdated"), data: inventory });
    } catch (error) {
        return next(error);
    }
}

module.exports = { list, find, update };