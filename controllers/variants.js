const { Variant } = require('../models/sql');
const variantsService = require('../services/variants.service');

async function create(req, res, next) {
    try {
        const variant = await Variant.create(req.body);
        return res.status(201).json({ message: req.__("VariantsList.VariantCreated"), data: variant });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const variants = await variantsService.list();
        return res.json({ message: req.__("VariantsList.List"), data: variants });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const variant = await variantsService.find(req.params.id);
        if (!variant) return res.status(404).json({ message: req.__("VariantsList.VariantNotFound") });
        return res.json({ message: req.__("VariantsList.VariantById"), data: variant });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) return res.status(404).json({ message: req.__("VariantsList.VariantNotFound") });
        await variant.update(req.body);
        return res.json({ message: req.__("VariantsList.VariantUpdated"), data: variant });
    } catch (error) {
        return next(error);
    }
}

async function destroy(req, res, next) {
    try {
        const variant = await Variant.findByPk(req.params.id);
        if (!variant) return res.status(404).json({ message: req.__("VariantsList.VariantNotFound") });
        await variant.destroy();
        return res.json({ message: req.__("VariantsList.VariantDeleted"), data: variant });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };