// Revisa ../controllers/inventory.js 

const express = require('express');
const router = express.Router();

const controller = require('../controllers/inventory');
const { authorize } = require('../middleware/authorize');

/* GET */
router.get('/', authorize('inventory', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('inventory', 'read', 'any'), controller.find);

/* PUT */
router.put('/:id', authorize('inventory', 'update', 'any'), controller.update);

module.exports = router;
