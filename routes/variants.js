const express = require('express');
const router = express.Router();

const controller = require('../controllers/variants');
const { authorize } = require('../middleware/authorize');

/* POST */
router.post('/', authorize('variants', 'create', 'any'), controller.create);

/* GET */
router.get('/', authorize('variants', 'read', 'any'), controller.list);

/* GET by ID */
router.get('/:id', authorize('variants', 'read', 'any'), controller.find);

/* PUT */
router.put('/:id', authorize('variants', 'update', 'any'), controller.update);

/* DELETE by ID. */
router.delete('/:id', authorize('variants', 'delete', 'any'), controller.destroy);

module.exports = router;
