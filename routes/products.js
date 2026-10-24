const express = require('express');
const router = express.Router();

const controller = require('../controllers/products');
const { authorize } = require('../middleware/authorize');

/* POST */
router.post('/', authorize('products', 'create', 'any'), controller.create);

/* GET */
router.get('/', authorize('products', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('products', 'read', 'any'), controller.find);

/* PUT */
router.put('/:id', authorize('products', 'update', 'any'), controller.update);

/* DELETE by ID. */
router.delete('/:id', authorize('products', 'delete', 'any'), controller.destroy);

module.exports = router;
