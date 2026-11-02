const express = require('express');
const router = express.Router();

const controller = require('../controllers/orders');
const { authorize } = require('../middleware/authorize');
const { getOrderOwnerId, getBodyCustomerOwnerId } = require('../utils/checkOwnership');

/* POST: any, o own si el cliente del body es del usuario */
router.post('/', authorize('orders', 'create', 'own', getBodyCustomerOwnerId), controller.create);

/* GET */
router.get('/', authorize('orders', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('orders', 'read', 'own', getOrderOwnerId), controller.find);

/* PUT */
router.put('/:id', authorize('orders', 'update', 'own', getOrderOwnerId), controller.update);

module.exports = router;
