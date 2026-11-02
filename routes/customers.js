const express = require('express');
const router = express.Router();

const controller = require('../controllers/customers');
const { authorize } = require('../middleware/authorize');
const { getCustomerOwnerId } = require('../utils/checkOwnership');

/* POST */
router.post('/', authorize('customers', 'create', 'any'), controller.create);

/* GET */
router.get('/', authorize('customers', 'read', 'any'), controller.list);

/* GET by ID: any, o own si el cliente es del usuario */
router.get('/:id', authorize('customers', 'read', 'own', getCustomerOwnerId), controller.find);

/* PUT */
router.put('/:id', authorize('customers', 'update', 'own', getCustomerOwnerId), controller.update);

/* DELETE by ID. */
router.delete('/:id', authorize('customers', 'delete', 'any'), controller.destroy);

module.exports = router;
