const express = require('express');
const router = express.Router();

const controller = require('../controllers/permissions');
const { authorize } = require('../middleware/authorize');

/* POST */
router.post('/', authorize('permissions', 'create', 'any'), controller.create);

/* GET */
router.get('/', authorize('permissions', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('permissions', 'read', 'any'), controller.find);

/* PUT */
router.put('/:id', authorize('permissions', 'update', 'any'), controller.update);

/* DELETE by ID. */
router.delete('/:id', authorize('permissions', 'delete', 'any'), controller.destroy);

module.exports = router;