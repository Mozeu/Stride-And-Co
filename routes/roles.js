const express = require('express');
const router = express.Router();

const controller = require('../controllers/roles');
const { authorize } = require('../middleware/authorize');

/* POST */
router.post('/', authorize('roles', 'create', 'any'), controller.create);

/* GET */
router.get('/', authorize('roles', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('roles', 'read', 'any'), controller.find);

/* PUT */
router.put('/:id', authorize('roles', 'update', 'any'), controller.update);

/* DELETE by ID. */
router.delete('/:id', authorize('roles', 'delete', 'any'), controller.destroy);

module.exports = router;