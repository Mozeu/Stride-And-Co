const productsService = require('../services/products.service');

async function create(req, res, next) {
    try {
        const product = await productsService.create(req.body);
        return res.status(201).json({ message:req.__("ProductsList.ProductCreated"), data: product });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const products = await productsService.list();
        return res.json({ message: req.__("ProductsList.List"), data: products });
    } catch (error) {
        return next(error);
    }
}

async function find(req, res, next) {
    try {
        const product = await productsService.find(req.params.id);
        if (!product) return res.status(404).json({ message: req.__("ProductsList.ProductNotFound") });
        return res.json({ message: req.__("ProductsList.ProductById"), data: product });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const product = await productsService.update(req.params.id, req.body);
        if (!product) return res.status(404).json({ message: req.__("ProductsList.ProductNotFound")});
        return res.json({ message: req.__("ProductsList.ProductUpdated"), data: product });
    } catch (error) {
        return next(error);
    }
}

async function destroy(req, res, next) {
    try {
        const product = await productsService.remove(req.params.id);
        if (!product) return res.status(404).json({ message: req.__("ProductsList.ProductNotFound")});
        return res.json({ message: req.__("ProductsList.ProductDeleted"), data: product });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, find, update, destroy };