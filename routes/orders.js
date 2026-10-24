const express = require('express');
const router = express.Router();

const controller = require('../controllers/orders');
const { authorize } = require('../middleware/authorize');
const { getOrderOwnerId } = require('../utils/orderOwnership');

/* POST */
router.post('/', authorize('orders', 'create', 'any'), controller.create);

/* GET */
router.get('/', authorize('orders', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('orders', 'read', 'own', getOrderOwnerId), controller.find);

/* PUT */
router.put('/:id', authorize('orders', 'update', 'own', getOrderOwnerId), controller.update);

module.exports = router;
